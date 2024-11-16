from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse, FileResponse
from pydantic import BaseModel
import uvicorn
import os
import logging
import requests
from dotenv import load_dotenv
from typing import List, Dict
from pathlib import Path
import asyncio
import git
import shutil
import subprocess
import aiofiles
import time
import zipfile

load_dotenv()
app = FastAPI()

origins = ["http://localhost:3000", "*", "http://localhost:5173"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Models
class CloneRequest(BaseModel):
    github_url: str

class EnvVariable(BaseModel):
    key: str
    value: str

class DeploymentRequest(BaseModel):
    github_url: str
    env_variables: List[EnvVariable]

BASE_DIR = Path("../../deployments")
BASE_DIR.mkdir(parents=True, exist_ok=True)

def get_project_dir(github_url: str):
    repo_parts = github_url.strip("/").split("/")
    username = repo_parts[-2]
    repo_name = repo_parts[-1]
    project_name = f"{username}-{repo_name}"
    project_dir = BASE_DIR / project_name
    return project_dir

async def run_command(cmd: List[str], cwd: Path) -> bool:
    try:
        process = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=str(cwd),
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            print(f"Command failed: {' '.join(cmd)}")
            print(f"Error: {stderr.decode()}")
            return False
        return True
    except Exception as e:
        print(f"Error running command {' '.join(cmd)}: {str(e)}")
        return False

@app.get("/api/get_build_files")
async def get_build_files(build_path: str):
    try:
        build_dir = Path(build_path)
        if not build_dir.exists():
            raise HTTPException(status_code=404, detail=f"Build directory not found at {build_path}")

        # Create a temporary directory for the zip file
        with tempfile.TemporaryDirectory() as temp_dir:
            zip_path = Path(temp_dir) / "build.zip"
            
            # Create zip file containing build directory contents
            with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
                for root, _, files in os.walk(build_dir):
                    root_path = Path(root)
                    for file in files:
                        file_path = root_path / file
                        arcname = file_path.relative_to(build_dir)
                        zipf.write(file_path, arcname)

            # Check if zip was created successfully
            if not zip_path.exists():
                raise HTTPException(status_code=500, detail="Failed to create zip file")

            return FileResponse(
                path=str(zip_path),
                media_type='application/zip',
                filename='build.zip'
            )

    except Exception as e:
        print(f"Error in get_build_files: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/clone")
async def clone_rep(request: CloneRequest):
    try:
        project_dir = get_project_dir(request.github_url)
        print(f"Project directory: {project_dir}")
        print(project_dir)
        if project_dir.exists():
            print("Project directory exists, returning success")
            return {"success": True, "message": "Repository already exists"}
        
        project_dir.mkdir(parents=True, exist_ok=True)
        
        git.Repo.clone_from(request.github_url, project_dir)
        print("Repository cloned successfully")
        return {"success": True, "message": "Repository cloned successfully"}
    except Exception as e:
        error_msg = f"Failed to clone repository: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=400, detail=error_msg)

@app.post("/api/create_env")
async def create_env(request: DeploymentRequest):
    try:
        project_dir = get_project_dir(request.github_url)
        if not project_dir.exists():
            raise HTTPException(status_code=404, detail="Project directory not found")
        
        env_content = "\n".join([f"{var.key}={var.value}" for var in request.env_variables])
        env_file = project_dir / ".env"
        
        # Ensure parent directory exists
        env_file.parent.mkdir(parents=True, exist_ok=True)
        
        with open(env_file, "w") as f:
            f.write(env_content)
        
        return {"success": True, "message": "Environment variables created"}
    except Exception as e:
        error_msg = f"Failed to create environment variables: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/dependency_install")
async def install_dependency(request: CloneRequest):
    try:
        project_dir = get_project_dir(request.github_url)
        if project_dir.exists():
            print("Project directory exists, returning success")
            return {"success": True, "message": "Repository already exists"}
        
        working_dir = project_dir / "zkcdn"
        if not working_dir.exists():
            raise HTTPException(status_code=404, detail="Project subdirectory not found")
        
        result = await run_command(["npm", "install"], working_dir)
        if not result:
            raise HTTPException(status_code=500, detail="Failed to install dependencies")
        
        return {"success": True, "message": "Dependencies installed"}
    except Exception as e:
        error_msg = f"Failed to install dependencies: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

@app.post("/api/build")
async def build_project(request: CloneRequest):
    try:
        project_dir = get_project_dir(request.github_url)
        
        if project_dir.exists():
            print("Project directory exists, returning success")
            return {"success": True, "message": "Repository already exists"}
        
        # Try to find the build directory
        build_dir = None
        possible_build_dirs = ['build', 'dist', 'out']
        
        for build_name in possible_build_dirs:
            temp_dir = project_dir / build_name
            if temp_dir.exists():
                build_dir = temp_dir
                break
        
        if build_dir is None:
            # Run build command
            if not await run_command(["npm", "run", "build"], project_dir):
                raise HTTPException(status_code=500, detail="Failed to build project")
            
            # Check again for build directory
            for build_name in possible_build_dirs:
                temp_dir = project_dir / build_name
                if temp_dir.exists():
                    build_dir = temp_dir
                    break
            
            if build_dir is None:
                raise HTTPException(status_code=404, detail="Build directory not found after build")
        
        return {
            "success": True,
            "message": "Project built successfully",
            "buildPath": str(build_dir)
        }
        
    except Exception as e:
        error_msg = f"Failed to build project: {str(e)}"
        print(error_msg)
        raise HTTPException(status_code=500, detail=error_msg)

# Deployment status endpoint
@app.get("/api/deployment/{project_name}/status")
async def deployment_status(project_name: str):
    project_dir = BASE_DIR / project_name
    return {
        "exists": project_dir.exists(),
        "has_node_modules": (project_dir/ "node_modules").exists() if project_dir.exists() else False,
        "has_build": any((project_dir / d).exists() for d in ["dist", "build"]) if project_dir.exists() else False
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
