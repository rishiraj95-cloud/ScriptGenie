# ScriptGenie Deployment Options

## Overview
This document outlines various hosting options for ScriptGenie's production deployment. These options will be evaluated after completing core functionality development.

## Available Platforms

### 1. Railway
- **Capability**: Frontend & Backend hosting
- **Free Tier**: 
  - 5GB storage
  - $5 credit/month (~500 hours)
- **Benefits**: 
  - Easy setup
  - GitHub integration
  - Container support
- **Setup**: Deploy directly from GitHub repo, auto-detects Python/Node
- **URL**: https://railway.app

### 2. Render
- **Components**: 
  - Frontend: Static site hosting
  - Backend: Web Service
- **Free Tier**: 
  - Web services sleep after 15 minutes of inactivity
  - Wake on request
- **Benefits**: 
  - Zero-config deployments
  - Good for both static sites and Python apps
- **Setup**: Connect GitHub, select appropriate service types
- **URL**: https://render.com

### 3. Fly.io
- **Capability**: Frontend & Backend as containers
- **Free Tier**: 
  - 3 shared VMs
  - 3GB persistent volume
- **Benefits**: 
  - Global deployment
  - Good scaling
  - Strong performance
- **Setup**: Requires Dockerfile configuration
- **URL**: https://fly.io

### 4. Oracle Cloud Free Tier
- **Offering**: 2 AMD VMs with 1GB RAM each (forever free)
- **Benefits**: 
  - True VMs
  - Not time-limited
  - Full control
- **Setup**: Requires manual server configuration
- **Best for**: Users comfortable with server management
- **URL**: https://www.oracle.com/cloud/free/

### 5. DigitalOcean App Platform
- **Pricing**: Starts at $5/month
- **Benefits**: 
  - Easy deployments
  - Excellent documentation
  - Reliable platform
- **Setup**: GitHub integration with automatic deployments
- **URL**: https://www.digitalocean.com/products/app-platform/

## Recommended Options
1. **Railway**: Best for simple setup, consider monthly credit limit
2. **Render**: Good free tier with sleep/wake cycle
3. **Oracle Cloud**: Best for long-term free hosting with manual configuration

## Pre-Deployment Requirements
Before deploying to any platform, ScriptGenie needs:
1. Environment variables for API endpoints
2. CORS configuration for cross-domain requests
3. Database/file storage setup
4. Production environment configuration
5. Security hardening

## Next Steps
1. Complete core functionality development
2. Add remaining features
3. Conduct thorough testing
4. Review deployment options based on final requirements
5. Implement necessary pre-deployment changes
6. Select and proceed with deployment platform

*Note: This document will be updated as the project evolves and requirements change.* 