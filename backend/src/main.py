# fastapi imports 
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.responses import RedirectResponse
import uvicorn 
#pydantic imports
from pydantic import BaseModel

# other imports
import os
import logging
import requests
from dotenv import load_dotenv
from typing import List, Dict
from pathlib import Path
import asyncio
import os
import git
import shutil
import subprocess
import aiofiles

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

# Environment Variables Model
class EnvVariable(BaseModel):
    key: str
    value: str

# Deployment Request Model
class DeploymentRequest(BaseModel):
    github_url: str
    env_variables: List[EnvVariable]
    
BASE_DIR = Path("../../deployments")

@app.get("/health_check")
async def health_check():
    return {"Running, CPU Count": os.cpu_count()}

def get_project_dir(github_url: str):
    repo_parts = github_url.strip("/").split("/")
    username = repo_parts[-2]
    repo_name = repo_parts[-1]
    project_name = f"{username}-{repo_name}"
    project_dir = BASE_DIR / project_name
    # if project_dir.exists():
    #     shutil.rmtree(project_dir)
    # project_dir.mkdir(parents=True)
    
    return project_dir
        
        
async def run_command(cmd: List[str], cwd: Path) -> bool:
    """Run a shell command asynchronously"""
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

@app.post("/api/clone")
async def clone_rep(github_url: str):
    project_dir = get_project_dir(github_url)
    if project_dir.exists():
        return True
        #shutil.rmtree(project_dir)
    project_dir.mkdir(parents=True)
    
    try:
        git.Repo.clone_from(github_url, project_dir)
        print("repo cloned")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to clone repository: {str(e)}")
    return True

@app.post("/api/create_env")
async def create_env(request: DeploymentRequest):
    # Create .env file
    project_dir = get_project_dir(request.github_url)
    
    env_content = "\n".join([f"{var.key}={var.value}" for var in request.env_variables])
    # print(env_content)
    print(project_dir, env_content)
    env_file = project_dir /"zkcdn" / ".env"
    print(env_file)
    with open(env_file, "w") as f:
        f.write(env_content)
    print(".env created")
    return True

@app.post("/api/dependency_install")
async def install_dependency(github_url: str):
    project_dir = get_project_dir(github_url)
    
    # Install dependencies
    result = await run_command(["npm", "install"], project_dir/"zkcdn")
    if not result:
        raise HTTPException(status_code=500, detail="Failed to install dependencies")
    print("npm installed")
    return True

@app.post("/api/build")
async def build_project(github_url: str):
    project_dir = get_project_dir(github_url)
    # Build project
    if not await run_command(["npm", "run", "build"], project_dir/"zkcdn"):
        raise HTTPException(status_code=500, detail="Failed to build project")
    print(f"npm run build done {project_dir}")
    return True, project_dir

# Deployment status endpoint
@app.get("/api/deployment/{project_name}/status")
async def deployment_status(project_name: str):
    project_dir = BASE_DIR / project_name
    return {
        "exists": project_dir.exists(),
        "has_node_modules": (project_dir/"zkcdn" / "node_modules").exists() if project_dir.exists() else False,
        "has_build": any((project_dir / d).exists() for d in ["dist", "build"]) if project_dir.exists() else False
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
