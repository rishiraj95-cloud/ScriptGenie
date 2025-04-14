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
            print(f"[JIRA Connection] Attempting to connect to server: {self.server}")
            print(f"[JIRA Connection] Using email: {self.email[:3]}...{self.email[-10:]}")
            print(f"[JIRA Connection] API key length: {len(self.api_key)} characters")
            
            # Initialize JIRA connection
            jira = JIRA(
                basic_auth=(self.email, self.api_key),
                server=self.server
            )
            
            print("[JIRA Connection] JIRA client initialized, testing connection...")
            
            try:
                # Test connection by trying to access JIRA information
                myself = jira.myself()
                # Handle response which is a dictionary
                display_name = myself.get('displayName') or myself.get('name') or myself.get('emailAddress')
                print(f"[JIRA Connection] Successfully connected as: {display_name}")
                print(f"[JIRA Connection] Full response: {myself}")  # Debug log
                return True
            except Exception as inner_e:
                print(f"[JIRA Connection] Failed to get user info: {str(inner_e)}")
                if hasattr(inner_e, 'response'):
                    print(f"[JIRA Connection] Response status: {inner_e.response.status_code}")
                    print(f"[JIRA Connection] Response headers: {dict(inner_e.response.headers)}")
                    print(f"[JIRA Connection] Response body: {inner_e.response.text}")
                    # Try to parse error response
                    try:
                        error_json = inner_e.response.json()
                        print(f"[JIRA Connection] Error details: {error_json}")
                    except:
                        pass
                raise inner_e
                
        except Exception as e:
            error_message = str(e)
            print("[JIRA Connection] Connection failed with error:")
            if "401" in error_message:
                print("[JIRA Connection] Authentication Error: Invalid credentials")
                print(f"[JIRA Connection] Full error: {error_message}")
            elif "404" in error_message:
                print("[JIRA Connection] Server Error: Could not find JIRA server")
                print(f"[JIRA Connection] Full error: {error_message}")
            elif "Connection" in error_message:
                print("[JIRA Connection] Network Error: Could not connect to server")
                print(f"[JIRA Connection] This might be due to:")
                print("  - Network connectivity issues")
                print("  - CORS restrictions")
                print("  - Proxy/firewall settings")
                print(f"[JIRA Connection] Full error: {error_message}")
            else:
                print(f"[JIRA Connection] Unexpected error: {error_message}")
                if hasattr(e, 'response'):
                    print(f"[JIRA Connection] Response status: {e.response.status_code}")
                    print(f"[JIRA Connection] Response headers: {dict(e.response.headers)}")
                    print(f"[JIRA Connection] Response body: {e.response.text}")
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
        """
        Get statistics for an epic including total stories, stories with code commits, and stories with test cases.
        
        Args:
            epic_key (str): The JIRA key of the epic (e.g., 'KLA-8827')
            
        Returns:
            dict: Statistics containing:
                - total_stories: Total number of user stories in the epic
                - stories_with_code: Number of stories with actual code commits
                - stories_with_tests: Number of stories with test cases
                - details: Detailed information about each category
        """
        try:
            jira = JIRA(
                basic_auth=(self.email, self.api_key),
                server=self.server
            )
            
            # First verify the epic exists and get project key
            try:
                epic = jira.issue(epic_key)
                project_key = epic.fields.project.key
                print(f"Found epic: {epic.fields.summary} (Key: {epic_key}) in project: {project_key}")
            except Exception as e:
                print(f"Error finding epic: {str(e)}")
                raise
            
            # Get all user stories linked to this epic
            stories_jql = f'issueType = "User Story" AND "Epic Link" = "{epic_key}"'
            print(f"Executing JQL for stories: {stories_jql}")
            stories = jira.search_issues(stories_jql, maxResults=100)
            print(f"Found {len(stories)} total user stories")
            
            # Get stories with code using commits query
            code_jql = f'project = {project_key} AND "Epic Link" = "{epic_key}" AND issueType = "User Story" AND development[commits].all > 0'
            print(f"Executing JQL for code commits: {code_jql}")
            stories_with_code_results = jira.search_issues(code_jql, maxResults=100)
            print(f"Found {len(stories_with_code_results)} stories with code commits")
            stories_with_code = len(stories_with_code_results)
            stories_with_code_details = [{
                'key': story.key,
                'summary': story.fields.summary,
                'status': story.fields.status.name
            } for story in stories_with_code_results]
            
            # Lists to store detailed information
            all_stories = []
            stories_with_tests_details = []
            
            stories_with_tests = 0
            
            # Performance optimization: Create a set of story keys with code
            stories_with_code_keys = {story.key for story in stories_with_code_results}
            
            for story in stories:
                # Store basic story info
                story_info = {
                    'key': story.key,
                    'summary': story.fields.summary,
                    'status': story.fields.status.name,
                    'has_code': story.key in stories_with_code_keys  # Add this flag for UI
                }
                all_stories.append(story_info)
                
                # Check for test cases (subtasks)
                subtasks = story.fields.subtasks
                has_test_case = any(
                    subtask.fields.issuetype.name == 'Test Case' 
                    for subtask in subtasks
                )
                if has_test_case:
                    stories_with_tests += 1
                    stories_with_tests_details.append(story_info)
            
            # Calculate coverage metrics
            code_coverage = (stories_with_tests / stories_with_code * 100) if stories_with_code > 0 else 0
            
            return {
                "total_stories": len(stories),
                "stories_with_code": stories_with_code,
                "stories_with_tests": stories_with_tests,
                "test_coverage": round(code_coverage, 2),  # Add coverage percentage
                "details": {
                    "all_stories": all_stories,
                    "stories_with_code": stories_with_code_details,
                    "stories_with_tests": stories_with_tests_details
                }
            }
        except Exception as e:
            print(f"Error getting epic statistics: {str(e)}")
            print(f"JQL Queries used:")
            print(f"Stories JQL: {stories_jql}")
            print(f"Code JQL: {code_jql}")
            print(f"Full error details: {str(e.__dict__)}")
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

    def get_stories_needing_tests(self, epic_key: str) -> list:
        """
        Get stories from epic that need test cases.
        Uses optimized JQL query and efficient subtask checking.
        """
        try:
            jira = JIRA(
                basic_auth=(self.email, self.api_key),
                server=self.server
            )
            
            # Get project key from epic
            epic = jira.issue(epic_key)
            project_key = epic.fields.project.key
            print(f"Found epic: {epic.fields.summary} (Key: {epic_key}) in project: {project_key}")
            
            # Optimized JQL to get relevant stories in one query
            jql = (
                f'project = {project_key} AND '
                f'"Epic Link" = "{epic_key}" AND '
                f'status != Open AND '
                f'issuetype = "User Story"'
            )
            
            print(f"Executing JQL for stories: {jql}")
            
            # Get all fields we need in one call
            stories = jira.search_issues(
                jql,
                maxResults=100,
                fields='key,summary,description,status,subtasks,issuetype'
            )
            print(f"Found {len(stories)} non-Open stories")
            
            stories_needing_tests = []
            for story in stories:
                # Efficient subtask checking using fields already fetched
                has_test_case = any(
                    subtask.fields.issuetype.name == 'Test Case'
                    for subtask in story.fields.subtasks
                )
                
                if not has_test_case:
                    stories_needing_tests.append({
                        'key': story.key,
                        'summary': story.fields.summary,
                        'description': story.fields.description,
                        'status': story.fields.status.name,
                        'type': story.fields.issuetype.name
                    })
            
            print(f"Found {len(stories_needing_tests)} stories needing test cases")
            
            return stories_needing_tests
            
        except Exception as e:
            print(f"Error getting stories needing tests: {str(e)}")
            print(f"JQL Query used: {jql}")
            if hasattr(e, 'response'):
                print(f"Response status: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            raise e 

    def get_issue_details(self, issue_key: str) -> dict:
        """Get full details of a JIRA issue for triaging"""
        try:
            jira = JIRA(
                basic_auth=(self.email, self.api_key),
                server=self.server
            )
            
            issue = jira.issue(issue_key)
            
            return {
                "key": issue.key,
                "title": issue.fields.summary,
                "description": issue.fields.description or "",
                "labels": [label for label in issue.fields.labels],
                "priority": str(issue.fields.priority),
                "status": str(issue.fields.status),
                "type": str(issue.fields.issuetype)
            }
        except Exception as e:
            print(f"Error getting issue details: {str(e)}")
            if hasattr(e, 'response'):
                print(f"Response status: {e.response.status_code}")
                print(f"Response body: {e.response.text}")
            raise e 