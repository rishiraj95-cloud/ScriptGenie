import requests
import json

def test_vedai_connection():
    api_key = "sk-81391c2a10664379a297b418921f3f79"  # Keep for future use
    base_url = "http://vedai.technia.cloud:8080/ollama"
    
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }

    try:
        print(f"Attempting to connect to VedAI at {base_url}")
        print("Headers:")
        print(json.dumps(headers, indent=2))
        
        response = requests.get(
            base_url,
            headers=headers,
            timeout=10
        )
        
        print(f"Response status code: {response.status_code}")
        print("Response body:")
        print(response.text)
        
        if response.status_code == 200:
            try:
                response_data = response.json()
                is_valid = response_data.get("status", False)
                print(f"Connection valid: {is_valid}")
                return is_valid
            except json.JSONDecodeError:
                print("Failed to parse response as JSON")
                return False
        else:
            print("Connection failed")
            return False
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

if __name__ == "__main__":
    test_vedai_connection() 