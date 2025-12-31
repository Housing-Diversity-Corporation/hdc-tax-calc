// Stub file for DealCard component - TODO: implement

import React from 'react';
import { DealMatchScore } from '../utils/dealMatching';

interface DealCardProps {
  match: DealMatchScore;
  onClick?: () => void;
}

const DealCard: React.FC<DealCardProps> = ({ match, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        border: '1px solid #ccc',
        borderRadius: '8px',
        padding: '1rem',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <h3>Deal: {match.dealId}</h3>
      <p>Fit Score: {match.fitScore}%</p>
      <p>Investment: ${match.estimatedInvestment.toLocaleString()}</p>
    </div>
  );
};

export default DealCard;
