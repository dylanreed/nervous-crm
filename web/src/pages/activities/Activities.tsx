import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Plus, Check, Clock, AlertCircle, Phone, Mail, Calendar, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Activity {
  id: string;
  type: string;
  title: string;
  description?: string;
  dueAt?: string;
  completedAt?: string;
  contact?: { id: string; name: string };
  deal?: { id: string; title: string };
  user: { id: string; name: string };
}

interface ActivitiesResponse {
  data: Activity[];
  pagination: {
    total: number;
    limit: number;
    cursor: string | null;
    hasMore: boolean;
  };
}

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  task: FileText,
};

const activityColors: Record<string, string> = {
  call: 'bg-blue-100 text-blue-800',
  email: 'bg-green-100 text-green-800',
  meeting: 'bg-purple-100 text-purple-800',
  task: 'bg-orange-100 text-orange-800',
};

export default function Activities() {
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'overdue'>('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['activities', filter],
    queryFn: () => {
      if (filter === 'upcoming') {
        return api.get<{ data: Activity[] }>('/activities/upcoming');
      }
      if (filter === 'overdue') {
        return api.get<{ data: Activity[] }>('/activities/overdue');
      }
      return api.get<ActivitiesResponse>('/activities?limit=50&sort=dueAt');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.post(`/activities/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activities'] });
    },
  });

  const activities = filter === 'all'
    ? (data as ActivitiesResponse | undefined)?.data || []
    : (data as { data: Activity[] } | undefined)?.data || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Activities</h1>
          <p className="text-muted-foreground">
            Track your tasks, calls, and meetings
          </p>
        </div>
        <Button asChild>
          <Link to="/activities/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Activity
          </Link>
        </Button>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          All
        </Button>
        <Button
          variant={filter === 'upcoming' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('upcoming')}
        >
          <Clock className="h-4 w-4 mr-1" />
          Upcoming
        </Button>
        <Button
          variant={filter === 'overdue' ? 'destructive' : 'outline'}
          size="sm"
          onClick={() => setFilter('overdue')}
        >
          <AlertCircle className="h-4 w-4 mr-1" />
          Overdue
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-16 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !activities.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              {filter === 'all' ? 'No activities yet' : `No ${filter} activities`}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {activities.map((activity) => {
            const Icon = activityIcons[activity.type] || FileText;
            const isOverdue = activity.dueAt && !activity.completedAt && new Date(activity.dueAt) < new Date();

            return (
              <Card
                key={activity.id}
                className={cn(
                  'transition-opacity',
                  activity.completedAt && 'opacity-60'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => toggleMutation.mutate(activity.id)}
                      className={cn(
                        'mt-1 flex-shrink-0 h-5 w-5 rounded border-2 flex items-center justify-center transition-colors',
                        activity.completedAt
                          ? 'bg-primary border-primary text-primary-foreground'
                          : 'border-muted-foreground hover:border-primary'
                      )}
                    >
                      {activity.completedAt && <Check className="h-3 w-3" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={activityColors[activity.type]}>
                          <Icon className="h-3 w-3 mr-1" />
                          {activity.type}
                        </Badge>
                        {isOverdue && (
                          <Badge variant="destructive">Overdue</Badge>
                        )}
                      </div>
                      <p className={cn(
                        'font-medium mt-1',
                        activity.completedAt && 'line-through'
                      )}>
                        {activity.title}
                      </p>
                      {activity.description && (
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {activity.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        {activity.dueAt && (
                          <span>{formatDate(activity.dueAt)}</span>
                        )}
                        {activity.contact && (
                          <Link
                            to={`/contacts/${activity.contact.id}`}
                            className="hover:text-primary"
                          >
                            {activity.contact.name}
                          </Link>
                        )}
                        {activity.deal && (
                          <Link
                            to={`/deals/${activity.deal.id}`}
                            className="hover:text-primary"
                          >
                            {activity.deal.title}
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
