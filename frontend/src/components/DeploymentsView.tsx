import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePrivy } from '@privy-io/react-auth';
import { ethers } from 'ethers';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Search,
  Filter,
  ExternalLink,
  Clock,
  Github,
  Globe,
  ChevronDown,
  RefreshCw,
  Box,
  FileCode,
  User,
  NetworkIcon
} from 'lucide-react';
import contractData from '../contracts/ETHVercel.json';
import { useOutletContext } from 'react-router-dom';

interface ContractContext {
  contract: ethers.Contract | null;
  provider: any;
  currentNetwork: {
    address: string;
    chainId: number;
    name: string;
    Link: string;
  } | null;
  isConnected: boolean;
  address: string | null;
}

const DeploymentsView = () => {
  const [deployments, setDeployments] = useState([]);
  const [userDeployments, setUserDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedNetwork, setSelectedNetwork] = useState(Object.keys(contractData.networks)[0]);

  const context = useOutletContext<ContractContext>();
  const { contract, provider, isConnected, address } = context || {};

  const fetchDeployments = async () => {
    if (!contract || !isConnected) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch all users
      const allUsers = await contract.AllUsers();
      console.log(allUsers, provider, contract);
      // Fetch deployments for each user
      const allDeployments = await Promise.all(
        allUsers.map(async (userAddress) => {
          try {
            const deploymentsOfUser = await contract.getDeploymentsOfOwner(userAddress);
            console.log(deploymentsOfUser);
            return deploymentsOfUser.map((deployment) => ({
              ...deployment,
              owner: userAddress,
              deployedAt: new Date().toISOString() // Placeholder, adjust based on your data
            }));
          } catch (error) {
            console.error(`Error fetching deployments for ${userAddress}:`, error);
            return [];
          }
        })
      );

      const flattenedDeployments = allDeployments.flat();
      setDeployments(flattenedDeployments);

      // If user is connected, fetch their deployments
      if (address) {
        const userDeploys = await contract.getDeploymentsOfOwner(address);
        setUserDeployments(userDeploys.map((deploy) => ({
          ...deploy,
          owner: address,
          deployedAt: new Date().toISOString() // Placeholder, adjust based on your data
        })));
      }
    } catch (err) {
      console.error('Error fetching deployments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeployments();
  }, [contract, address, isConnected]);

  const filteredDeployments = React.useMemo(() => {
    let filtered = filter === 'user' ? userDeployments : deployments;

    if (searchTerm) {
      filtered = filtered.filter(d => 
        d.repo_url.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.owner.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.deployedAt).getTime() - new Date(a.deployedAt).getTime();
        case 'oldest':
          return new Date(a.deployedAt).getTime() - new Date(b.deployedAt).getTime();
        case 'owner':
          return a.owner.localeCompare(b.owner);
        default:
          return 0;
      }
    });
  }, [deployments, userDeployments, filter, searchTerm, sortBy]);

  const networkOptions = Object.entries(contractData.networks).map(([chainId, data]) => ({
    value: chainId,
    label: data.name
  }));

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <Card className="bg-gray-800 border-red-600">
          <CardHeader>
            <CardTitle className="text-red-500">Error Loading Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-400">{error}</p>
            <Button 
              onClick={fetchDeployments}
              className="mt-4 bg-red-500 hover:bg-red-600"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
              Deployments
            </h1>
            <p className="text-gray-400 mt-1">
              View and manage your project deployments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={selectedNetwork}
              onValueChange={setSelectedNetwork}
            >
              <SelectTrigger className="w-[180px] bg-gray-800 border-gray-700">
                <SelectValue placeholder="Select Network" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                {networkOptions.map(option => (
                  <SelectItem 
                    key={option.value} 
                    value={option.value}
                    className="text-gray-200 hover:bg-gray-700"
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={fetchDeployments}
              className="bg-blue-500 hover:bg-blue-600 flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search deployments..."
              className="pl-10 bg-gray-800 border-gray-700 focus-visible:ring-teal-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full bg-gray-800 border-gray-700">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 border-gray-700">
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="owner">Owner Address</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Main Content */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="bg-gray-800 border-gray-700">
            <TabsTrigger 
              value="all"
              onClick={() => setFilter('all')}
              className="data-[state=active]:bg-gray-700"
            >
              All Deployments
            </TabsTrigger>
            <TabsTrigger 
              value="user"
              onClick={() => setFilter('user')}
              className="data-[state=active]:bg-gray-700"
              disabled={!address}
            >
              My Deployments
            </TabsTrigger>
          </TabsList>

          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDeployments.length > 0 ? (
                  filteredDeployments.map((deployment, index) => (
                    <motion.div
                      key={`${deployment.owner}-${index}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="w-full"
                    >
                      <Card className="bg-gray-800/50 border-gray-700 hover:bg-gray-800/80 transition-all">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg text-gray-200">
                                {deployment.repo_url.split('/').slice(-2).join('/')}
                              </CardTitle>
                              <CardDescription className="flex items-center gap-2 text-gray-400">
                                <User className="w-4 h-4" />
                                {deployment.owner.slice(0, 6)}...{deployment.owner.slice(-4)}
                              </CardDescription>
                            </div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <ChevronDown className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="bg-gray-800 border-gray-700">
                                <DropdownMenuItem className="flex items-center gap-2 text-blue-400 hover:text-blue-300">
                                  <Github className="w-4 h-4" />
                                  <a 
                                    href={deployment.repo_url} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    View Repository
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2 text-teal-400 hover:text-teal-300">
                                  <Globe className="w-4 h-4" />
                                  <a 
                                    href={deployment.data} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    View Deployment
                                  </a>
                                </DropdownMenuItem>
                                <DropdownMenuItem className="flex items-center gap-2 text-purple-400 hover:text-purple-300">
                                  <Box className="w-4 h-4" />
                                  <a 
                                    href={`https://ipfs.io/ipfs/${deployment.tokenuri}`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    View on IPFS
                                  </a>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-gray-400">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(deployment.deployedAt).toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 text-gray-400">
                              <NetworkIcon className="w-4 h-4" />
                              <span>{contractData.networks[selectedNetwork]?.name}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                ) : (
                  <Card className="bg-gray-800/50 border-gray-700">
                    <CardContent className="flex flex-col items-center justify-center h-64">
                      <FileCode className="w-12 h-12 text-gray-600 mb-4" />
                      <p className="text-gray-400">No deployments found</p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default DeploymentsView;