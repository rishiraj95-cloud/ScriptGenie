from jira import JIRA
import os
from dotenv import load_dotenv

load_dotenv()

class JiraHelper:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('JIRA_API_KEY')
        self.email = os.getenv('JIRA_EMAIL')
        self.server = os.getenv('JIRA_SERVER', 'https://technia.jira.com')
        
        if not all([self.api_key, self.email, self.server]):
            raise ValueError("Missing required JIRA configuration. Check your .env file.")
        
    def verify_connection(self) -> bool:
        try:
            print(f"Attempting JIRA connection with server: {self.server}")
            # Initialize JIRA connection
            jira = JIRA(
                basic_auth=(self.email, self.api_key),
                server=self.server
            )
            
            # Test connection by trying to access JIRA information
            jira.myself()
            return True
        except Exception as e:
            error_message = str(e)
            if "401" in error_message:
                print("JIRA Authentication Error: Invalid credentials")
            elif "404" in error_message:
                print("JIRA Server Error: Could not find JIRA server")
            elif "Connection" in error_message:
                print("JIRA Connection Error: Could not connect to server")
            else:
                print(f"JIRA Error: {error_message}")
            return False 