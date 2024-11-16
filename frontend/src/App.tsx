import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './components/Landing';
import Deploy from './components/Deploy';
import AccessToken from './components/AccessToken';
import { createWeb3Modal, defaultConfig } from '@web3modal/ethers/react';

// Web3Modal configuration
const projectId = 'a7a2557c75d9558a9c932d5f99559799';

// Chain configurations
const rootstock = {
  chainId: 31,
  name: 'Rootstock Testnet',
  currency: 'tRBTC',
  explorerUrl: 'https://explorer.testnet.rootstock.io',
  rpcUrl: 'https://public-node.testnet.rsk.co'
};

const citrea = {
  chainId: 5115,
  name: 'Citrea Testnet',
  currency: 'cBTC',
  rpcUrl: 'https://rpc.testnet.citrea.xyz',
  explorerUrl: 'explorer.testnet.citrea.xyz'
};

const metadata = {
  name: 'ZkTCP',
  description: 'Private and secure Server Lookups',
  url: 'https://ZkTCP.com',
  icons: ['https://example.com/icon.png']
};

const ethersConfig = defaultConfig({
  metadata,
  defaultChainId: 8008135,
  auth: {
    email: true,
    socials: ['google', 'x', 'github', 'discord', 'apple', 'facebook', 'farcaster'],
    showWallets: true,
    walletFeatures: true
  }
});

createWeb3Modal({
  ethersConfig,
  chains: [citrea, rootstock],
  projectId,
  enableAnalytics: true,
  themeMode: 'dark',
});

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="deploy" element={<Deploy />} />
        </Route>
        <Route path="/callback" element={<AccessToken />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;