import logo from './logo.svg';
import React, { useState, useEffect } from 'react';
import DiffView from './components/DiffView';
import './App.css';

function ScriberTestCaseGenerator({
  file,
  setFile,
  testCases,
  loading,
  error,
  backendLogs,
  frames,
  isVideo,
  handleUpload,
  handleDownloadAll,
  formatTestCases
}) {
  return (
    <div className="container">
      <div className="main-panel">
        <h1>Scribe Test Case Generator</h1>
        
        <div className="upload-section">
          <input
            type="file"
            accept="video/*,.pdf"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <div className="file-types">
            Supported files: Videos and PDFs
          </div>
          <button 
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Generate Test Cases'}
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {testCases && (
          <div className="test-cases">
            <h2>Generated Test Cases</h2>
            <div className="test-case-output">
              <pre>{formatTestCases(testCases)}</pre>
            </div>
          </div>
        )}
      </div>
      
      <div className="right-panel">
        <div className="logs-section">
          <h2>Backend Logs</h2>
          <div className="logs-container">
            {backendLogs.length > 0 ? (
              backendLogs.map((log, index) => (
                <div key={index} className="log-entry">{log}</div>
              ))
            ) : (
              <div className="no-logs">No logs available</div>
            )}
          </div>
        </div>

        {isVideo && (
          <div className="screenshots-bundle">
            <div className="panel-header">
              <h2>Screenshots Bundle</h2>
              {frames.length > 0 && (
                <button 
                  className="download-all-btn"
                  onClick={handleDownloadAll}
                >
                  Download All
                </button>
              )}
            </div>
            <div className="screenshots-list">
              {frames.length > 0 ? (
                frames.map((frame, index) => (
                  <a 
                    key={index}
                    href={`http://localhost:8000/api/video/frame/${encodeURIComponent(frame)}`}
                    download={`picture_${index + 1}.jpg`}
                    className="screenshot-link"
                    onClick={(e) => {
                      e.preventDefault();
                      fetch(`http://localhost:8000/api/video/frame/${encodeURIComponent(frame)}`)
                        .then(response => response.blob())
                        .then(blob => {
                          const url = window.URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = `picture_${index + 1}.jpg`;
                          document.body.appendChild(a);
                          a.click();
                          window.URL.revokeObjectURL(url);
                          document.body.removeChild(a);
                        });
                    }}
                  >
                    {`${index + 1}. Picture ${index + 1}`}
                  </a>
                ))
              ) : (
                <div className="no-screenshots">No screenshots available</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TestCaseGeneration() {
  const [jiraApiKey, setJiraApiKey] = useState(() => {
    return localStorage.getItem('jiraApiKey') || '';
  });
  const [gptApiKey, setGptApiKey] = useState(() => {
    return localStorage.getItem('gptApiKey') || '';
  });
  const [jiraLink, setJiraLink] = useState('');
  const [userStory, setUserStory] = useState('');
  const [isGptConnected, setIsGptConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [jiraConnecting, setJiraConnecting] = useState(false);
  const [backendLogs, setBackendLogs] = useState([]);
  const [isGptEnabled, setIsGptEnabled] = useState(false);
  const [generatedTestCases, setGeneratedTestCases] = useState('');
  const [generating, setGenerating] = useState(false);
  const [savedTestCases, setSavedTestCases] = useState([]);
  const [savingTestCases, setSavingTestCases] = useState(false);
  const [gherkinScript, setGherkinScript] = useState('');
  const [improvementPrompt, setImprovementPrompt] = useState('');
  const [previousGherkin, setPreviousGherkin] = useState('');
  const [improving, setImproving] = useState(false);
  const [selectedTestCases, setSelectedTestCases] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Fetch saved test cases on component mount
  useEffect(() => {
    fetchSavedTestCases();
  }, []);

  const fetchSavedTestCases = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/video/saved-test-cases');
      if (!response.ok) throw new Error('Failed to fetch saved test cases');
      const data = await response.json();
      setSavedTestCases(data.files);
    } catch (err) {
      console.error('Error fetching saved test cases:', err);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    }
  };

  const handleSaveTestCases = async () => {
    if (!generatedTestCases) {
      setError('No test cases to save');
      return;
    }
    
    setSavingTestCases(true);
    try {
      const response = await fetch('http://localhost:8000/api/video/save-test-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_cases: generatedTestCases
        })
      });
      
      if (!response.ok) throw new Error('Failed to save test cases');
      
      setBackendLogs(prev => [...prev, 'Successfully saved test cases']);
      fetchSavedTestCases();  // Refresh the list
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setSavingTestCases(false);
    }
  };

  // Handle JIRA API key changes
  const handleJiraApiKeyChange = (e) => {
    const newValue = e.target.value;
    setJiraApiKey(newValue);
    // Store in localStorage
    localStorage.setItem('jiraApiKey', newValue);
  };

  // Handle GPT API key changes
  const handleGptApiKeyChange = (e) => {
    const newValue = e.target.value;
    setGptApiKey(newValue);
    // Store in localStorage
    localStorage.setItem('gptApiKey', newValue);
  };

  const handleGptConnect = async () => {
    if (!gptApiKey) {
      setError('Please enter ChatGPT API Key');
      setBackendLogs(prev => [...prev, 'Error: ChatGPT API Key is required']);
      return;
    }
    
    setConnecting(true);
    setError(null);
    
    try {
      console.log('Attempting to connect to ChatGPT...');
      setBackendLogs(prev => [...prev, 'Attempting to connect to ChatGPT...']);
      const response = await fetch('http://localhost:8000/api/video/verify-chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          "api_key": gptApiKey 
        })
      });
      
      console.log('Raw response status:', response.status);
      console.log('Raw response headers:', response.headers);
      
      if (!response.ok) {
        let errorDetail;
        try {
          const errorData = await response.json();
          console.log('Error data:', errorData);
          errorDetail = errorData.detail;
        } catch (e) {
          console.log('Error parsing error response:', e);
          errorDetail = `HTTP Error ${response.status}`;
        }
        throw new Error(errorDetail || 'Failed to verify ChatGPT connection');
      }
      
      const data = await response.json();
      
      if (data.valid) {
        setIsGptConnected(true);
        setIsGptEnabled(true);
        setError(null);
        setBackendLogs(prev => [...prev, 'Successfully connected to ChatGPT']);
      } else {
        setError('Failed to connect to ChatGPT. Please check your API key.');
        setIsGptConnected(false);
        setIsGptEnabled(false);
        setBackendLogs(prev => [...prev, 'Failed to verify ChatGPT connection']);
      }
    } catch (err) {
      setError(err.message || 'Failed to verify ChatGPT connection');
      setIsGptConnected(false);
      setIsGptEnabled(false);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
      console.error('ChatGPT verification error:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleJiraConnect = async () => {
    if (!jiraApiKey) {
      setError('Please enter JIRA API Key');
      setBackendLogs(prev => [...prev, 'Error: JIRA API Key is required']);
      return;
    }
    
    setJiraConnecting(true);
    setError(null);
    
    try {
      setBackendLogs(prev => [...prev, 'Attempting to connect to JIRA...']);
      const response = await fetch('http://localhost:8000/api/video/verify-jira', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          "api_key": jiraApiKey 
        })
      });
      
      console.log('Raw response:', response);
      
      if (!response.ok) {
        let errorDetail;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail;
        } catch (e) {
          errorDetail = `HTTP Error ${response.status}`;
        }
        setBackendLogs(prev => [...prev, `JIRA Connection Error: ${errorDetail}`]);
        throw new Error(errorDetail || 'Failed to verify JIRA connection');
      }
      
      const data = await response.json();
      
      if (data.valid) {
        setIsJiraConnected(true);
        setError(null);
        setBackendLogs(prev => [...prev, 'Successfully connected to JIRA']);
      } else {
        setError('Failed to connect to JIRA. Please check your API key.');
        setIsJiraConnected(false);
        setBackendLogs(prev => [...prev, 'Failed to verify JIRA connection']);
      }
    } catch (err) {
      setError(err.message || 'Failed to verify JIRA connection');
      setIsJiraConnected(false);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
      console.error('JIRA verification error:', err);
    } finally {
      setJiraConnecting(false);
    }
  };

  const handleClearJiraKey = () => {
    setJiraApiKey('');
    localStorage.removeItem('jiraApiKey');
    setIsJiraConnected(false);
    setBackendLogs(prev => [...prev, 'Cleared JIRA API Key']);
  };

  const handleClearGptKey = () => {
    setGptApiKey('');
    localStorage.removeItem('gptApiKey');
    setIsGptConnected(false);
    setIsGptEnabled(false);
    setBackendLogs(prev => [...prev, 'Cleared ChatGPT API Key']);
  };

  const handleGptToggle = () => {
    if (!isGptConnected) {
      setBackendLogs(prev => [...prev, 'Please connect to ChatGPT first']);
      return;
    }
    setIsGptEnabled(prev => !prev);
    setBackendLogs(prev => [...prev, `ChatGPT service ${!isGptEnabled ? 'enabled' : 'disabled'}`]);
  };

  const handleGenerateTestCases = async () => {
    if (!isGptEnabled) {
      setError('Please enable ChatGPT service first');
      setBackendLogs(prev => [...prev, 'Error: ChatGPT service is not enabled']);
      return;
    }
    
    if (!userStory) {
      setError('Please enter a user story');
      setBackendLogs(prev => [...prev, 'Error: User story is required']);
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      setBackendLogs(prev => [...prev, 'Generating test cases...']);
      const response = await fetch('http://localhost:8000/api/video/generate-test-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_story: userStory,
          api_key: gptApiKey
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to generate test cases');
      }
      
      const data = await response.json();
      setGeneratedTestCases(data.test_cases);
      setBackendLogs(prev => [...prev, 'Successfully generated test cases']);
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setGenerating(false);
    }
  };

  const handleImproveGherkin = async () => {
    if (!improvementPrompt.trim()) {
      setError('Please enter an improvement prompt');
      return;
    }
    
    setImproving(true);
    setError(null);
    setPreviousGherkin(gherkinScript);
    
    try {
      const response = await fetch('http://localhost:8000/api/video/improve-gherkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_script: gherkinScript,
          improvement_prompt: improvementPrompt,
          api_key: gptApiKey
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to improve Gherkin script');
      }
      
      const data = await response.json();
      setGherkinScript(data.script);
      
      // After getting improved Gherkin, update Cucumber script
      const cucumberResponse = await fetch('http://localhost:8000/api/video/generate-automation-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gherkin_script: data.script,
          framework: selectedFramework,
          api_key: gptApiKey,
          script_type: 'cucumber'
        })
      });
      
      if (!cucumberResponse.ok) {
        throw new Error('Failed to update Cucumber script');
      }
      
      const cucumberData = await cucumberResponse.json();
      setGeneratedTestCases(cucumberData.script);
      
    } catch (err) {
      setError(err.message);
      console.error('Improvement error:', err);
    } finally {
      setImproving(false);
    }
  };

  useEffect(() => {
    const savedApiKey = localStorage.getItem('gptApiKey');
    if (savedApiKey) {
      setGptApiKey(savedApiKey);
    }
    return () => {
      // Cleanup any subscriptions or timers here
    };
  }, []);

  const handleTestCaseSelect = (filename) => {
    setSelectedTestCases(prev => {
      if (prev.includes(filename)) {
        return prev.filter(f => f !== filename);
      }
      return [...prev, filename];
    });
  };

  const handleSelectAll = () => {
    if (selectedTestCases.length === savedTestCases.length) {
      setSelectedTestCases([]);
    } else {
      setSelectedTestCases(savedTestCases.map(tc => tc.name));
    }
  };

  const handleDeleteClick = () => {
    if (selectedTestCases.length > 0) {
      setShowDeleteModal(true);
    }
  };

  const handleConfirmDelete = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/video/delete-test-cases', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(selectedTestCases)
      });

      if (!response.ok) {
        throw new Error('Failed to delete test cases');
      }

      await fetchSavedTestCases();
      setSelectedTestCases([]);
      setShowDeleteModal(false);
      setBackendLogs(prev => [...prev, `Successfully deleted ${selectedTestCases.length} test case(s)`]);
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedTestCases([]);
  };

  const handleDownloadTestCase = async (filename) => {
    try {
      const response = await fetch(`http://localhost:8000/api/video/download-test-case/${filename}`);
      if (!response.ok) {
        throw new Error('Failed to download test case');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      setBackendLogs(prev => [...prev, `Successfully downloaded test case: ${filename}`]);
    } catch (err) {
      setError('Failed to download test case');
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
      console.error('Download error:', err);
    }
  };

  return (
    <div className="container">
      <div className="main-panel">
        <div className="header-with-status">
          <h1>Test Case Generation</h1>
          <div className="connection-status">
            <div className="light-bulb">
              <div className={`bulb ${isJiraConnected ? 'on' : 'off'}`}></div>
              <div className="content">
                <div className="line"></div>
                <div className="line"></div>
                <div className="line"></div>
              </div>
              <div className="footer"></div>
            </div>
            <button 
              className={`toggle-button ${isGptEnabled ? 'on' : 'off'}`}
              onClick={handleGptToggle}
              disabled={!isGptConnected}
            >
              {isGptEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        <div className="input-form">
          <div className="input-group">
            <label htmlFor="jiraApiKey">JIRA API Key</label>
            <div className="input-with-button">
              <input
                type="password"
                id="jiraApiKey"
                value={jiraApiKey}
                onChange={handleJiraApiKeyChange}
                placeholder="Enter your JIRA API Key"
              />
              <button 
                className="connect-btn"
                onClick={handleJiraConnect}
                disabled={jiraConnecting}
              >
                {jiraConnecting ? 'Connecting...' : 'Connect'}
              </button>
              <button 
                className="clear-btn"
                onClick={handleClearJiraKey}
                disabled={jiraConnecting}
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="input-group">
            <label htmlFor="gptApiKey">ChatGPT API Key</label>
            <div className="input-with-button">
              <input
                type="password"
                id="gptApiKey"
                value={gptApiKey}
                onChange={handleGptApiKeyChange}
                placeholder="Enter your ChatGPT API Key"
              />
              <button 
                className="connect-btn"
                onClick={handleGptConnect}
                disabled={connecting}
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
              <button 
                className="clear-btn"
                onClick={handleClearGptKey}
                disabled={connecting}
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="input-group">
            <label htmlFor="jiraLink">JIRA Link</label>
            <div className="input-with-button">
              <input
                type="text"
                id="jiraLink"
                value={jiraLink}
                onChange={(e) => setJiraLink(e.target.value)}
                placeholder="Enter JIRA Link"
              />
              <button className="connect-btn">Generate US</button>
            </div>
          </div>

          <div className="input-group">
            <div className="input-with-button">
              <input
                type="text"
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder="Enter US"
              />
              <button 
                className="generate-btn"
                onClick={handleGenerateTestCases}
                disabled={generating || !isGptEnabled}
              >
                {generating ? 'Generating...' : 'Generate Test'}
              </button>
            </div>
          </div>
        </div>

        {generatedTestCases && (
          <div className="test-cases">
            <div className="test-cases-header">
              <h2>Generated Test Cases</h2>
              <button
                className="save-btn"
                onClick={handleSaveTestCases}
                disabled={savingTestCases}
              >
                {savingTestCases ? 'Saving...' : 'Save Test Case'}
              </button>
            </div>
            <div className="test-case-output">
              <pre>{generatedTestCases}</pre>
            </div>
          </div>
        )}

        {/* Saved Test Cases Widget */}
        <div className="saved-test-cases">
          <div className="test-cases-header">
            <h2>Saved Test Cases</h2>
            <div className="test-cases-actions">
              <button
                className="select-all-btn"
                onClick={handleSelectAll}
                disabled={savedTestCases.length === 0}
              >
                {selectedTestCases.length === savedTestCases.length ? 'Deselect All' : 'Select All'}
              </button>
              <button
                className="delete-btn"
                onClick={handleDeleteClick}
                disabled={selectedTestCases.length === 0}
              >
                Delete Selected
              </button>
            </div>
          </div>
          
          {savedTestCases.length > 0 ? (
            <div className="test-case-list">
              {savedTestCases.map((testCase, index) => (
                <div key={index} className="test-case-item">
                  <div className="test-case-select">
                    <input
                      type="checkbox"
                      checked={selectedTestCases.includes(testCase.name)}
                      onChange={() => handleTestCaseSelect(testCase.name)}
                    />
                  </div>
                  <span 
                    className="test-case-link"
                    onClick={() => handleDownloadTestCase(testCase.name)}
                  >
                    {testCase.name}
                  </span>
                  <span className="test-case-date">
                    {testCase.created}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-test-cases">No saved test cases</div>
          )}
        </div>

        {showDeleteModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>Confirm Delete</h3>
              <p>Are you sure you want to delete {selectedTestCases.length} test case(s)?</p>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={handleCancelDelete}>
                  Cancel
                </button>
                <button className="delete-confirm-btn" onClick={handleConfirmDelete}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="right-panel">
        <div className="logs-section">
          <h2>Backend Logs</h2>
          <div className="logs-container">
            {backendLogs.length > 0 ? (
              backendLogs.map((log, index) => (
                <div key={index} className="log-entry">{log}</div>
              ))
            ) : (
              <div className="no-logs">No logs available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AIEnabledAutomation() {
  const [selectedFramework, setSelectedFramework] = useState('SAHI Pro');
  const [gptApiKey, setGptApiKey] = useState(() => localStorage.getItem('gptApiKey') || '');
  const [isGptConnected, setIsGptConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [userStory, setUserStory] = useState('');
  const [sahiScript, setSahiScript] = useState('');
  const [seleniumScript, setSeleniumScript] = useState('');
  const [generating, setGenerating] = useState(false);
  const [savedScripts, setSavedScripts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [backendLogs, setBackendLogs] = useState([]);

  useEffect(() => {
    const savedFramework = localStorage.getItem('selectedFramework');
    if (savedFramework) {
      setSelectedFramework(savedFramework);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('selectedFramework', selectedFramework);
  }, [selectedFramework]);

  const handleGptConnect = async () => {
    if (!gptApiKey) {
      setError('Please enter ChatGPT API Key');
      setBackendLogs(prev => [...prev, 'Error: ChatGPT API Key is required']);
      return;
    }
    
    setConnecting(true);
    setError(null);
    
    try {
      console.log('Attempting to connect to ChatGPT...');
      setBackendLogs(prev => [...prev, 'Attempting to connect to ChatGPT...']);
      const response = await fetch('http://localhost:8000/api/video/verify-chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: gptApiKey })
      });
      
      console.log('Raw response status:', response.status);
      console.log('Raw response headers:', response.headers);
      
      if (!response.ok) {
        throw new Error('Failed to verify ChatGPT connection');
      }
      
      const data = await response.json();
      setIsGptConnected(data.valid);
      setBackendLogs(prev => [...prev, 'Successfully connected to ChatGPT']);
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
      setIsGptConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  const handleGptApiKeyChange = (e) => {
    const newValue = e.target.value;
    setGptApiKey(newValue);
    localStorage.setItem('gptApiKey', newValue);
  };

  const handleGenerateScript = async () => {
    if (!isGptConnected) {
      setError('Please connect to AI first');
      return;
    }
    
    if (!userStory.trim()) {
      setError('Please enter a test case');
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      const endpoint = selectedFramework === 'SAHI Pro' 
        ? 'generate-sahi-script'
        : selectedFramework === 'Selenium'
        ? 'generate-selenium-script'
        : null;
      
      if (!endpoint) {
        throw new Error('Unsupported framework');
      }

      const response = await fetch(`http://localhost:8000/api/video/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_case: userStory,
          api_key: gptApiKey
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate script');
      }
      
      const data = await response.json();
      if (selectedFramework === 'SAHI Pro') {
        setSahiScript(data.script);
      } else if (selectedFramework === 'Selenium') {
        setSeleniumScript(data.script);
      }
      
    } catch (err) {
      setError(err.message || 'Failed to generate script');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveScript = async () => {
    const scriptToSave = selectedFramework === 'SAHI Pro' ? sahiScript : seleniumScript;
    
    if (!scriptToSave) {
      setError('No script to save');
      return;
    }
    
    setSaving(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/video/save-automation-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: scriptToSave,
          framework: selectedFramework
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save script');
      }
      
      await fetchSavedScripts();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchSavedScripts();
  }, []);

  const fetchSavedScripts = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/video/saved-automation-scripts');
      if (!response.ok) throw new Error('Failed to fetch saved scripts');
      const data = await response.json();
      setSavedScripts(data.files);
    } catch (err) {
      console.error('Error fetching saved scripts:', err);
      setError('Failed to load saved scripts');
    }
  };

  return (
    <div className="container">
      <div className="main-panel">
        <div className="header-with-status">
          <h1>AI Enabled Automation</h1>
          <div className="gpt-controls">
            <input
              type="password"
              placeholder="Enter ChatGPT API Key"
              value={gptApiKey}
              onChange={handleGptApiKeyChange}
              className="api-key-input"
            />
            <button
              onClick={handleGptConnect}
              disabled={connecting}
              className="connect-btn"
            >
              {connecting ? 'Connecting...' : 'Connect'}
            </button>
            <span className={`status-indicator ${isGptConnected ? 'on' : 'off'}`}>
              {isGptConnected ? 'ON' : 'OFF'}
            </span>
          </div>
        </div>

        {error && <div className="error">{error}</div>}
        
        <div className="automation-controls">
          <div className="framework-selection">
            <select 
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="framework-dropdown"
            >
              <option value="SAHI Pro">SAHI Pro</option>
              <option value="Cucumber">Cucumber</option>
              <option value="Selenium">Selenium</option>
            </select>
            
            <textarea
              placeholder="Enter Test Case"
              value={userStory}
              onChange={(e) => setUserStory(e.target.value)}
              className="us-textarea"
              rows={4}
            />
            
            <button
              className="generate-btn"
              onClick={handleGenerateScript}
              disabled={generating || !isGptConnected}
            >
              {generating ? 'Generating...' : 'Generate Automated Test'}
            </button>
          </div>

          {selectedFramework === 'SAHI Pro' && (
            <div className="output-box">
              <h3>SAHI Script Output</h3>
              <div className="script-output">
                <pre className="sahi-output">
                  {sahiScript || 'Generated SAHI script will appear here'}
                </pre>
                <button
                  className="save-script-btn"
                  onClick={handleSaveScript}
                  disabled={!sahiScript || saving}
                >
                  {saving ? 'Saving...' : 'Save Script'}
                </button>
              </div>
            </div>
          )}

          {selectedFramework === 'Selenium' && (
            <div className="output-box">
              <h3>Selenium Test Script</h3>
              <div className="script-output">
                <pre className="selenium-output">
                  {seleniumScript || 'Generated Selenium script will appear here'}
                </pre>
                <button
                  className="save-script-btn"
                  onClick={handleSaveScript}
                  disabled={!seleniumScript || saving}
                >
                  {saving ? 'Saving...' : 'Save Script'}
                </button>
              </div>
            </div>
          )}

          <div className="bottom-section">
            <div className="saved-scripts-panel">
              <div className="output-box">
                <h3>Saved Scripts</h3>
                <div className="saved-scripts">
                  {savedScripts.length > 0 ? (
                    <div className="script-list">
                      {savedScripts.map((script, index) => (
                        <div key={index} className="script-item">
                          <button
                            className="script-link"
                            onClick={() => handleDownloadScript(script.name)}
                          >
                            {script.name}
                          </button>
                          <span className="script-date">{script.created}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="no-scripts">No saved scripts</div>
                  )}
                </div>
              </div>
            </div>

            <div className="logs-panel">
              <div className="output-box">
                <h3>Backend Logs</h3>
                <div className="logs-container">
                  {backendLogs.length > 0 ? (
                    backendLogs.map((log, index) => (
                      <div key={index} className="log-entry">{log}</div>
                    ))
                  ) : (
                    <div className="no-logs">No logs available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestCaseValidator() {
  const [testCaseInput, setTestCaseInput] = useState('Enter Test Case');
  const [checklistResults, setChecklistResults] = useState({
    scenarios: { present: false, count: 0 },
    browserConfig: { present: false, count: 0 },
    notes: { present: false },
    regressionScenarios: { present: false }
  });
  const [gptApiKey, setGptApiKey] = useState(() => localStorage.getItem('validatorGptApiKey') || '');
  const [isGptConnected, setIsGptConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGptConnect = async () => {
    if (!gptApiKey) {
      setError('Please enter ChatGPT API Key');
      return;
    }
    
    setConnecting(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/video/verify-chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          "api_key": gptApiKey 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify ChatGPT connection');
      }
      
      const data = await response.json();
      
      if (data.valid) {
        setIsGptConnected(true);
        localStorage.setItem('validatorGptApiKey', gptApiKey);
        setError(null);
      } else {
        throw new Error('Invalid API key');
      }
    } catch (err) {
      setError(err.message || 'Failed to verify ChatGPT connection');
      setIsGptConnected(false);
    } finally {
      setConnecting(false);
    }
  };

  const handleGptApiKeyChange = (e) => {
    const newValue = e.target.value;
    setGptApiKey(newValue);
  };

  const scanTestCase = (testCase) => {
    const sections = {
      scenarios: { present: false, count: 0 },
      browserConfig: { present: false, count: 0 },
      notes: { present: false },
      regressionScenarios: { present: false }
    };
    
    // Convert to lowercase and split into lines for easier scanning
    const lines = testCase.toLowerCase().split('\n');
    
    let currentSection = '';
    
    lines.forEach(line => {
      // Check for Scenario sections
      if (line.includes('scenario:') || line.includes('scenario ')) {
        sections.scenarios.present = true;
        sections.scenarios.count++;
      }
      
      // Check for Browser Configuration
      if (line.includes('browser configuration:') || 
          line.includes('browser config:') || 
          line.includes('browser setup:')) {
        sections.browserConfig.present = true;
        sections.browserConfig.count++;
      }
      
      // Check for Notes section
      if (line.includes('notes:')) {
        sections.notes.present = true;
      }
      
      // Check for Additional Regression Scenarios
      if (line.includes('additional regression scenarios:') || 
          line.includes('regression scenarios:') ||
          line.includes('regression test cases:')) {
        sections.regressionScenarios.present = true;
      }
    });
    
    setChecklistResults(sections);
  };

  const handleTestCaseChange = (e) => {
    const newValue = e.target.value;
    setTestCaseInput(newValue);
    if (newValue.trim()) {
      scanTestCase(newValue);
    } else {
      // Reset checklist if input is empty
      setChecklistResults({
        scenarios: { present: false, count: 0 },
        browserConfig: { present: false, count: 0 },
        notes: { present: false },
        regressionScenarios: { present: false }
      });
    }
  };

  const handleGenerateReport = async () => {
    if (!isGptConnected) {
      setError('Please connect to AI first');
      return;
    }
    
    if (!testCaseInput.trim()) {
      setError('Please enter a test case to analyze');
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/video/analyze-test-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_case: testCaseInput,
          api_key: gptApiKey
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to analyze test case');
      }
      
      const data = await response.json();
      setAiAnalysis(data.analysis);
      
    } catch (err) {
      setError(err.message || 'Failed to generate analysis');
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveScript = async () => {
    if (!testCaseInput || testCaseInput === 'Enter Test Case') {
      setError('Please enter a test case before saving');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:8000/api/video/save-test-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_case: testCaseInput
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save test case');
      }
      
      setError(null);
      // Optional: Show success message
    } catch (err) {
      setError(err.message || 'Failed to save test case');
    }
  };

  return (
    <div className="container">
      <div className="main-panel">
        <h1>Test Case Validator</h1>
        
        {error && <div className="error">{error}</div>}
        
        <div className="validator-controls">
          <div className="input-section">
            <div className="controls-container">
              <div className="api-input-group">
                <input
                  type="password"
                  placeholder="Enter JIRA API Key"
                  className="api-key-input"
                />
                <button className="connect-btn">
                  Connect to JIRA
                </button>
              </div>
              
              <div className="api-input-group">
                <input
                  type="password"
                  placeholder="Enter AI Key"
                  className="api-key-input"
                  value={gptApiKey}
                  onChange={handleGptApiKeyChange}
                />
                <button 
                  className="connect-btn"
                  onClick={handleGptConnect}
                  disabled={connecting}
                >
                  {connecting ? 'Connecting...' : 'Connect to AI'}
                </button>
                <span className={`status-indicator ${isGptConnected ? 'on' : 'off'}`}>
                  {isGptConnected ? 'ON' : 'OFF'}
                </span>
              </div>
              
              <div className="input-group">
                <input
                  type="text"
                  placeholder="JIRA Link"
                  className="full-width-input"
                />
              </div>
              
              <div className="input-group">
                <textarea
                  placeholder="Enter Test Case"
                  className="test-case-input"
                  value={testCaseInput}
                  onChange={handleTestCaseChange}
                  rows={4}
                />
              </div>
              
              <div className="generate-section">
                <button 
                  className="generate-report-btn"
                  onClick={handleGenerateReport}
                  disabled={generating || !isGptConnected}
                >
                  {generating ? 'Analyzing...' : 'Generate Report'}
                </button>
              </div>
            </div>

            <div className="report-widgets">
              <div className="report-widget">
                <h3>Checklist Report</h3>
                <div className="report-content">
                  <div className="checklist">
                    <div className="checklist-item">
                      <span className={`checkmark ${checklistResults.scenarios.present ? 'present' : 'missing'}`}>
                        {checklistResults.scenarios.present ? '✓' : '✗'}
                      </span>
                      <span className="section-name">Scenarios</span>
                      {checklistResults.scenarios.count > 0 && (
                        <span className="count">({checklistResults.scenarios.count})</span>
                      )}
                    </div>
                    
                    <div className="checklist-item">
                      <span className={`checkmark ${checklistResults.browserConfig.present ? 'present' : 'missing'}`}>
                        {checklistResults.browserConfig.present ? '✓' : '✗'}
                      </span>
                      <span className="section-name">Browser Configuration</span>
                      {checklistResults.browserConfig.count > 0 && (
                        <span className="count">({checklistResults.browserConfig.count})</span>
                      )}
                    </div>
                    
                    <div className="checklist-item">
                      <span className={`checkmark ${checklistResults.notes.present ? 'present' : 'missing'}`}>
                        {checklistResults.notes.present ? '✓' : '✗'}
                      </span>
                      <span className="section-name">Notes</span>
                    </div>
                    
                    <div className="checklist-item">
                      <span className={`checkmark ${checklistResults.regressionScenarios.present ? 'present' : 'missing'}`}>
                        {checklistResults.regressionScenarios.present ? '✓' : '✗'}
                      </span>
                      <span className="section-name">Additional Regression Scenarios</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="report-widget">
                <h3>AI Analysis</h3>
                <div className="report-content">
                  {aiAnalysis ? (
                    <div className="ai-analysis">
                      {aiAnalysis.split('\n\n').map((section, index) => {
                        if (section.startsWith('KEY FINDINGS:')) {
                          return (
                            <div key={index} className="analysis-section">
                              <div className="section-title">Key Findings</div>
                              {section.split('\n').slice(1).map((point, i) => (
                                point.trim() && <div key={i} className="key-point">{point.trim()}</div>
                              ))}
                            </div>
                          );
                        } else if (section.startsWith('RECOMMENDATIONS:')) {
                          return (
                            <div key={index} className="analysis-section">
                              <div className="section-title">Recommendations</div>
                              {section.split('\n').slice(1).map((point, i) => (
                                point.trim() && <div key={i} className="recommendation">{point.trim()}</div>
                              ))}
                            </div>
                          );
                        } else if (section.startsWith('DETAILED ANALYSIS:')) {
                          return (
                            <div key={index} className="analysis-section">
                              <div className="section-title">Detailed Analysis</div>
                              <div className="analysis-text">{section.split('\n').slice(1).join('\n')}</div>
                            </div>
                          );
                        }
                        return null;
                      })}
                    </div>
                  ) : (
                    <div className="placeholder-text">
                      AI analysis will appear here after generating the report
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="save-section">
              <button 
                className="save-script-btn"
                onClick={handleSaveScript}
                disabled={!testCaseInput || testCaseInput === 'Enter Test Case'}
              >
                Save Script
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [selectedFramework, setSelectedFramework] = useState('Cucumber');
  const [activeTab, setActiveTab] = useState('scribe');
  const [file, setFile] = useState(null);
  const [testCases, setTestCases] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendLogs, setBackendLogs] = useState([]);
  const [frames, setFrames] = useState([]);
  const [isVideo, setIsVideo] = useState(false);

  const formatTestCases = (testCases) => {
    if (!testCases || testCases.length === 0) return "No test cases generated";
    
    return testCases.map((testCase, index) => {
      const formattedSteps = testCase.steps.map((step, stepIndex) => (
        `${stepIndex + 1}. ${step.description}\n   Expected Outcome: ${step.expected_outcome}`
      )).join('\n\n');

      return `Test Case: ${testCase.name}\n\n${formattedSteps}`;
    }).join('\n\n---\n\n');
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setBackendLogs([]);
    setFrames([]);
    setIsVideo(false);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/video/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      console.log("Response data:", data);
      console.log("Frames received:", data.frames);
      
      if (data.logs) {
        setBackendLogs(data.logs);
      }
      setIsVideo(data.is_video || false);
      if (data.frames) {
        console.log("Setting frames:", data.frames);
        setFrames(data.frames);
      }
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to process file');
      }

      setTestCases(data.test_cases);
    } catch (err) {
      const errorMessage = err.name === 'TypeError' 
        ? 'Failed to connect to server. Please ensure the backend is running on port 8000.'
        : err.message;
      setError(errorMessage);
      console.error('Connection error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadAll = async () => {
    try {
      // Download all frames in sequence
      for (let i = 0; i < frames.length; i++) {
        const frame = frames[i];
        const fileResponse = await fetch(`http://localhost:8000/api/video/frame/${encodeURIComponent(frame)}`);
        const blob = await fileResponse.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `picture_${i + 1}.jpg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        // Small delay between downloads to prevent browser throttling
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } catch (err) {
      setError('Failed to download screenshots');
      console.error('Download error:', err);
    }
  };

  return (
    <div className="app">
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'scribe' ? 'active' : ''}`}
          onClick={() => setActiveTab('scribe')}
        >
          Scribe Test Case Generator
        </button>
        <button 
          className={`tab-button ${activeTab === 'testgen' ? 'active' : ''}`}
          onClick={() => setActiveTab('testgen')}
        >
          Test Case Generation
        </button>
        <button 
          className={`tab-button ${activeTab === 'automation' ? 'active' : ''}`}
          onClick={() => setActiveTab('automation')}
        >
          AI Enabled Automation
        </button>
        <button 
          className={`tab-button ${activeTab === 'validator' ? 'active' : ''}`}
          onClick={() => setActiveTab('validator')}
        >
          Test Case Validator
        </button>
        <button 
          className={`tab-button ${activeTab === 'massreports' ? 'active' : ''}`}
          onClick={() => setActiveTab('massreports')}
        >
          Mass Reports
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'scribe' ? (
          <ScriberTestCaseGenerator
            file={file}
            setFile={setFile}
            testCases={testCases}
            loading={loading}
            error={error}
            backendLogs={backendLogs}
            frames={frames}
            isVideo={isVideo}
            handleUpload={handleUpload}
            handleDownloadAll={handleDownloadAll}
            formatTestCases={formatTestCases}
          />
        ) : activeTab === 'testgen' ? (
          <TestCaseGeneration />
        ) : activeTab === 'automation' ? (
          <AIEnabledAutomation />
        ) : activeTab === 'validator' ? (
          <TestCaseValidator />
        ) : (
          <MassReports />
        )}
      </div>
    </div>
  );
}

function MassReports() {
  const [jiraApiKey, setJiraApiKey] = useState(() => localStorage.getItem('jiraApiKey') || '');
  const [aiApiKey, setAiApiKey] = useState(() => localStorage.getItem('aiApiKey') || '');
  const [epicLink, setEpicLink] = useState('');
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [isAiConnected, setIsAiConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);

  const handleJiraApiKeyChange = (e) => {
    const value = e.target.value;
    setJiraApiKey(value);
    localStorage.setItem('jiraApiKey', value);
  };

  const handleAiApiKeyChange = (e) => {
    const value = e.target.value;
    setAiApiKey(value);
    localStorage.setItem('aiApiKey', value);
  };

  return (
    <div className="container">
      <div className="main-panel">
        <h1>Mass Reports</h1>
        {error && <div className="error">{error}</div>}

        <div className="mass-reports-controls">
          <div className="api-section">
            <div className="api-input-group">
              <input
                type="password"
                placeholder="Enter JIRA API Key"
                value={jiraApiKey}
                onChange={handleJiraApiKeyChange}
                className="api-key-input"
              />
              <button
                className={`connect-btn ${isJiraConnected ? 'connected' : ''}`}
                disabled={connecting}
              >
                {connecting ? 'Connecting...' : 'Link to Jira'}
              </button>
              <span className={`status-indicator ${isJiraConnected ? 'on' : 'off'}`}>
                {isJiraConnected ? 'ON' : 'OFF'}
              </span>
            </div>

            <div className="api-input-group">
              <input
                type="password"
                placeholder="AI API Key"
                value={aiApiKey}
                onChange={handleAiApiKeyChange}
                className="api-key-input"
              />
              <button
                className={`connect-btn ${isAiConnected ? 'connected' : ''}`}
                disabled={connecting}
              >
                {connecting ? 'Connecting...' : 'Link to AI'}
              </button>
              <span className={`status-indicator ${isAiConnected ? 'on' : 'off'}`}>
                {isAiConnected ? 'ON' : 'OFF'}
              </span>
            </div>
          </div>

          <div className="epic-section">
            <div className="epic-input-group">
              <input
                type="text"
                placeholder="Enter Epic Number or Epic Link"
                value={epicLink}
                onChange={(e) => setEpicLink(e.target.value)}
                className="epic-input"
              />
              <button className="generate-report-btn">
                Generate TC Status Report
              </button>
            </div>
          </div>

          <div className="reports-section">
            <div className="report-widget">
              <h3>Test Case Status Report</h3>
              <div className="report-content">
                <div className="placeholder-text">
                  Report will be displayed here
                </div>
              </div>
            </div>
          </div>

          <div className="actions-section">
            <div className="action-group">
              <button className="backfill-btn">
                Backfill Test Cases
              </button>
              <div className="backfill-list-widget">
                <h3>Backfill Status</h3>
                <div className="list-content">
                  <div className="placeholder-text">
                    Backfill items will appear here
                  </div>
                </div>
              </div>
            </div>
            <button className="push-jira-btn">
              Push to JIRA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
