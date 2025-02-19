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

    def get_issue_description(self, issue_key: str) -> str:
        try:
            jira = JIRA(
                basic_auth=(self.email, self.api_key),
                server=self.server
            )
            
            issue = jira.issue(issue_key)
            return issue.fields.description
        except Exception as e:
            print(f"Error fetching JIRA issue: {str(e)}")
            raise e 

    def get_epic_statistics(self, epic_key: str) -> dict:
        try:
            jira = JIRA(
                basic_auth=(self.email, self.api_key),
                server=self.server
            )
            
            # First verify the epic exists
            try:
                epic = jira.issue(epic_key)
                print(f"Found epic: {epic.fields.summary}")
            except Exception as e:
                print(f"Error finding epic: {str(e)}")
                raise
            
            # Get all stories in epic
            jql = f'issueType = "User Story" AND "Epic Link" = "{epic_key}"'
            print(f"Executing JQL: {jql}")  # Debug log
            
            stories = jira.search_issues(jql, maxResults=100)  # Increase max results
            
            # Debug information
            print(f"Raw stories response: {stories}")
            print(f"Total stories found: {len(stories)}")
            
            stories_with_code = 0
            stories_with_tests = 0
            
            for story in stories:
                print(f"Processing story: {story.key} - Status: {story.fields.status.name}")
                # Check for code (development status)
                if story.fields.status.name in ['In Development', 'Done', 'In Progress', 'Resolved']:
                    stories_with_code += 1
                
                # Check for test cases (subtasks)
                subtasks = story.fields.subtasks
                print(f"Story {story.key} has {len(subtasks)} subtasks")
                has_test_case = any(
                    subtask.fields.issuetype.name == 'Test Case' 
                    for subtask in subtasks
                )
                if has_test_case:
                    stories_with_tests += 1
            
            print(f"Found {len(stories)} stories in epic {epic_key}")
            print(f"Stories with code: {stories_with_code}")
            print(f"Stories with tests: {stories_with_tests}")
            
            return {
                "total_stories": len(stories),
                "stories_with_code": stories_with_code,
                "stories_with_tests": stories_with_tests
            }
        except Exception as e:
            print(f"Error getting epic statistics: {str(e)}")
            print(f"JQL Query used: {jql}")
            print(f"Full error details: {str(e.__dict__)}")  # More detailed error info
            raise e 