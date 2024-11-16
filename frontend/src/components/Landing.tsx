import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Github, Code, Rocket, Lock } from 'lucide-react';
import Footer from './ui/Footer';
import Navbar from './ui/Navbar';
import axios from 'axios';

const Landing = () => {
  const navigate = useNavigate();

  const handleLogin = async () => {
    window.location.assign(
      `https://github.com/login/oauth/authorize?client_id=${import.meta.env.VITE_GH_CLIENT_ID}&scope=user`
    );
  };

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    console.log(code);
    if (code) {
      async function GetToken() {
        const resp = await axios.post('http://localhost:8000/getToken', { code });
        console.log(resp);
      }
      GetToken();
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 overflow-x-hidden w-full">
      <Navbar />

      {/* Hero Section */}
      <div className="w-full">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-4 pt-10 py-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.h1
              className="text-2xl sm:text-5xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-teal-400 via-cyan-500 to-blue-500"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Deploy Projects. Mint Ownership. Verify with Zero Knowledge.
            </motion.h1>
            <p className="text-lg sm:text-xl text-gray-400 mb-8">
              Transform your GitHub projects into verifiable deployments with tokenized ownership, powered by
              ZK-proofs for ultimate security and transparency.
            </p>
            <div className="flex justify-center gap-4">
              <Button size="lg" className="bg-teal-500 hover:bg-teal-600 rounded" onClick={handleLogin}>
                Get Started
              </Button>
              <Button size="lg" variant="outline" className="bg-gray-800 text-teal-400 hover:bg-gray-700 hover:text-teal-500 rounded">
                Learn More
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="w-full bg-gray-900">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <h2 className="text-3xl font-bold text-center mb-16">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>1. Connect GitHub</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-full bg-teal-900/20 w-12 h-12 flex items-center justify-center mb-4">
                  <Github className="w-6 h-6 text-teal-400" />
                </div>
                <p className="text-gray-400">
                  Seamlessly connect your GitHub account and select any repository you want to deploy.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>2. Deploy Project</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-full bg-teal-900/20 w-12 h-12 flex items-center justify-center mb-4">
                  <Rocket className="w-6 h-6 text-teal-400" />
                </div>
                <p className="text-gray-400">
                  We handle the installation, building, and deployment of your project automatically.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>3. Mint & Verify</CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="rounded-full bg-teal-900/20 w-12 h-12 flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-teal-400" />
                </div>
                <p className="text-gray-400">
                  Receive a token of ownership backed by ZK-proofs for verifiable deployment authenticity.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="w-full">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-teal-400 mb-2">1000+</div>
              <div className="text-gray-400">Projects Deployed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-400 mb-2">500+</div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-teal-400 mb-2">99.9%</div>
              <div className="text-gray-400">Uptime</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Landing;