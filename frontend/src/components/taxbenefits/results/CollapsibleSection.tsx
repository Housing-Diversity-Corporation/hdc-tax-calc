import React, { useState } from 'react';
import '../../../styles/taxbenefits/hdcCalculator.css';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultExpanded = true
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="hdc-section">
      <h3
        className="hdc-section-header"
        style={{
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          userSelect: 'none'
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <span style={{
            marginRight: '0.5rem',
            fontSize: '0.8rem',
            transition: 'transform 0.2s',
            transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
            display: 'inline-block'
          }}>
            ▶
          </span>
          {title}
        </span>
      </h3>

      {isExpanded && (
        <div style={{
          animation: 'slideDown 0.2s ease-out',
        }}>
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;