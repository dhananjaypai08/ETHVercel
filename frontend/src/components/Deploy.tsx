import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X, Check, Loader2, Github, Globe, Terminal } from 'lucide-react';
import axios from 'axios';
import { create } from "@web3-storage/w3up-client";
import { filesFromPaths } from 'files-from-path';
import {Name} from "w3name"
const BACKEND_URL = 'http://localhost:8000';

const Deploy = () => {
  const [githubUrl, setGithubUrl] = useState('');
  const [envVariables, setEnvVariables] = useState([{ key: '', value: '' }]);
  const [deploymentStatus, setDeploymentStatus] = useState({
    isDeploying: false,
    currentStep: '',
    completedSteps: [],
    error: null,
    deployedUrls: null
  });

  const deploySteps = [
    'Cloning repository',
    'Setting up environment',
    'Installing dependencies',
    'Building project',
    'Deploying to IPFS'
  ];

  const uploadToIPFS = async (buildPath) => {
    try {
      // const filesResponse = await axios.get(`${BACKEND_URL}/api/get_build_files`, {
      //   params: { build_path: buildPath },
      //   responseType: 'arraybuffer',  // Important for handling binary data
      //   headers: {
      //     'Accept': 'application/zip'
      //   }
      // });
  
      // if (!filesResponse.data) {
      //   throw new Error('Failed to get build files');
      // }
      const client = await create();
      await client.setCurrentSpace("did:key:z6MkunTdA3s954ZXkKRxcViA3vCsfuNJX3pKSoa1GE7apsZX");

    // Convert the received data to a File object
    // const buildFiles = new File(
    //   [filesResponse.data], 
    //   'build.zip', 
    //   { type: 'application/zip' }
    // );

    // Upload to IPFS
    // console.log('Uploading to IPFS...');
    // const cid = await client.uploadFile(buildFiles);
    const cid = "bafybeidn2xt6wiyxqi7dqqfx6qxowizg2ob5xmyg6i5ho7bwz6ti4vhv6e";
    console.log('File uploaded with CID:', cid);

    // Create IPNS record
    console.log('Creating IPNS record...');
    const name = await Name.create();
    console.log('created new name: ', name.toString());
      // const name = await client.name.publish(cid);
      // console.log('Published to IPNS:', name);
    const revision = await Name.v0(name, `https://${cid}.ipfs.w3s.link/index.html`);

    return {
      ipfsUrl: `https://${cid}.ipfs.w3s.link/index.html`,
      ipnsUrl: `https://${name}.ipns.w3s.link`,
      ipfsCid: cid,
      ipnsName: name
    };
  } catch (error) {
    console.error('IPFS upload error:', error);
    if (error.response) {
      console.error('Error response:', error.response.data);
      throw new Error(
        error.response.data.detail || 
        error.response.data.message || 
        'Failed to upload to IPFS'
      );
    }
    throw error;
  }
  };

  const addEnvVariable = () => {
    setEnvVariables([...envVariables, { key: '', value: '' }]);
  };

  const removeEnvVariable = (index) => {
    const newVariables = envVariables.filter((_, i) => i !== index);
    setEnvVariables(newVariables);
  };

  const updateEnvVariable = (index, field, value) => {
    const newVariables = [...envVariables];
    newVariables[index] = { ...newVariables[index], [field]: value };
    setEnvVariables(newVariables);
  };

  const updateDeploymentStep = (step, completed = false, error = null) => {
    setDeploymentStatus(prev => ({
      ...prev,
      currentStep: completed ? deploySteps[deploySteps.indexOf(step) + 1] || '' : step,
      completedSteps: completed ? [...prev.completedSteps, step] : prev.completedSteps,
      error: error
    }));
  };

  const handleDeploy = async () => {
    setDeploymentStatus({
      isDeploying: true,
      currentStep: deploySteps[0],
      completedSteps: [],
      error: null,
      deployedUrls: null
    });
  
    try {
      // Step 1: Clone Repository
      updateDeploymentStep('Cloning repository');
      const cloneResponse = await axios.post(`${BACKEND_URL}/api/clone`, {
        github_url: githubUrl
      });
      
      if (!cloneResponse.data.success) {
        throw new Error(cloneResponse.data.message || 'Failed to clone repository');
      }
      updateDeploymentStep('Cloning repository', true);
  
      // Step 2: Setup Environment
      updateDeploymentStep('Setting up environment');
      const validEnvVariables = envVariables.filter(v => v.key && v.value);
      const envResponse = await axios.post(`${BACKEND_URL}/api/create_env`, {
        github_url: githubUrl,
        env_variables: validEnvVariables
      });
      
      if (!envResponse.data.success) {
        throw new Error(envResponse.data.message || 'Failed to create environment variables');
      }
      updateDeploymentStep('Setting up environment', true);
  
      // Step 3: Install Dependencies
      updateDeploymentStep('Installing dependencies');
      const installResponse = await axios.post(`${BACKEND_URL}/api/dependency_install`, {
        github_url: githubUrl
      });
      
      if (!installResponse.data.success) {
        throw new Error(installResponse.data.message || 'Failed to install dependencies');
      }
      updateDeploymentStep('Installing dependencies', true);
  
      // Step 4: Build Project
      updateDeploymentStep('Building project');
      const buildResponse = await axios.post(`${BACKEND_URL}/api/build`, {
        github_url: githubUrl
      });
      
      if (!buildResponse.data.success) {
        throw new Error(buildResponse.data.message || 'Failed to build project');
      }
      updateDeploymentStep('Building project', true);
  
      // Step 5: Deploy to IPFS
      updateDeploymentStep('Deploying to IPFS');
      const buildPath = buildResponse.data.buildPath;
      
      const { ipfsUrl, ipnsUrl, ipfsCid, ipnsName } = await uploadToIPFS(buildPath);
  
      // Store deployment info
      await axios.post(`${BACKEND_URL}/api/store_deployment`, {
        github_url: githubUrl,
        ipfs_cid: ipfsCid,
        ipns_name: ipnsName
      });
  
      setDeploymentStatus(prev => ({
        ...prev,
        completedSteps: [...prev.completedSteps, 'Deploying to IPFS'],
        currentStep: '',
        isDeploying: false,
        deployedUrls: {
          ipfs: ipfsUrl,
          ipns: ipnsUrl
        }
      }));
  
    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus(prev => ({
        ...prev,
        error: error.response?.data?.detail || error.message,
        isDeploying: false
      }));
    }
  };

  const isValidGithubUrl = (url) => {
    return url.match(/^https:\/\/github\.com\/[\w-]+\/[\w-]+$/);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500 mb-4">
          Deploy Your Project
        </h1>
        <p className="text-gray-400 text-lg">
          Deploy your GitHub repository with custom environment variables
        </p>
      </motion.div>

      <Card className="bg-gray-800/50 border-gray-700 mb-6">
        <CardContent className="p-6">
          <div className="space-y-4">
            {/* GitHub URL Input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                GitHub Repository URL
              </label>
              <div className="relative">
                <Github className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  type="text"
                  placeholder="https://github.com/username/repository"
                  className="pl-10 bg-gray-900 border-gray-700 focus-visible:ring-teal-500 rounded"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                />
              </div>
            </div>

            {/* Environment Variables Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-300">
                  Environment Variables
                </label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addEnvVariable}
                  className="border-gray-600 hover:bg-gray-700 rounded"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Variable
                </Button>
              </div>

              <AnimatePresence>
                {envVariables.map((variable, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex gap-3"
                  >
                    <Input
                      placeholder="KEY"
                      className="bg-gray-900 border-gray-700 focus-visible:ring-teal-500 rounded"
                      value={variable.key}
                      onChange={(e) => updateEnvVariable(index, 'key', e.target.value)}
                    />
                    <Input
                      placeholder="VALUE"
                      className="bg-gray-900 border-gray-700 focus-visible:ring-teal-500 rounded"
                      value={variable.value}
                      onChange={(e) => updateEnvVariable(index, 'value', e.target.value)}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeEnvVariable(index)}
                      className="hover:bg-gray-700"
                    >
                      <X className="h-4 w-4 text-gray-400" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Deploy Button */}
            <Button
              className="bg-teal-500 hover:bg-teal-600 mt-6 rounded w-full"
              // disabled={!isValidGithubUrl(githubUrl) || deploymentStatus.isDeploying}
              onClick={handleDeploy}
            >
              {deploymentStatus.isDeploying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deploying...
                </>
              ) : (
                <>
                  <Terminal className="mr-2 h-4 w-4" />
                  Start Deployment
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Deployment Progress Section */}
      {(deploymentStatus.isDeploying || deploymentStatus.completedSteps.length > 0) && (
        <Card className="bg-gray-800/50 border-gray-700 rounded">
          <CardHeader>
            <CardTitle>Deployment Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {deploySteps.map((step) => (
                <div
                  key={step}
                  className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                    deploymentStatus.currentStep === step
                      ? 'bg-gray-700/50 border border-gray-600'
                      : deploymentStatus.completedSteps.includes(step)
                      ? 'bg-gray-800/30'
                      : 'bg-gray-800/10'
                  }`}
                >
                  <span className="text-gray-300">{step}</span>
                  <div className="flex items-center">
                    {deploymentStatus.completedSteps.includes(step) ? (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Check className="h-5 w-5 text-teal-500" />
                      </motion.div>
                    ) : deploymentStatus.currentStep === step ? (
                      <Loader2 className="h-5 w-5 text-teal-500 animate-spin" />
                    ) : (
                      <div className="h-5 w-5" />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Deployed URLs Section */}
            {deploymentStatus.deployedUrls && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 space-y-4"
              >
                {/* IPFS URL */}
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">IPFS URL:</span>
                    <a
                      href={deploymentStatus.deployedUrls.ipfs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-teal-400 hover:text-teal-300"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      View on IPFS
                    </a>
                  </div>
                </div>

                {/* IPNS URL */}
                <div className="p-4 bg-gray-700/30 rounded-lg border border-gray-600">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300">IPNS URL (Permanent):</span>
                    <a
                      href={deploymentStatus.deployedUrls.ipns}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-teal-400 hover:text-teal-300"
                    >
                      <Globe className="h-4 w-4 mr-1" />
                      View on IPNS
                    </a>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Error Message Section */}
            {deploymentStatus.error && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 bg-red-900/20 rounded-lg border border-red-800"
              >
                <span className="text-red-400">{deploymentStatus.error}</span>
              </motion.div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Deploy;