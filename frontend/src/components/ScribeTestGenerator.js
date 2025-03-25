import { useState, useEffect } from 'react';
import { Tooltip } from 'react-tooltip';

function ScribeTestGenerator() {
  const [vedaiApiKey, setVedaiApiKey] = useState('');
  const [isVedaiConnected, setIsVedaiConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  // Load saved API key on component mount
  useEffect(() => {
    const savedKey = localStorage.getItem('scribeVedaiApiKey');
    if (savedKey) {
      setVedaiApiKey(savedKey);
    }
  }, []);

  const handleVedaiConnect = async () => {
    if (!vedaiApiKey) {
      setError('Please enter VedAI API Key');
      return;
    }
    
    setConnecting(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/automation/verify-vedai', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-KEY': vedaiApiKey
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to connect to VedAI');
      }
      
      localStorage.setItem('scribeVedaiApiKey', vedaiApiKey);
      setIsVedaiConnected(true);
    } catch (error) {
      setError(error.message);
      setIsVedaiConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  const handleVedaiApiKeyChange = (e) => {
    const newValue = e.target.value;
    setVedaiApiKey(newValue);
  };

  const handleVedaiClear = () => {
    setVedaiApiKey('');
    setIsVedaiConnected(false);
    localStorage.removeItem('scribeVedaiApiKey');
    setError(null);
  };

  // Styles matching AI Enabled automation tab exactly
  const connectBtnStyle = {
    padding: '0.5rem 1rem',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#4CAF50',
    color: 'white',
    cursor: 'pointer',
    transition: 'background-color 0.3s'
  };

  const connectedBtnStyle = {
    ...connectBtnStyle,
    backgroundColor: '#45a049'
  };

  const statusIndicatorStyle = {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  };

  const statusOnStyle = {
    ...statusIndicatorStyle,
    backgroundColor: '#4CAF50',
    color: 'white'
  };

  const statusOffStyle = {
    ...statusIndicatorStyle,
    backgroundColor: '#f44336',
    color: 'white'
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <input
          type="password"
          placeholder="Enter VedAI API Key"
          value={vedaiApiKey}
          onChange={handleVedaiApiKeyChange}
          style={{
            flex: 1,
            padding: '0.5rem',
            borderRadius: '4px',
            border: '1px solid #ccc'
          }}
        />
        <button
          onClick={handleVedaiConnect}
          disabled={connecting}
          style={isVedaiConnected ? connectedBtnStyle : connectBtnStyle}
        >
          {connecting ? 'Connecting...' : 'Connect'}
        </button>
        <span style={isVedaiConnected ? statusOnStyle : statusOffStyle}>
          {isVedaiConnected ? 'ON' : 'OFF'}
        </span>
        <button
          onClick={handleVedaiClear}
          className="btn btn-secondary"
        >
          Clear
        </button>
      </div>
      {error && <div style={{ color: 'red', marginTop: '5px' }}>{error}</div>}

      <button 
        className="btn btn-primary" 
        onClick={handleGenerateTestCases}
        title="If scribe files are dropped, test steps shall be generated, if video files are dropped screen shots shall be generated"
        style={{ marginRight: '5px', marginTop: '10px' }}
      >
        Generate Test Cases
      </button>
    </div>
  );
}

export default ScribeTestGenerator; 