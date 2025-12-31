import React, { useState, useEffect, useRef } from 'react';
import { Loader2, User as UserIcon, Briefcase, Network, Building, MapPin, Mail, Phone, FileEdit, Check } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PhoneInput } from '@/components/ui/phone-input';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { toast } from 'sonner';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../ThemeToggle';
import ProfileImageUpload from './ProfileImageUpload';
import BannerImageUpload from './BannerImageUpload';
import api from '../../services/api';
import { User } from '../../services/api';

const INDUSTRY_OPTIONS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Real Estate',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Legal',
  'Marketing',
  'Media',
  'Hospitality',
  'Energy',
  'Transportation',
  'Government',
  'Non-Profit',
  'Other'
];

const Settings: React.FC = () => {
  const { isDarkMode } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showOtherIndustry, setShowOtherIndustry] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    jobTitle: '',
    industry: '',
    organization: '',
    location: '',
    contactEmail: '',
    phone: '',
    bio: '',
    bannerImageUrl: ''
  });

  const locationInputRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          toast.error('Please sign in to view settings.');
          setLoading(false);
          return;
        }

        const response = await api.get<User>('/account/me');
        setUser(response.data);

        // Populate form with user data
        const userIndustry = response.data.industry || '';
        const isOtherIndustry = Boolean(userIndustry && !INDUSTRY_OPTIONS.includes(userIndustry));

        setFormData({
          fullName: response.data.fullName || '',
          jobTitle: response.data.jobTitle || '',
          industry: isOtherIndustry ? 'Other' : userIndustry,
          organization: response.data.organization || '',
          location: response.data.location || '',
          contactEmail: response.data.contactEmail || '',
          phone: response.data.phone || '',
          bio: response.data.bio || '',
          bannerImageUrl: response.data.bannerImageUrl || ''
        });

        setShowOtherIndustry(isOtherIndustry);
        if (isOtherIndustry) {
          setFormData(prev => ({ ...prev, industry: userIndustry }));
        }
      } catch (err) {
        console.error('Error fetching user info:', err);
        toast.error('Failed to fetch user information.');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Initialize Google Places Autocomplete for location
  useEffect(() => {
    const containerCaptured = locationInputRef.current;

    const initLocationAutocomplete = async () => {
      const container = containerCaptured;
      if (!container) return;

      try {
        await google.maps.importLibrary("places") as google.maps.PlacesLibrary;

        const placeAutocomplete = new google.maps.places.PlaceAutocompleteElement({});
        placeAutocomplete.id = 'location-autocomplete-input';

        if (container.firstChild) {
          container.removeChild(container.firstChild);
        }

        container.appendChild(placeAutocomplete);
        autocompleteRef.current = placeAutocomplete;

        // Set color scheme for proper text colors
        const colorScheme = isDarkMode ? 'dark' : 'light';
        placeAutocomplete.style.colorScheme = colorScheme;

        // Set placeholder
        setTimeout(() => {
          const elementWithInternals = placeAutocomplete as unknown as Record<string, unknown>;
          for (const key in elementWithInternals) {
            const prop = elementWithInternals[key];
            if (prop && typeof prop === 'object' && prop !== null && 'tagName' in prop && (prop as HTMLElement).tagName === 'INPUT') {
              const inputElement = prop as HTMLInputElement;
              inputElement.setAttribute('placeholder', formData.location || 'Search for your location...');
              break;
            }
          }
        }, 300);

        // Handle place selection
        const handlePlaceSelection = async (event: Event & { Fg?: unknown; Dg?: unknown; place?: unknown; detail?: { place?: unknown } }) => {
          const eventObj = event as unknown as Record<string, unknown>;
          let place = event.Fg || event.Dg || event.place || event.detail?.place;

          if (!place) {
            for (const key in eventObj) {
              const value = eventObj[key];
              if (value && typeof value === 'object' && ('toPlace' in (value as object) || 'formattedAddress' in (value as object))) {
                place = value;
                break;
              }
            }
          }

          if (!place) return;

          try {
            const placeObj = place as Record<string, unknown>;
            let formattedAddress = (placeObj.formattedAddress as string) || (placeObj.formatted_address as string);

            // If it's a placePrediction, convert to place
            if (placeObj.toPlace && typeof placeObj.toPlace === 'function') {
              const fullPlace = await placeObj.toPlace();
              await fullPlace.fetchFields({ fields: ['formattedAddress'] });
              formattedAddress = fullPlace.formattedAddress;
            }

            if (formattedAddress) {
              handleInputChange('location', formattedAddress);
            }
          } catch (err) {
            console.error('Error processing place:', err);
          }
        };

        placeAutocomplete.addEventListener('gmp-select', handlePlaceSelection);
      } catch (error) {
        console.error('Error initializing location autocomplete:', error);
      }
    };

    initLocationAutocomplete();

    return () => {
      const autocompleteElement = autocompleteRef.current;

      if (autocompleteElement && containerCaptured) {
        try {
          containerCaptured.removeChild(autocompleteElement);
        } catch {
          // Element might already be removed
        }
        autocompleteRef.current = null;
      }
    };
  }, [formData.location]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileImageUpdate = (imageUrl: string) => {
    if (user) {
      setUser({ ...user, profileImageUrl: imageUrl });
    }
  };

  const handleSave = async () => {
    // Validate full name before saving
    if (!formData.fullName || formData.fullName.trim().length < 2) {
      setNameError('Full name is required and must be at least 2 characters');
      toast.error('Please fix validation errors before saving.');
      return;
    }
    if (!/^[a-zA-Z\s'-]+$/.test(formData.fullName)) {
      setNameError('Full name should only contain letters, spaces, hyphens, and apostrophes');
      toast.error('Please fix validation errors before saving.');
      return;
    }

    // Validate email before saving
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.contactEmail && !emailRegex.test(formData.contactEmail)) {
      setEmailError('Please enter a valid email address');
      toast.error('Please fix validation errors before saving.');
      return;
    }

    // Validate phone number before saving
    if (formData.phone && !isValidPhoneNumber(formData.phone)) {
      setPhoneError('Please enter a valid phone number');
      toast.error('Please fix validation errors before saving.');
      return;
    }

    setSaving(true);
    setPhoneError(null);
    setEmailError(null);
    setNameError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        toast.error('Authentication required. Please sign in again.');
        setSaving(false);
        return;
      }

      const response = await api.put<User>('/account/update', formData);
      setUser(response.data);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-8">
        <p className="text-muted-foreground">No user information found.</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 w-[90vw] mx-auto min-h-screen overflow-auto">
      <h1 className="text-3xl font-bold mb-6">
        Settings
      </h1>

      {/* Two Column Layout for Wide View */}
      <div className="flex flex-col lg:flex-row gap-6 lg:items-stretch">
        {/* Left Column: Theme, Profile, Banner */}
        <div className="w-full lg:w-[50vw] flex flex-col gap-6">
          {/* Theme Settings */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Switch between light and dark mode
                  </p>
                  <p className="text-xs text-primary mt-1">
                    Current theme: {isDarkMode ? 'Dark Mode' : 'Light Mode'}
                  </p>
                </div>
                <ThemeToggle />
              </div>
            </CardContent>
          </Card>

          {/* Profile Image */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfileImageUpload
                currentImageUrl={user.profileImageUrl || ''}
                onUploadSuccess={handleProfileImageUpdate}
                onUploadError={(err) => toast.error(err)}
              />
            </CardContent>
          </Card>

          {/* Banner Image */}
          <Card className="bg-card">
            <CardHeader>
              <CardTitle>Banner Image</CardTitle>
            </CardHeader>
            <CardContent>
              <BannerImageUpload
                currentImageUrl={user.bannerImageUrl || ''}
                onUploadSuccess={(imageUrl) => {
                  if (user) {
                    setUser({ ...user, bannerImageUrl: imageUrl });
                  }
                }}
                onUploadError={(err) => toast.error(err)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Profile Information */}
        <div className="w-full lg:w-[50vw] flex flex-col">
          {/* Profile Information */}
          <Card className="mb-6 bg-card" style={{ flex: '1 1 auto', minHeight: 'calc(100%)' }}>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div>
              <label htmlFor="fullName" className="block mb-2 font-medium flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => {
                  const name = e.target.value;
                  handleInputChange('fullName', name);
                  // Validate name - should not be empty and contain at least 2 characters
                  if (name && name.trim().length < 2) {
                    setNameError('Full name must be at least 2 characters');
                  } else if (name && !/^[a-zA-Z\s'-]+$/.test(name)) {
                    setNameError('Full name should only contain letters, spaces, hyphens, and apostrophes');
                  } else {
                    setNameError(null);
                  }
                }}
                placeholder={user?.fullName || 'Enter your full name'}
                required
              />
              {nameError && (
                <p className="text-xs text-red-500 mt-1">{nameError}</p>
              )}
            </div>

            <div>
              <label htmlFor="jobTitle" className="block mb-2 font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Job Title
              </label>
              <Input
                id="jobTitle"
                value={formData.jobTitle}
                onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                placeholder={user?.jobTitle || 'Enter your job title'}
              />
            </div>

            <div>
              <label htmlFor="industry" className="block mb-2 font-medium flex items-center gap-2">
                <Network className="w-4 h-4" />
                Industry
              </label>
              <Select
                value={showOtherIndustry ? 'Other' : formData.industry}
                onValueChange={(value) => {
                  if (value === 'Other') {
                    setShowOtherIndustry(true);
                    handleInputChange('industry', '');
                  } else {
                    setShowOtherIndustry(false);
                    handleInputChange('industry', value);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder={user?.industry || 'Select your industry'} />
                </SelectTrigger>
                <SelectContent>
                  {INDUSTRY_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {showOtherIndustry && (
                <Input
                  id="industryOther"
                  value={formData.industry}
                  onChange={(e) => handleInputChange('industry', e.target.value)}
                  placeholder="Enter your industry"
                  className="mt-2"
                />
              )}
            </div>

            <div>
              <label htmlFor="organization" className="block mb-2 font-medium flex items-center gap-2">
                <Building className="w-4 h-4" />
                Organization
              </label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => handleInputChange('organization', e.target.value)}
                placeholder={user?.organization || 'Enter your organization'}
              />
            </div>

            <div>
              <label htmlFor="location" className="block mb-2 font-medium flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Location
              </label>
              <div ref={locationInputRef} className="w-full">
                {/* Google Places Autocomplete will be inserted here */}
              </div>
              {formData.location && (
                <p className="text-xs text-muted-foreground mt-1">
                  Current: {formData.location}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="contactEmail" className="block mb-2 font-medium flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Contact Email
              </label>
              <Input
                id="contactEmail"
                type="email"
                value={formData.contactEmail}
                onChange={(e) => {
                  const email = e.target.value;
                  handleInputChange('contactEmail', email);
                  // Validate email format
                  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                    setEmailError('Please enter a valid email address');
                  } else {
                    setEmailError(null);
                  }
                }}
                placeholder={user?.contactEmail || 'Enter your contact email'}
              />
              {emailError && (
                <p className="text-xs text-red-500 mt-1">{emailError}</p>
              )}
            </div>

            <div>
              <label htmlFor="phone" className="block mb-2 font-medium flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Contact Phone
              </label>
              <PhoneInput
                id="phone"
                value={formData.phone}
                onChange={(value) => {
                  handleInputChange('phone', value || '');
                  // Validate phone number
                  if (value && !isValidPhoneNumber(value)) {
                    setPhoneError('Please enter a valid phone number');
                  } else {
                    setPhoneError(null);
                  }
                }}
                placeholder={user?.phone || 'Enter your contact phone'}
              />
              {phoneError && (
                <p className="text-xs text-red-500 mt-1">{phoneError}</p>
              )}
            </div>

            <div>
              <label htmlFor="bio" className="block mb-2 font-medium flex items-center gap-2">
                <FileEdit className="w-4 h-4" />
                Bio
              </label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleInputChange('bio', e.target.value)}
                rows={4}
                placeholder={user?.bio || 'Tell us about yourself...'}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {formData.bio.length}/500 characters
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#7fbd45] hover:bg-[#6fa838]"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
