import { useEffect, useState } from 'react';

export const useGoogleMaps = (apiKey: string) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already loading or loaded
    const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existingScript) {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        return;
      }
      const handleLoad = () => setIsLoaded(true);
      existingScript.addEventListener('load', handleLoad);
      return () => existingScript.removeEventListener('load', handleLoad);
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry&v=beta`;
    script.async = true;
    script.defer = true;

    script.onload = () => {
      setIsLoaded(true);
    };

    script.onerror = (error) => {
      console.error('Failed to load Google Maps:', error);
      setLoadError('Failed to load Google Maps');
    };

    document.head.appendChild(script);

    // Don't remove the script on cleanup to prevent duplicate loads
    return () => {
      // Script removal commented out to prevent duplicate loads in StrictMode
      // document.head.removeChild(script);
    };
  }, [apiKey]);

  return { isLoaded, loadError };
};