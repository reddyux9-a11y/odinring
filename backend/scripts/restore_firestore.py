#!/usr/bin/env python3
"""
Firestore Restore Script
Restores Firestore database from a backup in Google Cloud Storage
"""
import os
import sys
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


def restore_firestore(backup_path):
    """
    Restore Firestore database from a backup
    
    Args:
        backup_path: Full GCS path to backup (e.g., gs://bucket/backups/20240101_120000)
    """
    try:
        project_id = settings.FIREBASE_PROJECT_ID
        
        logger.info(f"Starting Firestore restore...")
        logger.info(f"Project: {project_id}")
        logger.info(f"Database: odinringdb")
        logger.info(f"Source: {backup_path}")
        logger.warning("⚠️  This will overwrite existing data!")
        
        # Confirm restore
        confirm = input("Type 'RESTORE' to confirm: ")
        if confirm != 'RESTORE':
            logger.info("Restore cancelled")
            return False
        
        # Run gcloud firestore import command
        cmd = [
            'gcloud', 'firestore', 'import',
            backup_path,
            '--project', project_id,
            '--database', 'odinringdb',
            '--async'
        ]
        
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            check=True
        )
        
        logger.info("✅ Restore initiated successfully!")
        logger.info(f"Output: {result.stdout}")
        
        if "operation" in result.stdout.lower():
            logger.info(f"Track restore progress with: gcloud operations describe [OPERATION_ID]")
        
        return True
        
    except subprocess.CalledProcessError as e:
        logger.error(f"❌ Restore failed: {e}")
        logger.error(f"Error output: {e.stderr}")
        return False
    except Exception as e:
        logger.error(f"❌ Unexpected error during restore: {e}")
        return False


if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Firestore Restore Tool')
    parser.add_argument('backup_path', help='GCS path to backup (gs://bucket/backups/timestamp)')
    
    args = parser.parse_args()
    
    restore_firestore(args.backup_path)


