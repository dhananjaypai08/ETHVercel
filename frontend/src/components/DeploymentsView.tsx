import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Search, Github, Globe, User, Clock, RefreshCwIcon, Drop, MessageSquare } from 'lucide-react';
import contractData from "../contracts/ETHVercel.json";
import VerifiableDeploymentCard from './VerifiableDeploymentCard';
import AttestationWidget from './AttestationWidget';
import { setPimlicoAsProvider } from '@zerodev/sdk';

const DeploymentCard = ({ deployment, provider }) => {

  const [showAttestations, setShowAttestations] = useState(false);
  const [currentNetwork, setCurrentNetwork] = useState('');
  
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Parse the deployment data JSON
  const deploymentData = React.useMemo(() => {
    try {
      // The data is in deployment[1] based on the contract structure
      return JSON.parse(deployment[1]);
    } catch (e) {
      console.error('Error parsing deployment data:', e);
      return null;
    }
  }, [deployment]);

  // Structure data based on contract's DeploymentDetails struct
  const structuredData = {
    repo_url: deployment[0], // repo_url
    data: deploymentData,    // parsed JSON data
    tokenUri: deployment[2], // tokenuri
    owner: deployment[3]     // owner address
  };

  return (
    <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/80 transition-all">
      <CardHeader className="flex flex-row justify-between items-start">
        <div>
          <CardTitle className="text-lg text-gray-200">
            {deployment.repo_url}
          </CardTitle>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
            <User className="w-4 h-4" />
            <span>{deployment.owner.slice(0, 6)}...{deployment.owner.slice(-4)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowAttestations(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2 text-sm flex items-center gap-2"
          >
          <MessageSquare className="w-4 h-4" />
          Attestations
        </Button>
          {deploymentData?.ipfsUrl && (
            <a
              href={deploymentData.ipfsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300 p-2"
            >
              <Globe className="w-4 h-4" />
            </a>
          )}
          <a
            href="https://github.com/nkilm/openai-gpt3"
            target="_blank"
            rel="noopener noreferrer"
            className="text-purple-400 hover:text-purple-300 p-2"
          >
            <Github className="w-4 h-4" />
          </a>
        </div>
      </CardHeader>
      <AttestationWidget
    isOpen={showAttestations}
    onClose={() => setShowAttestations(false)}
    provider={provider}
  />
    </Card>
   
  );
};

const DeploymentsView = () => {
  const { user, ready } = usePrivy();
  const { wallets } = useWallets();
  const [contract, setContract] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showComponent, setShowComponent] = useState(false);
  const [provider, setProvider] = useState();

  // Add this useEffect to detect network
useEffect(() => {
  const detectNetwork = async () => {
    if (wallets && wallets.length > 0) {
      console.log(wallets);
      const provider = await wallets[0].getEthersProvider();
      console.log(provider);
      setProvider(provider);
      const network = await provider.getNetwork();
      setCurrentNetwork(network.name);
    }
  };
  
  detectNetwork();
}, [wallets]);

  // Initialize contract
  useEffect(() => {
    const initContract = async () => {
      if (wallets && wallets.length > 0) {
        try {
          console.log(wallets[0]);
          const primaryWallet = wallets[0];
          const ethersProvider = await primaryWallet.getEthersProvider();
          // const signer = await ethersProvider.getSigner();
          
          console.log(ethersProvider);
          const contractAddress = contractData.address;
          console.log(contractAddress)
          // console.log(primaryWallet, ethersProvider, signer, contractAddress);
          const newContract = new ethers.Contract(
            contractAddress,
            contractData.abi,
            ethersProvider
          );

          setContract(newContract);
        } catch (error) {
          console.error("Error initializing contract:", error);
          setError("Failed to initialize contract connection");
        }
      }
    };

    if (ready && wallets.length > 0) {
      initContract();
    }
  }, [ready, wallets]);

  // Fetch deployments
  useEffect(() => {
    const fetchDeployments = async () => {
      if (!contract) return;

      try {
        setLoading(true);
        setError(null);

        // Get deployments length using public counter if available
        // If you have a function to get the number of deployments, use that
        let currentIndex = 0;
        let vis = {};
        const deploymentsList = [];
        
        while (currentIndex<5) {
          try {
            //Get user at current index
            const userAddress = await contract.AllUsers(currentIndex);
            if(vis.userAddress == 1){ break; }
            vis[userAddress] = 1;
            
            console.log(userAddress);
            if (!userAddress) break;
            // console.log(address);
            // Get deployments for this user
            const userDeployments = await contract.getDeploymentsOfOwner(userAddress);
            console.log(userDeployments);
            // Process deployments
            // if (userDeployments && userDeployments.length > 0) {
            //   deploymentsList.push(...userDeployments.map(deployment => ({
            //     ...deployment,
            //     owner: userAddress
            //   })));
            // }
            for(let i=0;i<userDeployments.length;i++){
              deploymentsList.push(userDeployments[i]);
            }
            
            currentIndex++;
          } catch (e) {
            // If we hit an error (like out of bounds), break the loop
            console.log(e);
            break;
          }
        }
        // const deploymentsL = deploymentsList.slice(0, 0+5);
        setDeployments(deploymentsList);
        console.log(deploymentsList);
      } catch (err) {
        console.error('Error fetching deployments:', err);
        setError(err.message || 'Failed to fetch deployments');
      } finally {
        setLoading(false);
      }
    };

    if (contract) {
      fetchDeployments();
    }
  }, [contract]);

  // Filter and sort deployments
  const filteredDeployments = React.useMemo(() => {
    let filtered = [...deployments];
    if (searchTerm) {
      filtered = filtered.filter(d => 
        d[0].toLowerCase().includes(searchTerm.toLowerCase()) ||
        d[2].toLowerCase().includes(searchTerm.toLowerCase())
      );
      console.log(filtered);
    }
    const data  = filtered.sort((a, b) => {
      try {
        const dataA = JSON.parse(a.data);
        const dataB = JSON.parse(b.data);
        
        if (sortBy === 'newest') {
          return new Date(dataB.deployedAt) - new Date(dataA.deployedAt);
        } else {
          return new Date(dataA.deployedAt) - new Date(dataB.deployedAt);
        }
      } catch (e) {
        return 0;
      }
    });
    console.log(data);
    return data;
  }, [deployments, searchTerm, sortBy]);

  if (!ready || !wallets.length) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="flex flex-col items-center p-6">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400 mb-4" />
            <p className="text-gray-400">Connecting to wallet...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                Deployments
              </h1>
              <p className="text-gray-400 mt-2">
                View all project deployments on the network
              </p>
            </div>
            
            <Button 
              onClick={() => setContract(prev => ({ ...prev }))} // Trigger refresh
              className="bg-blue-500 hover:bg-blue-600 rounded"
            >
              <RefreshCwIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
            <div className="relative">
            
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by repository or owner..."
                className="pl-10 bg-gray-800 border-gray-700 rounded"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-gray-800 border-gray-700 rounded">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <Card className="bg-red-900/20 border-red-800 mb-6">
            <CardContent className="p-4">
              <p className="text-red-400">{error}</p>
            </CardContent>
          </Card>
        )}
        <Button 
              onClick={() => setShowComponent(!showComponent)}
              className="bg-blue-500 hover:bg-blue-600 rounded">
                Generate Proof
        </Button>
        {showComponent && <VerifiableDeploymentCard deployment={filteredDeployments[0]} />}

        {/* Deployments Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-6 h-6 animate-spin text-blue-400" />
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredDeployments.length > 0 ? (
              filteredDeployments.map((deployment, index) => (
                <DeploymentCard 
                  key={`${deployment[2]}-${index}`} 
                  deployment={deployment} 
                  provider={provider}
                />
              
              ))
            ) : (
              <Card className="bg-gray-800/50 border-gray-700">
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <p className="text-gray-400">No deployments found</p>
                  
                </CardContent>
              </Card>
    
            )}
          </div>
        )}
        
      </div>

      
      
    </div>
  );
};

export default DeploymentsView;