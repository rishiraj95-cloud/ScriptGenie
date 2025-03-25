import requests
import json
import re
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ScribeVedAIHelper:
    def __init__(self, api_key):
        self.api_key = api_key
        self.base_url = "http://vedai.technia.cloud:8080/ollama"
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json",
            "Authorization": f"Bearer {self.api_key}"
        }

    def verify_connection(self):
        """Verify connection to VedAI by making a simple GET request"""
        try:
            logger.info(f"Attempting Scribe VedAI connection at {self.base_url}")
            
            response = requests.get(
                self.base_url,
                headers=self.headers,
                timeout=10
            )
            
            logger.info(f"Scribe VedAI Response status code: {response.status_code}")
            logger.debug(f"Scribe VedAI Response body: {response.text}")
            
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    # Check for {"status": true} in response
                    return response_data.get("status", False)
                except json.JSONDecodeError:
                    logger.error("Failed to parse Scribe VedAI response as JSON")
                    return False
            else:
                logger.error(f"Scribe VedAI connection failed with status code: {response.status_code}")
                return False
                
        except requests.exceptions.Timeout:
            logger.error("Scribe VedAI connection timed out")
            return False
        except requests.exceptions.ConnectionError as e:
            logger.error(f"Scribe VedAI connection error: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Error verifying Scribe VedAI connection: {str(e)}")
            return False 