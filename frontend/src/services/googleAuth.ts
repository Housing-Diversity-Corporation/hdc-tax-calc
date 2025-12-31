import { authService, tokenService } from './api';

export const handleGoogleSuccess = async (credentialResponse: any) => {
  try {
    const response = await authService.googleAuth({ 
      token: credentialResponse.credential 
    });
    
    tokenService.setToken(response.jwt);
    return { success: true, message: 'Google sign-in successful!' };
  } catch (error: any) {
    console.error('Google auth error:', error);
    return { 
      success: false, 
      message: error.response?.data?.message || 'Google authentication failed' 
    };
  }
};

export const handleGoogleError = () => {
  console.error('Google Sign-In failed');
  return { success: false, message: 'Google Sign-In failed' };
};