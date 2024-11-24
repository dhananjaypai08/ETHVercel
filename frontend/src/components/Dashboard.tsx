import { motion } from 'framer-motion';
import { ApolloClient, InMemoryCache, gql } from '@apollo/client';
import {
  LineChart, Line, PieChart, Pie, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid, Legend
} from 'recharts';
import {
  RefreshCw, ExternalLink, Activity, Clock, 
  Users, GitBranch, CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useRef, useEffect } from 'react';
import { 
  MessageCircle, 
  Send, 
  MinimizeIcon, 
  Maximize2, 
  X,
  Bot
} from 'lucide-react';
import { Input } from '@/components/ui/input';

// Add these interfaces
interface ChatMessage {
  type: 'user' | 'bot';
  content: string;
  timestamp: Date;
}

const AnalyticsChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    // Add user message
    const userMessage: ChatMessage = {
      type: 'user',
      content: message,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);

    try {
      // Call your backend API
      const response = await fetch(`http://localhost:8000/query?query=${encodeURIComponent(message)}`);
      const data = await response.text();

      // Add bot response
      const botMessage: ChatMessage = {
        type: 'bot',
        content: data,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error querying AI:', error);
      const errorMessage: ChatMessage = {
        type: 'bot',
        content: 'Sorry, I encountered an error processing your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-3 shadow-lg transition-all duration-200"
      >
        <MessageCircle className="w-6 h-6" />
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className={`fixed bottom-4 right-4 bg-gray-800 border border-gray-700 rounded-lg shadow-xl transition-all duration-200 ${
        isMinimized ? 'w-72 h-12' : 'w-96 h-[500px]'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-400" />
          <span className="font-medium text-gray-200">Analytics Assistant</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="text-gray-400 hover:text-gray-300"
          >
            {isMinimized ? <Maximize2 className="w-4 h-4" /> : <MinimizeIcon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-300"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages Area */}
          <div className="p-4 h-[380px] overflow-y-auto space-y-4">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.type === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-gray-200'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {msg.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </motion.div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-700 text-gray-200 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Ask about deployment analytics..."
                className="flex-1 bg-gray-700 border-gray-600 focus:border-blue-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
};

const client = new ApolloClient({
  uri: 'https://api.goldsky.com/api/public/project_cm3rlo9y0r3jf01y00qmy2kqb/subgraphs/ZKVercel/0.0.1/gn',
  cache: new InMemoryCache(),
});

const QUERIES = {
  mints: gql`
    {
      mints(first: 20) {
        id
        _to
        transactionHash
        uri
      }
    }
  `,
  deploymentMaps: gql`
    {
      deploymentMaps(orderBy: blockTimestamp, first: 20) {
        blockTimestamp
        record_owner
        record_data
      }
    }
  `,
  upkeeps: gql`
    {
      performUpkeeps(orderBy: id) {
        _counter
        blockTimestamp
        id
      }
      upkeepChecks(orderBy: id) {
        id
        transactionHash
        blockNumber
      }
    }
  `
};

const Dashboard = () => {
  const [data, setData] = useState({
    mints: [],
    deploymentMaps: [],
    upkeeps: { performUpkeeps: [], upkeepChecks: [] }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching data...');
      
      const [mintsRes, deploymentMapsRes, upkeepsRes] = await Promise.all([
        client.query({ query: QUERIES.mints }),
        client.query({ query: QUERIES.deploymentMaps }),
        client.query({ query: QUERIES.upkeeps })
      ]);

      console.log('Fetched data:', {
        mints: mintsRes.data,
        deployments: deploymentMapsRes.data,
        upkeeps: upkeepsRes.data
      });

      setData({
        mints: mintsRes.data.mints || [],
        deploymentMaps: deploymentMapsRes.data.deploymentMaps || [],
        upkeeps: upkeepsRes.data || { performUpkeeps: [], upkeepChecks: [] }
      });
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Process deployment data
  const processedDeployments = data.deploymentMaps.map(deployment => {
    try {
      const parsedData = JSON.parse(deployment.record_data || '{}');
      return {
        ...deployment,
        timestamp: new Date(parseInt(deployment.blockTimestamp) * 1000),
        ipfsUrl: parsedData.ipfsUrl,
        ipfsCid: parsedData.ipfsCid,
        deployedAt: parsedData.deployedAt
      };
    } catch (err) {
      console.error('Error processing deployment:', err);
      return {
        ...deployment,
        timestamp: new Date(parseInt(deployment.blockTimestamp) * 1000),
        ipfsUrl: '',
        ipfsCid: '',
        deployedAt: ''
      };
    }
  });

  // Calculate statistics
  const stats = {
    totalDeployments: {
      value: data.deploymentMaps.length,
      icon: GitBranch,
      description: 'Total Deployments'
    },
    totalMints: {
      value: data.mints.length,
      icon: Activity,
      description: 'Total Mints'
    },
    uniqueUsers: {
      value: new Set([
        ...data.mints.map(m => m.to),
        ...data.deploymentMaps.map(d => d.record_owner)
      ]).size,
      icon: Users,
      description: 'Unique Users'
    },
    successRate: {
      value: data.deploymentMaps.length > 0 
        ? ((data.deploymentMaps.length / data.mints.length) * 100).toFixed(1) + '%'
        : '0%',
      icon: CheckCircle,
      description: 'Uptime of the Server'
    }
  };

  // Prepare time series data
  const timeSeriesData = processedDeployments
    .sort((a, b) => a.timestamp - b.timestamp)
    .map((d, index) => ({
      timestamp: d.timestamp,
      deployments: 1,
      cumulative: index + 1
    }));

  // Prepare user activity data
  const userActivityData = Object.entries(
    data.deploymentMaps.reduce((acc, curr) => {
      const owner = curr.record_owner;
      acc[owner] = (acc[owner] || 0) + 1;
      return acc;
    }, {})
  ).map(([address, count]) => ({
    address,
    deployments: count
  }));

  // Color scheme for charts
  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-500" />
          <span className="text-lg">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-red-500 text-center">
          <p className="text-lg">Error loading analytics:</p>
          <p className="text-sm opacity-80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
            Deployment Analytics
          </h1>
          <Button
            onClick={fetchData}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh Data
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(stats).map(([key, stat]) => (
            <Card key={key} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {stat.description}
                </CardTitle>
                <stat.icon className="w-4 h-4 text-blue-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Deployment Growth Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Deployment Growth</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={timeSeriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis 
                      dataKey="timestamp" 
                      tickFormatter={(time) => new Date(time).toLocaleDateString()}
                      stroke="#9CA3AF"
                    />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (active && payload?.[0]) {
                          return (
                            <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
                              <p className="text-white font-medium">
                                {new Date(label).toLocaleString()}
                              </p>
                              <p className="text-blue-400">
                                Total Deployments: {payload[0].value}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cumulative" 
                      stroke="#3B82F6" 
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User Activity Chart */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>User Activity Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userActivityData}
                      dataKey="deployments"
                      nameKey="address"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label={({ address }) => `${address.slice(0, 6)}...${address.slice(-4)}`}
                    >
                      {userActivityData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload?.[0]) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-700">
                              <p className="text-white font-medium">
                                {`${data.address.slice(0, 6)}...${data.address.slice(-4)}`}
                              </p>
                              <p className="text-blue-400">
                                Deployments: {data.deployments}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Deployments */}
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle>Recent Deployments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {processedDeployments.slice(0, 5).map((deployment, index) => (
                <motion.div
                  key={deployment.blockTimestamp}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 bg-gray-700/50 rounded-lg"
                >
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-300">
                      {deployment.record_owner.slice(0, 6)}...{deployment.record_owner.slice(-4)}
                    </span>
                    <span className="text-xs text-gray-400">
                      {deployment.timestamp.toLocaleString()}
                    </span>
                  </div>
                  {deployment.ipfsUrl && (
                    <a
                      href={deployment.ipfsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                    >
                      View <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <AnalyticsChatbot />
    </div>
  );
};

export default Dashboard;