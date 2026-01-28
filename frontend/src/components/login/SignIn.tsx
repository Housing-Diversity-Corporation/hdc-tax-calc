import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, AlertCircle } from 'lucide-react';
import { authService, tokenService, API_BASE_URL } from '../../services/api';
import { GoogleLogin } from '@react-oauth/google';
import ForgotPassword from './ForgotPassword';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../ThemeToggle';

const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  rememberMe: z.boolean().optional(),
});

type SignInFormValues = z.infer<typeof signInSchema>;

export default function SignIn(props: { onNavigateToSignUp?: () => void; onAuthSuccess?: () => void; onProfileIncomplete?: () => void }) {
  const { isDarkMode } = useTheme();
  const [forgotPasswordOpen, setForgotPasswordOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [authError, setAuthError] = React.useState('');

  const form = useForm<SignInFormValues>({
    resolver: zodResolver(signInSchema),
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const checkProfileCompletion = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/account/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        return true; // Assume complete if we can't check
      }

      const user = await response.json();

      // Check if profile is incomplete (missing any of the key fields)
      const isIncomplete = !user.jobTitle && !user.industry && !user.organization;
      return !isIncomplete;
    } catch (error) {
      console.error('Error checking profile completion:', error);
      return true; // Assume complete if there's an error
    }
  };

  const handleGoogleSuccess = async (credentialResponse: { credential?: string }) => {
    console.log('🔵 Google sign-in button clicked - handleGoogleSuccess triggered');
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

      // Check if user needs to complete their profile
      const isProfileComplete = await checkProfileCompletion(response.jwt);

      if (!isProfileComplete && props.onProfileIncomplete) {
        props.onProfileIncomplete();
      } else if (props.onAuthSuccess) {
        props.onAuthSuccess();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error ?
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Google authentication failed' :
        'Google authentication failed';
      setAuthError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    console.log('🔴 Google Sign-In error - handleGoogleError triggered');
    setAuthError('Google Sign-In failed');
  };

  const onSubmit = async (values: SignInFormValues) => {
    setAuthError('');
    setLoading(true);

    try {
      const response = await authService.login({
        username: values.email,
        password: values.password,
      });

      tokenService.setToken(response.jwt);
      if (props.onAuthSuccess) {
        props.onAuthSuccess();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error ?
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Login failed. Please try again.' :
        'Login failed. Please try again.';
      setAuthError(errorMessage);
    } finally {
      setLoading(false);
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

      <Card className="w-full max-w-[600px] lg:max-w-[700px] xl:max-w-[800px] bg-card border shadow-2xl [&_input]:focus-visible:ring-1 [&_input]:focus-visible:ring-offset-0 [&_input]:!border-[var(--input-border-color)] [&_button[role='combobox']]:!border-[var(--input-border-color)]" style={{
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
          <CardTitle className="text-4xl text-center">Sign in</CardTitle>
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
                        autoFocus
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
                        autoComplete="current-password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel className="text-sm font-normal cursor-pointer">
                      Remember me
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full transition-all hover:brightness-90"
                disabled={loading}
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
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>

              <div className="text-center">
                <Button
                  variant="link"
                  type="button"
                  onClick={() => setForgotPasswordOpen(true)}
                  className="text-sm text-primary hover:underline p-0 h-auto font-normal"
                >
                  Forgot your password?
                </Button>
              </div>
            </form>
          </Form>

          <div className="relative my-6">
            <div className="flex items-center gap-4">
              <Separator className="flex-1" style={{
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
              }} />
              <span className="text-xs whitespace-nowrap" style={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)'
              }}>
                Or Sign in with
              </span>
              <Separator className="flex-1" style={{
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)'
              }} />
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-full">
              <div onClick={() => console.log('🟡 Wrapper div clicked')}>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  width="100%"
                  theme={isDarkMode ? "filled_black" : "outline"}
                  size="large"
                  text="signin_with"
                  useOneTap={false}
                  auto_select={false}
                />
              </div>
            </div>
          </div>

          <p className="text-center mt-6 text-sm">
            Don't have an account?{' '}
            <Button
              variant="link"
              type="button"
              onClick={props.onNavigateToSignUp}
              className="text-primary hover:underline font-medium p-0 h-auto inline"
            >
              Sign up
            </Button>
          </p>
        </CardContent>
      </Card>

      <ForgotPassword
        open={forgotPasswordOpen}
        onClose={() => setForgotPasswordOpen(false)}
      />
    </div>
  );
}
