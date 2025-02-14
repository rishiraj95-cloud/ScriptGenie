import logo from './logo.svg';
import React, { useState, useEffect } from 'react';
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
      setBackendLogs(prev => [...prev, 'Attempting to connect to ChatGPT...']);
      const response = await fetch('http://localhost:8000/api/video/verify-chatgpt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          "api_key": gptApiKey 
        })
      });
      
      console.log('Raw ChatGPT response:', response);
      
      if (!response.ok) {
        let errorDetail;
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail;
        } catch (e) {
          errorDetail = `HTTP Error ${response.status}`;
        }
        setBackendLogs(prev => [...prev, `ChatGPT Connection Error: ${errorDetail}`]);
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
          <h2>Saved Test Cases</h2>
          <div className="saved-test-cases-list">
            {savedTestCases.length > 0 ? (
              <table className="saved-test-cases-table">
                <thead>
                  <tr>
                    <th>Test Case</th>
                    <th>Created On</th>
                  </tr>
                </thead>
                <tbody>
                  {savedTestCases.map((file, index) => (
                    <tr key={index} className="saved-test-case-row">
                      <td>
                        <a 
                          href={`http://localhost:8000/api/video/download-test-case/${encodeURIComponent(file.name)}`}
                          className="test-case-link"
                          download={`TestCase_${file.date.replace(/[: ]/g, '_')}.txt`}
                        >
                          {`TestCase_${file.date.replace(/[: ]/g, '_')}`}
                        </a>
                      </td>
                      <td className="saved-test-case-date">
                        {file.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="no-saved-cases">No saved test cases</div>
            )}
          </div>
        </div>
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
  const [selectedFramework, setSelectedFramework] = useState('Cucumber');

  return (
    <div className="container">
      <div className="main-panel">
        <div className="header-with-status">
          <h1>AI Enabled Automation</h1>
          <div className="connection-status">
            <span className="status-indicator off">OFF</span>
          </div>
        </div>
        <div className="automation-controls">
          <div className="framework-selection">
            <select 
              value={selectedFramework}
              onChange={(e) => setSelectedFramework(e.target.value)}
              className="framework-dropdown"
            >
              <option value="Cucumber">Cucumber</option>
              <option value="Selenium">Selenium</option>
              <option value="SAHI Pro">SAHI Pro</option>
            </select>
            <button className="generate-btn">Generate Automated Test</button>
          </div>
          
          <div className="user-story-input">
            <textarea
              placeholder="Enter US"
              className="us-textarea"
              rows={4}
            />
          </div>
          
          <div className="output-section">
            <div className="output-box">
              <h3>Gherkin Script</h3>
              <div className="script-output">
                <pre>Gherkin Script</pre>
              </div>
            </div>
            
            <div className="output-box">
              <h3>Other Script Output</h3>
              <div className="script-output">
                <pre></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestCaseValidator() {
  return (
    <div className="container">
      <div className="main-panel">
        <h1>Test Case Validator</h1>
        <p>Coming soon...</p>
      </div>
    </div>
  );
}

function App() {
  const [file, setFile] = useState(null);
  const [testCases, setTestCases] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendLogs, setBackendLogs] = useState([]);
  const [frames, setFrames] = useState([]);
  const [isVideo, setIsVideo] = useState(false);
  const [activeTab, setActiveTab] = useState('scribe');

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
    <div className="app-container">
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
        ) : (
          <TestCaseValidator />
        )}
      </div>
    </div>
  );
}

export default App;
