import React, { useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3ModalProvider, useWeb3ModalAccount } from '@web3modal/ethers/react';

function Home() {
  const { walletProvider } = useWeb3ModalProvider();
  const { isConnected } = useWeb3ModalAccount();

  useEffect(() => {
    const setupContract = async () => {
      if (isConnected && walletProvider) {
        try {
          const ethersProvider = new ethers.BrowserProvider(walletProvider);
          const network = await ethersProvider.getNetwork();
          console.log('Connected network:', network);
          
          // You can add additional contract setup here if needed
          // For example:
          // const contractAddress = "your_contract_address";
          // const contract = new ethers.Contract(contractAddress, ABI, signer);
          // setContract(contract);
          
        } catch (error) {
          console.error("Error setting up contract:", error);
        }
      }
    };

    setupContract();
  }, [isConnected, walletProvider]);

  return (
    <div>
      {/* You can add any Home-specific content here */}
      {/* The layout (sidebar, web3 button, etc.) is now handled by Layout.tsx */}
      {/* The landing component is rendered through the router */}
    </div>
  );
}

export default Home;