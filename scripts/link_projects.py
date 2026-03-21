#!/usr/bin/env python3
"""
Link Vercel projects using the API
Creates projects if they don't exist, then links them
"""
import os
import json
import sys
import requests
from pathlib import Path

VERCEL_TOKEN = os.environ.get("VERCEL_TOKEN")
API_BASE = "https://api.vercel.com"

if not VERCEL_TOKEN:
    print("ERROR: VERCEL_TOKEN environment variable is required.")
    sys.exit(1)

def get_account_info():
    """Get user account information"""
    response = requests.get(
        f"{API_BASE}/v2/user",
        headers={"Authorization": f"Bearer {VERCEL_TOKEN}"}
    )
    response.raise_for_status()
    return response.json()

def list_projects():
    """List all projects"""
    response = requests.get(
        f"{API_BASE}/v9/projects",
        headers={"Authorization": f"Bearer {VERCEL_TOKEN}"}
    )
    response.raise_for_status()
    return response.json().get('projects', [])

def create_project(name):
    """Create a new project"""
    response = requests.post(
        f"{API_BASE}/v9/projects",
        headers={
            "Authorization": f"Bearer {VERCEL_TOKEN}",
            "Content-Type": "application/json"
        },
        json={"name": name}
    )
    response.raise_for_status()
    return response.json()

def get_or_create_project(name):
    """Get existing project or create new one"""
    projects = list_projects()
    
    # Check if project exists
    for project in projects:
        if project.get('name') == name:
            print(f"✅ Project '{name}' already exists: {project.get('id')}")
            return project
    
    # Create new project
    print(f"📦 Creating project '{name}'...")
    project = create_project(name)
    print(f"✅ Project created: {project.get('id')}")
    return project

def link_project(project_name, project_dir):
    """Link a project to a directory"""
    project_dir = Path(project_dir)
    project_dir.mkdir(parents=True, exist_ok=True)
    
    # Get or create project
    project = get_or_create_project(project_name)
    project_id = project.get('id')
    
    # Get account info for org ID
    account = get_account_info()
    user = account.get('user', {})
    org_id = user.get('id') or user.get('username', '')
    
    # Create .vercel directory
    vercel_dir = project_dir / '.vercel'
    vercel_dir.mkdir(exist_ok=True)
    
    # Write project.json
    project_json = {
        "projectId": project_id,
        "orgId": org_id
    }
    
    project_json_path = vercel_dir / 'project.json'
    with open(project_json_path, 'w') as f:
        json.dump(project_json, f, indent=2)
    
    print(f"✅ Linked '{project_name}' to {project_dir}/.vercel/project.json")
    return project_id

def main():
    print("🔗 Linking Vercel Projects")
    print("=" * 50)
    print("")
    
    # Get account info
    print("1. Getting account information...")
    try:
        account = get_account_info()
        username = account.get('user', {}).get('username', 'unknown')
        print(f"✅ Authenticated as: {username}")
    except Exception as e:
        print(f"❌ Authentication failed: {e}")
        sys.exit(1)
    
    print("")
    
    # Link backend
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("🔗 Backend Project")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    try:
        backend_id = link_project("odinring-backend", "backend")
    except Exception as e:
        print(f"❌ Failed to link backend: {e}")
        sys.exit(1)
    
    print("")
    
    # Link frontend
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("🔗 Frontend Project")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    try:
        frontend_id = link_project("odinring-frontend", "frontend")
    except Exception as e:
        print(f"❌ Failed to link frontend: {e}")
        sys.exit(1)
    
    print("")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("✅ Projects Linked!")
    print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print("")
    print(f"Backend Project ID: {backend_id}")
    print(f"Frontend Project ID: {frontend_id}")
    print("")
    print("📋 Next: Set environment variables and deploy")
    print("")

if __name__ == "__main__":
    main()
