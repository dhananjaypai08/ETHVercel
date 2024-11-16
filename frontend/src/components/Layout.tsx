import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
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
import { Wallet, LogOut, Copy, ExternalLink } from 'lucide-react';
import contractData from '../contracts/ETHVercel.json';

interface NetworkConfig {
  address: string;
  chainId: number;
  name: string;
  Link: string;
}

interface ContractState {
  contract: ethers.Contract | null;
  provider: any;
  currentNetwork: NetworkConfig | null;
}

const Layout = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  const [contractState, setContractState] = useState<ContractState>({
    contract: null,
    provider: null,
    currentNetwork: null
  });
  
  const { login, logout, authenticated, ready, user } = usePrivy();
  const { wallets } = useWallets();

  // Initialize contract when wallet is connected
  const initializeContract = async (wallet: any) => {
    try {
      const ethProvider = await wallet.getEthersProvider();
      const signer = await ethProvider.getSigner();
      const network = await ethProvider.getNetwork();
      const chainId = String(network.chainId);
      console.log(chainId);
      //Find network configuration
      const networkConfig = Object.values(contractData.networks).find(
        (net: any) => net.chainId === network.chainId
      ) as NetworkConfig;

      if (!networkConfig) {
        console.error('Network not supported');
        return;
      }
      console.log(signer, network, contractData.address);
      // Create contract instance
      const contract = new ethers.Contract(
        contractData.address,
        contractData.abi,
        signer
      );

      console.log(signer, network, contract, contractData.networks);

      setContractState({
        contract,
        provider: ethProvider,
        currentNetwork: networkConfig
      });

    } catch (error) {
      console.error('Error initializing contract:', error);
    }
  };

  // Handle login completion
  const handleLogin = async () => {
    setLoading(true);
    try {
      await login();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      setContractState({
        contract: null,
        provider: null,
        currentNetwork: null
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Copy address to clipboard
  const copyAddress = () => {
    if (wallets?.[0]?.address) {
      navigator.clipboard.writeText(wallets[0].address);
    }
  };

  // Initialize wallet and contract when authenticated
  useEffect(() => {
    const initWallet = async () => {
      if (authenticated && wallets.length > 0) {
        const embeddedWallet = wallets[0];
        await initializeContract(embeddedWallet);
      }
    };

    if (ready) {
      initWallet();
    }
  }, [authenticated, wallets, ready]);

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get active tab from current path
  const activeTab = location.pathname.split('/')[1] || 'home';

  // Get the current wallet address
  const currentAddress = wallets?.[0]?.address;

  // Don't render until Privy is ready
  if (!ready) {
    return (
      <div className="flex min-h-screen bg-gray-950 text-gray-100 items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-950 text-gray-100 relative overflow-hidden">
      <Sidebar activeTab={activeTab} />
      <div className="flex-1 p-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex gap-4">
            {!authenticated ? (
              <Button 
                className="bg-blue-500 hover:bg-blue-600 rounded flex items-center gap-2" 
                onClick={handleLogin}
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 rounded flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    {formatAddress(currentAddress || '')}
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
        </div>

        {/* Wallet Info Modal */}
        {showWalletInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Card className="w-96 bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Wallet Information</CardTitle>
                <CardDescription>Connected wallet details</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-400">Address</p>
                    <p className="text-sm font-mono">{currentAddress}</p>
                  </div>
                  {contractState.currentNetwork && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-400">Network</p>
                      <p className="text-sm">{contractState.currentNetwork.name}</p>
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

        <Outlet context={{ 
          contract: contractState.contract,
          provider: contractState.provider,
          currentNetwork: contractState.currentNetwork,
          isConnected: authenticated,
          address: currentAddress
        }} />

        {loading && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Layout;