import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import Sidebar from './Sidebar';
import { Button } from './ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from './ui/card';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { 
  Wallet, 
  LogOut, 
  Copy, 
  ExternalLink,
  Loader2
} from 'lucide-react';
import contractData from '../contracts/ETHVercel.json';

// Contract Context Interface
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

const Layout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login, logout, authenticated, user, ready } = usePrivy();
  const { wallets } = useWallets();
  
  // Contract and wallet states
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [provider, setProvider] = useState<any>(null);
  const [currentNetwork, setCurrentNetwork] = useState<ContractContext['currentNetwork']>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  
  // UI states
  const [loading, setLoading] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize contract connection
  const initializeContract = async () => {
    if (!authenticated || !wallets.length) return;

    try {
      setLoading(true);
      // Get the first wallet (main wallet)
      const wallet = wallets[0];
      
      // Get the provider
      const provider = await wallet.getEthersProvider();
      const network = await provider.getNetwork();
      
      const networkData = contractData.networks[network.chainId];
      if (!networkData) {
        throw new Error('Contract not deployed on this network');
      }

      // Get signer from the provider
      const signer = await provider.getSigner();

      const contract = new ethers.Contract(
        networkData.address,
        contractData.abi,
        signer // Use signer instead of provider to allow write operations
      );

      setContract(contract);
      setProvider(provider);
      setCurrentNetwork(networkData);
      setIsConnected(true);
      setAddress(wallet.address);
      setError(null);
    } catch (err: any) {
      console.error('Contract initialization error:', err);
      setError(err.message);
      setIsConnected(false);
      setContract(null);
    } finally {
      setLoading(false);
    }
  };

  // Handle login
  const handleLogin = async () => {
    try {
      setLoading(true);
      await login();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      setIsConnected(false);
      setAddress(null);
      setContract(null);
      setProvider(null);
      setCurrentNetwork(null);
    } catch (err: any) {
      console.error('Logout error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Copy address to clipboard
  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address);
    }
  };

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Initialize contract when authenticated and wallets are available
  useEffect(() => {
    if (authenticated && wallets.length > 0) {
      initializeContract();
    }
  }, [authenticated, wallets]);

  // Get active tab from current path
  const activeTab = location.pathname.split('/')[1] || 'home';

  // Context value for child components
  const contextValue: ContractContext = {
    contract,
    provider,
    currentNetwork,
    isConnected,
    address
  };

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100 relative overflow-hidden">
      <Sidebar activeTab={activeTab} />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4">
            {!isConnected ? (
              <Button 
                className="bg-blue-500 hover:bg-blue-600 rounded flex items-center gap-2" 
                onClick={handleLogin}
                disabled={loading || !ready}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wallet className="w-4 h-4" />
                )}
                Connect Wallet
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 rounded flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    {formatAddress(address || '')}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-gray-800 border-gray-700">
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-700"
                    onClick={copyAddress}
                  >
                    <Copy className="w-4 h-4" />
                    Copy Address
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-700"
                    onClick={() => setShowWalletInfo(true)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Wallet Info
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    className="flex items-center gap-2 cursor-pointer text-red-400 hover:bg-gray-700 hover:text-red-300"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Disconnect
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Network Display */}
          {currentNetwork && (
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              {currentNetwork.name}
            </div>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-900/20 border border-red-700 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Wallet Info Modal */}
        {showWalletInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-96 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Wallet Information</CardTitle>
                <CardDescription>Connected wallet details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {address && (
                    <div>
                      <p className="text-sm font-medium text-gray-400">Address</p>
                      <p className="text-sm font-mono text-gray-200">{address}</p>
                    </div>
                  )}
                  {currentNetwork && (
                    <div>
                      <p className="text-sm font-medium text-gray-400">Network</p>
                      <p className="text-sm text-gray-200">{currentNetwork.name}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Chain ID: {currentNetwork.chainId}
                      </p>
                    </div>
                  )}
                  <Button 
                    className="w-full mt-4" 
                    onClick={() => setShowWalletInfo(false)}
                  >
                    Close
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content with Context Provider */}
        <Outlet context={contextValue} />

        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Layout;