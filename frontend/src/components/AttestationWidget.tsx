import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
// import { usePrivy, useWallets } from '@privy-io/react-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import ContractData from "../contracts/ETHVercelOApp.json";
import { 
  MessageSquare, 
  X, 
  Loader2, 
  Send,
  ExternalLink,
  CheckCircle2
} from 'lucide-react';

// Contract ABI - you'll need to replace this with your actual ABI
const CONTRACT_ABI = ContractData.abi;

const AttestationWidget = ({ isOpen, onClose, provider }) => {
  const [attestations, setAttestations] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [contract, setContract] = useState(null);
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState();
  const [network, setNetwork] = useState();

//   const { user, ready } = usePrivy();
//   const { wallets } = useWallets()
  
  
  useEffect(() => {
    const initContract = async () => {
      try {
        if (window.ethereum) {
        //   const provider = await wallets[0].getEthersProvider();
          const network = await provider.getNetwork();
          console.log(network);
          let contractAddress;
          setNetwork(network.name);
          if (network.name == "sepolia") {
              contractAddress = ContractData.sepolia;
          } else{
              contractAddress = ContractData.ble;
          }
          setContractAddress(contractAddress);
          const signer = provider.getSigner();
          console.log(contractAddress, signer, CONTRACT_ABI);
          const ethenaContract = new ethers.Contract(
            contractAddress,
            CONTRACT_ABI,
            signer
          );
          console.log(ethenaContract);
          setContract(ethenaContract);
          await fetchAttestations(ethenaContract);
        }
      } catch (err) {
        console.error('Error initializing contract:', err);
        setError('Failed to connect to the contract');
      }
    };

    if (isOpen) {
      initContract();
    }
  }, [isOpen, contractAddress]);

  const fetchAttestations = async (contractInstance) => {
    try {
      const attestations = await contractInstance.getAttestations();
      setAttestations(attestations);
    } catch (err) {
      console.error('Error fetching attestations:', err);
      setError('Failed to fetch attestations');
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      // Append network name to message
      const fullMessage = `[${network}] ${message}`;
      
      // Hardcoded values as specified
      const dstEid = 40330; // Ble testnet
      const options = "0x0003010011010000000000000000000000000000ea60";
      const value = Number(ethers.parseEther("0.0001")); 
      console.log(Number(value));
      const tx = await contract.send(dstEid, fullMessage, options, {
        value: value
      });

      setTxHash(tx.hash);
    //   await tx.wait();
      
      // Refresh attestations
      await fetchAttestations(contract);
      setMessage('');
    } catch (err) {
      console.error('Error sending attestation:', err);
      setError(err.message || 'Failed to send attestation');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        className="w-full max-w-lg"
      >
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl text-gray-100">
                ETHENA Cross-Chain Attestation Service
              </CardTitle>
              <p className="text-sm text-gray-400 mt-1">
                Add attestations and comments across chains
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </Button>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Input Section */}
            <div className="space-y-2">
              <Textarea
                placeholder="Write your attestation or comment..."
                className="bg-gray-900 border-gray-700 min-h-[100px]"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button
                className="w-full bg-blue-500 hover:bg-blue-600"
                onClick={handleSubmit}
                disabled={isLoading || !message.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Sending Attestation...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Add Attestation
                  </>
                )}
              </Button>
            </div>

            {/* Transaction Hash */}
            {txHash && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-green-900/20 border border-green-800 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-sm text-green-400">
                      Attestation sent successfully
                    </span>
                  </div>
                  <a
                    href={`https://testnet.layerzeroscan.com/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300"
                  >
                    View on LayerZero
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-900/20 border border-red-800 rounded-lg"
              >
                <p className="text-sm text-red-400">{error}</p>
              </motion.div>
            )}

            {/* Attestations List */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-200 mb-3">
                Recent Attestations
              </h3>
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {attestations.map((attestation, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-3 bg-gray-700/30 rounded-lg"
                  >
                    <p className="text-sm text-gray-300">{attestation}</p>
                  </motion.div>
                ))}
                {attestations.length === 0 && (
                  <p className="text-center text-gray-400 py-4">
                    No attestations yet
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
};

export default AttestationWidget;