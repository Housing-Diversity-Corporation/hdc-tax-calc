import React, { useState, useEffect, useCallback } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { tokenService } from './services/api';
import type { GeoJsonFeatureCollection } from './types/map/geojson';
import './styles/global.css';
import { ThemeProvider } from './contexts/ThemeContext';
import { LayerHierarchyProvider } from './contexts/LayerHierarchyContext';
import type { SolarAnalysis } from './types/map/solar';

import Navbar from './components/navbar/NavbarShadcn';
import { Toaster } from './components/ui/sonner';
import AccountPage from './components/account/AccountPage';
import Settings from './components/account/Settings';
import SignIn from './components/login/SignIn';
import SignUp from './components/login/SignUp';
import PasswordReset from './components/login/PasswordReset';
import GradientBackground from './components/GradientBackground';
import PanelLayout from './components/map/PanelLayout';
import FloatingChatContainer from './components/map/chat/FloatingChatContainer';
import InvestorTaxProfilePage from './components/investor-portal/InvestorTaxProfile/InvestorTaxProfilePage';
import AvailableInvestments from './components/investor-portal/investments/AvailableInvestments';
import InvestorAnalysis from './components/investor-portal/InvestorAnalysis/InvestorAnalysis';
import HDCCalculatorMain from './components/taxbenefits/HDCCalculatorMain';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || 'your-google-client-id-here';

// Debug logging for Google OAuth configuration
console.log('🔧 Google OAuth Configuration:', {
  clientId: GOOGLE_CLIENT_ID,
  clientIdLength: GOOGLE_CLIENT_ID?.length,
  isDefault: GOOGLE_CLIENT_ID === 'your-google-client-id-here',
  envVarExists: !!import.meta.env.VITE_GOOGLE_CLIENT_ID
});

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'signin' | 'signup' | 'home' | 'reset-password' | 'account' | 'calculator' | 'oz-calculator' | 'demographic-calculator' | 'tax-strategy' | 'tax-profile' | 'investments' | 'investor-analysis' | 'settings'>('signin');
  const [isInvestorPortal, setIsInvestorPortal] = useState(false);
  const [_resetToken, setResetToken] = useState<string>('');
  const [selectedDealId, setSelectedDealId] = useState<string | number | null>(null);
  const [accountPageKey, setAccountPageKey] = useState(0);
  const [navbarKey, setNavbarKey] = useState(0);
  const [isFavoritesPanelOpen, setIsFavoritesPanelOpen] = useState(false);
  const [isPlacesPanelOpen, setIsPlacesPanelOpen] = useState(false);
  const [addIntersectionLayer, setAddIntersectionLayer] = useState<((geoJsonData: GeoJsonFeatureCollection) => void) | null>(null);
  const [toggleLayer, setToggleLayer] = useState<((layerId: string) => void) | null>(null);
  const [navigateToLocation, setNavigateToLocation] = useState<((lat: number, lng: number, name: string, address?: string, placeId?: string, placeTypes?: string) => void) | null>(null);
  const [runNeighborhoodExplorer, setRunNeighborhoodExplorer] = useState<((textQuery: string | undefined, categories: string[] | undefined, radius: number, centerLat: number, centerLng: number) => void) | null>(null);

  // Solar panel state
  // Solar panel state managed by MapLayout
  const [solarCallbacks, setSolarCallbacks] = useState<{
    visible: boolean;
    isLoading: boolean;
    data: SolarAnalysis | null;
    activeTab: 'analysis' | 'layers';
    onTabChange: (tab: 'analysis' | 'layers') => void;
    onClose: () => void;
    onClearAll: () => void;
    loadingOverlay: boolean;
    showFluxOverlay: boolean;
    showMapWideHeatmap: boolean;
    overlayOpacity: number;
    onToggleFluxOverlay: () => void;
    onToggleMapWideHeatmap: () => void;
    onUpdateOverlayOpacity: (value: number) => void;
    onClearAllOverlays: () => void;
  } | null>(null);

  // Neighborhood Explorer state (managed by MapContainer via callbacks)
  const [neighborhoodExplorerState, setNeighborhoodExplorerState] = useState<{
    results: any[];
    visible: boolean;
    metadata: { textQuery: string; radius: number; centerLat: number; centerLng: number } | null;
    onResultClick: (result: any) => void;
    onClear: () => void;
    onExport: (filename: string) => void;
    onSave: (searchName: string) => void;
    onSaveLocation: (result: any, locationName: string) => void;
    onDeleteResult: (result: any) => void;
    onNewSearch: (textQuery: string) => void;
    onMarkerTypeChange: (result: any, newType: string) => void;
    onSaveDialogOpen?: (openFn: () => void) => void;
    onExportDialogOpen?: (openFn: () => void) => void;
  } | null>(null);

  // Feature layer panel state (shows overlapping features at clicked location)
  interface FeatureData {
    layerId: string;
    layerName: string;
    properties: { [key: string]: string | number | boolean | null };
    priority: number;
    feature?: google.maps.Data.Feature;
  }

  const [featureLayerState, setFeatureLayerState] = useState<{
    visible: boolean;
    features: FeatureData[];
    onClose: () => void;
    onSetPriority: (layerId: string, priority: number) => void;
    onHighlightFeature: (layerId: string, feature?: google.maps.Data.Feature) => void;
  } | null>(null);

  // Layer controls render function (provided by MapContainer)
  const [renderLayerControls, setRenderLayerControls] = useState<(() => React.ReactNode) | undefined>(undefined);

  // Memoize the callback to prevent infinite loops
  const handleLayerControlsReady = useCallback((renderFn: () => React.ReactNode) => {
    setRenderLayerControls(() => renderFn);
  }, []);

  const handleLoadMap = (callbacks: {
    addIntersectionLayer: (geoJsonData: GeoJsonFeatureCollection) => void;
    toggleLayer: (layerId: string) => void;
    navigateToLocation: (lat: number, lng: number, name: string, address?: string, placeId?: string, placeTypes?: string) => void;
    runTextQuerySearch?: (textQuery: string | undefined, categories: string[] | undefined, radius: number, centerLat: number, centerLng: number) => void;
  }) => {
    setAddIntersectionLayer(() => callbacks.addIntersectionLayer);
    setToggleLayer(() => callbacks.toggleLayer);
    setNavigateToLocation(() => callbacks.navigateToLocation);
    if (callbacks.runTextQuerySearch) {
      setRunNeighborhoodExplorer(() => callbacks.runTextQuerySearch);
    }
  };

  useEffect(() => {
    const authToken = tokenService.getToken();
    if (authToken) {
      setCurrentView('home');
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

  const toggleFavoritesPanel = () => {
    setIsFavoritesPanelOpen(prev => !prev);
  };

  const togglePlacesPanel = () => {
    setIsPlacesPanelOpen(prev => !prev);
  };

  const handleNavigateToFavorites = () => {
    setCurrentView('home');
    setIsFavoritesPanelOpen(prev => !prev);
  };

  const handleNavigateToPlaces = () => {
    setCurrentView('home');
    // Close favorites panel if open, then toggle places
    if (isFavoritesPanelOpen) {
      setIsFavoritesPanelOpen(false);
    }
    setIsPlacesPanelOpen(prev => !prev);
  };

  const _handlePasswordResetSuccess = () => {
    setCurrentView('signin');
    window.history.pushState(null, '', '/signin');
  };

  const handleLogout = () => {
    tokenService.removeToken();
    setCurrentView('signin');
    setIsInvestorPortal(false);
    window.history.pushState(null, '', '/signin');
  };

  // Handle entering investor portal mode
  const handleEnterInvestorPortal = () => {
    setIsInvestorPortal(true);
    setCurrentView('investments');
    setSelectedDealId(null); // Clear any selected deal when entering portal
  };

  // Handle exiting investor portal mode
  const handleExitInvestorPortal = () => {
    setIsInvestorPortal(false);
    setCurrentView('home');
    setSelectedDealId(null); // Clear selected deal when exiting portal
  };

  // Solar update callback
  const onSolarUpdate = React.useCallback((
    visible: boolean,
    isLoading: boolean,
    data: SolarAnalysis | null,
    activeTab: 'analysis' | 'layers',
    onTabChange: (tab: 'analysis' | 'layers') => void,
    onClose: () => void,
    onClearAll: () => void,
    loadingOverlay: boolean,
    showFluxOverlay: boolean,
    showMapWideHeatmap: boolean,
    overlayOpacity: number,
    onToggleFluxOverlay: () => void,
    onToggleMapWideHeatmap: () => void,
    onUpdateOverlayOpacity: (value: number) => void,
    onClearAllOverlays: () => void
  ) => {
    setSolarCallbacks({
      visible,
      isLoading,
      data,
      activeTab,
      onTabChange,
      onClose,
      onClearAll,
      loadingOverlay,
      showFluxOverlay,
      showMapWideHeatmap,
      overlayOpacity,
      onToggleFluxOverlay,
      onToggleMapWideHeatmap,
      onUpdateOverlayOpacity,
      onClearAllOverlays,
    });
  }, []);

  // Neighborhood Explorer update callback
  const onNeighborhoodExplorerUpdate = React.useCallback((
    results: any[],
    visible: boolean,
    metadata: { textQuery: string; radius: number; centerLat: number; centerLng: number } | null,
    onResultClick: (result: any) => void,
    onClear: () => void,
    onExport: (filename: string) => void,
    onSave: (searchName: string) => void,
    onSaveLocation: (result: any, locationName: string) => void,
    onDeleteResult: (result: any) => void,
    onNewSearch: (textQuery: string) => void,
    onMarkerTypeChange: (result: any, newType: string) => void
  ) => {
    console.log('🎨 [App.tsx] onNeighborhoodExplorerUpdate called with onMarkerTypeChange:', !!onMarkerTypeChange);
    setNeighborhoodExplorerState({
      results,
      visible,
      metadata,
      onResultClick,
      onClear,
      onExport,
      onSave,
      onSaveLocation,
      onDeleteResult,
      onNewSearch,
      onMarkerTypeChange,
    });
  }, []);

  // Feature layer panel update callback
  const onFeatureLayerUpdate = React.useCallback((
    visible: boolean,
    features: FeatureData[],
    onClose: () => void,
    onSetPriority: (layerId: string, priority: number) => void,
    onHighlightFeature: (layerId: string, feature?: google.maps.Data.Feature) => void
  ) => {
    // console.log('📥 [STEP 8] App.tsx onFeatureLayerUpdate called');
    // console.log('📥 [STEP 8] visible:', visible);
    // console.log('📥 [STEP 8] features count:', features.length);
    // console.log('📥 [STEP 8] Updating featureLayerState...');

    setFeatureLayerState({
      visible,
      features,
      onClose,
      onSetPriority,
      onHighlightFeature,
    });

    // console.log('✅ [STEP 8] featureLayerState updated in App.tsx');
  }, []);

  // Determine if we should show gradient background
  const showGradientBg = currentView !== 'signin' && currentView !== 'signup' && currentView !== 'reset-password';

  return (
   <ThemeProvider>
      <LayerHierarchyProvider>
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <Toaster />
              <div className="App h-screen w-screen flex flex-col overflow-hidden">
                {showGradientBg ? (
                  <GradientBackground variant="subtle" className="flex flex-col flex-1">
                    <Navbar
                      key={navbarKey}
                      onNavigateHome={() => setCurrentView('home')}
                      onNavigateToAccount={() => {
                        setAccountPageKey(prev => prev + 1);
                        setNavbarKey(prev => prev + 1);
                        setCurrentView('account');
                      }}
                      onNavigateToFavorites={handleNavigateToFavorites}
                      onNavigateToPlaces={handleNavigateToPlaces}
                      onNavigateToCalculator={() => setCurrentView('oz-calculator')}
                      onNavigateToDemographicCalc={() => setCurrentView('demographic-calculator')}
                      onNavigateToTaxStrategy={isInvestorPortal ? () => setCurrentView('tax-strategy') : handleEnterInvestorPortal}
                      onNavigateToTaxProfile={() => setCurrentView('tax-profile')}
                      onNavigateToInvestments={() => {
                        setCurrentView('investments');
                        setSelectedDealId(null); // Clear selected deal when going back to investments list
                      }}
                      onNavigateToInvestorAnalysis={() => setCurrentView('investor-analysis')}
                      onNavigateToSettings={() => setCurrentView('settings')}
                      onLogout={handleLogout}
                      isInvestorPortal={isInvestorPortal}
                      onExitInvestorPortal={handleExitInvestorPortal}
                      currentView={currentView}
                      showAnalysisTab={!!selectedDealId || currentView === 'investor-analysis'}
                    />
                    <div className="flex-1 min-h-0 overflow-auto">
                      {currentView === 'home' ? (
                        /* Map view with PanelLayout handling all panels */
                        <PanelLayout
                          isFavoritesPanelOpen={isFavoritesPanelOpen}
                          isPlacesPanelOpen={isPlacesPanelOpen}
                          onCloseFavorites={toggleFavoritesPanel}
                          onClosePlaces={togglePlacesPanel}
                          addIntersectionLayer={addIntersectionLayer}
                          toggleLayer={toggleLayer}
                          navigateToLocation={navigateToLocation}
                          runNeighborhoodExplorer={runNeighborhoodExplorer}
                          onMapLoad={handleLoadMap}
                          onLayerControlsReady={handleLayerControlsReady}
                          renderLayerControls={renderLayerControls}
                          solarCallbacks={solarCallbacks}
                          neighborhoodExplorerState={neighborhoodExplorerState}
                          featureLayerState={featureLayerState}
                          onSolarUpdate={onSolarUpdate}
                          onNeighborhoodExplorerUpdate={onNeighborhoodExplorerUpdate}
                          onFeatureLayerUpdate={onFeatureLayerUpdate}
                        />
                      ) : (
                        /* Other views - Settings, Account, Investments, Tax Profile */
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
                              onNavigateToFavorites={handleNavigateToFavorites}
                              onNavigateToPlaces={handleNavigateToPlaces}
                            />
                          ) : currentView === 'oz-calculator' ? (
                            <HDCCalculatorMain />
                          ) : currentView === 'tax-profile' ? (
                            <InvestorTaxProfilePage />
                          ) : currentView === 'investments' ? (
                            <AvailableInvestments
                              onViewDeal={(dealId) => {
                                setSelectedDealId(dealId);
                                setCurrentView('investor-analysis');
                              }}
                            />
                          ) : currentView === 'investor-analysis' ? (
                            <InvestorAnalysis
                              onNavigateToTaxProfile={() => setCurrentView('tax-profile')}
                              dealId={selectedDealId || undefined}
                              onBack={() => setCurrentView('investments')}
                            />
                          ) : null}
                        </div>
                      )}
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
                        onAuthSuccess={() => setCurrentView('home')}
                        onProfileIncomplete={() => setCurrentView('signup')}
                      />
                    ) : currentView === 'signup' ? (
                      <SignUp
                        onNavigateToSignIn={() => setCurrentView('signin')}
                        onAuthSuccess={() => setCurrentView('home')}
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
      </LayerHierarchyProvider>
  </ThemeProvider>
  );
};

export default App;
