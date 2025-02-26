import { Tooltip } from 'react-tooltip';

function ScribeTestGenerator() {
  return (
    <div>
      <button 
        className="btn btn-primary" 
        onClick={handleGenerateTestCases}
        title="If scribe files are dropped, test steps shall be generated, if video files are dropped screen shots shall be generated"
        style={{ marginRight: '5px' }}
      >
        Generate Test Cases
      </button>
    </div>
  );
}

export default ScribeTestGenerator; 