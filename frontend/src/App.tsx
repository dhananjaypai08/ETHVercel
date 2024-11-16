import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './components/Landing';
import Deploy from './components/Deploy';
import AccessToken from './components/AccessToken';
import Dashboard from './components/Dashboard';
import DeploymentsView from './components/DeploymentsView';
import { PrivyProvider } from '@privy-io/react-auth';

function App() {
  return (
    <PrivyProvider
      appId="cm3iyt7tm00wf142g79r8sr1i"
      config={{
        // Display email and wallet as login methods
        loginMethods: ['email', 'wallet'],
        // Customize Privy's appearance in your app
        appearance: {
          theme: 'light',
          accentColor: '#676FFF',
          logo: 'https://your-logo-url',
        },
        // Create embedded wallets for users who don't have a wallet
        embeddedWallets: {
          createOnLogin: 'users-without-wallets',
        },
      }}
    >
    
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="deploy" element={<Deploy />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="deployments" element={DeploymentsView} />
        </Route>
        <Route path="/callback" element={<AccessToken />} />
      </Routes>
    </BrowserRouter>

    </PrivyProvider>
  );
}

export default App;