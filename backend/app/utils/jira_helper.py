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
            
            jql = f'issueType = "User Story" AND "Epic Link" = "{epic_key}"'
            stories = jira.search_issues(jql, maxResults=100)
            
            # Lists to store detailed information
            all_stories = []
            stories_with_code_details = []
            stories_with_tests_details = []
            
            stories_with_code = 0
            stories_with_tests = 0
            
            for story in stories:
                # Store basic story info
                story_info = {
                    'key': story.key,
                    'summary': story.fields.summary,
                    'status': story.fields.status.name
                }
                all_stories.append(story_info)
                
                # Check for code (development status)
                if story.fields.status.name in ['In Development', 'Done', 'In Progress', 'Resolved']:
                    stories_with_code += 1
                    stories_with_code_details.append(story_info)
                
                # Check for test cases (subtasks)
                subtasks = story.fields.subtasks
                has_test_case = any(
                    subtask.fields.issuetype.name == 'Test Case' 
                    for subtask in subtasks
                )
                if has_test_case:
                    stories_with_tests += 1
                    stories_with_tests_details.append(story_info)
            
            return {
                "total_stories": len(stories),
                "stories_with_code": stories_with_code,
                "stories_with_tests": stories_with_tests,
                "details": {
                    "all_stories": all_stories,
                    "stories_with_code": stories_with_code_details,
                    "stories_with_tests": stories_with_tests_details
                }
            }
        except Exception as e:
            print(f"Error getting epic statistics: {str(e)}")
            print(f"JQL Query used: {jql}")
            print(f"Full error details: {str(e.__dict__)}")  # More detailed error info
            raise e 

    def get_test_case(self, issue_key: str) -> str:
        """Fetch and format a test case from JIRA"""
        try:
            jira = JIRA(
                basic_auth=(self.email, self.api_key),
                server=self.server
            )
            
            issue = jira.issue(issue_key)
            
            # Get the description field which contains the test case
            test_case = issue.fields.description
            
            if not test_case:
                raise Exception("Test case description is empty")
            
            # Format the test case
            formatted_test_case = self.format_test_case(test_case)
            
            return formatted_test_case
        except Exception as e:
            print(f"Error fetching test case from JIRA: {str(e)}")
            raise e

    def format_test_case(self, raw_test_case: str) -> str:
        """Format the raw JIRA test case text"""
        # Remove JIRA markup and format consistently
        formatted = raw_test_case.strip()
        
        # Add more formatting as needed
        return formatted 

    def get_story_details(self, issue_key: str) -> dict:
        """Get user story details including project and title"""
        try:
            jira = JIRA(
                basic_auth=(self.email, self.api_key),
                server=self.server
            )
            
            issue = jira.issue(issue_key)
            
            return {
                "key": issue.key,
                "projectKey": issue.fields.project.key,
                "title": issue.fields.summary,
                "description": issue.fields.description
            }
        except Exception as e:
            print(f"Error getting story details: {str(e)}")
            raise e

    def create_test_case(self, project_key: str, summary: str, description: str, parent_key: str) -> any:
        """Create a test case as a subtask of a user story"""
        try:
            jira = JIRA(
                basic_auth=(self.email, self.api_key),
                server=self.server
            )
            
            # Create test case issue
            test_case = jira.create_issue(
                project=project_key,
                summary=summary,
                description=description,
                issuetype={'name': 'Test Case'},
                parent={'key': parent_key}
            )
            
            return test_case
        except Exception as e:
            print(f"Error creating test case: {str(e)}")
            raise e 