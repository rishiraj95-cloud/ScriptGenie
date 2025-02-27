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
  // Add tooltip style
  const tooltipStyle = {
    position: 'relative',
    display: 'inline-block',
    marginTop: '30px'  // Add space above button for tooltip
  };
  
  const tooltipTextStyle = {
    visibility: 'hidden',
    width: '300px',
    backgroundColor: '#333',
    color: '#fff',
    textAlign: 'center',
    borderRadius: '6px',
    padding: '12px 16px',  // Increase padding
    position: 'absolute',
    zIndex: 1,
    bottom: '150%',  // Move tooltip higher
    left: '50%',
    transform: 'translateX(-50%)',
    opacity: 0,
    transition: 'opacity 0.3s',
    fontSize: '14px',
    lineHeight: '1.6',  // Increase line height
    whiteSpace: 'normal',  // Ensure text wraps properly
    wordWrap: 'break-word'  // Handle long words
  };

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
          <div style={tooltipStyle}>
            <button 
              onClick={handleUpload}
              disabled={loading}
              onMouseEnter={(e) => {
                e.currentTarget.nextElementSibling.style.visibility = 'visible';
                e.currentTarget.nextElementSibling.style.opacity = '1';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.nextElementSibling.style.visibility = 'hidden';
                e.currentTarget.nextElementSibling.style.opacity = '0';
              }}
            >
              {loading ? 'Processing...' : 'Generate Test Cases'}
            </button>
            <div style={tooltipTextStyle}>
              If scribe files are dropped, test steps shall be generated, if video files are dropped screen shots shall be generated
            </div>
          </div>
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
  const [terminalInput, setTerminalInput] = useState('');
  const [previousTestCase, setPreviousTestCase] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [isSavedTestCasesCollapsed, setSavedTestCasesCollapsed] = useState(false);
  const [hoveredStats, setHoveredStats] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });
  const [jiraTestCaseLink, setJiraTestCaseLink] = useState('');
  const [showPushModal, setShowPushModal] = useState(false);
  const [userStoryLink, setUserStoryLink] = useState('');
  const [isPushing, setIsPushing] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState('');

  // Add style for push to JIRA button
  const pushToJiraButtonStyle = {
    backgroundColor: '#0052CC',  // JIRA blue color
    color: 'white',
    border: 'none',
    padding: '10px 20px',
    borderRadius: '25px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    boxShadow: '0 3px 6px rgba(0, 82, 204, 0.2)',
    transition: 'all 0.3s ease',
    fontSize: '14px',
    letterSpacing: '0.5px',
    position: 'relative',
    overflow: 'hidden'
  };

  // Style for modal overlay
  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  // Style for modal content
  const modalContentStyle = {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    width: '400px',
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)'
  };

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
      console.log('Attempting JIRA connection...'); // Add logging
      const response = await fetch('http://localhost:8000/api/video/verify-jira', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: jiraApiKey })
      });
      
      console.log('JIRA response status:', response.status); // Add logging
      if (!response.ok) {
        throw new Error('Failed to verify JIRA connection');
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
      setError('Please enable AI first');
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      setBackendLogs(prev => [...prev, 'Generating test cases...']);
      const response = await fetch('http://localhost:8000/api/video/generate-test-cases-from-text', {
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
        throw new Error('Failed to generate test cases');
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

  const handleImprove = async () => {
    if (!isGptConnected) {
      setError('Please connect to AI first');
      setBackendLogs(prev => [...prev, 'Error: AI connection required']);
      return;
    }
    
    if (!terminalInput.trim()) {
      setError('Please enter an improvement prompt');
      return;
    }
    
    if (!generatedTestCases) {
      setError('No test cases to improve');
      return;
    }
    
    setIsImproving(true);
    setError(null);
    setPreviousTestCase(generatedTestCases);
    
    try {
      const response = await fetch('http://localhost:8000/api/video/improve-test-cases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_test_cases: generatedTestCases,
          improvement_prompt: terminalInput,
          api_key: gptApiKey
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to improve test cases');
      }
      
      const data = await response.json();
      setGeneratedTestCases(data.improved_test_cases);
      setBackendLogs(prev => [...prev, 'Successfully improved test cases']);
      setTerminalInput('');
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setIsImproving(false);
    }
  };

  const handleRevert = () => {
    if (previousTestCase) {
      setGeneratedTestCases(previousTestCase);
      setPreviousTestCase('');
      setBackendLogs(prev => [...prev, 'Reverted to previous version']);
    }
  };

  const handleGenerateFromJira = async () => {
    if (!isJiraConnected || !isGptConnected) {
      setError('Please connect to both JIRA and AI first');
      setBackendLogs(prev => [...prev, 'Error: Both JIRA and AI connections required']);
      return;
    }
    
    if (!jiraLink) {
      setError('Please enter a JIRA link');
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      // First fetch the user story from JIRA
      setBackendLogs(prev => [...prev, 'Fetching user story from JIRA...']);
      const jiraResponse = await fetch('http://localhost:8000/api/video/fetch-jira-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jira_link: jiraLink,
          api_key: jiraApiKey
        })
      });
      
      if (!jiraResponse.ok) {
        throw new Error('Failed to fetch user story from JIRA');
      }
      
      const jiraData = await jiraResponse.json();
      setBackendLogs(prev => [...prev, 'Successfully fetched user story from JIRA']);
      
      // Then generate test cases using the user story
      setBackendLogs(prev => [...prev, 'Generating test cases using AI...']);
      const generateResponse = await fetch('http://localhost:8000/api/video/generate-test-cases-from-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_story: jiraData.user_story,
          api_key: gptApiKey
        })
      });
      
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        setBackendLogs(prev => [...prev, `Failed to generate test cases: ${errorData.detail || 'Unknown error'}`]);
        throw new Error(errorData.detail || 'Failed to generate test cases');
      }
      
      const generateData = await generateResponse.json();
      setGeneratedTestCases(generateData.test_cases);
      setBackendLogs(prev => [...prev, 'Successfully generated test cases']);
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
      console.error('Test case generation error:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handlePullTestCase = async () => {
    // First validate JIRA connection
    if (!isJiraConnected) {
      setError('Please connect to JIRA first');
      setBackendLogs(prev => [...prev, 'Error: JIRA connection required']);
      return;
    }
    
    if (!jiraTestCaseLink) {
      setError('Please enter a JIRA test case link');
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/video/fetch-jira-test-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jira_link: jiraTestCaseLink,
          api_key: jiraApiKey
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch test case from JIRA');
      }
      
      const data = await response.json();
      
      // Format the test case with JIRA prefix
      const formattedTestCase = `JIRA Test Case (${jiraTestCaseLink}):\n\n${data.test_case}`;
      setGeneratedTestCases(formattedTestCase);
      setBackendLogs(prev => [...prev, 'Successfully fetched test case from JIRA']);
      
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setGenerating(false);
    }
  };

  const handlePushToJira = async () => {
    if (!userStoryLink) {
      setError('Enter a valid User Story');
      return;
    }
    
    setIsPushing(true);
    setError(null);
    
    try {
      // First fetch user story details to get title
      const storyResponse = await fetch('http://localhost:8000/api/video/get-user-story', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jira_link: userStoryLink,
          api_key: jiraApiKey
        })
      });
      
      if (!storyResponse.ok) {
        throw new Error('Failed to fetch user story details');
      }
      
      const storyData = await storyResponse.json();
      
      // Create and push test case
      const pushResponse = await fetch('http://localhost:8000/api/video/push-test-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_story_key: storyData.key,
          project_key: storyData.projectKey,
          user_story_title: storyData.title,
          test_case_content: generatedTestCases,
          api_key: jiraApiKey
        })
      });
      
      if (!pushResponse.ok) {
        throw new Error('Failed to push test case to JIRA');
      }
      
      setBackendLogs(prev => [...prev, 'Successfully pushed test case to JIRA']);
      setShowPushModal(false);
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setIsPushing(false);
    }
  };

  const handleUserStoryChange = (e) => {
    setUserStory(e.target.value);
  };

  // Tooltip styles
  const tooltipStyle = {
    position: 'relative',
    display: 'inline-block'
  };
  
  const tooltipTextStyle = {
    visibility: 'hidden',
    width: '300px',
    backgroundColor: '#333',
    color: '#fff',
    textAlign: 'left',
    borderRadius: '6px',
    padding: '12px 16px',
    position: 'absolute',
    zIndex: 1,
    bottom: '150%',
    left: '50%',
    transform: 'translateX(-50%)',
    opacity: 0,
    transition: 'opacity 0.3s',
    fontSize: '14px',
    lineHeight: '1.6',
    whiteSpace: 'normal',
    wordWrap: 'break-word'
  };

  // Special tooltip style for Pull Test Case button
  const pullTestCaseTooltipStyle = {
    ...tooltipTextStyle,
    left: 'calc(100% + 10px)',  // Position to the right of the button
    bottom: '50%',  // Align vertically with button
    transform: 'translateY(50%)',  // Center vertically
    width: '350px'  // Slightly wider to accommodate the text
  };

  // Special arrow style for Pull Test Case tooltip
  const pullTestCaseArrowStyle = {
    content: '""',
    position: 'absolute',
    top: '50%',
    right: '100%',
    marginTop: '-8px',
    borderWidth: '8px',
    borderStyle: 'solid',
    borderColor: 'transparent #333 transparent transparent'
  };

  // Terminal improve button tooltip style
  const improveButtonTooltipStyle = {
    ...tooltipTextStyle,
    width: '350px',
    left: 'calc(100% + 10px)',  // Position to the right of the button
    bottom: '50%',              // Align vertically with button
    transform: 'translateY(50%)',// Center vertically
    zIndex: 1000,
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    textAlign: 'left'
  };

  // Update arrow style for improve button tooltip
  const improveButtonArrowStyle = {
    content: '""',
    position: 'absolute',
    top: '50%',
    right: '100%',
    marginTop: '-8px',
    borderWidth: '8px',
    borderStyle: 'solid',
    borderColor: 'transparent #333 transparent transparent'
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
            <input
              type="text"
              id="jiraLink"
              value={jiraLink}
              onChange={(e) => setJiraLink(e.target.value)}
              placeholder="Enter User Story JIRA# Link"
            />
            <div style={tooltipStyle}>
              <button
                className="generate-btn"
                onClick={handleGenerateFromJira}
                disabled={generating || !isJiraConnected || !isGptConnected}
                onMouseEnter={(e) => {
                  e.currentTarget.nextElementSibling.style.visibility = 'visible';
                  e.currentTarget.nextElementSibling.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.nextElementSibling.style.visibility = 'hidden';
                  e.currentTarget.nextElementSibling.style.opacity = '0';
                }}
              >
                {generating ? 'Generating...' : 'Generate Test Case From US'}
              </button>
              <div style={tooltipTextStyle}>
                Enter the JIRA User Story# (already existing in JIRA) for which you want to generate test case using AI
              </div>
            </div>
          </div>

          <div className="input-group">
            <div className="input-with-button">
              <input
                type="text"
                value={userStory}
                onChange={(e) => setUserStory(e.target.value)}
                placeholder="Paste User Story in this input box"
              />
              <div style={tooltipStyle}>
                <button
                  className="generate-btn"
                  onClick={handleGenerateTestCases}
                  disabled={generating || !isGptEnabled}
                  onMouseEnter={(e) => {
                    e.currentTarget.nextElementSibling.style.visibility = 'visible';
                    e.currentTarget.nextElementSibling.style.opacity = '1';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.nextElementSibling.style.visibility = 'hidden';
                    e.currentTarget.nextElementSibling.style.opacity = '0';
                  }}
                  style={{ backgroundColor: '#800080' }}  // Purple color
                >
                  {generating ? 'Generating...' : 'Generate Test Case'}
                </button>
                <div style={tooltipTextStyle}>
                  Generate Test Case for the User Story in the Input box
                </div>
              </div>
            </div>
          </div>

          <div className="input-group">
            <input
              type="text"
              placeholder="Enter JIRA Test Case Link"
              value={jiraTestCaseLink}
              onChange={(e) => setJiraTestCaseLink(e.target.value)}
              className="jira-link-input"
            />
            <div style={tooltipStyle}>
              <button
                className="generate-btn"
                onClick={handlePullTestCase}
                disabled={!isJiraConnected}
                onMouseEnter={(e) => {
                  e.currentTarget.nextElementSibling.style.visibility = 'visible';
                  e.currentTarget.nextElementSibling.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.nextElementSibling.style.visibility = 'hidden';
                  e.currentTarget.nextElementSibling.style.opacity = '0';
                }}
                style={{ backgroundColor: '#00008B' }}  // Dark Blue color
              >
                Pull Test Case from JIRA
              </button>
              <div style={pullTestCaseTooltipStyle}>
                Enter the link of an existing Test Case here and click on the command, it shall be loaded in Generated Test Cases output box where it can be improved using AI
                <div style={pullTestCaseArrowStyle}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="generated-test-cases">
          <h2>Generated Test Cases</h2>
          <div className="test-cases-header">
            <button
              className="save-btn"
              onClick={handleSaveTestCases}
              disabled={savingTestCases}
            >
              {savingTestCases ? 'Saving...' : 'Save Test Case'}
            </button>
            <button
              className="push-jira-btn"
              onClick={() => setShowPushModal(true)}
              disabled={!isJiraConnected || !generatedTestCases}
            >
              Push Test Case to JIRA
            </button>
          </div>
          <div className="test-case-output">
            <pre>{generatedTestCases || 'Generated test cases will appear here'}</pre>
          </div>
          <div className="terminal-section">
            <div className="terminal-header">
              <span>Terminal</span>
              <div className="terminal-actions">
                <div style={tooltipStyle}>
                  <button
                    onClick={handleImprove}
                    disabled={isImproving || !terminalInput.trim()}
                    onMouseEnter={(e) => {
                      e.currentTarget.nextElementSibling.style.visibility = 'visible';
                      e.currentTarget.nextElementSibling.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.nextElementSibling.style.visibility = 'hidden';
                      e.currentTarget.nextElementSibling.style.opacity = '0';
                    }}
                  >
                    {isImproving ? 'Improving...' : 'Improve'}
                  </button>
                  <div style={improveButtonTooltipStyle}>
                    Enter Prompts to iterate the results which are present in the Generated Test Cases output widget above
                    <div style={improveButtonArrowStyle}></div>
                  </div>
                </div>
                <button
                  className="revert-btn"
                  onClick={handleRevert}
                  disabled={!previousTestCase}
                >
                  Revert
                </button>
              </div>
            </div>
            <textarea
              className="terminal-input"
              value={terminalInput}
              onChange={(e) => setTerminalInput(e.target.value)}
              placeholder="Enter improvement prompt here..."
              rows={3}
            />
          </div>
        </div>

        <div className="saved-test-cases">
          <div className="test-cases-header">
            <div className="header-with-toggle">
              <button 
                className="collapse-toggle"
                onClick={() => setSavedTestCasesCollapsed(!isSavedTestCasesCollapsed)}
              >
                {isSavedTestCasesCollapsed ? '►' : '▼'}
              </button>
              <h2>Saved Test Cases</h2>
            </div>
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
          
          <div className={`test-cases-content ${isSavedTestCasesCollapsed ? 'collapsed' : ''}`}>
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

        {showPushModal && (
          <div 
            style={modalOverlayStyle}
            onClick={() => setShowPushModal(false)}
          >
            <div 
              style={modalContentStyle}
              onClick={e => e.stopPropagation()}
            >
              <h3>Push Test Case to JIRA</h3>
              <input
                type="text"
                value={userStoryLink}
                onChange={(e) => setUserStoryLink(e.target.value)}
                placeholder="Enter User Story to Link with Test Case"
                style={{
                  width: '100%',
                  padding: '8px',
                  marginBottom: '15px',
                  borderRadius: '4px',
                  border: '1px solid #ddd'
                }}
              />
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handlePushToJira}
                  disabled={isPushing}
                  style={{
                    backgroundColor: '#36B37E',  // Green color
                    color: 'white',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  {isPushing ? 'Pushing...' : 'Push'}
                </button>
                <button
                  onClick={() => setShowPushModal(false)}
                  style={{
                    backgroundColor: '#EBECF0',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
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
  // Script states
  const [seleniumScript, setSeleniumScript] = useState('');
  const [sahiScript, setSahiScript] = useState('');
  const [cucumberScript, setCucumberScript] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('Selenium');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [backendLogs, setBackendLogs] = useState([]);
  const [isGptConnected, setIsGptConnected] = useState(false);
  const [gptApiKey, setGptApiKey] = useState('');
  const [connecting, setConnecting] = useState(false);
  const [testCase, setTestCase] = useState('');
  const [generating, setGenerating] = useState(false);
  const [savedScripts, setSavedScripts] = useState([]);
  
  // Terminal input states
  const [terminalInput, setTerminalInput] = useState('');
  
  // Previous script states
  const [previousSeleniumScript, setPreviousSeleniumScript] = useState('');
  const [previousSahiScript, setPreviousSahiScript] = useState('');
  const [previousCucumberScript, setPreviousCucumberScript] = useState('');
  
  // Improving states
  const [isImprovingSelenium, setIsImprovingSelenium] = useState(false);
  const [isImprovingSahi, setIsImprovingSahi] = useState(false);
  const [isImprovingCucumber, setIsImprovingCucumber] = useState(false);

  // Handle framework selection
  const handleFrameworkChange = (e) => {
    setSelectedFramework(e.target.value);
  };

  // Handle user story input
  const handleUserStoryChange = (e) => {
    setUserStory(e.target.value);
  };

  // Handle script generation
  const handleGenerateScript = async () => {
    if (!isGptConnected) {
      setError('Please connect to AI first');
      return;
    }
    
    if (!testCase) {
      setError('Please enter a test case');
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/video/generate-automation-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_case: testCase,
          framework: selectedFramework,
          api_key: gptApiKey
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate script');
      }
      
      const data = await response.json();
      
      // Update the appropriate script based on selected framework
      if (selectedFramework === 'SAHI Pro') {
        setSahiScript(data.script);
      } else if (selectedFramework === 'Cucumber') {
        setCucumberScript(data.script);
      } else {
        setSeleniumScript(data.script);
      }
      
      setBackendLogs(prev => [...prev, 'Successfully generated automation script']);
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setGenerating(false);
    }
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

  // Get current script based on selected framework
  const getCurrentScript = () => {
    const script = selectedFramework === 'SAHI Pro' ? sahiScript :
                   selectedFramework === 'Cucumber' ? cucumberScript :
                   seleniumScript;
                 
    // Trim any leading/trailing ~~~ or ``` markers
    return script ? script.replace(/^(~~~|```)\s*python?\s*|[\s\n]*(~~~|```)$/g, '').trim() : '';
  };

  // Save script handler
  const handleSaveScript = async () => {
    const currentScript = getCurrentScript();
    
    if (!currentScript) {
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
          script: currentScript,
          framework: selectedFramework  // Send the full framework name
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save script');
      }
      
      const data = await response.json();
      setBackendLogs(prev => [...prev, `Successfully saved script: ${data.filename}`]);
      
      // Refresh saved scripts list
      const scriptsResponse = await fetch('http://localhost:8000/api/video/saved-automation-scripts');
      if (scriptsResponse.ok) {
        const scriptsData = await scriptsResponse.json();
        setSavedScripts(scriptsData.files);
      }
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setSaving(false);
    }
  };

  // Fetch saved scripts on component mount
  useEffect(() => {
    const fetchSavedScripts = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/video/saved-automation-scripts');
        if (response.ok) {
          const data = await response.json();
          setSavedScripts(data.files);
        }
      } catch (err) {
        console.error('Error fetching saved scripts:', err);
        setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
      }
    };
    
    fetchSavedScripts();
  }, []);

  const handleImproveScript = async (scriptType, input, currentScript) => {
    if (!isGptConnected) {
      setError('Please connect to AI first');
      return;
    }
    
    if (!input.trim()) {
      setError('Please enter an improvement prompt');
      return;
    }
    
    // Get the appropriate state setters based on framework
    const setImproving = {
      'Selenium': setIsImprovingSelenium,
      'SAHI Pro': setIsImprovingSahi,
      'Cucumber': setIsImprovingCucumber
    }[selectedFramework];
    
    const setPrevious = {
      'Selenium': setPreviousSeleniumScript,
      'SAHI Pro': setPreviousSahiScript,
      'Cucumber': setPreviousCucumberScript
    }[selectedFramework];
    
    const setScript = {
      'Selenium': setSeleniumScript,
      'SAHI Pro': setSahiScript,
      'Cucumber': setCucumberScript
    }[selectedFramework];
    
    setImproving(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/video/improve-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          script: currentScript,
          improvement_prompt: input,
          framework: selectedFramework,
          api_key: gptApiKey
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to improve script');
      }
      
      const data = await response.json();
      setPrevious(currentScript);
      setScript(data.improved_script);
      setBackendLogs(prev => [...prev, 'Successfully improved script']);
      setTerminalInput(''); // Clear terminal input after successful improvement
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setImproving(false);
    }
  };

  const handleRevertScript = (scriptType) => {
    const setPrevious = {
      'Selenium': setPreviousSeleniumScript,
      'SAHI Pro': setPreviousSahiScript,
      'Cucumber': setPreviousCucumberScript
    }[scriptType];
    
    const setScript = {
      'Selenium': setSeleniumScript,
      'SAHI Pro': setSahiScript,
      'Cucumber': setCucumberScript
    }[scriptType];
    
    const previousScript = {
      'Selenium': previousSeleniumScript,
      'SAHI Pro': previousSahiScript,
      'Cucumber': previousCucumberScript
    }[scriptType];
    
    if (previousScript) {
      setScript(previousScript);
      setPrevious('');
      setBackendLogs(prev => [...prev, 'Reverted to previous version']);
    }
  };

  const handleDownloadScript = async (filename) => {
    try {
      const response = await fetch(`http://localhost:8000/api/video/download-automation-script/${filename}`);
      if (!response.ok) {
        throw new Error('Failed to download script');
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
      
      setBackendLogs(prev => [...prev, `Successfully downloaded script: ${filename}`]);
    } catch (err) {
      setError('Failed to download script');
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    }
  };

  // Add new CSS class for the summarize button
  const summarizeButtonStyle = {
    backgroundColor: '#FF6B6B',  // Coral red color
    color: 'white',
    border: 'none',
    padding: '8px 16px',
    borderRadius: '20px',  // More rounded corners
    cursor: 'pointer',
    fontWeight: '500',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginLeft: '10px',
    transition: 'all 0.3s ease'
  };

  // Add style for validate button
  const validateButtonStyle = {
    backgroundColor: '#4CAF50',  // Green color
    color: 'white',
    border: '2px solid #45a049',
    padding: '8px 16px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    marginLeft: '10px',
    transition: 'all 0.3s ease',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    textTransform: 'uppercase',
    fontSize: '0.9em',
    letterSpacing: '0.5px'
  };

  // Tooltip styles
  const tooltipStyle = {
    position: 'relative',
    display: 'inline-block'
  };
  
  const tooltipTextStyle = {
    visibility: 'hidden',
    width: '300px',
    backgroundColor: '#333',
    color: '#fff',
    textAlign: 'left',
    borderRadius: '6px',
    padding: '12px 16px',
    position: 'absolute',
    zIndex: 1,
    bottom: '150%',
    left: '50%',
    transform: 'translateX(-50%)',
    opacity: 0,
    transition: 'opacity 0.3s',
    fontSize: '14px',
    lineHeight: '1.6',
    whiteSpace: 'normal',
    wordWrap: 'break-word'
  };

  // Terminal improve button tooltip style
  const improveButtonTooltipStyle = {
    ...tooltipTextStyle,
    width: '350px',
    left: 'calc(100% + 10px)',  // Position to the right of the button
    bottom: '50%',              // Align vertically with button
    transform: 'translateY(50%)',// Center vertically
    zIndex: 1000,
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    textAlign: 'left'
  };

  // Arrow style for improve button tooltip
  const improveButtonArrowStyle = {
    content: '""',
    position: 'absolute',
    top: '50%',
    right: '100%',
    marginTop: '-8px',
    borderWidth: '8px',
    borderStyle: 'solid',
    borderColor: 'transparent #333 transparent transparent'
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
              className="framework-dropdown"
              value={selectedFramework}
              onChange={handleFrameworkChange}
            >
              <option value="Selenium">Selenium</option>
              <option value="SAHI Pro">SAHI Pro</option>
              <option value="Cucumber">Cucumber</option>
            </select>
          </div>

          <div className="user-story-input">
            <textarea
              className="us-textarea"
              placeholder="Enter test case here..."
              value={testCase}
              onChange={(e) => setTestCase(e.target.value)}
            />
            <button
              className="generate-btn"
              onClick={handleGenerateScript}
              disabled={generating || !isGptConnected}
            >
              {generating ? 'Generating...' : 'Generate Script'}
            </button>
          </div>

          <div className="script-outputs">
            <div className="script-section">
              <h3>
                {selectedFramework === 'SAHI Pro' ? 'SAHI Script Output' :
                 selectedFramework === 'Cucumber' ? 'Cucumber Output' :
                 'Selenium Test Script'}
              </h3>
              <pre className="script-output">
                {selectedFramework === 'SAHI Pro' ? (sahiScript || 'Generated SAHI script will appear here') :
                 selectedFramework === 'Cucumber' ? (cucumberScript || 'Generated Cucumber script will appear here') :
                 (getCurrentScript() || 'Generated Selenium script will appear here')}
              </pre>
              <div className="button-group">
                <button 
                  className="save-script-btn" 
                  onClick={handleSaveScript}
                  disabled={saving || !getCurrentScript()}
                >
                  {saving ? 'Saving...' : 'Save Script'}
                </button>
                <button 
                  style={summarizeButtonStyle}
                  onMouseOver={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                  }}
                >
                  Summarize
                </button>
                <button 
                  style={validateButtonStyle}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#45a049';
                    e.target.style.boxShadow = '0 4px 8px rgba(76, 175, 80, 0.3)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#4CAF50';
                    e.target.style.boxShadow = '0 2px 5px rgba(0,0,0,0.1)';
                  }}
                >
                  Validate TC with Summary
                </button>
              </div>
            </div>

            <div className="terminal-section">
              <div className="terminal-header">
                <span>Terminal</span>
                <div className="terminal-buttons">
                  <div style={tooltipStyle}>
                    <button
                      onClick={() => handleImproveScript(
                        selectedFramework,
                        terminalInput,
                        selectedFramework === 'SAHI Pro' ? sahiScript :
                        selectedFramework === 'Cucumber' ? cucumberScript :
                        seleniumScript
                      )}
                      disabled={
                        selectedFramework === 'SAHI Pro' ? isImprovingSahi || !sahiScript :
                        selectedFramework === 'Cucumber' ? isImprovingCucumber || !cucumberScript :
                        isImprovingSelenium || !seleniumScript
                      }
                      onMouseEnter={(e) => {
                        e.currentTarget.nextElementSibling.style.visibility = 'visible';
                        e.currentTarget.nextElementSibling.style.opacity = '1';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.nextElementSibling.style.visibility = 'hidden';
                        e.currentTarget.nextElementSibling.style.opacity = '0';
                      }}
                    >
                      {(selectedFramework === 'SAHI Pro' && isImprovingSahi) ||
                       (selectedFramework === 'Cucumber' && isImprovingCucumber) ||
                       (selectedFramework === 'Selenium' && isImprovingSelenium)
                        ? 'Improving...' : 'Improve'}
                    </button>
                    <div style={improveButtonTooltipStyle}>
                      Enter Prompts to iterate the results which are present in the Generated Test Cases output widget above
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevertScript(
                      selectedFramework
                    )}
                    disabled={
                      selectedFramework === 'SAHI Pro' ? !previousSahiScript :
                      selectedFramework === 'Cucumber' ? !previousCucumberScript :
                      !previousSeleniumScript
                    }
                  >
                    Revert
                  </button>
                </div>
              </div>
              <textarea
                className="terminal-input"
                value={terminalInput}
                onChange={(e) => setTerminalInput(e.target.value)}
                placeholder="Enter improvement prompt here..."
              />
            </div>
          </div>

          <div className="saved-scripts-section">
            <h3>Saved Scripts</h3>
            <div className="saved-scripts-list">
              {savedScripts.length > 0 ? (
                <table className="saved-scripts-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {savedScripts.map((script, index) => (
                      <tr key={index} className="saved-script-row">
                        <td>
                          <button
                            className="script-link"
                            onClick={() => handleDownloadScript(script.name)}
                          >
                            {script.name}
                          </button>
                        </td>
                        <td className="script-date">{script.created}</td>
                        <td>
                          <button
                            className="download-btn"
                            onClick={() => handleDownloadScript(script.name)}
                          >
                            Download
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="no-scripts">No saved scripts</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function TestCaseValidator() {
  const [jiraApiKey, setJiraApiKey] = useState(() => localStorage.getItem('validatorJiraApiKey') || '');
  const [gptApiKey, setGptApiKey] = useState('');
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [isGptConnected, setIsGptConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [backendLogs, setBackendLogs] = useState([]);
  const [testCase, setTestCase] = useState('');
  const [checklist, setChecklist] = useState({
    scenarios: { present: false, count: 0 },
    browserConfig: { present: false, count: 0 },
    notes: { present: false },
    regressionScenarios: { present: false }
  });
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [generating, setGenerating] = useState(false);
  const [jiraLink, setJiraLink] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [hoveredStats, setHoveredStats] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  // Add tooltip styles
  const tooltipStyle = {
    position: 'relative',
    display: 'inline-block'
  };
  
  const tooltipTextStyle = {
    visibility: 'hidden',
    width: '300px',
    backgroundColor: '#333',
    color: '#fff',
    textAlign: 'left',
    borderRadius: '6px',
    padding: '12px 16px',
    position: 'absolute',
    zIndex: 1,
    bottom: '150%',
    left: '50%',
    transform: 'translateX(-50%)',
    opacity: 0,
    transition: 'opacity 0.3s',
    fontSize: '14px',
    lineHeight: '1.6',
    whiteSpace: 'normal',
    wordWrap: 'break-word'
  };

  const handleJiraConnect = async () => {
    if (!jiraApiKey) {
      setError('Please enter JIRA API Key');
      setBackendLogs(prev => [...prev, 'Error: JIRA API Key is required']);
      return;
    }
    
    setConnecting(true);
    setError(null);
    
    try {
      setBackendLogs(prev => [...prev, 'Attempting to connect to JIRA...']);
      console.log('Attempting JIRA connection...'); // Add logging
      const response = await fetch('http://localhost:8000/api/video/verify-jira', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: jiraApiKey })
      });
      
      console.log('JIRA response status:', response.status); // Add logging
      if (!response.ok) {
        throw new Error('Failed to verify JIRA connection');
      }
      
      const data = await response.json();
      
      if (data.valid) {
        setIsJiraConnected(true);
        localStorage.setItem('validatorJiraApiKey', jiraApiKey);
        setError(null);
        setBackendLogs(prev => [...prev, 'Successfully connected to JIRA']);
      } else {
        throw new Error('Failed to connect to JIRA');
      }
    } catch (err) {
      setError(err.message);
      setIsJiraConnected(false);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setConnecting(false);
    }
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
        },
        body: JSON.stringify({ api_key: gptApiKey })
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify ChatGPT connection');
      }
      
      const data = await response.json();
      
      if (data.valid) {
        setIsGptConnected(true);
        localStorage.setItem('validatorGptApiKey', gptApiKey);
        setError(null);
        setBackendLogs(prev => [...prev, 'Successfully connected to ChatGPT']);
      } else {
        throw new Error('Invalid API key');
      }
    } catch (err) {
      setError(err.message);
      setIsGptConnected(false);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setConnecting(false);
    }
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
    
    setChecklist(sections);
  };

  const handleTestCaseChange = (e) => {
    const newValue = e.target.value;
    setTestCase(newValue);
    if (newValue.trim()) {
      scanTestCase(newValue);
    } else {
      // Reset checklist if input is empty
      setChecklist({
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
    
    if (!testCase.trim()) {
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
          test_case: testCase,
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
    if (!testCase || testCase === 'Enter Test Case') {
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
          test_case: testCase
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

  const handleJiraTestCaseValidation = async () => {
    if (!isJiraConnected || !isGptConnected) {
      setError('Please connect to both JIRA and AI first');
      setBackendLogs(prev => [...prev, 'Error: Both JIRA and AI connections required']);
      return;
    }
    
    if (!jiraLink) {
      setError('Please enter a JIRA link');
      return;
    }
    
    setIsValidating(true);
    setError(null);
    
    try {
      // First fetch the test case from JIRA
      const jiraResponse = await fetch('http://localhost:8000/api/video/fetch-jira-test-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jira_link: jiraLink,
          api_key: jiraApiKey
        })
      });
      
      if (!jiraResponse.ok) {
        throw new Error('Failed to fetch test case from JIRA');
      }
      
      const jiraData = await jiraResponse.json();
      const testCaseContent = jiraData.test_case;
      
      setBackendLogs(prev => [...prev, 'Successfully fetched test case from JIRA']);
      
      // Update test case input and trigger validation
      setTestCase(testCaseContent);
      scanTestCase(testCaseContent);
      
      // Generate AI analysis
      const analysisResponse = await fetch('http://localhost:8000/api/video/analyze-test-case', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test_case: testCaseContent,
          api_key: gptApiKey
        })
      });
      
      if (!analysisResponse.ok) {
        throw new Error('Failed to analyze test case');
      }
      
      const analysisData = await analysisResponse.json();
      setAiAnalysis(analysisData.analysis);
      setBackendLogs(prev => [...prev, 'Successfully generated AI analysis']);
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setIsValidating(false);
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
                  value={jiraApiKey}
                  onChange={(e) => setJiraApiKey(e.target.value)}
                />
                <button 
                  className="connect-btn"
                  onClick={handleJiraConnect}
                  disabled={connecting}
                >
                  {connecting ? 'Connecting...' : 'Link to JIRA'}
                </button>
                <span className={`status-indicator ${isJiraConnected ? 'on' : 'off'}`}>
                  {isJiraConnected ? 'ON' : 'OFF'}
                </span>
              </div>
              
              <div className="api-input-group">
                <input
                  type="password"
                  placeholder="Enter ChatGPT API Key"
                  className="api-key-input"
                  value={gptApiKey}
                  onChange={(e) => setGptApiKey(e.target.value)}
                />
                <button 
                  className={`connect-btn ${isGptConnected ? 'connected' : ''}`}
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
                  value={jiraLink}
                  onChange={(e) => setJiraLink(e.target.value)}
                  className="jira-link-input"
                />
                <div style={tooltipStyle}>
                  <button
                    className="generate-btn"
                    onClick={handleJiraTestCaseValidation}
                    disabled={isValidating || !isJiraConnected || !isGptConnected}
                    onMouseEnter={(e) => {
                      e.currentTarget.nextElementSibling.style.visibility = 'visible';
                      e.currentTarget.nextElementSibling.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.nextElementSibling.style.visibility = 'hidden';
                      e.currentTarget.nextElementSibling.style.opacity = '0';
                    }}
                  >
                    {isValidating ? 'Validating...' : 'Generate Report from JIRA Link'}
                  </button>
                  <div style={tooltipTextStyle}>
                    Enter the JIRA User Story# (already existing in JIRA) for which you want to generate test case using AI
                  </div>
                </div>
              </div>
              
              <div className="test-case-section">
                <textarea
                  placeholder="Enter Test Case"
                  className="test-case-input"
                  value={testCase}
                  onChange={handleTestCaseChange}
                  rows={4}
                />
                
                <div className="validation-results">
                  <div className="report-widgets">
                    <div className="report-widget">
                      <h3>Checklist Report</h3>
                      <div className="report-content">
                        <div className="checklist">
                          <div className="checklist-item">
                            <span className={`checkmark ${checklist.scenarios.present ? 'present' : 'missing'}`}>
                              {checklist.scenarios.present ? '✓' : '✗'}
                            </span>
                            <span className="section-name">Scenarios</span>
                            {checklist.scenarios.count > 0 && (
                              <span className="count">({checklist.scenarios.count})</span>
                            )}
                          </div>
                          
                          <div className="checklist-item">
                            <span className={`checkmark ${checklist.browserConfig.present ? 'present' : 'missing'}`}>
                              {checklist.browserConfig.present ? '✓' : '✗'}
                            </span>
                            <span className="section-name">Browser Configuration</span>
                            {checklist.browserConfig.count > 0 && (
                              <span className="count">({checklist.browserConfig.count})</span>
                            )}
                          </div>
                          
                          <div className="checklist-item">
                            <span className={`checkmark ${checklist.notes.present ? 'present' : 'missing'}`}>
                              {checklist.notes.present ? '✓' : '✗'}
                            </span>
                            <span className="section-name">Notes</span>
                          </div>
                          
                          <div className="checklist-item">
                            <span className={`checkmark ${checklist.regressionScenarios.present ? 'present' : 'missing'}`}>
                              {checklist.regressionScenarios.present ? '✓' : '✗'}
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
                </div>
              </div>
            </div>

            <div className="report-widgets">
              {/* ... existing report widgets ... */}
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
  const [jiraApiKey, setJiraApiKey] = useState(() => localStorage.getItem('massReportsJiraApiKey') || '');
  const [isJiraConnected, setIsJiraConnected] = useState(false);
  const [gptApiKey, setGptApiKey] = useState(() => localStorage.getItem('massReportsGptApiKey') || '');
  const [isGptConnected, setIsGptConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState(null);
  const [backendLogs, setBackendLogs] = useState([]);
  const [epicLink, setEpicLink] = useState('');
  const [epicStats, setEpicStats] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [hoveredStats, setHoveredStats] = useState(null);
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 });

  const handleJiraConnect = async () => {
    if (!jiraApiKey) {
      setError('Please enter JIRA API Key');
      setBackendLogs(prev => [...prev, 'Error: JIRA API Key is required']);
      return;
    }
    
    setConnecting(true);
    setError(null);
    
    try {
      setBackendLogs(prev => [...prev, 'Attempting to connect to JIRA...']);
      const response = await fetch('http://localhost:8000/api/video/verify-jira', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api_key: jiraApiKey })
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify JIRA connection');
      }
      
      const data = await response.json();
      
      if (data.valid) {
        setIsJiraConnected(true);
        localStorage.setItem('massReportsJiraApiKey', jiraApiKey);
        setError(null);
        setBackendLogs(prev => [...prev, 'Successfully connected to JIRA']);
      } else {
        throw new Error('Failed to connect to JIRA');
      }
    } catch (err) {
      setError(err.message);
      setIsJiraConnected(false);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setConnecting(false);
    }
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
        },
        body: JSON.stringify({ api_key: gptApiKey })
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify ChatGPT connection');
      }
      
      const data = await response.json();
      
      if (data.valid) {
        setIsGptConnected(true);
        localStorage.setItem('massReportsGptApiKey', gptApiKey);
        setError(null);
        setBackendLogs(prev => [...prev, 'Successfully connected to ChatGPT']);
      } else {
        throw new Error('Failed to connect to ChatGPT');
      }
    } catch (err) {
      setError(err.message);
      setIsGptConnected(false);
      setBackendLogs(prev => [...prev, `Error: ${err.message}`]);
    } finally {
      setConnecting(false);
    }
  };

  const handleGptClear = () => {
    setGptApiKey('');
    setIsGptConnected(false);
    localStorage.removeItem('massReportsGptApiKey');
  };

  const handleGenerateReport = async () => {
    if (!isJiraConnected || !isGptConnected) {
      setError('Please connect to both JIRA and AI first');
      setBackendLogs(prev => [...prev, 'Error: Both JIRA and AI connections required']);
      return;
    }
    
    if (!epicLink) {
      setError('Please enter an Epic link');
      return;
    }
    
    setGenerating(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8000/api/video/fetch-epic-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          epic_link: epicLink,
          api_key: jiraApiKey
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch epic status');
      }
      
      const data = await response.json();
      setEpicStats(data);
      setBackendLogs(prev => [...prev, 'Successfully generated test case status report']);
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
        <h1>Mass Reports</h1>
        {error && <div className="error">{error}</div>}

        <div className="mass-reports-controls">
          <div className="api-section">
            <div className="api-input-group">
              <input
                type="password"
                placeholder="Enter JIRA API Key"
                value={jiraApiKey}
                onChange={(e) => setJiraApiKey(e.target.value)}
                className="api-key-input"
              />
              <button
                className={`connect-btn ${isJiraConnected ? 'connected' : ''}`}
                onClick={handleJiraConnect}
                disabled={connecting}
              >
                {connecting ? 'Connecting...' : 'Link to JIRA'}
              </button>
              <span className={`status-indicator ${isJiraConnected ? 'on' : 'off'}`}>
                {isJiraConnected ? 'ON' : 'OFF'}
              </span>
            </div>

            <div className="api-input-group">
              <input
                type="password"
                placeholder="AI API Key"
                value={gptApiKey}
                onChange={(e) => setGptApiKey(e.target.value)}
                className="api-key-input"
              />
              <button
                className={`connect-btn ${isGptConnected ? 'connected' : ''}`}
                onClick={handleGptConnect}
                disabled={connecting}
              >
                {connecting ? 'Connecting...' : 'Connect'}
              </button>
              <button
                className="clear-btn"
                onClick={handleGptClear}
                disabled={connecting}
              >
                Clear
              </button>
              <span className={`status-indicator ${isGptConnected ? 'on' : 'off'}`}>
                {isGptConnected ? 'ON' : 'OFF'}
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
              <button 
                className="generate-report-btn"
                onClick={handleGenerateReport}
                disabled={generating || !isJiraConnected || !isGptConnected}
              >
                {generating ? 'Generating...' : 'Generate TC Status Report'}
              </button>
            </div>
          </div>

          <div className="reports-section">
            <div className="report-widget">
              <h3>Test Case Status Report</h3>
              <div className="report-content">
                {epicStats ? (
                  <div className="epic-statistics">
                    <div className="stat-item">
                      <span className="stat-label">Total User Stories:</span>
                      <span 
                        className="stat-value clickable"
                        onMouseEnter={(e) => {
                          setHoveredStats({
                            title: 'All User Stories',
                            items: epicStats?.details?.all_stories || []
                          });
                          setHoverPosition({ 
                            x: e.clientX, 
                            y: e.clientY 
                          });
                        }}
                        onMouseLeave={() => setHoveredStats(null)}
                      >
                        {epicStats.total_stories}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Stories with Code:</span>
                      <span 
                        className="stat-value clickable"
                        onMouseEnter={(e) => {
                          setHoveredStats({
                            title: 'Stories with Code',
                            items: epicStats?.details?.stories_with_code || []
                          });
                          setHoverPosition({ 
                            x: e.clientX, 
                            y: e.clientY 
                          });
                        }}
                        onMouseLeave={() => setHoveredStats(null)}
                      >
                        {epicStats.stories_with_code}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Stories with Test Cases:</span>
                      <span 
                        className="stat-value clickable"
                        onMouseEnter={(e) => {
                          setHoveredStats({
                            title: 'Stories with Test Cases',
                            items: epicStats?.details?.stories_with_tests || []
                          });
                          setHoverPosition({ 
                            x: e.clientX, 
                            y: e.clientY 
                          });
                        }}
                        onMouseLeave={() => setHoveredStats(null)}
                      >
                        {epicStats.stories_with_tests}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="placeholder-text">
                    Report will be displayed here
                  </div>
                )}
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
            <button className="push-jira-btn" onClick={() => setShowPushModal(true)} disabled={!isJiraConnected || !generatedTestCases}>
              Push Test Case to JIRA
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
