import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';

const activitySchema = z.object({
  type: z.enum(['call', 'email', 'meeting', 'task']),
  title: z.string().min(1, 'Title is required').max(200),
  description: z.string().max(1000).optional().or(z.literal('')),
  dueAt: z.string().optional().or(z.literal('')),
  contactId: z.string().optional().or(z.literal('')),
  dealId: z.string().optional().or(z.literal('')),
});

type ActivityForm = z.infer<typeof activitySchema>;

interface Contact {
  id: string;
  name: string;
}

interface Deal {
  id: string;
  title: string;
}

export default function ActivityNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: () => api.get<{ data: Contact[] }>('/contacts?limit=100'),
  });

  const { data: dealsData } = useQuery({
    queryKey: ['deals-list'],
    queryFn: () => api.get<{ data: Deal[] }>('/deals?limit=100'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivityForm>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: 'task',
      title: '',
      description: '',
      dueAt: '',
      contactId: '',
      dealId: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ActivityForm) => {
      const payload = {
        type: data.type,
        title: data.title,
        description: data.description || undefined,
        dueAt: data.dueAt ? new Date(data.dueAt).toISOString() : undefined,
        contactId: data.contactId || undefined,
        dealId: data.dealId || undefined,
      };
      return api.post('/activities', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ title: 'Activity created successfully' });
      navigate('/activities');
    },
    onError: (error) => {
      toast({
        title: 'Failed to create activity',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: ActivityForm) => {
    setIsSubmitting(true);
    try {
      await createMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/activities">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add Activity</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Activity Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                {...register('type')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="task">Task</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                placeholder="Follow up on proposal"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                placeholder="Add any notes or details..."
                {...register('description')}
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueAt">Due Date</Label>
              <Input
                id="dueAt"
                type="datetime-local"
                {...register('dueAt')}
              />
              {errors.dueAt && (
                <p className="text-sm text-destructive">{errors.dueAt.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactId">Related Contact</Label>
              <select
                id="contactId"
                {...register('contactId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">No contact</option>
                {contactsData?.data.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dealId">Related Deal</Label>
              <select
                id="dealId"
                {...register('dealId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">No deal</option>
                {dealsData?.data.map((deal) => (
                  <option key={deal.id} value={deal.id}>
                    {deal.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Activity'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/activities">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
