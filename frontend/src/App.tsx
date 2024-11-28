import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './components/Landing';
import Deploy from './components/Deploy';
import AccessToken from './components/AccessToken';
import Dashboard from './components/Dashboard';
import DeploymentsView from './components/DeploymentsView';
import DeploymentCredentials from './components/DeploymentCredentials';

function App() {
  return (
    
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="deploy" element={<Deploy />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="deployments" element={<DeploymentsView/>} />
          <Route path="deploymentcredentials" element={<DeploymentCredentials/>} />
        </Route>
        <Route path="/callback" element={<AccessToken />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;