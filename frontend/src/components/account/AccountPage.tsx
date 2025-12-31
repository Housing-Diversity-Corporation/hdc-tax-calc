import React, { useState, useEffect } from 'react';
import { Edit, Loader2, AlertCircle, Briefcase, Building, MapPin, Mail, Phone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import api, { investorTaxInfoService } from '../../services/api';
import { User } from '../../services/api';
import { InvestorTaxInfo } from '../../types/investorTaxInfo';

interface AccountPageProps {
  onNavigateToSettings?: () => void;
}

const AccountPage: React.FC<AccountPageProps> = ({ onNavigateToSettings }) => {
  const [user, setUser] = useState<User | null>(null);
  const [defaultTaxProfile, setDefaultTaxProfile] = useState<InvestorTaxInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        </div>
      </div>
    </div>
  );
};

export default AccountPage;
