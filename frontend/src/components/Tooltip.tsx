import React, { useState } from 'react';

interface TooltipProps {
  content: string;
}

const Tooltip: React.FC<TooltipProps> = ({ content }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="info-icon">
      <i 
        className="fa-solid fa-circle-info"
        onClick={(e) => {
          e.stopPropagation();
          setIsVisible(!isVisible);
        }}
      />
      {isVisible && (
        <div className="info-text">
          {content}
        </div>
      )}
    </span>
  );
};

export default Tooltip;