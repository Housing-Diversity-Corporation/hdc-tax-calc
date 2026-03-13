import React, { useState, useEffect } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { tokenService } from './services/api';
import './styles/global.css';
import { ThemeProvider } from './contexts/ThemeContext';

import Navbar from './components/navbar/NavbarShadcn';
import { Toaster } from './components/ui/sonner';
import AccountPage from './components/account/AccountPage';
import Settings from './components/account/Settings';
import SignIn from './components/login/SignIn';
import SignUp from './components/login/SignUp';
import PasswordReset from './components/login/PasswordReset';
import GradientBackground from './components/GradientBackground';
import InvestorTaxProfilePage from './components/investor-portal/InvestorTaxProfile/InvestorTaxProfilePage';
import AvailableInvestments from './components/investor-portal/investments/AvailableInvestments';
import InvestorAnalysis from './components/investor-portal/InvestorAnalysis/InvestorAnalysis';
import HDCCalculatorMain from './components/taxbenefits/HDCCalculatorMain';
import FundDetail from './components/investor-portal/FundDetail/FundDetail';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id-here';

// Debug logging for Google OAuth configuration
console.log('Google OAuth Configuration:', {
  clientId: GOOGLE_CLIENT_ID,
  clientIdLength: GOOGLE_CLIENT_ID?.length,
  isDefault: GOOGLE_CLIENT_ID === 'your-google-client-id-here',
  envVarExists: !!import.meta.env.VITE_GOOGLE_CLIENT_ID
});

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'signin' | 'signup' | 'reset-password' | 'account' | 'calculator' | 'tax-profile' | 'investments' | 'investor-analysis' | 'fund-detail' | 'settings'>('signin');
  const [_resetToken, setResetToken] = useState<string>('');
  const [selectedDealId, setSelectedDealId] = useState<string | number | null>(null);
  const [selectedPoolId, setSelectedPoolId] = useState<number | null>(null);
  const [accountPageKey, setAccountPageKey] = useState(0);
  const [navbarKey, setNavbarKey] = useState(0);

  useEffect(() => {
    const authToken = tokenService.getToken();
    if (authToken) {
      setCurrentView('calculator');
      return;
    }

    const path = window.location.pathname;
    const urlParams = new URLSearchParams(window.location.search);
    const resetTokenFromUrl = urlParams.get('token');

    if (path.includes('reset-password') && resetTokenFromUrl) {
      setResetToken(resetTokenFromUrl);
      setCurrentView('reset-password');
    } else if (path.includes('signup')) {
      setCurrentView('signup');
    } else {
      setCurrentView('signin');
    }
  }, []);

  const handleLogout = () => {
    tokenService.removeToken();
    setCurrentView('signin');
    window.history.pushState(null, '', '/signin');
  };

  // Determine if we should show gradient background
  const showGradientBg = currentView !== 'signin' && currentView !== 'signup' && currentView !== 'reset-password';

  return (
    <ThemeProvider>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <Toaster />
        <div className="App h-screen w-screen flex flex-col overflow-hidden">
          {showGradientBg ? (
            <GradientBackground variant="subtle" className="flex flex-col flex-1">
              <Navbar
                key={navbarKey}
                onNavigateHome={() => setCurrentView('calculator')}
                onNavigateToAccount={() => {
                  setAccountPageKey(prev => prev + 1);
                  setNavbarKey(prev => prev + 1);
                  setCurrentView('account');
                }}
                onNavigateToCalculator={() => setCurrentView('calculator')}
                onNavigateToTaxProfile={() => setCurrentView('tax-profile')}
                onNavigateToInvestments={() => {
                  setCurrentView('investments');
                  setSelectedDealId(null);
                }}
                onNavigateToInvestorAnalysis={() => setCurrentView('investor-analysis')}
                onNavigateToSettings={() => setCurrentView('settings')}
                onLogout={handleLogout}
                currentView={currentView}
                showAnalysisTab={!!selectedDealId || currentView === 'investor-analysis'}
              />
              <div className="flex-1 min-h-0 overflow-auto">
                <div style={{
                  minHeight: '100%',
                  display: 'flex',
                  justifyContent: 'flex-start',
                  alignItems: 'stretch',
                  padding: '0'
                }}>
                  {currentView === 'settings' ? (
                    <Settings key="settings" />
                  ) : currentView === 'account' ? (
                    <AccountPage
                      key={accountPageKey}
                      onNavigateToSettings={() => setCurrentView('settings')}
                    />
                  ) : currentView === 'calculator' ? (
                    <HDCCalculatorMain />
                  ) : currentView === 'tax-profile' ? (
                    <InvestorTaxProfilePage />
                  ) : currentView === 'investments' ? (
                    <AvailableInvestments
                      onViewDeal={(dealId) => {
                        setSelectedDealId(dealId);
                        setCurrentView('investor-analysis');
                      }}
                      onViewPool={(poolId) => {
                        setSelectedPoolId(poolId);
                        setCurrentView('fund-detail');
                      }}
                    />
                  ) : currentView === 'investor-analysis' ? (
                    <InvestorAnalysis
                      onNavigateToTaxProfile={() => setCurrentView('tax-profile')}
                      dealId={selectedDealId || undefined}
                      onBack={() => setCurrentView('investments')}
                    />
                  ) : currentView === 'fund-detail' && selectedPoolId ? (
                    <FundDetail
                      poolId={selectedPoolId}
                      onBack={() => {
                        setSelectedPoolId(null);
                        setCurrentView('investments');
                      }}
                      onNavigateToTaxProfile={() => setCurrentView('tax-profile')}
                    />
                  ) : null}
                </div>
              </div>
            </GradientBackground>
          ) : (
            /* Auth pages with their own inline gradients */
            <div style={{
              flex: 1,
              display: 'flex',
              overflow: 'auto',
              justifyContent: 'center',
              alignItems: 'flex-start',
              padding: '20px'
            }}>
              {currentView === 'signin' ? (
                <SignIn
                  onNavigateToSignUp={() => setCurrentView('signup')}
                  onAuthSuccess={() => setCurrentView('calculator')}
                  onProfileIncomplete={() => setCurrentView('signup')}
                />
              ) : currentView === 'signup' ? (
                <SignUp
                  onNavigateToSignIn={() => setCurrentView('signin')}
                  onAuthSuccess={() => setCurrentView('calculator')}
                />
              ) : (
                <PasswordReset
                  token={_resetToken}
                  onSuccess={() => setCurrentView('signin')}
                />
              )}
            </div>
          )}
        </div>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
};

export default App;
