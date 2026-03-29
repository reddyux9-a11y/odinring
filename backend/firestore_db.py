"""
Firestore Database Operations
Provides async-style wrappers for Firestore operations with caching support
"""

from firebase_config import (
    get_firestore_client,
    get_firestore_client_error,
    Collections,
    firestore_to_dict,
    dict_to_firestore,
    retry_on_failure,
)
from cache_service import get_cache, CACHE_TTL
from google.cloud.firestore_v1 import FieldFilter
from datetime import datetime
import logging
import hashlib
import json

logger = logging.getLogger(__name__)


class DatabaseUnavailableError(Exception):
    """Raised when Firestore client is None (missing/invalid Firebase env on the server)."""


class FirestoreDB:
    """
    Firestore database operations wrapper
    Provides MongoDB-like interface for Firestore with caching support
    """
    
    def __init__(self, collection_name=None, enable_cache=True):
        self.db = get_firestore_client()
        self.collection_name = collection_name
        self.enable_cache = enable_cache
        self.cache = get_cache() if enable_cache else None

    def _ensure_db(self):
        """Ensure Firestore client exists; retry once per call (env may be fixed at runtime)."""
        if self.db is None:
            self.db = get_firestore_client()
        if self.db is None:
            err = get_firestore_client_error()
            hint = err or (
                "Firestore is not configured. Set FIREBASE_PROJECT_ID and "
                "FIREBASE_SERVICE_ACCOUNT_JSON on the server (e.g. Render environment variables)."
            )
            raise DatabaseUnavailableError(hint)
    
    def collection(self, name):
        """Get collection reference"""
        self._ensure_db()
        return self.db.collection(name)
    
    def _get_cache_key(self, collection: str, filter_dict: dict) -> str:
        """Generate cache key from collection and filter"""
        # Create deterministic key from filter
        filter_str = json.dumps(filter_dict, sort_keys=True) if filter_dict else "{}"
        key_hash = hashlib.md5(filter_str.encode()).hexdigest()[:16]
        return f"{collection}:{key_hash}"
    
    @retry_on_failure(max_retries=2, delay=0.5)
    async def find_one(self, collection_name=None, filter_dict=None, use_cache=True):
        """
        Find one document matching filter with retry logic and caching
        MongoDB equivalent: collection.find_one(filter)
        
        Args:
            collection_name: Collection name (optional if set in __init__)
            filter_dict: Filter dictionary
            use_cache: Whether to use cache (default: True)
        """
        import json
        
        # Support both old style (collection_name, filter_dict) and new style (filter_dict only)
        if collection_name is not None and not isinstance(collection_name, dict):
            # Old style: collection_name is a string
            coll_name = collection_name
            filt = filter_dict or {}
        else:
            # New style: collection_name is actually the filter_dict
            coll_name = self.collection_name
            filt = collection_name or {}
        
        # Try cache first (only for simple id lookups for now)
        if self.enable_cache and self.cache and use_cache:
            # Cache lookup for direct ID queries
            if 'id' in filt and len(filt) == 1:
                cache_key = filt['id']
                cached = self.cache.get(coll_name, cache_key)
                if cached is not None:
                    logger.debug(f"Cache hit: {coll_name}:{cache_key}")
                    return cached
        
        try:
            self._ensure_db()
            # Handle $or queries - Firestore doesn't support $or directly
            if '$or' in filt:
                or_conditions = filt['$or']
                # Try each condition in the $or array
                for condition in or_conditions:
                    result = await self.find_one(coll_name, condition)
                    if result:
                        return result
                return None
            
            # When `id` is in the filter, load by Firestore document ID first, then verify
            # other predicates in memory. Many documents use the UUID as the document ID but
            # do not store an `id` field in the payload; a compound where("id"==...) would
            # miss them while find({"user_id": ...}) still returns them via doc snapshot id.
            if 'id' in filt:
                doc_id = str(filt['id'])
                doc_ref = self.db.collection(coll_name).document(doc_id).get()
                if not doc_ref.exists:
                    return None
                result = firestore_to_dict(doc_ref)
                for key, expected in filt.items():
                    if key in ('$or', 'id'):
                        continue
                    if result.get(key) != expected:
                        return None
                if self.enable_cache and self.cache and use_cache and len(filt) == 1:
                    ttl = CACHE_TTL.get(coll_name, CACHE_TTL['default'])
                    self.cache.set(coll_name, doc_id, result, ttl)
                return result
            
            # For other fields, use where() queries
            query = self.db.collection(coll_name)
            
            for key, value in filt.items():
                # Skip $or as it's handled above
                if key == '$or':
                    continue
                # Handle regex queries (case-insensitive search)
                if isinstance(value, dict) and '$regex' in value:
                    regex_pattern = value['$regex']
                    # Firestore doesn't support regex directly
                    # For case-insensitive prefix matching, use range queries
                    # Note: This is a simplified implementation - full regex is not supported
                    pattern_lower = regex_pattern.lower()
                    query = query.where(filter=FieldFilter(key, '>=', pattern_lower))
                    query = query.where(filter=FieldFilter(key, '<=', pattern_lower + '\uf8ff'))
                else:
                    query = query.where(filter=FieldFilter(key, '==', value))
            
            docs = query.limit(1).stream()
            
            for doc in docs:
                result = firestore_to_dict(doc)
                # Cache the result if it has an ID
                if self.enable_cache and self.cache and use_cache and 'id' in result:
                    ttl = CACHE_TTL.get(coll_name, CACHE_TTL['default'])
                    self.cache.set(coll_name, result['id'], result, ttl)
                return result
            
            return None
            
        except Exception as e:
            logger.error(f"Error in find_one: {e}")
            raise
    
    @retry_on_failure(max_retries=2, delay=0.5)
    async def find(self, collection_name=None, filter_dict=None, limit=None, sort=None, skip=None):
        """
        Find multiple documents with retry logic
        MongoDB equivalent: collection.find(filter)
        """
        # Support both old style and new style
        if collection_name is not None and not isinstance(collection_name, dict):
            coll_name = collection_name
            filt = filter_dict
        else:
            coll_name = self.collection_name
            filt = collection_name
        
        try:
            self._ensure_db()
            # Handle $or queries - Firestore doesn't support $or directly
            if filt and '$or' in filt:
                or_conditions = filt['$or']
                all_results = []
                seen_ids = set()
                
                # Try each condition in the $or array and combine results
                for condition in or_conditions:
                    # Recursively call find for each condition
                    results = await self.find(coll_name, condition, limit=None, sort=sort, skip=None)
                    for result in results:
                        if result['id'] not in seen_ids:
                            all_results.append(result)
                            seen_ids.add(result['id'])
                
                # Apply sorting if specified
                if sort:
                    for field, direction in sort:
                        reverse = (direction == -1)
                        all_results.sort(key=lambda x: x.get(field, ''), reverse=reverse)
                
                # Apply skip and limit
                if skip:
                    all_results = all_results[skip:]
                if limit:
                    all_results = all_results[:limit]
                
                return all_results
            
            query = self.db.collection(coll_name)
            range_field = None  # Firestore requires order_by on inequality field

            if filt:
                for key, value in filt.items():
                    # Skip $or as it's handled above
                    if key == '$or':
                        continue
                    # Handle $in (e.g. event: {"$in": ["media_click", "click"]})
                    if isinstance(value, dict) and '$in' in value:
                        in_list = value['$in']
                        if in_list:
                            query = query.where(filter=FieldFilter(key, 'in', in_list))
                    # Handle range $gte / $lte (e.g. timestamp: {"$gte": start, "$lte": end})
                    elif isinstance(value, dict) and ('$gte' in value or '$lte' in value):
                        range_field = key
                        if '$gte' in value:
                            query = query.where(filter=FieldFilter(key, '>=', value['$gte']))
                        if '$lte' in value:
                            query = query.where(filter=FieldFilter(key, '<=', value['$lte']))
                    # Handle regex queries (case-insensitive search)
                    elif isinstance(value, dict) and '$regex' in value:
                        regex_pattern = value['$regex']
                        pattern_lower = regex_pattern.lower()
                        query = query.where(filter=FieldFilter(key, '>=', pattern_lower))
                        query = query.where(filter=FieldFilter(key, '<=', pattern_lower + '\uf8ff'))
                    else:
                        query = query.where(filter=FieldFilter(key, '==', value))

            # Firestore requires order_by on the inequality field when using range filters.
            # Prefer DESC for timestamps to match our deployed indexes.
            def _default_range_direction(field: str) -> str:
                return 'DESCENDING' if field == 'timestamp' else 'ASCENDING'

            if range_field:
                if sort:
                    sort_fields = [f for (f, _d) in sort]
                    if range_field not in sort_fields:
                        query = query.order_by(range_field, direction=_default_range_direction(range_field))
                else:
                    query = query.order_by(range_field, direction=_default_range_direction(range_field))

            if sort:
                for field, direction in sort:
                    query = query.order_by(field, direction='DESCENDING' if direction == -1 else 'ASCENDING')
            
            if skip:
                query = query.offset(skip)
            
            if limit:
                query = query.limit(limit)
            
            docs = query.stream()
            return [firestore_to_dict(doc) for doc in docs]
            
        except DatabaseUnavailableError:
            raise
        except Exception as e:
            logger.error(f"Error in find: {e}")
            return []
    
    @retry_on_failure(max_retries=2, delay=0.5)
    async def insert_one(self, collection_name=None, document=None):
        """
        Insert a single document with retry logic and cache invalidation
        MongoDB equivalent: collection.insert_one(doc)
        """
        # Support both old style and new style
        if collection_name is not None and not isinstance(collection_name, dict):
            coll_name = collection_name
            doc = document
        else:
            coll_name = self.collection_name
            doc = collection_name
        
        try:
            self._ensure_db()
            data = dict_to_firestore(doc)
            
            # If document has an 'id' field, use it as document ID
            doc_id = doc.get('id')
            
            if doc_id:
                self.db.collection(coll_name).document(doc_id).set(data)
                # Cache the new document
                if self.enable_cache and self.cache:
                    ttl = CACHE_TTL.get(coll_name, CACHE_TTL['default'])
                    self.cache.set(coll_name, doc_id, doc, ttl)
                return {'inserted_id': doc_id}
            else:
                doc_ref = self.db.collection(coll_name).add(data)
                inserted_id = doc_ref[1].id
                # Cache the new document
                if self.enable_cache and self.cache:
                    doc['id'] = inserted_id
                    ttl = CACHE_TTL.get(coll_name, CACHE_TTL['default'])
                    self.cache.set(coll_name, inserted_id, doc, ttl)
                return {'inserted_id': inserted_id}
                
        except Exception as e:
            logger.error(f"Error in insert_one: {e}")
            raise
    
    @retry_on_failure(max_retries=2, delay=0.5)
    async def update_one(self, collection_name=None, filter_dict=None, update_dict=None, upsert=False):
        """
        Update a single document with retry logic
        MongoDB equivalent: collection.update_one(filter, {'$set': update})
        """
        # Support both old style and new style
        if collection_name is not None and not isinstance(collection_name, dict):
            coll_name = collection_name
            filt = filter_dict
            upd = update_dict
        else:
            coll_name = self.collection_name
            filt = collection_name
            upd = filter_dict
            if update_dict is not None and isinstance(update_dict, bool):
                upsert = update_dict
        
        try:
            # Find the document first
            doc = await self.find_one(coll_name, filt)
            
            if doc:
                doc_id = doc['id']
                update_data = {}

                # Handle MongoDB $inc operator (Firestore has no $inc; do read-then-write)
                if '$inc' in upd:
                    for field, delta in upd['$inc'].items():
                        current = doc.get(field, 0)
                        try:
                            current = int(current) if current is not None else 0
                        except (TypeError, ValueError):
                            current = 0
                        update_data[field] = current + delta

                # Handle MongoDB $set operator
                if '$set' in upd:
                    set_data = dict_to_firestore(upd['$set'])
                    update_data = {**update_data, **set_data}

                if not update_data:
                    update_data = dict_to_firestore(upd)

                if update_data:
                    self.db.collection(coll_name).document(doc_id).update(dict_to_firestore(update_data))
                # Invalidate cache
                if self.enable_cache and self.cache:
                    self.cache.delete(coll_name, doc_id)
                return {'modified_count': 1}
            elif upsert:
                # Insert if document doesn't exist
                result = await self.insert_one(coll_name, {**filt, **upd.get('$set', upd)})
                return {'modified_count': 0, 'upserted_id': True}
            
            return {'modified_count': 0}
            
        except Exception as e:
            logger.error(f"Error in update_one: {e}")
            raise
    
    @retry_on_failure(max_retries=2, delay=0.5)
    async def delete_one(self, collection_name=None, filter_dict=None):
        """
        Delete a single document with retry logic
        MongoDB equivalent: collection.delete_one(filter)
        """
        # Support both old style and new style
        if collection_name is not None and not isinstance(collection_name, dict):
            coll_name = collection_name
            filt = filter_dict
        else:
            coll_name = self.collection_name
            filt = collection_name
        
        try:
            doc = await self.find_one(coll_name, filt)
            
            if doc:
                doc_id = doc['id']
                self.db.collection(coll_name).document(doc_id).delete()
                # Invalidate cache
                if self.enable_cache and self.cache:
                    self.cache.delete(coll_name, doc_id)
                return {'deleted_count': 1}
            
            return {'deleted_count': 0}
            
        except Exception as e:
            logger.error(f"Error in delete_one: {e}")
            raise
    
    async def count_documents(self, collection_name=None, filter_dict=None):
        """
        Count documents in collection
        MongoDB equivalent: collection.count_documents(filter)
        """
        # Support both old style and new style
        if collection_name is not None and not isinstance(collection_name, dict):
            coll_name = collection_name
            filt = filter_dict
        else:
            coll_name = self.collection_name
            filt = collection_name
        
        try:
            docs = await self.find(coll_name, filt)
            return len(docs)
            
        except DatabaseUnavailableError:
            raise
        except Exception as e:
            logger.error(f"Error in count_documents: {e}")
            return 0
    
    async def aggregate(self, collection_name=None, pipeline=None):
        """
        Aggregate query (simplified)
        Note: Firestore doesn't have aggregation like MongoDB
        This is a simplified version for basic needs
        """
        logger.warning("Aggregate queries are limited in Firestore")
        # For now, return empty list
        # You'll need to implement specific aggregations as needed
        return []
    
    def sort(self, field, direction=-1):
        """MongoDB-like sort method (returns self for chaining)"""
        # This is a placeholder for MongoDB compatibility
        # Actual sorting should be done in find() method
        return self
    
    def limit(self, count):
        """MongoDB-like limit method (returns self for chaining)"""
        # This is a placeholder for MongoDB compatibility
        # Actual limiting should be done in find() method
        return self
    
    def skip(self, count):
        """MongoDB-like skip method (returns self for chaining)"""
        # This is a placeholder for MongoDB compatibility
        # Actual skipping should be done in find() method
        return self
    
    @retry_on_failure(max_retries=2, delay=0.5)
    async def batch_write(self, operations: list):
        """
        Execute multiple write operations in a single batch transaction
        Significantly improves write performance for multiple operations
        
        Args:
            operations: List of operation dicts with format:
                {
                    'type': 'insert' | 'update' | 'delete',
                    'collection': 'collection_name',
                    'document': {...},  # for insert/update
                    'filter': {...},    # for update/delete
                    'update': {...}      # for update only
                }
        
        Returns:
            Dict with results: {'inserted': [...], 'updated': [...], 'deleted': [...]}
        """
        try:
            self._ensure_db()
            batch = self.db.batch()
            results = {
                'inserted': [],
                'updated': [],
                'deleted': []
            }
            
            for op in operations:
                op_type = op.get('type')
                coll_name = op.get('collection', self.collection_name)
                
                if op_type == 'insert':
                    doc = op.get('document', {})
                    data = dict_to_firestore(doc)
                    doc_id = doc.get('id')
                    
                    if doc_id:
                        doc_ref = self.db.collection(coll_name).document(doc_id)
                        batch.set(doc_ref, data)
                        results['inserted'].append(doc_id)
                    else:
                        # Generate ID for batch insert
                        doc_ref = self.db.collection(coll_name).document()
                        batch.set(doc_ref, data)
                        results['inserted'].append(doc_ref.id)
                
                elif op_type == 'update':
                    filt = op.get('filter', {})
                    upd = op.get('update', {})
                    
                    # Find document first
                    doc = await self.find_one(coll_name, filt, use_cache=False)
                    if doc:
                        doc_id = doc['id']
                        update_data = dict_to_firestore(upd.get('$set', upd))
                        doc_ref = self.db.collection(coll_name).document(doc_id)
                        batch.update(doc_ref, update_data)
                        results['updated'].append(doc_id)
                
                elif op_type == 'delete':
                    filt = op.get('filter', {})
                    doc = await self.find_one(coll_name, filt, use_cache=False)
                    if doc:
                        doc_id = doc['id']
                        doc_ref = self.db.collection(coll_name).document(doc_id)
                        batch.delete(doc_ref)
                        results['deleted'].append(doc_id)
            
            # Commit batch
            await batch.commit()
            
            # Invalidate cache for affected documents
            if self.enable_cache and self.cache:
                for doc_id in results['inserted'] + results['updated'] + results['deleted']:
                    coll = operations[0].get('collection', self.collection_name) if operations else self.collection_name
                    if coll:
                        self.cache.delete(coll, doc_id)
            
            return results
            
        except Exception as e:
            logger.error(f"Error in batch_write: {e}")
            raise

# Global database instance
_db_instance = None

def get_db():
    """Get database instance"""
    global _db_instance
    if _db_instance is None:
        _db_instance = FirestoreDB()
    return _db_instance

# Collection accessors
async def get_users_collection():
    return get_db().collection(Collections.USERS)

async def get_rings_collection():
    return get_db().collection(Collections.RINGS)

async def get_admins_collection():
    return get_db().collection(Collections.ADMINS)

async def get_analytics_collection():
    return get_db().collection(Collections.RING_ANALYTICS)

async def get_status_checks_collection():
    return get_db().collection(Collections.STATUS_CHECKS)

