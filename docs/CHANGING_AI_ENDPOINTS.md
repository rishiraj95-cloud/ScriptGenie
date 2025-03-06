# Guide to Changing AI Endpoints

This guide explains how to change the AI model endpoint from ChatGPT to another AI model in the application.

## Step-by-Step Instructions

1. Navigate to the backend configuration:
   - Go to `backend/config/config.py`

2. Locate the AI configuration section:
   - Find the `AI_CONFIG` dictionary or similar configuration settings

3. Update the endpoint URL:
   - Replace the existing ChatGPT endpoint URL with your new AI model's endpoint
   - Ensure the new endpoint follows the same API contract/response format
   - Example:
     ```python
     AI_CONFIG = {
         "endpoint": "your-new-ai-endpoint-url",
         "model": "your-model-name",
         # other configuration settings...
     }
     ```

4. Update Authentication (if required):
   - Modify the authentication method according to your new AI service
   - Update any API keys or tokens in your environment variables
   - Example:
     ```python
     headers = {
         "Authorization": f"Bearer {os.getenv('NEW_AI_API_KEY')}",
         "Content-Type": "application/json"
     }
     ```

5. Test the Integration:
   - Restart the backend server
   - Try generating a test case to verify the new AI endpoint works
   - Check logs for any connection issues

## Important Notes

- Ensure your new AI model can handle similar prompts and generate responses in a compatible format
- The new AI service should be able to process and return responses in a format similar to ChatGPT
- Always test thoroughly in a development environment before deploying to production
- Keep your API keys and sensitive information in environment variables, never in the code

## Troubleshooting

If you encounter issues after changing the endpoint:
1. Verify the endpoint URL is correct and accessible
2. Confirm your authentication credentials are valid
3. Check the backend logs for specific error messages
4. Ensure the new AI service's response format matches the expected structure

For specific AI model integrations, refer to your AI provider's API documentation for exact endpoint URLs and authentication requirements. 