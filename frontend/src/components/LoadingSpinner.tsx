import React, { useState, useEffect } from 'react';
import { ClimbingBoxLoader } from 'react-spinners';
import styles from '../styles/MapContainer.module.css';

const LoadingSpinner: React.FC = () => {
  const [displayText, setDisplayText] = useState('');
  const fullText = 'Loading...';

  useEffect(() => {
    let currentIndex = 0;

    const interval = setInterval(() => {
      currentIndex++;
      setDisplayText(fullText.slice(0, currentIndex));
      
      if (currentIndex >= fullText.length) {
        setTimeout(() => {
          currentIndex = 0;
        }, 800); // Pause at full text before restarting
      }
    }, 400); // Speed of character reveal

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.loadingSpinner}>
      <div className={styles.spinnerContainer}>
        <ClimbingBoxLoader color="#7fbd45" size={10} />
        <div className={styles.loadingText}>{displayText}</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;