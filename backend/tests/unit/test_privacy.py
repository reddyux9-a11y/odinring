"""
Unit tests for Privacy & GDPR Compliance Module

SECURITY: Tests for data retention, user deletion, and consent management
"""
import pytest
from unittest.mock import Mock, AsyncMock, patch, MagicMock
from datetime import datetime, timedelta
import sys
from pathlib import Path

backend_dir = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_dir))

# Import privacy modules (FirestoreDB is mocked in conftest.py)
from privacy.data_retention import DataRetentionService
from privacy.user_deletion import UserDeletionService
from privacy.consent import ConsentManager


@pytest.mark.asyncio
class TestDataRetentionService:
    """Test data retention service"""
    
    async def test_purge_expired_analytics(self):
        """Test purging expired analytics data"""
        service = DataRetentionService(retention_days=90)
        
        with patch('privacy.data_retention.FirestoreDB') as mock_db:
            mock_collection = MagicMock()
            mock_db.return_value = mock_collection
            mock_collection.find = AsyncMock(return_value=[
                {"id": "old1", "timestamp": datetime.utcnow() - timedelta(days=100)},
                {"id": "old2", "timestamp": datetime.utcnow() - timedelta(days=95)}
            ])
            mock_collection.delete_one = AsyncMock()
            
            results = await service.purge_expired_analytics()
            
            assert "analytics" in results
            assert results["analytics"] >= 0
    
    async def test_get_retention_stats(self):
        """Test getting retention statistics"""
        service = DataRetentionService(retention_days=90)
        
        with patch('privacy.data_retention.FirestoreDB') as mock_db:
            mock_collection = MagicMock()
            mock_db.return_value = mock_collection
            mock_collection.count_documents = AsyncMock(return_value=100)
            mock_collection.find = AsyncMock(return_value=[])
            
            stats = await service.get_retention_stats()
            
            assert "retention_days" in stats
            assert stats["retention_days"] == 90
            assert "collections" in stats


@pytest.mark.asyncio
class TestUserDeletionService:
    """Test user deletion service"""
    
    async def test_delete_user_data(self):
        """Test deleting all user data"""
        service = UserDeletionService()
        
        with patch('privacy.user_deletion.FirestoreDB') as mock_db, \
             patch('privacy.user_deletion.log_audit_event') as mock_audit:
            
            mock_collection = MagicMock()
            mock_db.return_value = mock_collection
            mock_collection.find = AsyncMock(return_value=[
                {"id": "doc1"},
                {"id": "doc2"}
            ])
            mock_collection.delete_one = AsyncMock()
            mock_audit.return_value = True
            
            results = await service.delete_user_data(
                "user_123",
                "admin_123",
                "127.0.0.1",
                "pytest"
            )
            
            assert results["user_id"] == "user_123"
            assert "collections" in results
            mock_audit.assert_called_once()
    
    async def test_anonymize_user_data(self):
        """Test anonymizing user data"""
        service = UserDeletionService()
        
        with patch('privacy.user_deletion.FirestoreDB') as mock_db, \
             patch('privacy.user_deletion.log_audit_event') as mock_audit:
            
            mock_collection = MagicMock()
            mock_db.return_value = mock_collection
            mock_collection.update_one = AsyncMock()
            mock_audit.return_value = True
            
            results = await service.anonymize_user_data(
                "user_123",
                "user_123",
                "127.0.0.1",
                "pytest"
            )
            
            assert results["user_id"] == "user_123"
            assert "anonymized_at" in results
            mock_audit.assert_called_once()


@pytest.mark.asyncio
class TestConsentManager:
    """Test consent management"""
    
    async def test_record_consent(self):
        """Test recording user consent"""
        manager = ConsentManager()
        
        with patch('privacy.consent.ConsentManager.consents_collection') as mock_collection:
            mock_collection.create = AsyncMock()
            
            result = await manager.record_consent(
                "user_123",
                "analytics",
                True,
                "127.0.0.1",
                "pytest"
            )
            
            assert result["user_id"] == "user_123"
            assert result["consent_type"] == "analytics"
            assert result["granted"] is True
            mock_collection.create.assert_called_once()
    
    async def test_get_user_consent(self):
        """Test getting user consent"""
        manager = ConsentManager()
        
        with patch('privacy.consent.ConsentManager.consents_collection') as mock_collection:
            mock_collection.find = AsyncMock(return_value=[
                {
                    "user_id": "user_123",
                    "consent_type": "analytics",
                    "granted": True,
                    "recorded_at": datetime.utcnow()
                }
            ])
            
            consent = await manager.get_user_consent("user_123", "analytics")
            
            assert consent is not None
            assert consent["granted"] is True
    
    async def test_has_consent_granted(self):
        """Test has consent when granted"""
        manager = ConsentManager()
        
        with patch.object(manager, 'get_user_consent') as mock_get:
            mock_get.return_value = {
                "granted": True,
                "recorded_at": datetime.utcnow()
            }
            
            result = await manager.has_consent("user_123", "analytics")
            
            assert result is True
    
    async def test_has_consent_denied(self):
        """Test has consent when denied"""
        manager = ConsentManager()
        
        with patch.object(manager, 'get_user_consent') as mock_get:
            mock_get.return_value = {
                "granted": False,
                "recorded_at": datetime.utcnow()
            }
            
            result = await manager.has_consent("user_123", "analytics")
            
            assert result is False
    
    async def test_has_consent_no_record(self):
        """Test has consent when no record exists"""
        manager = ConsentManager()
        
        with patch.object(manager, 'get_user_consent') as mock_get:
            mock_get.return_value = None
            
            result = await manager.has_consent("user_123", "analytics")
            
            assert result is False
    
    async def test_require_consent_before_tracking_allowed(self):
        """Test require consent when tracking allowed"""
        manager = ConsentManager()
        
        with patch.object(manager, 'has_consent') as mock_has:
            mock_has.return_value = True
            
            result = await manager.require_consent_before_tracking("user_123", "analytics")
            
            assert result is True
    
    async def test_require_consent_before_tracking_denied(self):
        """Test require consent when tracking denied"""
        manager = ConsentManager()
        
        with patch.object(manager, 'has_consent') as mock_has:
            mock_has.return_value = False
            
            result = await manager.require_consent_before_tracking("user_123", "analytics")
            
            assert result is False

