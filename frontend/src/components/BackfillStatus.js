import React from 'react';

function BackfillStatus({ status, onDownloadAll }) {
  return (
    <div className="backfill-list-widget">
      <h3>Backfill Status</h3>
      <div className="list-content">
        {status.length > 0 ? (
          <>
            <div className="status-list">
              {status.map((item, index) => (
                <div key={index} className="status-item">
                  {item}
                </div>
              ))}
            </div>
            {status.some(s => s.includes('Generated Successfully')) && (
              <button 
                className="download-all-btn"
                onClick={onDownloadAll}
              >
                Download All Test Cases
              </button>
            )}
          </>
        ) : (
          <div className="placeholder-text">
            Backfill items will appear here
          </div>
        )}
      </div>
    </div>
  );
}

export default BackfillStatus; 