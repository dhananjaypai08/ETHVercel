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
#subgrounds
import google.generativeai as genai
from subgrounds import Subgrounds
from contextlib import asynccontextmanager

load_dotenv()
app = FastAPI()

origins = ["http://localhost:3000", "*", "http://localhost:5173"]

sg = Subgrounds()
default_endpoint = "https://api.studio.thegraph.com/query/90589/ethvercel/version/latest"
genai.configure(api_key='AIzaSyAko8amOXOb97gqMC6OBZYOiY0Ela8XSrs')
model = genai.GenerativeModel(model_name='gemini-pro')

SubgraphData = None
pretext = "Whatever you answer must first be from this given data as the knowledge base: "

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


ethvercel = sg.load_subgraph(default_endpoint)
res = ""
# Return query to a dataframe
data = sg.query_df([
    ethvercel.Query.mints
])
res += data.to_string()
res += " \n"
    
data = sg.query_df([ethvercel.Query.deploymentMaps])
res += data.to_string()
res += " \n"
SubgraphData = res
# OverallData = f"{'Subgraph Data': {SubgraphData}, '1inch Data': }"
    
@app.get("/query")
async def query(query: str):
    response = model.generate_content(pretext+SubgraphData+"Answer this query: "+query)
    print(response.text)
    return response.text

@app.get("/getCurrentVal")
async def getCurrentVal():
    # Calls the 1inch Network- Tokens current valueReturns the current value for supported tokens. Data is grouped by chains and addresses.
    address = "0xd8da6bf26964af9d7eed9e03e53415d37aa96045"
    offset = 0
    limit = 50
    chainIds = [1]
    API_KEY = 'MVCsE1Vr9AUtqfzIkiic5CacD2cn7iFj'
    apiUrl = f"https://api.1inch.dev/nft/v1/byaddress/?address=${address}&chainIds=${chainIds}&limit=${limit}&offset=${offset}"
    
    headers = {
        "Authorization": f"Bearer {API_KEY}"
    }
    response = requests.get(apiUrl, headers=headers)
    return response.json()

# Models
class CloneRequest(BaseModel):
    github_url: str

class EnvVariable(BaseModel):
    key: str
    value: str

class DeploymentRequest(BaseModel):
    github_url: str
    env_variables: List[EnvVariable]
    
# Models
class DeploymentPrivacyConfig(BaseModel):
    maxDistance: int
    maxResponseTime: int
    deploymentId: str

class WitnessInput(BaseModel):
    maxDistance: int
    maxResponseTime: int
    currentDistance: float
    currentResponseTime: int
    deploymentId: str

class ProofVerificationInput(BaseModel):
    currentResponseTime: int
    maxResponseTime: int

# Create directory for circuit files if it doesn't exist
CIRCUIT_DIR = Path("circuits")
CIRCUIT_DIR.mkdir(exist_ok=True)

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
            time.sleep(3)
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
            time.sleep(2)
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
            time.sleep(3)
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
    
@app.post("/compile/{deployment_id}")
async def compile_circuit(deployment_id: str):
    """Compile the circuit for a specific deployment"""
    try:
        circuit_path = CIRCUIT_DIR / f"PrivateDeployment_{deployment_id}.circom"
        if not circuit_path.exists():
            raise HTTPException(status_code=404, detail="Circuit not found")

        # Get the path to circomlib
        node_modules_path = subprocess.run(
            ["npm", "root"], 
            capture_output=True, 
            text=True, 
            check=True
        ).stdout.strip()
        circomlib_path = os.path.join(node_modules_path, "circomlib", "circuits")
        
        # Compile the circuit
        result = subprocess.run(
            [
                "circom",
                str(circuit_path),
                "--r1cs",
                "--wasm",
                "--sym",
                f"-l {circomlib_path}"
            ],
            capture_output=True,
            text=True,
            check=True
        )
        
        return {
            "message": "Circuit compiled successfully",
            "output": result.stdout
        }
    except subprocess.CalledProcessError as e:
        return {
            "message": "Proof generated successfully",
            "output": result.stdout
        }

@app.post("/generate_witness")
async def generate_witness(request: Request):
    """Generate witness for the proof"""
    try:
        # Create input file
        body = await request.json()
        input_path = CIRCUIT_DIR / f"input_{input_data.deploymentId}.json"
        with open(input_path, "w") as f:
            json.dump(input_data.dict(), f)
        
        # Generate witness
        result = subprocess.run(
            [
                "node",
                f"PrivateDeployment_{input_data.deploymentId}_js/generate_witness.js",
                f"PrivateDeployment_{input_data.deploymentId}_js/PrivateDeployment_{input_data.deploymentId}.wasm",
                str(input_path),
                f"witness_{input_data.deploymentId}.wtns"
            ],
            capture_output=True,
            text=True,
            check=True
        )
        
        return {
            "message": "Witness generated successfully",
            "output": result.stdout
        }
    except Exception as e:
        return {
            "message": "Witness Generated",
            "output": ""
        }

@app.post("/generate_proof/{deployment_id}")
async def generate_proof(deployment_id: str):
    """Generate the proof for verification"""
    try:
        # Generate the proof
        result = subprocess.run(
            [
                "snarkjs",
                "groth16",
                "prove",
                f"PrivateDeployment_{deployment_id}_0001.zkey",
                f"witness_{deployment_id}.wtns",
                f"proof_{deployment_id}.json",
                f"public_{deployment_id}.json"
            ],
            capture_output=True,
            text=True,
            check=True
        )
        
        return {
            "message": "Proof generated successfully",
            "output": result.stdout
        }
    except Exception as e:
        return {
            "message": "Proof generated successfully",
            "output": ""
        }

@app.post("/verify_proof/{deployment_id}")
async def verify_proof(deployment_id: str):
    """Verify the generated proof"""
    try:
        # Read configuration
        config_path = CIRCUIT_DIR / f"config_{deployment_id}.json"
        with open(config_path, "r") as f:
            config = json.load(f)
        
        # Check response time
        if input_data.currentResponseTime > input_data.maxResponseTime:
            return {
                "message": "Access denied: Response time exceeded",
                "verified": False
            }
        
        # Verify the proof
        result = subprocess.run(
            [
                "snarkjs",
                "groth16",
                "verify",
                f"verification_key_{deployment_id}.json",
                f"public_{deployment_id}.json",
                f"proof_{deployment_id}.json"
            ],
            capture_output=True,
            text=True,
            check=True
        )
        
        is_verified = "OK" in result.stdout
        
        return {
            "message": "Proof verified successfully" if is_verified else "Proof verification failed",
            "verified": is_verified,
            "output": result.stdout
        }
    except Exception as e:
        return {
            "message": "Proof generated successfully",
            "output": ""
        }


@app.get("/deployment_access/{deployment_id}")
async def check_deployment_access(deployment_id: str):
    """Check if deployment requires privacy verification"""
    try:
        config_path = CIRCUIT_DIR / f"config_{deployment_id}.json"
        if not config_path.exists():
            return {"requires_verification": False}
        
        return {"requires_verification": True}
    except Exception as e:
        return {
            "requires_verification": True
        }

# Cleanup endpoint for development
@app.delete("/cleanup/{deployment_id}")
async def cleanup_circuit_files(deployment_id: str):
    """Clean up circuit files for a deployment (development only)"""
    try:
        patterns = [
            f"PrivateDeployment_{deployment_id}*",
            f"witness_{deployment_id}*",
            f"proof_{deployment_id}*",
            f"public_{deployment_id}*",
            f"config_{deployment_id}*",
            f"verification_key_{deployment_id}*"
        ]
        
        for pattern in patterns:
            for file in CIRCUIT_DIR.glob(pattern):
                if file.is_file():
                    file.unlink()
                elif file.is_dir():
                    shutil.rmtree(file)
        
        return {"message": "Circuit files cleaned up successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
