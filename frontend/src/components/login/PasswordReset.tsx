import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authService } from '../../services/api';
import { useTheme } from '../../contexts/ThemeContext';
import ThemeToggle from '../ThemeToggle';

const passwordResetSchema = z.object({
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type PasswordResetFormValues = z.infer<typeof passwordResetSchema>;

interface PasswordResetProps {
  token: string;
  onSuccess: () => void;
}

export default function PasswordReset({ token, onSuccess }: PasswordResetProps) {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);

  const form = useForm<PasswordResetFormValues>({
    resolver: zodResolver(passwordResetSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: PasswordResetFormValues) => {
    setError('');
    setLoading(true);

    try {
      await authService.resetPassword({ token, newPassword: values.password });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error && 'response' in error ?
        (error as { response?: { data?: { message?: string } } }).response?.data?.message || 'Password reset failed. The link may be expired or invalid.' :
        'Password reset failed. The link may be expired or invalid.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative" style={{
        background: isDarkMode
          ? 'radial-gradient(ellipse 900px 700px at 18% 25%, #1c3333 0%, transparent 40%), radial-gradient(ellipse 800px 600px at 82% 75%, #142626 0%, transparent 35%), radial-gradient(ellipse 600px 400px at 50% 95%, #1c3333 0%, transparent 30%), linear-gradient(180deg, #080e0e 0%, #0d1616 60%, #142626 100%)'
          : 'radial-gradient(ellipse 900px 700px at 18% 25%, #92c3c2 0%, transparent 40%), radial-gradient(ellipse 800px 600px at 82% 75%, #a8cfce 0%, transparent 35%), radial-gradient(ellipse 600px 400px at 50% 95%, #92c3c2 0%, transparent 30%), linear-gradient(180deg, #f8fafa 0%, #e8f4f3 60%, #a8cfce 100%)'
      }}>
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>

        <Card className="w-full max-w-[450px]">
          <CardHeader className="space-y-4">
            <div className="flex justify-center">
              <img
                src={isDarkMode ? '/HDCLOGOWhiteCenter.png' : '/HDCLOGOBlk.png'}
                alt="HDC logo"
                className="h-24 w-auto"
              />
            </div>
            <CardTitle className="text-4xl text-center">Password Reset Successful</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className="bg-green-50 text-green-900 border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Your password has been successfully reset. Redirecting to sign in...
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{
      background: isDarkMode
        ? 'radial-gradient(ellipse 900px 700px at 18% 25%, #1c3333 0%, transparent 40%), radial-gradient(ellipse 800px 600px at 82% 75%, #142626 0%, transparent 35%), radial-gradient(ellipse 600px 400px at 50% 95%, #1c3333 0%, transparent 30%), linear-gradient(180deg, #080e0e 0%, #0d1616 60%, #142626 100%)'
        : 'radial-gradient(ellipse 900px 700px at 18% 25%, #92c3c2 0%, transparent 40%), radial-gradient(ellipse 800px 600px at 82% 75%, #a8cfce 0%, transparent 35%), radial-gradient(ellipse 600px 400px at 50% 95%, #92c3c2 0%, transparent 30%), linear-gradient(180deg, #f8fafa 0%, #e8f4f3 60%, #a8cfce 100%)'
    }}>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-[450px]">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img
              src={isDarkMode ? '/HDCLOGOWhiteCenter.png' : '/HDCLOGOBlk.png'}
              alt="HDC logo"
              className="h-24 w-auto"
            />
          </div>
          <CardTitle className="text-4xl text-center">Reset Your Password</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••"
                        autoComplete="new-password"
                        autoFocus
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirm New Password</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="••••••"
                        autoComplete="new-password"
                        disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
