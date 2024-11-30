export interface DeploymentDetails {
    repo_url: string;
    data: string;
    tokenuri: string;
    owner: string;
  }
  
  export interface DeploymentMap {
    blockTimestamp: string;
    record_owner: string;
    record_data: string;
  }
  
  export interface Mint {
    id: string;
    _to: string;
    transactionHash: string;
    uri: string;
  }
  
  export interface ChatMessage {
    type: 'user' | 'bot';
    content: string;
    timestamp: Date;
  }
  
  export interface EnvVariable {
    key: string;
    value: string;
  }
  
  export interface DeploymentStatus {
    isDeploying: boolean;
    currentStep: string;
    completedSteps: string[];
    error: string | null;
    deployedUrls: {
      ipfs?: string;
      ipns?: string;
    } | null;
    showLinks: boolean;
  }
  
  export interface VerificationStep {
    name: string;
    status: 'idle' | 'loading' | 'success' | 'error';
    responseTime?: number;
    error?: string;
  }