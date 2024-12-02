# ETHVercel
 Deploy projects on-chain and leverage Zk Security with Ethena Attestation service for cross-chain attestations

 ## Table of Contents

- [Overview](#overview)
- [System Architecture](#system-architecture)
- [Running the Project](#running-the-project)
- [Key Features](#key-features)
- [Bounty Integrations🔗](#bounty-integrations)
  - [Ethena network and its Integration](#ethena-integration)
  - [LayerZero Integration](#layerzero-integration)
  - [Goldsky Integration](#goldsky-integration)


## Overview
ETHVercel is a revolutionary decentralized deployment platform that combines privacy-preserving deployment mechanisms with tokenized deployment credentials and cross-chain attestations. By leveraging zero-knowledge proofs for access control and implementing a novel staking mechanism through sUSDE, ETHVercel creates a secure, incentivized ecosystem for decentralized application deployment.

### System Architecture 
<img src="./images/SystemDesign.png"/>

### Running the Project 
- Running the backend llm model
  ```sh
  cd backend
  python3 -m venv env
  source env/bin/activate
  pip install -r requirements.txt
  cd src
  python3 main.py
  ```
- Running the frontend
  ```sh
  cd frontend
  npm i
  npm run dev
  ```

### Key Features
####  🌟 Privacy-Preserved Deployments

- ZK-powered geolocation verification
- Response-time threshold validation
- Dynamic access control mechanisms
- Anti-VPN protection through multi-factor verification

#### Tokenized Deployment System

- Soul-bound Proof of Deployment tokens
- Deployment credentials through sUSDE staking
- Yield-generating deployment rights (15% APY)
- Non-transferable deployment attestations

#### Cross-Chain Attestation Network

- Omni-chain deployment verification
- LayerZero-powered attestation propagation
- Cross-chain deployment commenting system
- Unified attestation storage on Ethena Network

#### Monitoring & Analytics

- Real-time deployment analytics
- Chainlink Automation integration
- Natural language deployment queries
- Comprehensive deployment insights

### Bounty Integrations
#### Ethena Integration

- Deployed Contract Link (Verified) : https://testnet.explorer.ethena.fi/address/0xB32fdc2DED2DffCfA3442Def90fb13AFBa5683A2
- Contract code on GitHub : https://github.com/dhananjaypai08/ETHVercel/blob/encode/contracts/ETHVercel.sol
- Primary Network: Deployment and attestation infrastructure
- Token Integration: USDe and sUSDE for deployment credentials
- Staking Mechanism: 15% APY yield generation
- Impact: Created first-of-its-kind tokenized deployment rights system
- ETHENA ATTESTATION SERVICE using O-app for attestation

#### LayerZero Integration

- LayerZero's O-app support for ETHENA ATTESTATION SERVICE(EAS) on-chain : https://github.com/dhananjaypai08/ETHVercel/blob/encode/contracts/ETHVercelOApp.sol
- Attestation Contract : https://testnet.explorer.ethena.fi/address/0x6e8c29600Df7Db8e229Cbd95283D0bd9E52C0809
- O-app contract on Sepolia : 0x356A76fa3e90cc2d3964ad8490b6630e21E4E04d
- O-app contract on Ble testnet : 0x6e8c29600Df7Db8e229Cbd95283D0bd9E52C0809
- O-App Integration: Cross-chain attestation protocol
- Omni Messaging: Universal deployment verification
- Impact: Enabled seamless cross-chain deployment attestations

#### Goldsky Integration

- Subgraph Endpoint : Query endpoint : https://api.goldsky.com/api/public/project_cm3rlo9y0r3jf01y00qmy2kqb/subgraphs/ZKVercel/0.0.1/gn
- Subgraph code : https://github.com/dhananjaypai08/ETHVercel/tree/encode/zkvercelSubgraph
- Subgraph Development: Comprehensive deployment indexing
- LLM Integration: Natural language deployment queries
- Impact: Enhanced deployment discovery and analysis

### 🛠 Tech Stack
#### Smart Contracts

- Solidity ^0.8.22
- OpenZeppelin Contracts
- LayerZero O-App Framework
- Chainlink Automation Interface

#### Frontend

- React + TypeScript
- Tailwind CSS
- Framer Motion
- Ethers.js
- Shadcn

#### Backend & Infrastructure

- FastAPI
- IPFS/Web3.Storage
- Goldsky Indexing
- Gemini Pro LLM

### 🔮 Future Scope
#### Technical Enhancements

- Multi-chain deployment synchronization
- Advanced ZK-circuit implementation
- Enhanced privacy preserving features
- Automated deployment optimization

#### Ecosystem Growth

- DAO governance implementation
- Enhanced staking mechanisms
- Cross-chain deployment bridges
- Advanced attestation protocols

#### Platform Features

- Automated security auditing
- Enhanced analytics dashboard
- Advanced access control mechanisms
- Expanded cross-chain support
