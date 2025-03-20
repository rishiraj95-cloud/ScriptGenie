import requests
import json

class VedAIHelper:
    def __init__(self, api_key):
        self.api_key = api_key  # Keep for future use
        self.base_url = "http://vedai.technia.cloud:8080/ollama"
        self.headers = {
            "Content-Type": "application/json",
            "Accept": "application/json"
        }

    def verify_connection(self):
        """Verify connection to VedAI by making a simple GET request"""
        try:
            print(f"Attempting to connect to VedAI at {self.base_url}")
            
            response = requests.get(
                self.base_url,
                headers=self.headers,
                timeout=10
            )
            
            print(f"Response status code: {response.status_code}")
            print(f"Response body: {response.text}")
            
            if response.status_code == 200:
                try:
                    response_data = response.json()
                    # Check for {"status": true} in response
                    return response_data.get("status", False)
                except json.JSONDecodeError:
                    print("Failed to parse response as JSON")
                    return False
            else:
                print(f"VedAI connection failed with status code: {response.status_code}")
                return False
                
        except requests.exceptions.Timeout:
            print("Connection to VedAI timed out")
            return False
        except requests.exceptions.ConnectionError as e:
            print(f"Connection error: {str(e)}")
            return False
        except Exception as e:
            print(f"Error verifying VedAI connection: {str(e)}")
            return False 