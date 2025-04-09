import React, { useState, useEffect } from 'react';

function AIEnabledTriaging() {
  // API key states
  const [jiraApiKey, setJiraApiKey] = useState(() => localStorage.getItem('triagingJiraApiKey') || '');
  const [gptApiKey, setGptApiKey] = useState(() => localStorage.getItem('triagingGptApiKey') || '');
  const [vedaiApiKey, setVedaiApiKey] = useState(() => localStorage.getItem('triagingVedaiApiKey') || '');

  // Connection states
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [isGptConnected, setIsGptConnected] = useState(false);
  const [isVedaiConnected, setIsVedaiConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);

  // Error states
  const [jiraError, setJiraError] = useState(null);
  const [gptError, setGptError] = useState(null);
  const [vedaiError, setVedaiError] = useState(null);

  // Backend logs
  const [backendLogs, setBackendLogs] = useState([]);

  // Load saved API keys on mount
  useEffect(() => {
    const savedJiraKey = localStorage.getItem('triagingJiraApiKey');
    const savedGptKey = localStorage.getItem('triagingGptApiKey');
    const savedVedaiKey = localStorage.getItem('triagingVedaiApiKey');

    if (savedJiraKey) setJiraApiKey(savedJiraKey);
    if (savedGptKey) setGptApiKey(savedGptKey);
    if (savedVedaiKey) setVedaiApiKey(savedVedaiKey);
  }, []);

  // JIRA connection handlers
  const handleJiraConnect = async () => {
    if (!jiraApiKey) {
      setJiraError('Please enter JIRA API Key');
      setBackendLogs(prev => [...prev, 'Error: JIRA API Key is required']);
      return;
    }

    setConnecting(true);
    setJiraError(null);

    try {
      setBackendLogs(prev => [...prev, 'Attempting to connect to JIRA...']);
      const response = await fetch('http://localhost:8000/api/triaging/verify-jira', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: jiraApiKey })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to JIRA');
      }

      const data = await response.json();
      if (data.valid) {
        localStorage.setItem('triagingJiraApiKey', jiraApiKey);
        setIsJiraConnected(true);
        setBackendLogs(prev => [...prev, 'Successfully connected to JIRA']);
      } else {
        throw new Error('Invalid JIRA API Key');
      }
    } catch (error) {
      setJiraError(error.message);
      setIsJiraConnected(false);
      setBackendLogs(prev => [...prev, `Error: ${error.message}`]);
    } finally {
      setConnecting(false);
    }
  };

  // ChatGPT connection handlers
  const handleGptConnect = async () => {
    if (!gptApiKey) {
      setGptError('Please enter ChatGPT API Key');
      setBackendLogs(prev => [...prev, 'Error: ChatGPT API Key is required']);
      return;
    }

    setConnecting(true);
    setGptError(null);

    try {
      setBackendLogs(prev => [...prev, 'Attempting to connect to ChatGPT...']);
      const response = await fetch('http://localhost:8000/api/triaging/verify-chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: gptApiKey })
      });

      if (!response.ok) {
        throw new Error('Failed to connect to ChatGPT');
      }

      const data = await response.json();
      if (data.valid) {
        localStorage.setItem('triagingGptApiKey', gptApiKey);
        setIsGptConnected(true);
        setBackendLogs(prev => [...prev, 'Successfully connected to ChatGPT']);
      } else {
        throw new Error('Invalid ChatGPT API Key');
      }
    } catch (error) {
      setGptError(error.message);
      setIsGptConnected(false);
      setBackendLogs(prev => [...prev, `Error: ${error.message}`]);
    } finally {
      setConnecting(false);
    }
  };

  // VedAI connection handlers
  const handleVedaiConnect = async () => {
    if (!vedaiApiKey) {
      setVedaiError('Please enter VedAI API Key');
      setBackendLogs(prev => [...prev, 'Error: VedAI API Key is required']);
      return;
    }

    setConnecting(true);
    setVedaiError(null);

    try {
      setBackendLogs(prev => [...prev, 'Attempting to connect to VedAI...']);
      const response = await fetch('http://localhost:8000/api/triaging/verify-vedai', {
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

      localStorage.setItem('triagingVedaiApiKey', vedaiApiKey);
      setIsVedaiConnected(true);
      setBackendLogs(prev => [...prev, 'Successfully connected to VedAI']);
    } catch (error) {
      setVedaiError(error.message);
      setIsVedaiConnected(false);
      setBackendLogs(prev => [...prev, `Error: ${error.message}`]);
    } finally {
      setConnecting(false);
    }
  };

  // Clear handlers
  const handleClearJira = () => {
    setJiraApiKey('');
    setIsJiraConnected(false);
    localStorage.removeItem('triagingJiraApiKey');
    setJiraError(null);
    setBackendLogs(prev => [...prev, 'Cleared JIRA API Key']);
  };

  const handleClearGpt = () => {
    setGptApiKey('');
    setIsGptConnected(false);
    localStorage.removeItem('triagingGptApiKey');
    setGptError(null);
    setBackendLogs(prev => [...prev, 'Cleared ChatGPT API Key']);
  };

  const handleClearVedai = () => {
    setVedaiApiKey('');
    setIsVedaiConnected(false);
    localStorage.removeItem('triagingVedaiApiKey');
    setVedaiError(null);
    setBackendLogs(prev => [...prev, 'Cleared VedAI API Key']);
  };

  // Modern styles
  const styles = {
    container: {
      padding: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    header: {
      marginBottom: '2rem',
      borderBottom: '2px solid #e9ecef',
      paddingBottom: '1rem'
    },
    title: {
      fontSize: '2rem',
      color: '#343a40',
      margin: '0 0 1rem 0'
    },
    connectionSection: {
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)'
      }
    },
    inputGroup: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center',
      marginBottom: '1rem'
    },
    input: {
      flex: 1,
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      border: '2px solid #e9ecef',
      fontSize: '1rem',
      transition: 'all 0.2s ease',
      '&:focus': {
        borderColor: '#4dabf7',
        outline: 'none',
        boxShadow: '0 0 0 3px rgba(77, 171, 247, 0.2)'
      }
    },
    button: {
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      border: 'none',
      backgroundColor: '#4dabf7',
      color: 'white',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: '#339af0'
      },
      '&:disabled': {
        backgroundColor: '#adb5bd',
        cursor: 'not-allowed'
      }
    },
    clearButton: {
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      border: '1px solid #dee2e6',
      backgroundColor: 'white',
      color: '#495057',
      fontSize: '1rem',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      '&:hover': {
        backgroundColor: '#f8f9fa'
      }
    },
    statusIndicator: {
      padding: '0.5rem 1rem',
      borderRadius: '999px',
      fontSize: '0.875rem',
      fontWeight: '500',
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    errorMessage: {
      color: '#e03131',
      fontSize: '0.875rem',
      marginTop: '0.5rem'
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h1 style={styles.title}>AI Enabled Triaging</h1>
      </div>

      {/* JIRA Connection Section */}
      <div style={styles.connectionSection}>
        <div style={styles.inputGroup}>
          <input
            type="password"
            placeholder="Enter JIRA API Key"
            value={jiraApiKey}
            onChange={(e) => setJiraApiKey(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={handleJiraConnect}
            disabled={connecting}
            style={{
              ...styles.button,
              backgroundColor: isJiraConnected ? '#40c057' : '#4dabf7'
            }}
          >
            {connecting ? 'Connecting...' : 'Connect to JIRA'}
          </button>
          <button
            onClick={handleClearJira}
            disabled={connecting}
            style={styles.clearButton}
          >
            Clear
          </button>
          <span
            style={{
              ...styles.statusIndicator,
              backgroundColor: isJiraConnected ? '#d3f9d8' : '#ffe3e3',
              color: isJiraConnected ? '#2b8a3e' : '#e03131'
            }}
          >
            {isJiraConnected ? 'ON' : 'OFF'}
          </span>
        </div>
        {jiraError && <div style={styles.errorMessage}>{jiraError}</div>}
      </div>

      {/* ChatGPT Connection Section */}
      <div style={styles.connectionSection}>
        <div style={styles.inputGroup}>
          <input
            type="password"
            placeholder="Enter ChatGPT API Key"
            value={gptApiKey}
            onChange={(e) => setGptApiKey(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={handleGptConnect}
            disabled={connecting}
            style={{
              ...styles.button,
              backgroundColor: isGptConnected ? '#40c057' : '#4dabf7'
            }}
          >
            {connecting ? 'Connecting...' : 'Connect to ChatGPT'}
          </button>
          <button
            onClick={handleClearGpt}
            disabled={connecting}
            style={styles.clearButton}
          >
            Clear
          </button>
          <span
            style={{
              ...styles.statusIndicator,
              backgroundColor: isGptConnected ? '#d3f9d8' : '#ffe3e3',
              color: isGptConnected ? '#2b8a3e' : '#e03131'
            }}
          >
            {isGptConnected ? 'ON' : 'OFF'}
          </span>
        </div>
        {gptError && <div style={styles.errorMessage}>{gptError}</div>}
      </div>

      {/* VedAI Connection Section */}
      <div style={styles.connectionSection}>
        <div style={styles.inputGroup}>
          <input
            type="password"
            placeholder="Enter VedAI API Key"
            value={vedaiApiKey}
            onChange={(e) => setVedaiApiKey(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={handleVedaiConnect}
            disabled={connecting}
            style={{
              ...styles.button,
              backgroundColor: isVedaiConnected ? '#40c057' : '#4dabf7'
            }}
          >
            {connecting ? 'Connecting...' : 'Connect to VedAI'}
          </button>
          <button
            onClick={handleClearVedai}
            disabled={connecting}
            style={styles.clearButton}
          >
            Clear
          </button>
          <span
            style={{
              ...styles.statusIndicator,
              backgroundColor: isVedaiConnected ? '#d3f9d8' : '#ffe3e3',
              color: isVedaiConnected ? '#2b8a3e' : '#e03131'
            }}
          >
            {isVedaiConnected ? 'ON' : 'OFF'}
          </span>
        </div>
        {vedaiError && <div style={styles.errorMessage}>{vedaiError}</div>}
      </div>

      {/* Backend Logs Section */}
      <div style={{...styles.connectionSection, marginTop: '2rem'}}>
        <h2 style={{fontSize: '1.5rem', marginBottom: '1rem'}}>Backend Logs</h2>
        <div style={{
          maxHeight: '300px',
          overflowY: 'auto',
          backgroundColor: '#f8f9fa',
          borderRadius: '8px',
          padding: '1rem'
        }}>
          {backendLogs.length > 0 ? (
            backendLogs.map((log, index) => (
              <div
                key={index}
                style={{
                  padding: '0.5rem',
                  borderBottom: '1px solid #dee2e6',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace'
                }}
              >
                {log}
              </div>
            ))
          ) : (
            <div style={{color: '#868e96', fontStyle: 'italic'}}>
              No logs available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AIEnabledTriaging; 