import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  Wallet,
  Coins,
  Timer,
  ArrowUpDown,
  LockIcon,
  UnlockIcon,
  Loader2,
  TrendingUp,
  Info
} from 'lucide-react';
import contractData from "../contracts/ETHVercel.json";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B'];

// Mock historical staking data for the chart
const mockStakingHistory = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  stakedAmount: Math.floor(Math.random() * 1000 + 500),
  rewards: Math.floor(Math.random() * 100),
}));

const DeploymentCredentials = () => {
  const { user, ready } = usePrivy();
  const { wallets } = useWallets();
  const [contract, setContract] = useState(null);
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [address, setAddress] = useState('');
  
  const [balances, setBalances] = useState({
    eth: '0',
    usde: '0',
    susde: '0'
  });
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldownInfo, setCooldownInfo] = useState({
    inCooldown: false,
    timeRemaining: 0
  });
  const [rewardRate, setRewardRate] = useState('12'); // Mock APY
  const [hasStakingHistory, setHasStakingHistory] = useState(true);
  const [error, setError] = useState(null);

  // Initialize contract and provider
  useEffect(() => {
    const initContract = async () => {
      if (wallets && wallets.length > 0) {
        try {
          const primaryWallet = wallets[0];
          setAddress(primaryWallet.address);
          const ethersProvider = await primaryWallet.getEthersProvider();
          setProvider(ethersProvider);
          
          const signer = await ethersProvider.getSigner();
          // const networkId = '11155111'; // Sepolia network ID
          
          const newContract = new ethers.Contract(
            contractData.address,
            contractData.abi,
            signer
          );
          
          setContract(newContract);
          setSigner(signer);
          setError(null);
        } catch (error) {
          console.error("Error initializing contract:", error);
          setError("Failed to initialize contract connection. Please make sure you're connected to Sepolia network.");
        }
      }
    };

    if (ready && wallets.length > 0) {
      initContract();
    }
  }, [ready, wallets]);

  // Fetch balances and check cooldown status
  useEffect(() => {
    if (contract && address) {
      fetchBalances();
      checkCooldownStatus();
      const interval = setInterval(fetchBalances, 15000);
      return () => clearInterval(interval);
    }
  }, [contract, address]);

  const fetchBalances = async () => {
    try {
      if (!provider || !contract || !address) return;

      const ethBalance = await provider.getBalance(address);
      
      const usdeBalance = await contract.getUSDeBalance(address);
      const susdeBalance = await contract.getSUSDeBalance(address);
      // console.log(ethBalance, usdeBalance, susdeBalance);
      setBalances({
        eth: ethers.formatEther(ethBalance._hex),
        usde: ethers.formatEther(usdeBalance),
        susde: ethers.formatEther(susdeBalance)
      });

      // Check if user has any staking history
      setHasStakingHistory(Number(ethers.formatEther(susdeBalance)) > 0);
      setError(null);
    } catch (error) {
      console.error('Error fetching balances:', error);
      setError("Failed to fetch balances. Please try again.");
    }
  };

  const checkCooldownStatus = async () => {
    try {
      if (!contract || !address) return;
      
      const isInCooldown = await contract.isCooldownComplete(address);
      const remainingTime = await contract.getRemainingCooldown(address);
      
      setCooldownInfo({
        inCooldown: isInCooldown,
        timeRemaining: Number(remainingTime)
      });
      setError(null);
    } catch (error) {
      console.error('Error checking cooldown:', error);
      setError("Failed to check cooldown status.");
    }
  };

  const handleStake = async () => {
    if (!stakeAmount || !contract || !provider || !address) return;
    
    setLoading(true);
    try {
      const amount = ethers.parseEther(stakeAmount);
      
      // Create USDe contract instance with full ABI
      const usdeContract = new ethers.Contract(
        "0xf805ce4F96e0EdD6f0b6cd4be22B34b92373d696", // USDe address
        [
          "function approve(address spender, uint256 amount) external returns (bool)",
          "function allowance(address owner, address spender) external view returns (uint256)",
          "function balanceOf(address account) external view returns (uint256)"
        ],
        signer
      );
  
      setError("Approving token spending...");
      const approveTx = await usdeContract.approve(
        contractData.networks["11155111"].address, // Contract address from your contract data
        amount
      );
      // await approveTx.wait();
      console.log(`${approveTx}`);
      setError("Staking tokens...");
      const stakeTx = await contract.stake(amount);
      console.log(stakeTx);
      // await stakeTx.wait();
      
      await fetchBalances();
      setStakeAmount('');
      setError(null);
    } catch (error) {
      console.error('Error staking:', error);
      setError(error.reason || "Failed to stake. Please check your balance and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUnstake = async () => {
    if (!unstakeAmount || !contract) return;
    
    setLoading(true);
    try {
      const amount = ethers.parseEther(unstakeAmount);
      const tx = await contract.startCooldownShares(amount);
      await tx.wait();
      await checkCooldownStatus();
      setUnstakeAmount('');
      setError(null);
    } catch (error) {
      console.error('Error initiating unstake:', error);
      setError("Failed to initiate unstake. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleClaimUnstake = async () => {
    if (!contract) return;
    
    setLoading(true);
    try {
      const tx = await contract.unstake();
      await tx.wait();
      await fetchBalances();
      await checkCooldownStatus();
      setError(null);
    } catch (error) {
      console.error('Error claiming unstake:', error);
      setError("Failed to claim unstake. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Data for the pie chart
  const pieData = [
    { name: 'Staked USDe', value: parseFloat(balances.susde) },
    { name: 'Available USDe', value: parseFloat(balances.usde) },
    { name: 'Rewards', value: parseFloat(balances.susde) * 0.12 } // Mock rewards
  ];

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
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {error && (
        <Card className="bg-red-900/20 border-red-800">
          <CardContent className="p-4">
            <p className="text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {/* Balance Cards */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">ETH Balance</CardTitle>
            <Wallet className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parseFloat(balances.eth).toFixed(4)} ETH</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">USDe Balance</CardTitle>
            <Coins className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parseFloat(balances.usde).toFixed(2)} USDe</div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Deployment Credits</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{parseFloat(balances.susde).toFixed(2)} sUSDe</div>
            <p className="text-sm text-gray-400">APY: {rewardRate}%</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Staking Chart */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Staking History</CardTitle>
          <CardDescription>30-day view of your staking activity</CardDescription>
        </CardHeader>
        <CardContent>
          {hasStakingHistory ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockStakingHistory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="day" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="stakedAmount"
                    name="Staked Amount"
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="rewards"
                    name="Rewards"
                    stroke="#10B981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] bg-gray-800/50 rounded-lg border border-gray-700">
              <Info className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-400 text-center">No staking history available.</p>
              <p className="text-gray-500 text-sm text-center mt-2">
                Start staking USDe to see your deployment credits growth!
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staking Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Stake Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Stake USDe</CardTitle>
            <CardDescription>Stake USDe to earn deployment credits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Input
                type="number"
                placeholder="Amount to stake"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="bg-gray-700 border-gray-600"
              />
              <Button
                onClick={handleStake}
                disabled={loading || !stakeAmount || !contract}
                className="bg-blue-500 hover:bg-blue-600"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Stake'
                )}
              </Button>
            </div>
            <p className="text-sm text-gray-400">
              Minimum stake: 1 USDe
            </p>
          </CardContent>
        </Card>

        {/* Unstake Section */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Unstake sUSDe</CardTitle>
            <CardDescription>
              {cooldownInfo.inCooldown
                ? `Cooldown period: ${Math.ceil(cooldownInfo.timeRemaining / 3600)} hours remaining`
                : 'Start 1-hour cooldown period'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <Input
                type="number"
                placeholder="Amount to unstake"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                className="bg-gray-700 border-gray-600"
                disabled={cooldownInfo.inCooldown}
              />
              {cooldownInfo.inCooldown ? (
                <Button
                  onClick={handleClaimUnstake}
                  disabled={loading || cooldownInfo.timeRemaining > 0 || !contract}
                  className="bg-green-500 hover:bg-green-600"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Claim'
                  )}
                </Button>
              ) : (
                <Button
                  onClick={handleUnstake}
                  disabled={loading || !unstakeAmount || !contract}
                  className="bg-yellow-500 hover:bg-yellow-600"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Unstake'
                  )}
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-400">
              {cooldownInfo.inCooldown 
                ? "Your funds will be available after the cooldown period"
                : "1-hour cooldown period required before unstaking"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Portfolio Distribution */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle>Portfolio Distribution</CardTitle>
          <CardDescription>Overview of your staking portfolio</CardDescription>
        </CardHeader>
        <CardContent>
          {hasStakingHistory ? (
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                    formatter={(value) => `${parseFloat(value).toFixed(2)} USDe`}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[300px] bg-gray-800/50 rounded-lg border border-gray-700">
              <Info className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-400 text-center">No portfolio data available yet.</p>
              <p className="text-gray-500 text-sm text-center mt-2">
                Your portfolio distribution will appear here once you start staking.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeploymentCredentials;