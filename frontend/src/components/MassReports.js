import React, { useState } from 'react';
import BackfillStatus from './BackfillStatus';

const MassReports = () => {
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
  const [backfillStatus, setBackfillStatus] = useState([]);
  
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
      const response = await fetch('http://localhost:8000/api/video/verify-mass-reports-jira', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
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

  const handleBackfill = async () => {
    if (!epicLink) {
      setError('Enter an Epic Link');
      return;
    }
    if (!epicStats) {
      setError('Cannot generate report as Generate TC Status Report has not been run');
      return;
    }
    if (!isJiraConnected || !isGptConnected) {
      setError('Please connect to both JIRA and AI first');
      return;
    }

    setBackfillStatus([]);
    
    try {
      // Get stories needing test cases
      const response = await fetch('http://localhost:8000/api/video/get-stories-needing-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epic_link: epicLink, api_key: jiraApiKey })
      });
      
      const { stories } = await response.json();
      
      // Process each story sequentially
      for (let i = 0; i < stories.length; i++) {
        setBackfillStatus(prev => [...prev, 
          `Processing ${i + 1}/${stories.length}: ${stories[i].key}`
        ]);
        
        // Small delay between stories
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        try {
          const response = await fetch('http://localhost:8000/api/video/backfill-test-case', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              story: stories[i],
              api_key: gptApiKey
            })
          });
          
          if (!response.ok) throw new Error('Failed to generate test case');
          
          setBackfillStatus(prev => [...prev, 
            `${stories[i].key}: Generated Successfully`
          ]);
        } catch (err) {
          setBackfillStatus(prev => [...prev, 
            `${stories[i].key}: Failed - ${err.message}`
          ]);
          // Continue with next story
        }
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDownloadAll = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/video/download-backfill-test-cases');
      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Failed to download test cases');
      }
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'backfill_test_cases.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError(err.message);
      setBackendLogs(prev => [...prev, `Error downloading test cases: ${err.message}`]);
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
              <button 
                className="backfill-btn"
                onClick={handleBackfill}
                disabled={!isJiraConnected || !isGptConnected || !epicStats}
              >
                Backfill Test Cases
              </button>
              <BackfillStatus 
                status={backfillStatus}
                onDownloadAll={handleDownloadAll}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MassReports; 