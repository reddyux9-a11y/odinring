"""
Firestore proxy for Cloud Run.

Runs inside Google's network so it never depends on the calling host's
outbound IP reputation. The Render backend calls this service over plain
HTTPS instead of talking to Firestore directly.

Auth: a shared secret in the Authorization header (Bearer <FIRESTORE_PROXY_SECRET>).
Firestore access: Application Default Credentials (the Cloud Run service's
own runtime service account) - no service account JSON key needed here.
"""

import os
import secrets
import logging

from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
from typing import Optional, Any

from google.cloud import firestore as gcp_firestore
from google.cloud.firestore_v1 import FieldFilter

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PROJECT_ID = os.environ["FIREBASE_PROJECT_ID"]
DATABASE_ID = os.environ.get("FIRESTORE_DATABASE_ID", "odinringdb")
PROXY_SECRET = os.environ["FIRESTORE_PROXY_SECRET"]

db = gcp_firestore.Client(project=PROJECT_ID, database=DATABASE_ID)

app = FastAPI(title="Firestore Proxy")


def _check_auth(authorization: Optional[str]):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    token = authorization[len("Bearer "):]
    if not secrets.compare_digest(token, PROXY_SECRET):
        raise HTTPException(status_code=401, detail="Invalid token")


def _firestore_to_dict(doc_snapshot):
    if not doc_snapshot.exists:
        return None
    data = doc_snapshot.to_dict()
    data["id"] = doc_snapshot.id
    return data


def _dict_to_firestore(data: dict) -> dict:
    return {k: v for k, v in data.items() if v is not None}


def _apply_filters(query, filt: dict):
    for key, value in (filt or {}).items():
        if key == "$or":
            continue
        if isinstance(value, dict) and "$regex" in value:
            pattern_lower = value["$regex"].lower()
            query = query.where(filter=FieldFilter(key, ">=", pattern_lower))
            query = query.where(filter=FieldFilter(key, "<=", pattern_lower + ""))
        elif isinstance(value, dict) and "$in" in value:
            in_list = value["$in"]
            if in_list:
                query = query.where(filter=FieldFilter(key, "in", in_list))
        elif isinstance(value, dict) and ("$gte" in value or "$lte" in value):
            if "$gte" in value:
                query = query.where(filter=FieldFilter(key, ">=", value["$gte"]))
            if "$lte" in value:
                query = query.where(filter=FieldFilter(key, "<=", value["$lte"]))
        else:
            query = query.where(filter=FieldFilter(key, "==", value))
    return query


class FindOneRequest(BaseModel):
    collection: str
    filter: dict = {}


class FindRequest(BaseModel):
    collection: str
    filter: Optional[dict] = None
    limit: Optional[int] = None
    sort: Optional[list] = None
    skip: Optional[int] = None


class InsertOneRequest(BaseModel):
    collection: str
    document: dict


class UpdateOneRequest(BaseModel):
    collection: str
    filter: dict
    update: dict
    upsert: bool = False


class DeleteOneRequest(BaseModel):
    collection: str
    filter: dict


class BatchWriteRequest(BaseModel):
    operations: list


@app.post("/find_one")
def find_one(req: FindOneRequest, authorization: Optional[str] = Header(None)):
    _check_auth(authorization)
    filt = req.filter or {}

    if "$or" in filt:
        for condition in filt["$or"]:
            result = find_one(FindOneRequest(collection=req.collection, filter=condition), authorization)
            if result:
                return result
        return None

    if "id" in filt:
        doc_id = str(filt["id"])
        snap = db.collection(req.collection).document(doc_id).get()
        if not snap.exists:
            return None
        result = _firestore_to_dict(snap)
        for key, expected in filt.items():
            if key in ("$or", "id"):
                continue
            if result.get(key) != expected:
                return None
        return result

    query = _apply_filters(db.collection(req.collection), filt)
    docs = list(query.limit(1).stream())
    for doc in docs:
        return _firestore_to_dict(doc)
    return None


@app.post("/find")
def find(req: FindRequest, authorization: Optional[str] = Header(None)):
    _check_auth(authorization)
    filt = req.filter or {}

    if "$or" in filt:
        all_results = []
        seen_ids = set()
        for condition in filt["$or"]:
            for result in find(FindRequest(collection=req.collection, filter=condition), authorization):
                if result["id"] not in seen_ids:
                    all_results.append(result)
                    seen_ids.add(result["id"])
        if req.sort:
            for field, direction in req.sort:
                all_results.sort(key=lambda x: x.get(field, ""), reverse=(direction == -1))
        if req.skip:
            all_results = all_results[req.skip:]
        if req.limit:
            all_results = all_results[:req.limit]
        return all_results

    query = db.collection(req.collection)
    range_field = None

    for key, value in filt.items():
        if key == "$or":
            continue
        if isinstance(value, dict) and "$in" in value:
            in_list = value["$in"]
            if in_list:
                query = query.where(filter=FieldFilter(key, "in", in_list))
        elif isinstance(value, dict) and ("$gte" in value or "$lte" in value):
            range_field = key
            if "$gte" in value:
                query = query.where(filter=FieldFilter(key, ">=", value["$gte"]))
            if "$lte" in value:
                query = query.where(filter=FieldFilter(key, "<=", value["$lte"]))
        elif isinstance(value, dict) and "$regex" in value:
            pattern_lower = value["$regex"].lower()
            query = query.where(filter=FieldFilter(key, ">=", pattern_lower))
            query = query.where(filter=FieldFilter(key, "<=", pattern_lower + ""))
        else:
            query = query.where(filter=FieldFilter(key, "==", value))

    def _default_range_direction(field):
        return "DESCENDING" if field == "timestamp" else "ASCENDING"

    if range_field:
        sort_fields = [f for (f, _d) in (req.sort or [])]
        if range_field not in sort_fields:
            query = query.order_by(range_field, direction=_default_range_direction(range_field))

    if req.sort:
        for field, direction in req.sort:
            query = query.order_by(field, direction="DESCENDING" if direction == -1 else "ASCENDING")

    if req.skip:
        query = query.offset(req.skip)
    if req.limit:
        query = query.limit(req.limit)

    docs = list(query.stream())
    return [_firestore_to_dict(doc) for doc in docs]


@app.post("/insert_one")
def insert_one(req: InsertOneRequest, authorization: Optional[str] = Header(None)):
    _check_auth(authorization)
    data = _dict_to_firestore(req.document)
    doc_id = req.document.get("id")

    if doc_id:
        db.collection(req.collection).document(doc_id).set(data)
        return {"inserted_id": doc_id}
    else:
        doc_ref = db.collection(req.collection).add(data)
        return {"inserted_id": doc_ref[1].id}


@app.post("/update_one")
def update_one(req: UpdateOneRequest, authorization: Optional[str] = Header(None)):
    _check_auth(authorization)
    doc = find_one(FindOneRequest(collection=req.collection, filter=req.filter), authorization)

    if doc:
        doc_id = doc["id"]
        update_data: dict = {}

        if "$inc" in req.update:
            for field, delta in req.update["$inc"].items():
                current = doc.get(field, 0)
                try:
                    current = int(current) if current is not None else 0
                except (TypeError, ValueError):
                    current = 0
                update_data[field] = current + delta

        if "$set" in req.update:
            update_data = {**update_data, **_dict_to_firestore(req.update["$set"])}

        if not update_data:
            update_data = _dict_to_firestore(req.update)

        if update_data:
            db.collection(req.collection).document(doc_id).update(_dict_to_firestore(update_data))
        return {"modified_count": 1}
    elif req.upsert:
        merged = {**req.filter, **req.update.get("$set", req.update)}
        result = insert_one(InsertOneRequest(collection=req.collection, document=merged), authorization)
        return {"modified_count": 0, "upserted_id": True}

    return {"modified_count": 0}


@app.post("/delete_one")
def delete_one(req: DeleteOneRequest, authorization: Optional[str] = Header(None)):
    _check_auth(authorization)
    doc = find_one(FindOneRequest(collection=req.collection, filter=req.filter), authorization)
    if doc:
        db.collection(req.collection).document(doc["id"]).delete()
        return {"deleted_count": 1}
    return {"deleted_count": 0}


@app.post("/batch_write")
def batch_write(req: BatchWriteRequest, authorization: Optional[str] = Header(None)):
    _check_auth(authorization)
    batch = db.batch()
    results: dict = {"inserted": [], "updated": [], "deleted": []}

    for op in req.operations:
        op_type = op.get("type")
        coll_name = op.get("collection")

        if op_type == "insert":
            doc = op.get("document", {})
            data = _dict_to_firestore(doc)
            doc_id = doc.get("id")
            if doc_id:
                doc_ref = db.collection(coll_name).document(doc_id)
                batch.set(doc_ref, data)
                results["inserted"].append(doc_id)
            else:
                doc_ref = db.collection(coll_name).document()
                batch.set(doc_ref, data)
                results["inserted"].append(doc_ref.id)

        elif op_type == "update":
            filt = op.get("filter", {})
            upd = op.get("update", {})
            doc = find_one(FindOneRequest(collection=coll_name, filter=filt), authorization)
            if doc:
                doc_id = doc["id"]
                update_data = _dict_to_firestore(upd.get("$set", upd))
                doc_ref = db.collection(coll_name).document(doc_id)
                batch.update(doc_ref, update_data)
                results["updated"].append(doc_id)

        elif op_type == "delete":
            filt = op.get("filter", {})
            doc = find_one(FindOneRequest(collection=coll_name, filter=filt), authorization)
            if doc:
                doc_id = doc["id"]
                doc_ref = db.collection(coll_name).document(doc_id)
                batch.delete(doc_ref)
                results["deleted"].append(doc_id)

    batch.commit()
    return results


@app.get("/health")
def health():
    return {"status": "ok", "project": PROJECT_ID, "database": DATABASE_ID}
