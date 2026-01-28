import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { isValidPhoneNumber } from 'react-phone-number-input';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Loader2, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { authService, tokenService, API_BASE_URL } from '../../services/api';
import { GoogleLogin } from '@react-oauth/google';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../ThemeToggle';

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

const signUpSchema = z.object({
  // Step 1: Account Credentials
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),

  // Step 2: Profile Information (optional)
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  organization: z.string().optional(),
  phone: z.string().refine(
    (value) => !value || isValidPhoneNumber(value),
    'Please enter a valid phone number'
  ).optional(),

  // Step 3: Bio (optional)
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),

  emailNotify: z.boolean().optional(),
}).passthrough(); // Allow any additional fields

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUp(props: { onNavigateToSignIn?: () => void; onAuthSuccess?: () => void }) {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState('');
  const [step, setStep] = React.useState(1);
  const [isGoogleAuth, setIsGoogleAuth] = React.useState(false);
  const [step1Values, setStep1Values] = React.useState<Partial<SignUpFormValues>>({});
  const [step2Values, setStep2Values] = React.useState<Partial<SignUpFormValues>>({});

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    mode: 'onChange',
    shouldUnregister: false, // Keep field values when fields unmount
    defaultValues: {
      name: '',
      email: '',
      password: '',
      jobTitle: '',
      industry: '',
      organization: '',
      phone: '',
      bio: '',
      emailNotify: false,
    },
  });

  // Check if user is already authenticated (coming from SignIn with incomplete profile)
  React.useEffect(() => {
    const existingToken = tokenService.getToken();
    if (existingToken) {
      // User is already authenticated, skip to profile collection
      setIsGoogleAuth(true);

      // Fetch user data to populate email and name
      fetch(`${API_BASE_URL}/account/me`, {
        headers: {
          'Authorization': `Bearer ${existingToken}`,
        },
      })
        .then(response => response.json())
        .then(user => {
          if (user.username) {
            form.setValue('email', user.username);
          }
          if (user.fullName) {
            form.setValue('name', user.fullName);
          }
        })
        .catch(error => {
          console.error('Error fetching user data:', error);
        });

      setStep(2);
    }
  }, []); // Empty dependency array - only run once on mount

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    console.log('🔵 Google sign-up button clicked - handleGoogleSuccess triggered');
    console.log('🔵 Credential response:', credentialResponse);
    setLoading(true);
    setAuthError('');
    try {
      if (!credentialResponse.credential) {
        console.log('🔴 No credential received from Google');
        setAuthError('Google authentication failed - no credential received');
        return;
      }

      console.log('🟢 Sending credential to backend for authentication...');
      const response = await authService.googleAuth({
        token: credentialResponse.credential
      });
      console.log('🟢 Backend authentication successful, JWT received');

      tokenService.setToken(response.jwt);

      // Fetch user data to populate form fields
      try {
        const userResponse = await fetch(`${API_BASE_URL}/account/me`, {
          headers: {
            'Authorization': `Bearer ${response.jwt}`,
          },
        });
        const user = await userResponse.json();
        if (user.username) {
          form.setValue('email', user.username);
        }
        if (user.fullName) {
          form.setValue('name', user.fullName);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

      // Mark as Google auth and move to step 2 to collect profile information
      setIsGoogleAuth(true);
      setStep(2);
      setLoading(false);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error ?
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Google authentication failed' :
        'Google authentication failed';
      setAuthError(errorMessage);
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.log('🔴 Google Sign-Up error - handleGoogleError triggered');
    setAuthError('Google Sign-Up failed');
  };

  const onSubmit = async (values: SignUpFormValues) => {
    console.log('🟢 onSubmit called - Form submitted with values:', values);
    console.log('🟢 Current step:', step);
    console.log('🟢 Is Google auth:', isGoogleAuth);

    setAuthError('');
    setLoading(true);

    try {
      let jwtToken = tokenService.getToken();

      // If not Google auth, register with email/password
      if (!isGoogleAuth) {
        console.log('🟢 Registering new user with email/password...');
        // Register user with all profile information
        await authService.register({
          username: values.email,
          password: values.password,
          fullName: values.name,
        });
        console.log('🟢 Registration successful!');

        console.log('🟢 Logging in to get JWT...');
        // Login to get JWT
        const loginResponse = await authService.login({
          username: values.email,
          password: values.password,
        });

        jwtToken = loginResponse.jwt;
        tokenService.setToken(jwtToken);
        console.log('🟢 JWT token saved!');
      }

      // Update profile with additional information (always for Google auth users on step 3)
      if (isGoogleAuth || values.jobTitle || values.industry || values.organization || values.bio || values.emailNotify || values.email) {
        try {
          await fetch(`${API_BASE_URL}/account/update`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${jwtToken}`,
            },
            body: JSON.stringify({
              jobTitle: values.jobTitle || '',
              industry: values.industry || '',
              organization: values.organization || '',
              phone: values.phone || '',
              bio: values.bio || '',
              emailNotify: values.emailNotify || false,
              contactEmail: values.email || '',
            }),
          });
        } catch (updateError) {
          console.error('Failed to update profile, but account created:', updateError);
          // Don't fail registration if profile update fails
        }
      }

      console.log('🟢 Account creation complete! Calling onAuthSuccess...');
      if (props.onAuthSuccess) {
        props.onAuthSuccess();
      }
    } catch (error: unknown) {
      console.log('🔴 Registration error:', error);
      const errorMessage = error instanceof Error && 'response' in error ?
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Registration failed. Please try again.' :
        'Registration failed. Please try again.';
      console.log('🔴 Error message:', errorMessage);
      setAuthError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleNextStep = async () => {
    if (step === 1) {
      // Validate Step 1 fields
      const fieldsToValidate: (keyof SignUpFormValues)[] = ['name', 'email', 'password'];
      const isValid = await form.trigger(fieldsToValidate);

      if (isValid) {
        // Save Step 1 values before moving to step 2
        const currentValues = form.getValues();
        console.log('Moving from Step 1 to Step 2');
        console.log('Saving Step 1 values:', currentValues);
        setStep1Values({
          name: currentValues.name,
          email: currentValues.email,
          password: currentValues.password,
        });
        setStep(2);
      }
    } else if (step === 2) {
      // Save Step 2 values before moving to step 3
      const currentValues = form.getValues();
      console.log('Moving from Step 2 to Step 3');
      console.log('Saving Step 2 values:', currentValues);
      setStep2Values({
        jobTitle: currentValues.jobTitle,
        industry: currentValues.industry,
        organization: currentValues.organization,
        phone: currentValues.phone,
      });
      setStep(3);
    }
  };

  const handlePrevStep = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4" style={{
      background: isDarkMode
        ? 'radial-gradient(ellipse 900px 700px at 18% 25%, #1c3333 0%, transparent 40%), radial-gradient(ellipse 800px 600px at 82% 75%, #142626 0%, transparent 35%), radial-gradient(ellipse 600px 400px at 50% 95%, #1c3333 0%, transparent 30%), linear-gradient(180deg, #080e0e 0%, #0d1616 60%, #142626 100%)'
        : 'radial-gradient(ellipse 900px 700px at 18% 25%, #92c3c2 0%, transparent 40%), radial-gradient(ellipse 800px 600px at 82% 75%, #a8cfce 0%, transparent 35%), radial-gradient(ellipse 600px 400px at 50% 95%, #92c3c2 0%, transparent 30%), linear-gradient(180deg, #f8fafa 0%, #e8f4f3 60%, #a8cfce 100%)'
    }}>
      <div className="absolute top-6 right-6 z-10">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] bg-card border shadow-2xl [&_input]:focus-visible:ring-1 [&_input]:focus-visible:ring-offset-0 [&_textarea]:focus-visible:ring-1 [&_textarea]:focus-visible:ring-offset-0 [&_input]:!border-[var(--input-border-color)] [&_textarea]:!border-[var(--input-border-color)] [&_button[role='combobox']]:!border-[var(--input-border-color)]" style={{
        '--separator-color': isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
        '--input-border-color': isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
      } as React.CSSProperties & { '--separator-color': string; '--input-border-color': string }}>
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img
              src={isDarkMode ? '/HDCLOGOWhiteCenter.png' : '/HDCLOGOBlk.png'}
              alt="HDC logo"
              className="h-24 w-auto"
            />
          </div>
          <CardTitle className="text-4xl text-center">Sign up</CardTitle>
          <div className="flex justify-center gap-2">
            <div className={`h-2 w-12 rounded-full`} style={{
              background: step === 1
                ? (isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'hsl(var(--primary))')
                : (isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'hsl(var(--muted))')
            }} />
            <div className={`h-2 w-12 rounded-full`} style={{
              background: step === 2
                ? (isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'hsl(var(--primary))')
                : (isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'hsl(var(--muted))')
            }} />
            <div className={`h-2 w-12 rounded-full`} style={{
              background: step === 3
                ? (isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'hsl(var(--primary))')
                : (isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'hsl(var(--muted))')
            }} />
          </div>
        </CardHeader>
        <CardContent>
          {authError && (
            <Alert variant="destructive" className="mb-4" style={{
              background: isDarkMode ? 'rgba(239, 68, 68, 0.2)' : undefined,
              borderColor: isDarkMode ? 'rgba(239, 68, 68, 0.5)' : undefined,
              color: isDarkMode ? 'rgba(252, 165, 165, 1)' : undefined,
            }}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{authError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {step === 1 ? (
                <>
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full name</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="Jon Snow"
                            autoComplete="name"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="your@email.com"
                            autoComplete="email"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••"
                            autoComplete="new-password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="button"
                    className="w-full transition-all hover:brightness-90"
                    onClick={handleNextStep}
                    style={{
                      background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)',
                      backdropFilter: 'blur(10px)',
                      WebkitBackdropFilter: 'blur(10px)',
                      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.5)',
                      color: isDarkMode ? '#ffffff' : '#000000',
                    }}
                  >
                    Next
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="relative my-6">
                    <div className="flex items-center gap-4">
                      <Separator className="flex-1" style={{
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
                      }} />
                      <span className="text-xs whitespace-nowrap" style={{
                        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
                      }}>
                        Or Sign up with
                      </span>
                      <Separator className="flex-1" style={{
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
                      }} />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <div className="w-full">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        width="100%"
                        theme={isDarkMode ? "filled_black" : "outline"}
                        size="large"
                        text="signup_with"
                      />
                    </div>
                  </div>
                </>
              ) : step === 2 ? (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    {isGoogleAuth
                      ? 'Welcome! Help us personalize your experience (optional)'
                      : 'Help us personalize your experience (optional)'}
                  </div>

                  <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Job Title</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="e.g., Software Engineer"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Your current role or position</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="industry"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select your industry" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {INDUSTRY_OPTIONS.map((industry) => (
                              <SelectItem key={industry} value={industry}>
                                {industry}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="organization"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Organization</FormLabel>
                        <FormControl>
                          <Input
                            type="text"
                            placeholder="e.g., Acme Corp"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Your company or organization</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <PhoneInput
                            placeholder="Enter phone number"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>Your contact phone number</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePrevStep}
                      className="flex-1 transition-all hover:brightness-90"
                      style={{
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.5)',
                        color: isDarkMode ? '#ffffff' : '#000000',
                      }}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleNextStep}
                      className="flex-1 transition-all hover:brightness-90"
                      style={{
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.5)',
                        color: isDarkMode ? '#ffffff' : '#000000',
                      }}
                    >
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm text-muted-foreground mb-4">
                    Tell us a little about yourself
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Share a bit about yourself, your interests, or what brings you here..."
                            className="min-h-[120px] resize-none"
                            maxLength={500}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          {field.value?.length || 0}/500 characters
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="emailNotify"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          I want to receive updates via email
                        </FormLabel>
                      </FormItem>
                    )}
                  />

                  {isGoogleAuth ? (
                    // Google auth users: single button to complete setup
                    <Button
                      type="button"
                      className="w-full transition-all hover:brightness-90"
                      disabled={loading}
                      style={{
                        background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)',
                        backdropFilter: 'blur(10px)',
                        WebkitBackdropFilter: 'blur(10px)',
                        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.5)',
                        color: isDarkMode ? '#ffffff' : '#000000',
                      }}
                      onClick={async () => {
                        console.log('Button clicked - manually triggering form submission');
                        // For Google auth, bypass validation and call onSubmit directly
                        const currentValues = form.getValues();
                        // Merge all step values
                        const mergedValues = {
                          ...currentValues,
                          ...step1Values, // Overlay saved Step 1 values
                          ...step2Values, // Overlay saved Step 2 values
                        };
                        console.log('Step 1 saved values:', step1Values);
                        console.log('Step 2 saved values:', step2Values);
                        console.log('Current form values:', currentValues);
                        console.log('Merged values:', mergedValues);
                        await onSubmit(mergedValues);
                      }}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving profile...
                        </>
                      ) : (
                        'Complete Setup'
                      )}
                    </Button>
                  ) : (
                    // Email/password users: back button and submit
                    <>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handlePrevStep}
                          className="flex-1 transition-all hover:brightness-90"
                          style={{
                            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.5)',
                            color: isDarkMode ? '#ffffff' : '#000000',
                          }}
                        >
                          <ArrowLeft className="mr-2 h-4 w-4" />
                          Back
                        </Button>
                        <Button
                          type="button"
                          className="flex-1 transition-all hover:brightness-90"
                          disabled={loading}
                          onClick={async () => {
                            console.log('🔵 Create Account button clicked');
                            const currentValues = form.getValues();
                            // Merge all step values
                            const mergedValues = {
                              ...currentValues,
                              ...step1Values, // Overlay saved Step 1 values
                              ...step2Values, // Overlay saved Step 2 values
                            };
                            console.log('🔵 Step 1 saved values:', step1Values);
                            console.log('🔵 Step 2 saved values:', step2Values);
                            console.log('🔵 Current form values:', currentValues);
                            console.log('🔵 Merged values:', mergedValues);
                            await onSubmit(mergedValues);
                          }}
                          style={{
                            background: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)',
                            backdropFilter: 'blur(10px)',
                            WebkitBackdropFilter: 'blur(10px)',
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(255, 255, 255, 0.5)',
                            color: isDarkMode ? '#ffffff' : '#000000',
                          }}
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Creating account...
                            </>
                          ) : (
                            'Create Account'
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </>
              )}
            </form>
          </Form>

          <p className="text-center mt-6 text-sm">
            Already have an account?{' '}
            <Button
              variant="link"
              type="button"
              onClick={props.onNavigateToSignIn}
              className="text-primary hover:underline font-medium p-0 h-auto inline"
            >
              Sign in
            </Button>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
