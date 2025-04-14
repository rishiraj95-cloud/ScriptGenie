import React from 'react';
import './BackfillStatus.css';

const BackfillStatus = ({ status, onDownloadAll }) => {
  if (!status || status.length === 0) {
    return null;
  }

  const hasGeneratedSuccessfully = status.some(message => 
    message.includes('Generated Successfully')
  );

  return (
    <div className="backfill-status">
      <div className="status-list">
        {status.map((message, index) => (
          <div key={index} className="status-item">
            {message}
          </div>
        ))}
      </div>
      {hasGeneratedSuccessfully && (
        <button 
          className="download-all-btn"
          onClick={onDownloadAll}
        >
          Download All Test Cases
        </button>
      )}
    </div>
  );
};

export default BackfillStatus; 