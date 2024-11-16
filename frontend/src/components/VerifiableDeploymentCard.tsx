import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Loader2, 
  ExternalLink, 
  ShieldCheck, 
  Clock,
  CheckCircle2,
  XCircle,
  GithubIcon
} from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = 'http://localhost:8000';

interface DeploymentCardProps {
  deployment: {
    repo_url: string;
    data: string;
    tokenuri: string;
    owner: string;
  };
}

interface VerificationStep {
  name: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  responseTime?: number;
  error?: string;
}

const VerifiableDeploymentCard: React.FC<DeploymentCardProps> = ({ deployment }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationComplete, setVerificationComplete] = useState(false);
  const [deploymentData, setDeploymentData] = useState(() => {
    try {
      console.log(deployment)
      return JSON.parse(deployment);
    } catch (e) {
      console.error('Failed to parse deployment data:', e);
      return {};
    }
  });

  const [steps, setSteps] = useState<VerificationStep[]>([
    { name: 'Generate Witness', status: 'idle' },
    { name: 'Generate Proof', status: 'idle' },
    { name: 'Verify Proof', status: 'idle' },
  ]);

  const updateStep = (index: number, updates: Partial<VerificationStep>) => {
    setSteps(currentSteps => 
      currentSteps.map((step, i) => 
        i === index ? { ...step, ...updates } : step
      )
    );
  };

  const verifyDeployment = async () => {
    setIsVerifying(true);
    let allStepsSuccessful = true;

    try {
      console.log(deployment[0]);
      const data = {
        "max_distance": 200,
        "maxResponseTime": 2,
        "currentDistance": 10,
        "currentResponseTime": 1,
        "deploymentId": 12

      }
      updateStep(0, { status: 'loading' });
      const cloneStartTime = performance.now();
      const cloneResponse = await axios.post(`${BACKEND_URL}/generate_witness`, {});
      
      const cloneEndTime = performance.now();

      
      updateStep(0, {
          status: 'success',
          responseTime: Math.round(cloneEndTime - cloneStartTime)
      });
      

      
      updateStep(1, { status: 'loading' });
      const installStartTime = performance.now();
      const installResponse = await axios.post(`${BACKEND_URL}/generate_proof/TEST`, {
        github_url: deployment.repo_url
      });
      const installEndTime = performance.now();

      if (installResponse) {
        updateStep(1, {
          status: 'success',
          responseTime: Math.round(installEndTime - installStartTime)
        });
      } else {
        throw new Error(installResponse.data.message);
      }

      
      updateStep(2, { status: 'loading' });
      const buildStartTime = performance.now();
      const buildResponse = await axios.post(`${BACKEND_URL}/verify_proof/TEST`, {
        github_url: deployment.repo_url
      });
      const buildEndTime = performance.now();

      if (buildResponse) {
        updateStep(2, {
          status: 'success',
          responseTime: Math.round(buildEndTime - buildStartTime)
        });
      } else {
        throw new Error(buildResponse.data.message);
      }

      
      // Find the current loading step and mark it as failed
      const currentLoadingIndex = steps.findIndex(step => step.status === 'loading');
      if (currentLoadingIndex !== -1) {
        updateStep(currentLoadingIndex, {
          status: 'error',
          error: error.response?.data?.detail || error.message
        });
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700 mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-4">
          <GithubIcon className="w-6 h-6 text-gray-400" />
          <div>
            <CardTitle className="text-lg font-semibold text-gray-100">
              {deployment[0]}
            </CardTitle>
            <p className="text-sm text-gray-400">
              {deployment[2].slice(0, 6)}...{deployment[2].slice(-4)}
            </p>
          </div>
        </div>
        
        <Button
          onClick={verifyDeployment}
          disabled={isVerifying || verificationComplete}
          className={`gap-2 ${
            verificationComplete 
              ? 'bg-green-600 hover:bg-green-700' 
              : 'bg-teal-500 hover:bg-teal-600'
          }`}
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Verifying
            </>
          ) : verificationComplete ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              Verified
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              Verify
            </>
          )}
        </Button>
      </CardHeader>

      <CardContent>
        <div className="space-y-4">
          {/* Repository Info */}
          <div className="text-sm text-gray-400">
            <p>Repository: {deployment[0]}</p>
            {deploymentData.deployedAt && (
              <p>Deployed: {new Date(deploymentData.deployedAt).toLocaleDateString()}</p>
            )}
          </div>

          {/* Verification Steps */}
          <AnimatePresence>
            {(isVerifying || steps.some(step => step.status !== 'idle')) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                {steps.map((step, index) => (
                  <motion.div
                    key={step.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-3 rounded-lg ${
                      step.status === 'idle' ? 'bg-gray-700/30' :
                      step.status === 'loading' ? 'bg-blue-900/20 border border-blue-800' :
                      step.status === 'success' ? 'bg-green-900/20 border border-green-800' :
                      'bg-red-900/20 border border-red-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStepIcon(step.status)}
                        <span className="text-sm font-medium text-gray-200">
                          {step.name}
                        </span>
                      </div>
                      {step.responseTime && step.status === 'success' && (
                        <span className="text-xs text-gray-400">
                          {step.responseTime}ms
                        </span>
                      )}
                    </div>
                    {step.error && (
                      <p className="mt-2 text-sm text-red-400">{step.error}</p>
                    )}
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* IPFS Link */}
          {deploymentData.ipfsUrl && (
            <div className="pt-4">
              <Button
                variant="outline"
                className="gap-2 w-full"
                disabled={!verificationComplete}
                onClick={() => window.open(deploymentData.ipfsUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
                {verificationComplete ? 'View Deployment' : 'Verify First to View'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VerifiableDeploymentCard;