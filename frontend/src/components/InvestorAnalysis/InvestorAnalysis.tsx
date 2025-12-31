import React, { useState, useEffect } from 'react';
import InvestorAnalysisCalculator from './InvestorAnalysisCalculator';
import { investorTaxInfoService } from '../../services/api';
import { Alert, CircularProgress, Box, Select, MenuItem, FormControl, InputLabel, Button } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import type { InvestorTaxInfo } from '../../types/investorTaxInfo';

/**
 * Investor-specific Analysis page that auto-fills tax information
 * from the investor's tax profile and uses the same calculation engine
 * and database configurations as the main calculator.
 *
 * This page allows investors to analyze deals in the investment portal
 * with their personalized tax information pre-populated.
 */
interface InvestorAnalysisProps {
  onNavigateToTaxProfile?: () => void;
  dealId?: string | number; // Optional deal ID to load a specific configuration
  onBack?: () => void; // Optional back button handler
}

const InvestorAnalysis: React.FC<InvestorAnalysisProps> = ({ onNavigateToTaxProfile, dealId, onBack }) => {
  const [taxProfile, setTaxProfile] = useState<InvestorTaxInfo | null>(null);
  const [allProfiles, setAllProfiles] = useState<InvestorTaxInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInvestorTaxProfile();
  }, []);

  const loadInvestorTaxProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get all profiles
      const profiles = await investorTaxInfoService.getUserTaxInfo();
      if (profiles && profiles.length > 0) {
        setAllProfiles(profiles);
        // Find default profile or use the first one
        const defaultProfile = profiles.find(p => p.isDefault) || profiles[0];
        setTaxProfile(defaultProfile);
      } else {
        setError('No tax profile found. Please create a tax profile first.');
      }
    } catch (err) {
      console.error('Failed to load tax profile:', err);
      setError('Failed to load tax profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (profileId: number) => {
    const selectedProfile = allProfiles.find(p => p.id === profileId);
    if (selectedProfile) {
      console.log('🔄 Switching to profile:', selectedProfile.profileName || `Profile #${profileId}`);
      setTaxProfile(selectedProfile);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Alert severity="info">
          Please go to the Tax Profile page to create your tax profile before using the Analysis tool.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {taxProfile && (
        <Box
          sx={{
            mt: 4, mb: 0, ml: 7, mr: 7,
            display: 'flex', gap: 2, alignItems: 'space-between', justifyContent: 'space-between',
         }}
        >
          {/* Tax Profile Selector */}
          <FormControl
            size="small"
            sx={{
              flex: 1,
              maxWidth: '600px',
              '& .MuiOutlinedInput-root': {
                backgroundColor: '#ffffff',
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#407f7f',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#407f7f',
                  borderWidth: '2px',
                },
              },
              '& .MuiInputLabel-root.Mui-focused': {
                color: '#407f7f',
              },
            }}
          >
            <InputLabel id="tax-profile-selector-label">Tax Profile</InputLabel>
            <Select
              labelId="tax-profile-selector-label"
              id="tax-profile-selector"
              value={taxProfile?.id || ''}
              label="Tax Profile"
              onChange={(e) => handleProfileChange(Number(e.target.value))}
              renderValue={(selected) => {
                const profile = allProfiles.find(p => p.id === selected);
                if (!profile) return '';
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                      component="span"
                      sx={{
                        fontWeight: 600,
                        color: '#474a44',
                      }}
                    >
                      {profile.profileName || `Profile #${profile.id}`}
                    </Box>
                    {profile.isDefault && (
                      <Box
                        component="span"
                        sx={{
                          ml: 1,
                          px: 1,
                          py: 0.25,
                          fontSize: '0.75rem',
                          color: '#ffffff',
                          backgroundColor: '#7fbd45',
                          borderRadius: '4px',
                          fontWeight: 500,
                        }}
                      >
                        ✓ Default
                      </Box>
                    )}
                  </Box>
                );
              }}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: '#ffffff',
                    border: '1px solid #e5e5e5',
                    boxShadow: '0 4px 8px rgba(64, 127, 127, 0.15)',
                    '& .MuiMenuItem-root': {
                      '&:hover': {
                        backgroundColor: '#92c3c2',
                      },
                      '&.Mui-selected': {
                        backgroundColor: '#92c3c2',
                        '&:hover': {
                          backgroundColor: '#407f7f',
                          '& *': {
                            color: '#ffffff !important',
                          },
                        },
                      },
                    },
                  },
                },
              }}
            >
              {allProfiles.map((profile) => {
                const federalRate = profile.investorTrack !== 'rep' && profile.passiveGainType === 'long-term'
                  ? (profile.federalCapitalGainsRate || 0)
                  : (profile.federalOrdinaryRate || 0);

                return (
                  <MenuItem
                    key={profile.id}
                    value={profile.id}
                    sx={{
                      py: 1.5,
                      borderBottom: '1px solid #e5e5e5',
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                    }}
                  >
                    <Box sx={{ width: '100%' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                        <Box
                          component="span"
                          sx={{
                            fontWeight: 600,
                            color: '#474a44',
                            fontSize: '0.9rem',
                          }}
                        >
                          {profile.profileName || `Profile #${profile.id}`}
                        </Box>
                        {profile.isDefault && (
                          <Box
                            component="span"
                            sx={{
                              ml: 1,
                              px: 1,
                              py: 0.25,
                              fontSize: '0.7rem',
                              color: '#ffffff',
                              backgroundColor: '#7fbd45',
                              borderRadius: '4px',
                              fontWeight: 500,
                            }}
                          >
                            ✓ Default
                          </Box>
                        )}
                      </Box>
                      <Box sx={{
                        fontSize: '0.75rem',
                        color: '#474a44',
                        opacity: 0.7,
                        lineHeight: 1.5,
                      }}>
                        <Box component="span" sx={{ color: '#407f7f', fontWeight: 500 }}>Federal Rate:</Box> {federalRate.toFixed(1)}% |{' '}
                        <Box component="span" sx={{ color: '#407f7f', fontWeight: 500 }}>State:</Box> {profile.selectedState} (Ord: {(profile.stateOrdinaryRate || 0).toFixed(1)}%, CG: {(profile.stateCapitalGainsRate || 0).toFixed(1)}%) |{' '}
                        <Box component="span" sx={{ color: '#407f7f', fontWeight: 500 }}>Type:</Box> {profile.investorTrack === 'rep' ? 'REP' : `Non-REP (${profile.passiveGainType || 'short-term'})`} |{' '}
                        <Box component="span" sx={{ color: '#407f7f', fontWeight: 500 }}>OZ:</Box> {profile.ozType === 'rural' ? 'Rural (30%)' : 'Standard (10%)'}
                        {profile.investorTrack !== 'rep' && ' | NIIT: 3.8%'}
                      </Box>
                    </Box>
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {/* Edit Tax Profile Button */}
          {onNavigateToTaxProfile && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={onNavigateToTaxProfile}
              sx={{
                minWidth: '140px',
                height: '40px',
                whiteSpace: 'nowrap',
                borderColor: '#407f7f',
                color: '#407f7f',
                fontWeight: 500,
                '&:hover': {
                  borderColor: '#407f7f',
                  backgroundColor: '#92c3c2',
                  color: '#474a44',
                },
              }}
            >
              Edit Profile
            </Button>
          )}
        </Box>
      )}

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <InvestorAnalysisCalculator
          taxProfile={taxProfile}
          dealId={dealId}
          isReadOnly={!!dealId} // Make read-only when viewing a specific deal
        />
      </Box>
    </Box>
  );
};

export default InvestorAnalysis;