import requests
import json
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class VedAIHelper:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "http://vedai.technia.cloud:8080/ollama"
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_key}"  # Changed from X-API-KEY to Bearer token
        }

    def verify_connection(self):
        """Verify connection to VedAI by making a simple GET request"""
        try:
            logger.info(f"Attempting to connect to VedAI at {self.base_url}")
            
            response = requests.get(
                self.base_url,
                headers=self.headers,
                timeout=10
            )
            
            logger.info(f"Response status code: {response.status_code}")
            logger.debug(f"Response body: {response.text}")
            
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    # Check for {"status": true} in response
                    return response_data.get("status", False)
                except json.JSONDecodeError:
                    logger.error("Failed to parse response as JSON")
                    return False
            else:
                logger.error(f"VedAI connection failed with status code: {response.status_code}")
                return False
                
        except requests.exceptions.Timeout:
            logger.error("Connection to VedAI timed out")
            return False
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Connection error: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error verifying VedAI connection: {str(e)}")
            return False

    def format_request_payload(self, test_case: str, framework: str) -> dict:
        """Format the request payload for VedAI"""
        prompt = f"""Convert the following test case into an automation script using {framework}.
Follow these guidelines:
1. Use proper {framework} syntax and commands
2. Include necessary browser initialization
3. Add appropriate assertions and verifications
4. Handle any required waits or synchronization
5. Include error handling where appropriate
6. Add comments to explain complex logic

Test Case:
{test_case}

Generate only the {framework} script without any additional explanations."""

        return {
            "model": "llama3.1:8b",
            "stream": False,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

    def extract_script_from_response(self, response_data: dict, framework: str) -> str:
        """Extract and format script from VedAI response"""
        try:
            if not response_data.get("message", {}).get("content"):
                raise ValueError("Empty content in response")
                
            content = response_data["message"]["content"]
            logger.debug(f"Raw content from response: {content[:200]}...")  # Log first 200 chars
            
            # Extract code between triple backticks
            pattern = r"```(?:python|java|gherkin)?\n(.*?)```"
            match = re.search(pattern, content, re.DOTALL)
            
            if not match:
                # Handle incomplete code blocks
                if "```" in content:
                    logger.warning("Incomplete code block detected, attempting to extract content")
                    return content.split("```", 1)[1].strip()
                logger.warning("No code block markers found, returning raw content")
                return content.strip()
                
            script = match.group(1).strip()
            logger.info(f"Successfully extracted {framework} script")
            logger.debug(f"Extracted script preview: {script[:200]}...")  # Log first 200 chars
            return script
            
        except Exception as e:
            logger.error(f"Error extracting script: {str(e)}")
            raise ValueError(f"Error extracting script: {str(e)}")

    def generate_script(self, test_case: str, framework: str) -> str:
        """Generate automation script using VedAI"""
        try:
            logger.info(f"Generating {framework} script with VedAI")
            logger.debug(f"Test case preview: {test_case[:200]}...")  # Log first 200 chars
            
            # Format request payload
            payload = self.format_request_payload(test_case, framework)
            logger.info("Request payload prepared")
            # Log the complete payload for Postman validation
            logger.info("Complete request payload for Postman:")
            logger.info(json.dumps(payload, indent=2))
            logger.info(f"Request URL: {self.base_url}/api/chat")
            logger.info(f"Request Headers: {json.dumps(self.headers, indent=2)}")
            
            # Make request
            response = requests.post(
                f"{self.base_url}/api/chat",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            logger.info(f"Response status code: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    # Log complete response for validation
                    logger.info("Complete response data:")
                    logger.info(json.dumps(response_data, indent=2))
                    
                    # Extract and format script
                    script = self.extract_script_from_response(response_data, framework)
                    logger.info(f"Successfully generated {framework} script")
                    return script
                except json.JSONDecodeError:
                    logger.error("Failed to parse VedAI response as JSON")
                    raise Exception("Failed to parse VedAI response as JSON")
            else:
                logger.error(f"VedAI request failed with status code: {response.status_code}")
                # Log error response if available
                try:
                    error_data = response.json()
                    logger.error(f"Error response data: {json.dumps(error_data, indent=2)}")
                except:
                    logger.error(f"Raw error response: {response.text}")
                raise Exception(f"VedAI request failed with status code: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error generating script with VedAI: {str(e)}")
            raise

    def format_improve_payload(self, script: str, improvement_prompt: str, framework: str) -> dict:
        """Format the request payload for VedAI script improvement"""
        prompt = f"""You are working with a test case document that contains multiple scenarios.
The current test case content is:

{script}

Your task: {improvement_prompt}

Guidelines:
1. Keep ALL existing scenarios exactly as they are
2. Maintain the exact same formatting style as the existing scenarios
3. If adding a new scenario, use the same structure and style as existing scenarios
4. Include any relevant images or links in the same format as existing scenarios
5. Preserve all existing formatting, including spacing and special characters
6. Return the COMPLETE test case with all existing scenarios plus any additions/changes

Return the complete test case maintaining exact format and style."""

        return {
            "model": "llama3.1:8b",
            "stream": False,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

    def improve_script(self, script: str, improvement_prompt: str, framework: str) -> str:
        """Improve an existing automation script using VedAI"""
        try:
            logger.info(f"Improving {framework} script with VedAI")
            logger.debug(f"Original script preview: {script[:200]}...")  # Log first 200 chars
            logger.debug(f"Improvement prompt: {improvement_prompt}")
            
            # Format request payload
            payload = self.format_improve_payload(script, improvement_prompt, framework)
            logger.info("Request payload prepared")
            logger.info("Complete request payload for Postman:")
            logger.info(json.dumps(payload, indent=2))
            logger.info(f"Request URL: {self.base_url}/api/chat")
            logger.info(f"Request Headers: {json.dumps(self.headers, indent=2)}")
            
            # Make request
            response = requests.post(
                f"{self.base_url}/api/chat",
                headers=self.headers,
                json=payload,
                timeout=30
            )
            
            logger.info(f"Response status code: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    # Log complete response for validation
                    logger.info("Complete response data:")
                    logger.info(json.dumps(response_data, indent=2))
                    
                    # Extract and format script
                    improved_script = self.extract_script_from_response(response_data, framework)
                    logger.info(f"Successfully improved {framework} script")
                    return improved_script
                except json.JSONDecodeError:
                    logger.error("Failed to parse VedAI response as JSON")
                    raise Exception("Failed to parse VedAI response as JSON")
            else:
                logger.error(f"VedAI request failed with status code: {response.status_code}")
                # Log error response if available
                try:
                    error_data = response.json()
                    logger.error(f"Error response data: {json.dumps(error_data, indent=2)}")
                except:
                    logger.error(f"Raw error response: {response.text}")
                raise Exception(f"VedAI request failed with status code: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error improving script with VedAI: {str(e)}")
            raise 