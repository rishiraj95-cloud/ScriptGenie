import React from 'react';
import { diffLines } from 'diff';

function DiffView({ oldText, newText }) {
  const diff = diffLines(oldText || '', newText || '');
  
  return (
    <pre className="diff-content">
      {diff.map((part, index) => {
        const color = part.added 
          ? 'diff-added'
          : part.removed 
            ? 'diff-removed' 
            : 'diff-unchanged';
            
        return (
          <span key={index} className={color}>
            {part.value}
          </span>
        );
      })}
    </pre>
  );
}

export default DiffView; 