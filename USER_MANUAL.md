# ScriptGenie - Test Case Generation & Automation Tool
## User Manual

### Overview
ScriptGenie is a comprehensive tool designed to help QA engineers generate, validate, and automate test cases using AI assistance. The application consists of multiple modules, each serving a specific purpose.

### Modules

#### 1. Scribe Test Case Generator
This module helps convert Scribe recordings or video files into structured test cases.

**Features:**
- Upload Scribe PDFs or video recordings
- Automatic extraction of test steps
- Frame-by-frame analysis for videos
- Generated test cases in a structured format

**How to Use:**
1. Click "Choose File" to select a PDF or video file
2. Click "Generate Test Cases"
3. View the generated test cases in the output window
4. For videos, view extracted frames in the Screenshots Bundle section

#### 2. Test Case Generation
This module enables AI-powered test case generation from JIRA stories or raw user stories.

**Features:**
- JIRA integration
- ChatGPT integration
- Two methods of test case generation:
  - From JIRA User Story
  - From pasted User Story text

**Setup:**
1. Enter JIRA API Key and click "Connect"
2. Enter ChatGPT API Key and click "Connect"
3. Toggle ChatGPT service ON using the toggle button

**Usage Method 1 - Generate from JIRA:**
1. Enter JIRA User Story link in the first input box
2. Click "Generate Test Case From US"
3. View generated test cases in the output window

**Usage Method 2 - Generate from Text:**
1. Paste User Story text in the second input box
2. Click "Generate Test Case" (purple button)
3. View generated test cases in the output window

**AI Prompt Format:**
When generating test cases, the following structured prompt is sent to ChatGPT:
```
Generate detailed test cases for the following user story. Format each test case exactly as follows:

Browser Configuration: [List any specific browser requirements]
Pre-Required Conditions: [List any prerequisites needed]

Scenario Name: [Descriptive name of the scenario]
Test Steps:
    1. [Detailed step description]
    Received Outcome: [Expected outcome after this step]
    2. [Next step description]
    Received Outcome: [Expected outcome after this step]
    ... [Continue with numbered steps]

Important: After all scenarios, always include these mandatory sections:

Regression Scenarios: 
- Related functionality that might be impacted
- Integration points with other features
- Backward compatibility checks
- Performance implications
- Security considerations
- Edge cases and boundary conditions

Notes:
- Test environment requirements
- Data setup requirements
- Special considerations
- Known limitations
- Dependencies
- Risk areas

Important formatting rules:
1. Each step must be numbered
2. Each step must have a "Received Outcome" immediately after it
3. Outcomes should be detailed and specific
4. Include both positive and negative test scenarios
5. Include verification steps for UI elements, error messages, and state changes
6. Browser Configuration and Pre-Required Conditions are mandatory
7. Regression Scenarios and Notes sections are mandatory
8. Provide detailed regression scenarios based on the feature's context

Here is the user story to generate test cases for:
[User Story Content]
```

The AI will respond with test cases following this format, ensuring:
- Browser Configuration section
- Pre-Required Conditions section
- Multiple scenarios with step-by-step instructions
- Received Outcomes after each step
- Comprehensive Regression Scenarios section
- Detailed Notes section

**Additional Features:**
- Save generated test cases using "Save Test Case" button
- Push test cases to JIRA using "Push Test Case to JIRA" button
- Use terminal to iterate and improve test cases with AI prompts

#### 3. Test Case Validator
This module helps validate and analyze existing test cases.

**Features:**
- Test case structure validation
- AI-powered analysis
- Checklist verification
- Detailed recommendations

**How to Use:**
1. Connect to JIRA and ChatGPT
2. Enter JIRA test case link
3. Click "Generate Report from JIRA Link"
4. View validation results including:
   - Checklist Report
   - AI Analysis with:
     - Key Findings
     - Recommendations
     - Detailed Analysis

### Common Features Across Modules
- Backend Logs panel showing real-time operation status
- Error handling and user feedback
- Connection status indicators for JIRA and ChatGPT
- Tooltips providing usage guidance

### Best Practices
1. Always ensure both JIRA and ChatGPT connections are active before operations
2. Save important test cases before generating new ones
3. Use the terminal for iterative improvements
4. Check Backend Logs for detailed operation status
5. Clear API keys when switching users

### Troubleshooting
- If connections fail, verify API keys
- For generation errors, check Backend Logs
- If test cases don't appear, ensure all required fields are filled
- For JIRA integration issues, verify link format

### Note
This is a continuously evolving tool. New features and improvements are being added regularly. 