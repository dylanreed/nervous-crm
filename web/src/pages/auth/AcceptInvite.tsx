import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

const acceptInviteSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

type AcceptInviteForm = z.infer<typeof acceptInviteSchema>;

interface InviteInfo {
  email: string;
  teamName: string;
  role: string;
}

export default function AcceptInvite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AcceptInviteForm>({
    resolver: zodResolver(acceptInviteSchema),
  });

  useEffect(() => {
    async function validateToken() {
      if (!token) {
        setError('Invalid invite link');
        setIsValidating(false);
        return;
      }

      try {
        const response = await api.get<{ data: InviteInfo }>(`/auth/invite/${token}`);
        setInviteInfo(response.data);
      } catch {
        setError('This invite link is invalid or has expired');
      } finally {
        setIsValidating(false);
      }
    }

    validateToken();
  }, [token]);

  const onSubmit = async (data: AcceptInviteForm) => {
    if (!token) return;

    setIsLoading(true);
    try {
      await api.post('/auth/accept-invite', {
        token,
        name: data.name,
        password: data.password,
      });
      toast({
        title: 'Welcome!',
        description: 'Your account has been created. Please sign in.',
      });
      navigate('/login');
    } catch (err) {
      toast({
        title: 'Failed to accept invite',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !inviteInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Invalid Invite</CardTitle>
          <CardDescription>{error || 'This invite link is not valid'}</CardDescription>
        </CardHeader>
        <CardFooter>
          <Button onClick={() => navigate('/login')} variant="outline" className="w-full">
            Go to Login
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Join {inviteInfo.teamName}</CardTitle>
        <CardDescription>
          You've been invited to join as a {inviteInfo.role}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={inviteInfo.email} disabled />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Your name</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Create password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Minimum 8 characters"
              {...register('password')}
            />
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Accept Invite'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
