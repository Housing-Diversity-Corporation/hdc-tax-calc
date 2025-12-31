import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import styles from '../../styles/map/MapContainer.module.css';

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
        }, 800);
      }
    }, 400);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.loadingSpinner}>
      <div className={styles.spinnerContainer}>
        <Loader2 className="h-10 w-10 animate-spin text-[#7fbd45]" />
        <div className={styles.loadingText}>{displayText}</div>
      </div>
    </div>
  );
};

export default LoadingSpinner;
