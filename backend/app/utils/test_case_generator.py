def generate_test_cases(text_data):
    """Generate test cases from extracted text"""
    print("Received text data:")
    for line in text_data:
        print(f"  {line}")

    if not text_data:
        print("Warning: Received empty text data")
        return []

    test_cases = []
    current_scenario = None
    current_step = None
    
    # Find the title/scenario name first
    for line in text_data:
        if line.strip() and not line.startswith("Made with Scribe") and "Click" in line:
            # Look for the line before this one as the title
            title_index = text_data.index(line) - 1
            while title_index >= 0:
                potential_title = text_data[title_index].strip()
                if potential_title and not potential_title.startswith("Made with") and not potential_title.isdigit():
                    current_scenario = {
                        "name": potential_title,
                        "steps": []
                    }
                    print(f"Found scenario: {potential_title}")
                    break
                title_index -= 1
            break

    if not current_scenario:
        print("No scenario name found")
        return []

    # Process steps
    current_step_num = None
    for line in text_data:
        line = line.strip()
        print(f"Processing line: {line}")
        
        if not line or line.startswith("Made with Scribe"):
            continue

        # If line is just a number, it might be a step number
        if line.isdigit():
            current_step_num = int(line)
            continue

        # If we have meaningful text and it's not just a number
        if line and not line.isdigit() and ("Click" in line or "Navigate" in line):
            print(f"Found step {current_step_num}: {line}")
            if current_step:
                current_scenario["steps"].append(current_step)
            
            current_step = {
                "description": line,
                "expected_outcome": "Action completed successfully"  # Default outcome
            }
            
        elif line.startswith("Expected Outcome:"):
            print(f"Found expected outcome: {line}")
            if current_step:
                current_step["expected_outcome"] = line.replace("Expected Outcome:", "").strip()
    
    if current_step and current_scenario:
        current_scenario["steps"].append(current_step)
    
    test_cases.append(current_scenario)
    print(f"Final scenario name: {current_scenario['name']}")
    print(f"Number of steps found: {len(current_scenario['steps'])}")
    for idx, step in enumerate(current_scenario['steps'], 1):
        print(f"Step {idx}: {step['description']}")
    print(f"Generated test cases: {test_cases}")
    return test_cases 