import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './components/Landing';
import Deploy from './components/Deploy';
import AccessToken from './components/AccessToken';
import Dashboard from './components/Dashboard';


// Web3Modal configuration
const projectId = 'a7a2557c75d9558a9c932d5f99559799';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Landing />} />
          <Route path="deploy" element={<Deploy />} />
          <Route path="dashboard" element={<Dashboard />} />
        </Route>
        <Route path="/callback" element={<AccessToken />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;