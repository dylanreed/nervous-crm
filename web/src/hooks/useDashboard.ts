import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

interface PipelineStage {
  stage: string;
  count: number;
  totalValue: number;
  deals: Array<{
    id: string;
    title: string;
    value: number;
  }>;
}

interface Activity {
  id: string;
  type: string;
  title: string;
  dueAt: string;
  contact?: { id: string; name: string };
  deal?: { id: string; title: string };
}

interface Contact {
  id: string;
  name: string;
  email: string;
  company?: { name: string };
  createdAt: string;
}

interface DashboardData {
  deals: {
    open: number;
    totalValue: number;
    wonThisMonth: number;
    wonValue: number;
  };
  activities: {
    upcoming: Activity[];
    overdue: Activity[];
  };
  recentContacts: Contact[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async (): Promise<DashboardData> => {
      const [pipelineRes, upcomingRes, overdueRes, contactsRes] = await Promise.all([
        api.get<{ data: PipelineStage[] }>('/deals/pipeline'),
        api.get<{ data: Activity[] }>('/activities/upcoming?days=7'),
        api.get<{ data: Activity[] }>('/activities/overdue'),
        api.get<{ data: Contact[]; pagination: { total: number } }>('/contacts?limit=5&sort=-createdAt'),
      ]);

      const pipeline = pipelineRes.data;
      const openStages = ['lead', 'qualified', 'proposal', 'negotiation'];
      const openDeals = pipeline.filter(s => openStages.includes(s.stage));
      const wonDeals = pipeline.find(s => s.stage === 'won');

      return {
        deals: {
          open: openDeals.reduce((sum, s) => sum + s.count, 0),
          totalValue: openDeals.reduce((sum, s) => sum + s.totalValue, 0),
          wonThisMonth: wonDeals?.count || 0,
          wonValue: wonDeals?.totalValue || 0,
        },
        activities: {
          upcoming: upcomingRes.data,
          overdue: overdueRes.data,
        },
        recentContacts: contactsRes.data,
      };
    },
  });
}
