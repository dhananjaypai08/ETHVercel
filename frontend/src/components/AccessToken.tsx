import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Loader2 } from 'lucide-react';

const AccessToken = () => {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const getAccessToken = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      
      if (!code) {
        console.error('No code found in URL');
        navigate('/');
        return;
      }

      try {
        console.log('Exchanging code for token:', code);
        
        // Exchange code for access token using our backend
        const response = await axios.post('http://localhost:3000/api/github/oauth', 
          { code },
          {
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );

        console.log('Token response:', response.data);

        const { access_token } = response.data;

        if (access_token) {
          // Store the token
          localStorage.setItem('github_access_token', access_token);

          // Get user data
          const userResponse = await axios.get('https://api.github.com/user', {
            headers: {
              'Authorization': `Bearer ${access_token}`
            }
          });

          // Store user data
          localStorage.setItem('github_user', JSON.stringify(userResponse.data));

          // Redirect to deploy page
          navigate('/deploy');
        } else {
          throw new Error('No access token received');
        }
      } catch (error) {
        console.error('Error during authentication:', error);
        setError(error.response?.data?.error || error.message);
        setTimeout(() => navigate('/'), 3000);
      }
    };

    getAccessToken();
  }, [navigate]);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">Error: {error}</div>
          <p className="text-gray-400">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-12 h-12 text-teal-500 animate-spin mb-4" />
        <h2 className="text-xl text-gray-200">Connecting to GitHub...</h2>
        <p className="text-gray-400 mt-2">Please wait while we set up your account</p>
      </div>
    </div>
  );
};

export default AccessToken;