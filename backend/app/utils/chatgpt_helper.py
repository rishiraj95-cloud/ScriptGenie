import openai
from typing import List
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class ChatGPTHelper:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        self.model = "gpt-3.5-turbo"
        openai.api_key = self.api_key
        
        if not openai.api_key:
            raise ValueError("No API key provided and OPENAI_API_KEY not found in environment")
        
    def verify_connection(self) -> bool:
        try:
            # Add debug logging
            print(f"Attempting to verify ChatGPT connection with API key: {openai.api_key[:10]}...")
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[{"role": "user", "content": "Hello"}],
                max_tokens=5
            )
            print("ChatGPT connection successful")
            return True
        except Exception as e:
            print(f"ChatGPT Connection Error Details: {str(e)}")
            return False

    def generate_response(self, messages: List[dict]) -> str:
        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=messages,
                temperature=0.7,
                max_tokens=1000,
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )
            return response.choices[0].message['content']
        except Exception as e:
            print(f"Error in generating response: {str(e)}")
            return None 

    def generate_test_cases(self, user_story: str) -> str:
        """Generate test cases from a user story"""
        try:
            prompt = f"""
            Generate comprehensive test cases for the following user story:
            {user_story}
            
            Please format the test cases in a clear, structured manner including:
            - Test Case ID
            - Description
            - Preconditions
            - Test Steps
            - Expected Results
            """
            
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[{
                    "role": "system",
                    "content": "You are a QA expert who creates detailed test cases from user stories."
                }, {
                    "role": "user",
                    "content": prompt
                }],
                max_tokens=2000,
                temperature=0.7
            )
            
            return response.choices[0].message['content'].strip()
        except Exception as e:
            print(f"Error generating test cases: {str(e)}")
            raise Exception(f"Failed to generate test cases: {str(e)}")

    def format_test_cases_response(self, response: str) -> str:
        """Format the GPT response to ensure consistent structure"""
        try:
            # Store global sections that should appear at the end
            global_sections = {
                'regression': [],
                'notes': []
            }
            
            # Split into scenarios
            scenarios = response.split('\n\nScenario')
            formatted_scenarios = []
            
            # Handle first scenario's browser config and prereqs
            if scenarios[0].strip() and not scenarios[0].lower().startswith('scenario'):
                first_part = scenarios[0].strip()
                config_lines = []
                for line in first_part.split('\n'):
                    if line.strip():
                        if 'Browser Configuration:' in line:
                            config_lines.append('Browser Configuration:' + line.split('Browser Configuration:')[1])
                        elif 'Pre-Required Conditions:' in line:
                            config_lines.append(line)
                if config_lines:
                    formatted_scenarios.append('\n'.join(config_lines))
                scenarios = scenarios[1:]  # Remove processed first part
            
            for scenario in scenarios:
                if not scenario.strip():
                    continue
                    
                # Ensure "Scenario" prefix if it's not the first one
                if not scenario.lower().startswith('scenario'):
                    scenario = 'Scenario' + scenario
                
                # Format sections
                lines = scenario.split('\n')
                formatted_lines = []
                current_section = None
                temp_lines = []
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        temp_lines.append('')
                        continue
                        
                    # Handle section headers
                    if line.startswith('Pre-Required Conditions:'):
                        current_section = 'prereq'
                        temp_lines.append(line)
                    elif line.startswith('Scenario Name:'):
                        current_section = 'scenario'
                        temp_lines.append(line)
                    elif line.startswith('Test Steps:'):
                        current_section = 'steps'
                        temp_lines.append(line)
                    elif line.startswith('Regression Scenarios:'):
                        current_section = 'regression'
                        # Store regression scenarios for later
                        continue
                    elif line.startswith('Notes:'):
                        current_section = 'notes'
                        # Store notes for later
                        continue
                    else:
                        # Format based on current section
                        if current_section == 'steps' and (line[0].isdigit() and '.' in line):
                            temp_lines.append(f"        {line}")
                        elif current_section == 'steps' and line.startswith('Received Outcome:'):
                            temp_lines.append(f"        {line}")
                        elif current_section == 'regression':
                            global_sections['regression'].append(f"    {line}")
                        elif current_section == 'notes':
                            global_sections['notes'].append(f"    {line}")
                        elif current_section in ['prereq']:
                            temp_lines.append(f"    {line}")
                        else:
                            temp_lines.append(line)
                
                # Add all non-global sections
                formatted_lines.extend(temp_lines)
                
                formatted_scenarios.append('\n'.join(formatted_lines))
            
            # Add global sections at the end if they exist
            # Always include Regression Scenarios section
            formatted_scenarios.append('Regression Scenarios:')
            if global_sections['regression']:
                formatted_scenarios.append('\n'.join(global_sections['regression']))
            else:
                formatted_scenarios.append('    No regression scenarios identified - please review and add appropriate scenarios')
            
            # Always include Notes section
            formatted_scenarios.append('\nNotes:')
            if global_sections['notes']:
                formatted_scenarios.append('\n'.join(global_sections['notes']))
            else:
                formatted_scenarios.append('    No additional notes - please add any relevant information')
            
            # Join all formatted scenarios
            return '\n\n'.join(formatted_scenarios)
        except Exception as e:
            print(f"Error formatting test cases: {str(e)}")
            return response  # Return original response if formatting fails 

    def generate_automation_script(self, prompt: str) -> str:
        try:
            response = openai.ChatCompletion.create(
                model=self.model,
                messages=[{
                    "role": "user",
                    "content": prompt
                }],
                max_tokens=2000,
                temperature=0.7,
                top_p=1.0,
                frequency_penalty=0.0,
                presence_penalty=0.0
            )
            return response.choices[0].message['content'].strip()
        except Exception as e:
            print(f"ChatGPT API error: {str(e)}")
            raise Exception(f"Failed to generate automation script: {str(e)}") 