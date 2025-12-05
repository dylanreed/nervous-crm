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

const dealSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200),
  value: z.string().optional().or(z.literal('')),
  stage: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost']),
  probability: z.string().optional().or(z.literal('')),
  companyId: z.string().optional().or(z.literal('')),
  contactId: z.string().optional().or(z.literal('')),
});

type DealForm = z.infer<typeof dealSchema>;

interface Company {
  id: string;
  name: string;
}

interface Contact {
  id: string;
  name: string;
}

export default function DealNew() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: companiesData } = useQuery({
    queryKey: ['companies-list'],
    queryFn: () => api.get<{ data: Company[] }>('/companies?limit=100'),
  });

  const { data: contactsData } = useQuery({
    queryKey: ['contacts-list'],
    queryFn: () => api.get<{ data: Contact[] }>('/contacts?limit=100'),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DealForm>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      title: '',
      value: '',
      stage: 'lead',
      probability: '',
      companyId: '',
      contactId: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: DealForm) => {
      const payload = {
        title: data.title,
        value: data.value ? parseFloat(data.value) : undefined,
        stage: data.stage,
        probability: data.probability ? parseInt(data.probability, 10) : undefined,
        companyId: data.companyId || undefined,
        contactId: data.contactId || undefined,
      };
      return api.post('/deals', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deals'] });
      queryClient.invalidateQueries({ queryKey: ['deals-pipeline'] });
      toast({ title: 'Deal created successfully' });
      navigate('/deals');
    },
    onError: (error) => {
      toast({
        title: 'Failed to create deal',
        description: error instanceof Error ? error.message : 'Please try again',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = async (data: DealForm) => {
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
          <Link to="/deals">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold">Add Deal</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Deal Information</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Deal Title *</Label>
              <Input
                id="title"
                placeholder="Enterprise Software License"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="value">Value ($)</Label>
                <Input
                  id="value"
                  type="number"
                  step="0.01"
                  placeholder="10000"
                  {...register('value')}
                />
                {errors.value && (
                  <p className="text-sm text-destructive">{errors.value.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="probability">Win Probability (%)</Label>
                <Input
                  id="probability"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="50"
                  {...register('probability')}
                />
                {errors.probability && (
                  <p className="text-sm text-destructive">{errors.probability.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stage">Stage *</Label>
              <select
                id="stage"
                {...register('stage')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="lead">Lead</option>
                <option value="qualified">Qualified</option>
                <option value="proposal">Proposal</option>
                <option value="negotiation">Negotiation</option>
                <option value="won">Won</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyId">Company</Label>
              <select
                id="companyId"
                {...register('companyId')}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">No company</option>
                {companiesData?.data.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactId">Contact</Label>
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

            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Creating...' : 'Create Deal'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/deals">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
