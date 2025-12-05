import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Plus, Search, Globe, Users } from 'lucide-react';

interface Company {
  id: string;
  name: string;
  domain?: string;
  industry?: string;
  _count?: {
    contacts: number;
    deals: number;
  };
  createdAt: string;
}

interface CompaniesResponse {
  data: Company[];
  pagination: {
    total: number;
    limit: number;
    cursor: string | null;
    hasMore: boolean;
  };
}

export default function Companies() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['companies', search],
    queryFn: () => api.get<CompaniesResponse>(`/companies?search=${search}&limit=50`),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Companies</h1>
          <p className="text-muted-foreground">
            {data?.pagination.total || 0} companies
          </p>
        </div>
        <Button asChild>
          <Link to="/companies/new">
            <Plus className="h-4 w-4 mr-2" />
            Add Company
          </Link>
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-24 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : !data?.data.length ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">
              {search ? 'No companies found' : 'No companies yet. Add your first company!'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.data.map((company) => (
            <Link key={company.id} to={`/companies/${company.id}`}>
              <Card className="hover:border-primary transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{company.name}</CardTitle>
                  {company.industry && (
                    <Badge variant="secondary">{company.industry}</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {company.domain && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Globe className="h-3 w-3" />
                      {company.domain}
                    </div>
                  )}
                  {company._count && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {company._count.contacts} contacts, {company._count.deals} deals
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground pt-2">
                    Added {formatDate(company.createdAt)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
