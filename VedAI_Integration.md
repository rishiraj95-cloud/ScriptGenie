# VedAI Integration Guide

## Overview
This document outlines the steps to integrate VedAI with ScriptGenie, allowing the application to work with both ChatGPT and VedAI services.

## Prerequisites
1. VedAI API Key
2. VedAI API Endpoint: http://personai.technia.cloud:8080
3. Access to VedAI API documentation: http://personai.technia.cloud:8080/docs

## Integration Steps

### 1. Backend Changes

#### 1.1 Environment Variables
Add new environment variables in `.env`:
```
VEDAI_API_KEY=your_api_key_here
VEDAI_API_ENDPOINT=http://personai.technia.cloud:8080
```

#### 1.2 API Integration
Create new endpoints in the FastAPI backend:

1. Create `vedai_service.py`:
   - Implement connection validation
   - Handle API calls to VedAI
   - Support both `/api/generate` and `/api/chat` endpoints

2. Add new routes in `main.py`:
   - `/api/vedai/validate` - Test connection
   - `/api/vedai/generate` - One-time responses
   - `/api/vedai/chat` - Multi-turn conversations

### 2. Frontend Changes

#### 2.1 State Management
Add new state variables:
```javascript
const [vedaiApiKey, setVedaiApiKey] = useState('');
const [isVedaiConnected, setIsVedaiConnected] = useState(false);
```

#### 2.2 API Service
Create `vedaiService.js`:
```javascript
export const validateVedaiConnection = async (apiKey) => {
  // Implementation
};

export const generateVedaiResponse = async (prompt, apiKey) => {
  // Implementation
};

export const chatWithVedai = async (messages, apiKey) => {
  // Implementation
};
```

#### 2.3 UI Components
Add to each relevant tab:
- API key input field
- Connect button
- Connection status indicator
- AI provider selector (ChatGPT/VedAI)

### 3. Integration Points

#### 3.1 Test Case Generation
- Modify test case generation to support both AIs
- Add AI selection option
- Update API calls to use selected provider

#### 3.2 Scribe Test Case Generator
- Add VedAI processing option
- Maintain separate processing paths for each AI
- Update PDF processing to work with both

#### 3.3 AI Enabled Automation
- Support script generation with both AIs
- Add provider selection for improvements
- Update validation logic

#### 3.4 Test Case Validator
- Enable validation through both AIs
- Support switching between providers
- Maintain separate validation paths

#### 3.5 Mass Reports
- Add VedAI support for report generation
- Enable AI selection for backfilling
- Update batch processing

## Implementation Guidelines

### Error Handling
- Implement robust error handling for API failures
- Add retry mechanisms for timeouts
- Provide clear error messages to users

### Security
- Store API keys securely
- Clear keys on logout
- Implement encryption for key storage

### Performance
- Cache responses when appropriate
- Implement request queuing
- Add loading indicators

### Testing
1. Unit tests for new services
2. Integration tests for API endpoints
3. UI component tests
4. End-to-end testing

## Deployment Considerations
1. Update environment variables
2. Add new API endpoints to documentation
3. Update deployment scripts
4. Add monitoring for new endpoints

## Future Enhancements
1. AI provider comparison features
2. Performance metrics tracking
3. Response quality analysis
4. Automated provider selection based on task type 