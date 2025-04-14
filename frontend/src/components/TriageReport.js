import React from 'react';

const TriageReport = ({ analysisResults }) => {
  const formatAnalysis = (text) => {
    if (!text) return { priority: '-', category: '-', rootCause: '-' };

    try {
      // Extract sections based on the actual labels in the text
      const priorityMatch = text.match(/Priority Level:\s*-\s*([^]*?)(?=Category:|$)/i);
      const categoryMatch = text.match(/Category:\s*-\s*([^]*?)(?=Probable Root Cause:|$)/i);
      const rootCauseMatch = text.match(/Probable Root Cause:\s*-?\s*([^]*?)$/i);
      
      return {
        priority: priorityMatch ? priorityMatch[1].trim() : '-',
        category: categoryMatch ? categoryMatch[1].trim() : '-',
        rootCause: rootCauseMatch ? rootCauseMatch[1].trim() : '-'
      };
    } catch (error) {
      console.error('Error parsing analysis:', error);
      return { priority: text, category: '-', rootCause: '-' };
    }
  };

  const styles = {
    container: {
      padding: '15px',
      backgroundColor: '#fff',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    },
    section: {
      marginBottom: '15px',
      padding: '10px',
      backgroundColor: '#f8f9fa',
      borderRadius: '4px',
    },
    label: {
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '5px',
      display: 'block',
    },
    content: {
      color: '#666',
      marginLeft: '15px',
      lineHeight: '1.4',
    }
  };

  const { priority, category, rootCause } = formatAnalysis(analysisResults);

  return (
    <div style={styles.container}>
      <div style={styles.section}>
        <span style={styles.label}>Priority Level:</span>
        <div style={styles.content}>{priority}</div>
      </div>
      
      <div style={styles.section}>
        <span style={styles.label}>Category:</span>
        <div style={styles.content}>{category}</div>
      </div>
      
      <div style={styles.section}>
        <span style={styles.label}>Probable Root Cause:</span>
        <div style={styles.content}>{rootCause}</div>
      </div>
    </div>
  );
};

export default TriageReport; 