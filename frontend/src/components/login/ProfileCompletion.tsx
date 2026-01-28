import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Loader2, AlertCircle } from 'lucide-react';
import { tokenService, API_BASE_URL } from '../../services/api';
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

const profileSchema = z.object({
  jobTitle: z.string().optional(),
  industry: z.string().optional(),
  organization: z.string().optional(),
  bio: z.string().max(500, 'Bio must be 500 characters or less').optional(),
  emailNotify: z.boolean().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileCompletionProps {
  onComplete?: () => void;
  title?: string;
  description?: string;
  allowSkip?: boolean;
}

export default function ProfileCompletion({
  onComplete,
  title = "Complete Your Profile",
  description = "Help us personalize your experience by sharing a few details about yourself.",
  allowSkip = true
}: ProfileCompletionProps) {
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      jobTitle: '',
      industry: '',
      organization: '',
      bio: '',
      emailNotify: false,
    },
  });

  const onSubmit = async (values: ProfileFormValues) => {
    setError('');
    setLoading(true);

    try {
      const jwtToken = tokenService.getToken();

      if (!jwtToken) {
        setError('Authentication token not found. Please sign in again.');
        return;
      }

      // Update profile with additional information
      const response = await fetch(`${API_BASE_URL}/account/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${jwtToken}`,
        },
        body: JSON.stringify({
          jobTitle: values.jobTitle || '',
          industry: values.industry || '',
          organization: values.organization || '',
          bio: values.bio || '',
          emailNotify: values.emailNotify || false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      if (onComplete) {
        onComplete();
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update profile. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    if (onComplete) {
      onComplete();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{
      background: isDarkMode
        ? 'radial-gradient(at 50% 50%, hsla(210, 100%, 16%, 0.5), hsl(220, 30%, 5%))'
        : 'radial-gradient(ellipse at 50% 50%, hsl(210, 100%, 97%), hsl(0, 0%, 100%))'
    }}>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <Card className="w-full max-w-[600px]">
        <CardHeader className="space-y-4">
          <div className="flex justify-center">
            <img
              src={isDarkMode ? '/HDCLOGOWhiteCenter.png' : '/HDCLOGOBlk.png'}
              alt="HDC logo"
              className="h-24 w-auto"
            />
          </div>
          <CardTitle className="text-3xl text-center">{title}</CardTitle>
          <CardDescription className="text-center">{description}</CardDescription>
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
                name="jobTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., Software Engineer, Product Manager"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Your current role or position
                    </FormDescription>
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                    <FormDescription>
                      The industry you work in
                    </FormDescription>
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
                        placeholder="Company or organization name"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Where you currently work
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Complete Profile'
                  )}
                </Button>
              </div>

              {allowSkip && (
                <div className="text-center">
                  <Button
                    variant="link"
                    type="button"
                    onClick={handleSkip}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors p-0 h-auto font-normal"
                    disabled={loading}
                  >
                    Skip and continue
                  </Button>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
