import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { usePrivy, useLogin, useWallets } from '@privy-io/react-auth';
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

const Layout = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState('');
  const [isConnected, setConnected] = useState(false);
  const [showWalletInfo, setShowWalletInfo] = useState(false);
  
  const { login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

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
      setConnected(false);
      setAddress('');
    } catch (error) {
      console.error('Logout error:', error);
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

  // Update connection status when auth state changes
  useEffect(() => {
    if (authenticated && user) {
      setConnected(true);
      const userAddress = user.wallet?.address;
      if (userAddress) {
        setAddress(userAddress);
      }
    } else {
      setConnected(false);
      setAddress('');
    }
  }, [authenticated, user]);

  // Format address for display
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  // Get active tab from current path
  const activeTab = location.pathname.split('/')[1] || 'home';

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
              >
                <Wallet className="w-4 h-4" />
                Connect Wallet
              </Button>
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 rounded flex items-center gap-2">
                    <Wallet className="w-4 h-4" />
                    {formatAddress(address)}
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
                    <p className="text-sm font-mono">{address}</p>
                  </div>
                  {wallets.map((wallet) => (
                    <div key={wallet.address} className="space-y-2">
                      <p className="text-sm font-medium text-gray-400">Chain</p>
                      <p className="text-sm">{wallet.chainName}</p>
                    </div>
                  ))}
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

        <Outlet />

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