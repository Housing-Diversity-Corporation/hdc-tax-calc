import { useState, useEffect } from 'react';
import { tokenService, API_BASE_URL } from '../services/api';

interface UserProfile {
  profileImageUrl: string;
  userInitial: string;
}

/**
 * Hook to fetch and manage user profile data (avatar image and initials)
 * Used across the app for displaying user avatars
 */
export const useUserProfile = () => {
  const [profileImageUrl, setProfileImageUrl] = useState<string>('');
  const [userInitial, setUserInitial] = useState<string>('U');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        const token = tokenService.getToken();
        if (!token) {
          console.log('No auth token found, using default avatar');
          setUserInitial('U');
          setIsLoading(false);
          return;
        }

        // Fetch profile image
        const imageResponse = await fetch(`${API_BASE_URL}/user/profile-image/url`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          setProfileImageUrl(imageData.imageUrl || '');
        }

        // Fetch user info for initial
        const userResponse = await fetch(`${API_BASE_URL}/account/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (userResponse.ok) {
          const userData = await userResponse.json();
          const initial = userData.fullName?.charAt(0).toUpperCase() || userData.username?.charAt(0).toUpperCase() || 'U';
          setUserInitial(initial);
        }
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        setUserInitial('U');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, []);

  return {
    profileImageUrl,
    userInitial,
    isLoading,
  };
};
