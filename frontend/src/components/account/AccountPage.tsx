import React, { useState, useEffect } from 'react';
import { Edit, Loader2, AlertCircle, Briefcase, Building, MapPin, Mail, Phone, Layers, Eye, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import api, { investorTaxInfoService } from '../../services/api';
import { User } from '../../services/api';
import { InvestorTaxInfo } from '../../types/investorTaxInfo';
import LoadingSpinner from '../map/LoadingSpinner';
import axios from 'axios';
import { useContainerWidth, useResponsiveText } from '../../hooks/useResponsiveText';

interface FavoriteLayer {
  id: string;
}

interface SavedIntersection {
  id: number;
  name: string;
  created_at: string;
}

interface FavoriteLocation {
  id: number;
  name: string;
  address: string;
  lat: number;
  lng: number;
  placeId: string;
  placeTypes: string;
  createdAt: string;
}

interface SavedNeighborhoodExplorer {
  id: number;
  searchName: string;
  textQuery?: string;
  selectedCategories?: string;
  searchRadius: number;
  centerLat: number;
  centerLng: number;
  centerAddress?: string;
  resultCount: number;
  createdAt: string;
}

interface AccountPageProps {
  onNavigateToSettings?: () => void;
  onNavigateToFavorites?: () => void;
  onNavigateToPlaces?: () => void;
}

const AccountPage: React.FC<AccountPageProps> = ({ onNavigateToSettings, onNavigateToFavorites, onNavigateToPlaces }) => {
  const [user, setUser] = useState<User | null>(null);
  const [defaultTaxProfile, setDefaultTaxProfile] = useState<InvestorTaxInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Favorites state
  const [favoriteLayers, setFavoriteLayers] = useState<FavoriteLayer[]>([]);
  const [savedIntersections, setSavedIntersections] = useState<SavedIntersection[]>([]);
  const [favoritesLoading, setFavoritesLoading] = useState(true);
  const [favoritesError, setFavoritesError] = useState<string | null>(null);

  // Places state
  const [favoriteLocations, setFavoriteLocations] = useState<FavoriteLocation[]>([]);
  const [savedNeighborhoodExplorers, setSavedNeighborhoodExplorers] = useState<SavedNeighborhoodExplorer[]>([]);
  const [placesLoading, setPlacesLoading] = useState(true);
  const [placesError, setPlacesError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          setError('Please sign in to view account information.');
          setLoading(false);
          return;
        }

        const response = await api.get<User>('/account/me');
        setUser(response.data);

        // Fetch default tax profile
        try {
          const taxProfile = await investorTaxInfoService.getDefaultTaxInfo();
          setDefaultTaxProfile(taxProfile);
        } catch (taxErr) {
          console.log('No default tax profile found:', taxErr);
          // It's okay if there's no default tax profile
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
        setError('Failed to fetch user information.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch favorites data
  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setFavoritesLoading(false);
        return;
      }

      setFavoritesLoading(true);
      setFavoritesError(null);
      try {
        const [layersResponse, intersectionsResponse] = await Promise.all([
          api.get<string[]>('/favorites/layers'),
          api.get<SavedIntersection[]>('/intersections'),
        ]);

        const layers = layersResponse.data.map(id => ({ id }));
        setFavoriteLayers(layers);
        setSavedIntersections(intersectionsResponse.data);
      } catch (err) {
        console.error('Error fetching favorites data:', err);
        if (axios.isAxiosError(err) && err.response?.status === 403) {
          setFavoritesError('Authentication failed. Please sign in again.');
        } else {
          setFavoritesError('Failed to fetch favorites.');
        }
      } finally {
        setFavoritesLoading(false);
      }
    };

    fetchFavorites();
  }, []);

  // Fetch places data
  useEffect(() => {
    const fetchPlaces = async () => {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setPlacesLoading(false);
        return;
      }

      try {
        const [locationsResponse, searchesResponse] = await Promise.all([
          api.get<FavoriteLocation[]>('/favorite-locations'),
          api.get<SavedNeighborhoodExplorer[]>('/neighborhood-searches'),
        ]);

        setFavoriteLocations(locationsResponse.data);
        setSavedNeighborhoodExplorers(searchesResponse.data);
        setPlacesError(null);
      } catch (err) {
        console.error('Error fetching saved places:', err);
        setPlacesError('Failed to load saved places');
      } finally {
        setPlacesLoading(false);
      }
    };

    fetchPlaces();
  }, []);


  // Responsive components for favorites
  const ResponsiveLayerItem: React.FC<{ layer: FavoriteLayer }> = ({ layer }) => {
    const { ref, width } = useContainerWidth<HTMLDivElement>();
    const { displayText, fontSize } = useResponsiveText(layer.id, width, {
      minFontSize: 10,
      maxFontSize: 14,
    });

    return (
      <Button
        variant="outline"
        className="w-full justify-start overflow-hidden min-w-0 px-3 mb-2"
        onClick={onNavigateToFavorites}
      >
        <Layers className="mr-2 h-4 w-4 flex-shrink-0" />
        <div ref={ref} className="flex-1 overflow-hidden min-w-0">
          <span className="block overflow-hidden" style={{ fontSize: `${fontSize}px`, transition: 'font-size 0.2s ease' }}>
            {displayText}
          </span>
        </div>
      </Button>
    );
  };

  const ResponsiveIntersectionItem: React.FC<{ intersection: SavedIntersection }> = ({ intersection }) => {
    const { ref, width } = useContainerWidth<HTMLDivElement>();
    const fullText = `${intersection.name} (${new Date(intersection.created_at).toLocaleDateString()})`;
    const { displayText, fontSize } = useResponsiveText(fullText, width, {
      minFontSize: 10,
      maxFontSize: 14,
    });

    return (
      <Button
        variant="outline"
        className="w-full justify-start text-left overflow-hidden min-w-0 px-3 mb-2"
        onClick={onNavigateToFavorites}
      >
        <Eye className="mr-2 h-4 w-4 flex-shrink-0" />
        <div ref={ref} className="flex-1 overflow-hidden min-w-0">
          <span className="block overflow-hidden" style={{ fontSize: `${fontSize}px`, transition: 'font-size 0.2s ease' }}>
            {displayText}
          </span>
        </div>
      </Button>
    );
  };

  // Responsive components for places
  const ResponsiveFavoriteLocationItem: React.FC<{ location: FavoriteLocation }> = ({ location }) => {
    const { ref, width } = useContainerWidth<HTMLDivElement>();
    const fullText = `${location.name} ${location.address}`;
    const { displayText, fontSize } = useResponsiveText(fullText, width, {
      minFontSize: 10,
      maxFontSize: 14,
    });

    return (
      <Button
        variant="outline"
        className="w-full justify-start overflow-hidden min-w-0 px-3 mb-2"
        onClick={onNavigateToPlaces}
      >
        <MapPin className="mr-2 h-4 w-4 flex-shrink-0" />
        <div ref={ref} className="flex-1 overflow-hidden min-w-0">
          <span className="block overflow-hidden" style={{ fontSize: `${fontSize}px`, transition: 'font-size 0.2s ease' }}>
            {displayText}
          </span>
        </div>
      </Button>
    );
  };

  const ResponsiveNeighborhoodExplorerItem: React.FC<{ search: SavedNeighborhoodExplorer }> = ({ search }) => {
    const { ref, width } = useContainerWidth<HTMLDivElement>();
    const fullText = `${search.searchName} (${search.resultCount} results)`;
    const { displayText, fontSize } = useResponsiveText(fullText, width, {
      minFontSize: 10,
      maxFontSize: 14,
    });

    return (
      <Button
        variant="outline"
        className="w-full justify-start overflow-hidden min-w-0 px-3 mb-2"
        onClick={onNavigateToPlaces}
      >
        <Search className="mr-2 h-4 w-4 flex-shrink-0" />
        <div ref={ref} className="flex-1 overflow-hidden min-w-0">
          <span className="block overflow-hidden" style={{ fontSize: `${fontSize}px`, transition: 'font-size 0.2s ease' }}>
            {displayText}
          </span>
        </div>
      </Button>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-4">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No user information found.</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Determine banner background with fallback logic: user banner > default image > gradient
  const getBannerBackground = () => {
    if (user.bannerImageUrl) {
      return `url(${user.bannerImageUrl}) center/cover`;
    }
    // Fallback to default banner image, with gradient as final fallback
    return `url(/West-Seattle-Skyline-Panorama.jpg) center/cover, linear-gradient(135deg, #474a44 0%, #734968 100%)`;
  };

  return (
    <div className="w-full h-full overflow-auto">
      {/* Hero Banner - Responsive to uploaded image or default height */}
      <div
        className="w-full min-h-[200px] max-h-[400px] relative"
        style={{
          height: user.bannerImageUrl ? 'auto' : '200px',
          background: getBannerBackground()
        }}
      />

      {/* Main Content Container */}
      <div className="content-85vw flex flex-col lg:flex-row w-[85vw] lg:w-[95vw] mx-auto pb-4">
        {/* Left Sidebar - Narrow */}
        <div className="w-full lg:w-[320px] lg:mr-3 relative">
          {/* Profile Picture - Overlapping Banner */}
          <div className="-mt-20 mb-2 flex justify-center">
            <Avatar className="w-40 h-40 border-4 border-white shadow-md aspect-square" style={{ width: '160px', height: '160px', minWidth: '160px', minHeight: '160px', maxWidth: '160px', maxHeight: '160px' }}>
              <AvatarImage
                src={user.profileImageUrl ? `${user.profileImageUrl}?t=${Date.now()}` : undefined}
                alt={user.fullName}
                className="aspect-square object-cover"
              />
              <AvatarFallback className="text-4xl aspect-square">
                {!user.profileImageUrl && user.fullName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* User Name */}
          <h1 className="text-3xl font-bold text-center mb-3">
            {user.fullName}
          </h1>

          {/* About Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex justify-between items-center w-full">
                <CardTitle>About</CardTitle>
                {onNavigateToSettings && (
                  <Button
                    onClick={onNavigateToSettings}
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    aria-label="Edit profile"
                  >
                    <Edit className="h-4 w-4" style={{ color: '#734968' }} />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-4">
                {user.jobTitle && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                      <Briefcase className="h-3 w-3" />
                      Job Title
                    </p>
                    <p className="text-sm">{user.jobTitle}</p>
                  </div>
                )}

                {user.industry && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                      <Building className="h-3 w-3" />
                      Industry
                    </p>
                    <p className="text-sm">{user.industry}</p>
                  </div>
                )}

                {user.organization && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                      <Building className="h-3 w-3" />
                      Organization
                    </p>
                    <p className="text-sm">{user.organization}</p>
                  </div>
                )}

                {user.location && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                      <MapPin className="h-3 w-3" />
                      Location
                    </p>
                    <p className="text-sm">
                      {/* Extract city and state from full address - format: "Street, City, State Zip, Country" */}
                      {user.location.includes(',')
                        ? (() => {
                            const parts = user.location.split(',').map(p => p.trim());
                            // Assuming format: "Street, City, State Zip, Country" - get City (index 1) and State (index 2)
                            if (parts.length >= 3) {
                              const city = parts[1];
                              const stateZip = parts[2].split(' ')[0]; // Get just state, not zip
                              return `${city}, ${stateZip}`;
                            }
                            // Fallback if format is different
                            return parts.slice(-2).join(', ');
                          })()
                        : user.location}
                    </p>
                  </div>
                )}

                <Separator />

                {user.contactEmail && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                      <Mail className="h-3 w-3" />
                      Email
                    </p>
                    <p className="text-sm">{user.contactEmail}</p>
                  </div>
                )}

                {user.phone && (
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 mb-1">
                      <Phone className="h-3 w-3" />
                      Phone
                    </p>
                    <p className="text-sm">{user.phone}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Bio Card */}
          {user.bio && (
            <Card>
              <CardHeader>
                <CardTitle>Bio</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">
                  {user.bio}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Content Area - Wider */}
        <div className="flex-1 mt-6 lg:mt-3">
          {/* Tax Profile Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Default Tax Profile</CardTitle>
            </CardHeader>
            <CardContent>
              {defaultTaxProfile ? (
                <div className="flex flex-col gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground">Profile Name</p>
                    <p className="text-sm font-medium">{defaultTaxProfile.profileName || 'Default Profile'}</p>
                  </div>
                  <Separator />
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">Annual Income</p>
                      <p className="text-sm">${defaultTaxProfile.annualIncome?.toLocaleString() || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Filing Status</p>
                      <p className="text-sm capitalize">{defaultTaxProfile.filingStatus || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Federal Tax Rate</p>
                      <p className="text-sm">{defaultTaxProfile.federalOrdinaryRate ? `${defaultTaxProfile.federalOrdinaryRate.toFixed(1)}%` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">State Tax Rate</p>
                      <p className="text-sm">{defaultTaxProfile.stateOrdinaryRate ? `${defaultTaxProfile.stateOrdinaryRate.toFixed(1)}%` : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">State</p>
                      <p className="text-sm">{defaultTaxProfile.selectedState || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Investor Track</p>
                      <p className="text-sm capitalize">{defaultTaxProfile.investorTrack || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No default tax profile set. Create one in Tax Profile settings.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Investments Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>My Investments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Your investment portfolio will appear here.
              </p>
            </CardContent>
          </Card>

          {/* Favorite Layers Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Favorite Layers</CardTitle>
            </CardHeader>
            <CardContent>
              {favoritesLoading ? (
                <LoadingSpinner />
              ) : favoritesError ? (
                <Alert variant="destructive">
                  <AlertDescription>{favoritesError}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <h4 className="text-sm font-semibold mb-3">Layers</h4>
                  {favoriteLayers.length > 0 ? (
                    <div className="flex flex-col">
                      {favoriteLayers.map(layer => (
                        <ResponsiveLayerItem key={layer.id} layer={layer} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">No favorite layers yet.</p>
                  )}

                  <h4 className="text-sm font-semibold mb-3 mt-6">Saved Intersections</h4>
                  {savedIntersections.length > 0 ? (
                    <div className="flex flex-col">
                      {savedIntersections.map(intersection => (
                        <ResponsiveIntersectionItem key={intersection.id} intersection={intersection} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No saved intersections yet.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* Favorite Places Card */}
          <Card>
            <CardHeader>
              <CardTitle>Favorite Places</CardTitle>
            </CardHeader>
            <CardContent>
              {placesLoading ? (
                <LoadingSpinner />
              ) : placesError ? (
                <Alert variant="destructive">
                  <AlertDescription>{placesError}</AlertDescription>
                </Alert>
              ) : (
                <>
                  <h4 className="text-sm font-semibold mb-3">Locations</h4>
                  {favoriteLocations.length > 0 ? (
                    <div className="flex flex-col">
                      {favoriteLocations.map(location => (
                        <ResponsiveFavoriteLocationItem key={location.id} location={location} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground mb-4">No favorite locations yet.</p>
                  )}

                  <h4 className="text-sm font-semibold mb-3 mt-6">Neighborhood Searches</h4>
                  {savedNeighborhoodExplorers.length > 0 ? (
                    <div className="flex flex-col">
                      {savedNeighborhoodExplorers.map(search => (
                        <ResponsiveNeighborhoodExplorerItem key={search.id} search={search} />
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No neighborhood searches yet.</p>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
