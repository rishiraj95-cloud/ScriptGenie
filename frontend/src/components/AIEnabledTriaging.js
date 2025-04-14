import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import TriageReport from './TriageReport';

const AIEnabledTriaging = () => {
  // State for API keys and connection status
  const [jiraApiKey, setJiraApiKey] = useState('');
  const [vedaiApiKey, setVedaiApiKey] = useState('');
  const [chatgptApiKey, setChatgptApiKey] = useState('');
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [isVedaiConnected, setIsVedaiConnected] = useState(false);
  const [isChatgptConnected, setIsChatgptConnected] = useState(false);
  
  // State for JIRA analysis
  const [jiraNumber, setJiraNumber] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  
  // State for analysis results
  const [jiraDetails, setJiraDetails] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  
  // Connection handlers defined before useEffect
  const handleJiraConnect = useCallback(async (key = jiraApiKey) => {
    try {
      const response = await axios.post('http://localhost:8000/api/triaging/verify-jira', {
        api_key: key
      });
      setIsJiraConnected(response.data.valid);
      if (response.data.valid) {
        localStorage.setItem('triageJiraApiKey', key);
      }
    } catch (err) {
      setError('Failed to connect to JIRA');
      setIsJiraConnected(false);
    }
  }, [jiraApiKey]);
  
  const handleVedaiConnect = useCallback(async (key = vedaiApiKey) => {
    try {
      const response = await axios.get('http://localhost:8000/api/triaging/verify-vedai', {
        headers: { 'X-API-KEY': key }
      });
      setIsVedaiConnected(response.data.status);
      if (response.data.status) {
        localStorage.setItem('triageVedaiApiKey', key);
      }
    } catch (err) {
      setError('Failed to connect to VedAI');
      setIsVedaiConnected(false);
    }
  }, [vedaiApiKey]);
  
  const handleChatgptConnect = useCallback(async (key = chatgptApiKey) => {
    try {
      const response = await axios.post('http://localhost:8000/api/triaging/verify-chatgpt', {
        api_key: key
      });
      setIsChatgptConnected(response.data.valid);
      if (response.data.valid) {
        localStorage.setItem('triageChatgptApiKey', key);
      }
    } catch (err) {
      setError('Failed to connect to ChatGPT');
      setIsChatgptConnected(false);
    }
  }, [chatgptApiKey]);
  
  // Load saved API keys on component mount
  useEffect(() => {
    const savedJiraKey = localStorage.getItem('triageJiraApiKey');
    const savedVedaiKey = localStorage.getItem('triageVedaiApiKey');
    const savedChatgptKey = localStorage.getItem('triageChatgptApiKey');
    
    if (savedJiraKey) {
      setJiraApiKey(savedJiraKey);
      handleJiraConnect(savedJiraKey);
    }
    if (savedVedaiKey) {
      setVedaiApiKey(savedVedaiKey);
      handleVedaiConnect(savedVedaiKey);
    }
    if (savedChatgptKey) {
      setChatgptApiKey(savedChatgptKey);
      handleChatgptConnect(savedChatgptKey);
    }
  }, [handleJiraConnect, handleVedaiConnect, handleChatgptConnect]);
  
  // Styles
  const styles = {
    container: {
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
    },
    connectionSection: {
      marginBottom: '30px',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '5px',
    },
    inputGroup: {
      marginBottom: '15px',
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
    },
    input: {
      padding: '8px',
      borderRadius: '4px',
      border: '1px solid #ddd',
      flex: 1,
    },
    button: {
      padding: '8px 16px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: '#007bff',
      color: 'white',
      cursor: 'pointer',
    },
    connectedButton: {
      backgroundColor: '#28a745',
    },
    widget: {
      marginBottom: '20px',
      padding: '20px',
      border: '1px solid #ddd',
      borderRadius: '5px',
    },
    error: {
      color: 'red',
      marginTop: '5px',
    },
  };
  
  // Analysis handlers
  const handleAnalyze = async () => {
    setError('');
    setIsAnalyzing(true);
    
    try {
      // Validate connections
      if (!isJiraConnected) {
        throw new Error('Please connect to JIRA first');
      }
      
      if (!isChatgptConnected) {
        throw new Error('Please connect to ChatGPT first');
      }
      
      if (!jiraApiKey) {
        throw new Error('JIRA API key is missing');
      }

      if (!chatgptApiKey) {
        throw new Error('ChatGPT API key is missing');
      }

      // Use JIRA key directly without splitting
      const jiraKey = jiraNumber.trim();
      console.log('[Debug] JIRA Key:', jiraKey);
      console.log('[Debug] JIRA API Key:', jiraApiKey ? 'Present' : 'Missing');
      console.log('[Debug] ChatGPT API Key:', chatgptApiKey ? 'Present' : 'Missing');
      
      if (!jiraKey) {
        throw new Error('Please enter a JIRA number');
      }

      // Make the API call
      console.log('[Debug] Making API call to /api/video/analyze-issue');
      console.log('[Debug] Request payload:', {
        jira_key: jiraKey,
        api_key: 'PRESENT',
        chatgpt_api_key: 'PRESENT'
      });
      
      const jiraResponse = await axios.post('http://localhost:8000/api/video/analyze-issue', {
        jira_key: jiraKey,
        api_key: jiraApiKey,
        chatgpt_api_key: chatgptApiKey
      });
      
      console.log('[Debug] API Response:', jiraResponse.data);
      
      if (!jiraResponse.data.jira_details) {
        throw new Error('No JIRA details returned from API');
      }
      
      setJiraDetails(jiraResponse.data.jira_details);
      setAnalysisResults(jiraResponse.data.ai_analysis);
    } catch (err) {
      console.error('[Debug] Analysis error:', err);
      if (err.response) {
        console.error('[Debug] API error details:', {
          status: err.response.status,
          statusText: err.response.statusText,
          data: err.response.data
        });
        setError(err.response?.data?.detail || 'Server error occurred');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to analyze issue');
      }
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleSaveAnalysis = async () => {
    if (!analysisResults) return;
    
    try {
      const response = await axios.post('http://localhost:8000/api/triaging/save-analysis', {
        analysis: {
          jira_details: jiraDetails,
          ai_analysis: analysisResults,
          timestamp: new Date().toISOString()
        }
      }, {
        responseType: 'blob'
      });
      
      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `triage_analysis_${jiraNumber}_${new Date().getTime()}.txt`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to save analysis');
    }
  };
  
  return (
    <div style={styles.container}>
      {/* Connection Section */}
      <div style={styles.connectionSection}>
        <h2>AI Provider Connections</h2>
        
        <div style={styles.inputGroup}>
          <input
            type="password"
            placeholder="Enter JIRA API Key"
            value={jiraApiKey}
            onChange={(e) => setJiraApiKey(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={() => handleJiraConnect()}
            style={{
              ...styles.button,
              ...(isJiraConnected ? styles.connectedButton : {})
            }}
          >
            {isJiraConnected ? 'Connected' : 'Connect to JIRA'}
          </button>
        </div>
        
        <div style={styles.inputGroup}>
          <input
            type="password"
            placeholder="Enter VedAI API Key"
            value={vedaiApiKey}
            onChange={(e) => setVedaiApiKey(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={() => handleVedaiConnect()}
            style={{
              ...styles.button,
              ...(isVedaiConnected ? styles.connectedButton : {})
            }}
          >
            {isVedaiConnected ? 'Connected' : 'Connect to VedAI'}
          </button>
        </div>
        
        <div style={styles.inputGroup}>
          <input
            type="password"
            placeholder="Enter ChatGPT API Key"
            value={chatgptApiKey}
            onChange={(e) => setChatgptApiKey(e.target.value)}
            style={styles.input}
          />
          <button
            onClick={() => handleChatgptConnect()}
            style={{
              ...styles.button,
              ...(isChatgptConnected ? styles.connectedButton : {})
            }}
          >
            {isChatgptConnected ? 'Connected' : 'Connect to ChatGPT'}
          </button>
        </div>
      </div>
      
      {/* Analysis Section */}
      <div style={styles.inputGroup}>
        <input
          type="text"
          placeholder="Enter JIRA Number"
          value={jiraNumber}
          onChange={(e) => setJiraNumber(e.target.value)}
          style={styles.input}
        />
        <button
          onClick={handleAnalyze}
          disabled={!isJiraConnected || !isChatgptConnected || !jiraNumber || isAnalyzing}
          style={styles.button}
        >
          {isAnalyzing ? 'Analyzing...' : 'Triage with AI'}
        </button>
      </div>
      
      {error && <div style={styles.error}>{error}</div>}
      
      {/* JIRA Details Widget */}
      {jiraDetails && (
        <div style={styles.widget}>
          <h3>JIRA Details</h3>
          <div>
            <p><strong>Title:</strong> {jiraDetails.title}</p>
            <p><strong>Description:</strong> {jiraDetails.description}</p>
            <p><strong>Labels:</strong> {jiraDetails.labels?.join(', ') || 'None'}</p>
            <p><strong>Priority:</strong> {jiraDetails.priority}</p>
          </div>
        </div>
      )}
      
      {/* Triage Report Widget */}
      {analysisResults && (
        <div style={styles.widget}>
          <h3>Triage Report</h3>
          <TriageReport analysisResults={analysisResults} />
          <div style={{ marginTop: '15px' }}>
            <button onClick={handleSaveAnalysis} style={styles.button}>
              Save Analysis
            </button>
          </div>
        </div>
      )}
      
      {/* Necessary Information Widget */}
      <div style={styles.widget}>
        <h3>Necessary Information</h3>
        <p>This section will be implemented in future updates.</p>
      </div>
    </div>
  );
};

export default AIEnabledTriaging; 