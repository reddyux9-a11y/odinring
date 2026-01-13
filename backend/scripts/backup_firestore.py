#!/usr/bin/env python3
"""
Automated Firestore Backup Script
Exports Firestore database to Google Cloud Storage
"""
import os
import sys
from datetime import datetime
from pathlib import Path
import subprocess
import logging

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from config import settings

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def backup_firestore():
    """
    Export Firestore database to Google Cloud Storage
    Uses gcloud CLI for export operation
    """
    try:
        project_id = settings.FIREBASE_PROJECT_ID
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
        bucket_name = os.getenv('BACKUP_BUCKET_NAME', f'{project_id}-firestore-backups')
        backup_path = f'gs://{bucket_name}/backups/{timestamp}'
        
        logger.info(f"Starting Firestore backup...")
        logger.info(f"Project: {project_id}")
        logger.info(f"Database: odinringdb")
        logger.info(f"Destination: {backup_path}")
        
        # Run gcloud firestore export command
        cmd = [
            'gcloud', 'firestore', 'export',
            backup_path,
            '--project', project_id,
            '--database', 'odinringdb',
            '--async'  # Run asynchronously
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        
        logger.info("✅ Backup initiated successfully!")
        logger.info(f"Output: {result.stdout}")
        
        # Log operation ID for tracking
        if "operation" in result.stdout.lower():
            logger.info(f"Track backup progress with: gcloud operations describe [OPERATION_ID]")
        
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Backup failed: {e}")
        logger.error(f"Error output: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error during backup: {e}")
        return False


def list_recent_backups(limit=10):
    """List recent backups from Cloud Storage"""
    try:
        project_id = settings.FIREBASE_PROJECT_ID
        bucket_name = os.getenv('BACKUP_BUCKET_NAME', f'{project_id}-firestore-backups')
        
        logger.info(f"Listing recent backups from gs://{bucket_name}/backups/")
        
        cmd = [
            'gsutil', 'ls', '-l',
            f'gs://{bucket_name}/backups/'
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        
        logger.info("Recent backups:")
        lines = result.stdout.split('\n')[:limit]
        for line in lines:
            if line.strip():
                logger.info(f"  {line}")
        
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Failed to list backups: {e}")
        logger.error(f"Error output: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        return False


def setup_backup_bucket():
    """Create backup bucket if it doesn't exist"""
    try:
        project_id = settings.FIREBASE_PROJECT_ID
        bucket_name = os.getenv('BACKUP_BUCKET_NAME', f'{project_id}-firestore-backups')
        region = os.getenv('BACKUP_REGION', 'us-central1')
        
        logger.info(f"Setting up backup bucket: {bucket_name}")
        
        # Check if bucket exists
        check_cmd = ['gsutil', 'ls', f'gs://{bucket_name}/']
        check_result = subprocess.run(check_cmd, capture_output=True, text=True)
        
        if check_result.returncode == 0:
            logger.info(f"✅ Bucket {bucket_name} already exists")
            return True
        
        # Create bucket
        create_cmd = [
            'gsutil', 'mb',
            '-p', project_id,
            '-c', 'STANDARD',
            '-l', region,
            f'gs://{bucket_name}/'
        ]
        
        subprocess.run(create_cmd, check=True)
        logger.info(f"✅ Created bucket: {bucket_name}")
        
        # Set lifecycle policy to delete old backups after 30 days
        lifecycle_config = '''
        {
          "lifecycle": {
            "rule": [
              {
                "action": {"type": "Delete"},
                "condition": {
                  "age": 30,
                  "matchesPrefix": ["backups/"]
                }
              }
            ]
          }
        }
        '''
        
        # Save lifecycle config to temp file
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            f.write(lifecycle_config)
            lifecycle_file = f.name
        
        # Apply lifecycle policy
        lifecycle_cmd = ['gsutil', 'lifecycle', 'set', lifecycle_file, f'gs://{bucket_name}/']
        subprocess.run(lifecycle_cmd, check=True)
        logger.info("✅ Set 30-day retention policy on backups")
        
        # Clean up temp file
        os.unlink(lifecycle_file)
        
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Failed to setup bucket: {e}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error: {e}")
        return False


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Firestore Backup Tool')
    parser.add_argument('--setup', action='store_true', help='Setup backup bucket')
    parser.add_argument('--list', action='store_true', help='List recent backups')
    parser.add_argument('--backup', action='store_true', help='Run backup now')
    
    args = parser.parse_args()
    
    if args.setup:
        setup_backup_bucket()
    elif args.list:
        list_recent_backups()
    elif args.backup:
        backup_firestore()
    else:
        # Default: run backup
        backup_firestore()


