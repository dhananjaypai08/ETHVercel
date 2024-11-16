import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, UploadCloudIcon, ViewIcon, GitGraphIcon, HomeIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

function Sidebar({ activeTab }) {
  const navigate = useNavigate();
  
  const tabs = [
    { id: 'home', name: 'Home', icon: HomeIcon, path: '/' },
    { id: 'deploy', name: 'Deploy Project', icon: UploadCloudIcon, path: '/deploy' },
    { id: 'deployments', name: 'View Deployments', icon: ViewIcon, path: '/deployments' },
    { id: 'dashboard', name: 'Analytics Dashboard', icon: GitGraphIcon, path: '/dashboard' },
  ];

  const handleTabClick = (path) => {
    navigate(path);
  };

  return (
    <Card className="w-64 p-4 bg-gray-900 text-gray-400 shadow-lg border border-gray-800 rounded-lg">
      <CardHeader>
        <motion.div
          className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          onClick={() => navigate('/')}
          style={{ cursor: 'pointer' }}
        >
          ETHVercel
        </motion.div>
      </CardHeader>
      <CardContent>
        <nav>
          {tabs.map((tab, index) => (
            <motion.button
              key={tab.id}
              onClick={() => handleTabClick(tab.path)}
              className={`flex items-center w-full text-left py-3 px-4 rounded-lg mb-2 transition duration-200 ${
                activeTab === tab.id
                  ? 'bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500 text-gray-200 rounded'
                  : 'hover:bg-gray-800 hover:text-gray-300 rounded'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <tab.icon className="mr-3 h-5 w-5" />
              {tab.name}
            </motion.button>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}

export default Sidebar;