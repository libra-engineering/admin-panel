import { useState, useEffect } from 'react';
import { serviceApi } from '@/services/serviceApi';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Activity, 
  AlertCircle,
  Calendar,
  Search,
  Globe,
  Users,
  Building,
  Mail} from 'lucide-react';

// Purpose enum constants
const PURPOSES = {
  fc_search: 'FirstClass Search',
  fc_scrape: 'FirstClass Scrape', 
  tvly_search: 'Tavily Search',
  tvly_scrape: 'Tavily Scrape',
  apolloio_people_search: 'Apollo People Search',
  apolloio_organization_search: 'Apollo Organization Search',
  resend_email: 'Resend Email'
} as const;

const getPurposeIcon = (purpose: string) => {
  switch (purpose) {
    case 'fc_search':
    case 'tvly_search':
    case 'apolloio_people_search':
    case 'apolloio_organization_search':
      return <Search className="h-5 w-5" />;
    case 'fc_scrape':
    case 'tvly_scrape':
      return <Globe className="h-5 w-5" />;
    case 'resend_email':
      return <Mail className="h-5 w-5" />;
    default:
      return <Activity className="h-5 w-5" />;
  }
};

const getPurposeColor = (purpose: string) => {
  switch (purpose) {
    case 'fc_search':
    case 'fc_scrape':
      return 'text-purple-500';
    case 'tvly_search':
    case 'tvly_scrape':
      return 'text-blue-500';
    case 'apolloio_people_search':
      return 'text-green-500';
    case 'apolloio_organization_search':
      return 'text-orange-500';
    case 'resend_email':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

interface AnalyticsOverview {
  totalCreditsUsed: string;
  usageByPurpose: Array<{
    purpose: string;
    totalCredits: string;
    count: string;
  }>;
  totalOrganizations: string;
  apiKeys: {
    active: string;
    total: string;
  };
}

interface UsageEntry {
  id: number;
  creditsUsed: number;
  purpose: string;
  createdAt: string;
  orgName: string;
  orgId: number;
  apiKeyId: number;
}

interface UsageResponse {
  usage: UsageEntry[];
  pagination: {
    page: number;
    limit: number;
    total: string;
    totalPages: number;
  };
}

export default function ServiceAnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [usage, setUsage] = useState<UsageEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const [overviewData, usageData] = await Promise.all([
        serviceApi.getAnalyticsOverview() as Promise<AnalyticsOverview>,
        serviceApi.getAnalyticsUsage() as Promise<UsageResponse>
      ]);
      
      setOverview(overviewData);
      setUsage(usageData.usage);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch analytics data');
    } finally {
      setIsLoading(false);
    }
  };


  const formatNumber = (num: string | number) => {
    const numValue = typeof num === 'string' ? parseInt(num) : num;
    if (numValue >= 1000000) {
      return (numValue / 1000000).toFixed(1) + 'M';
    } else if (numValue >= 1000) {
      return (numValue / 1000).toFixed(1) + 'K';
    }
    return numValue.toString();
  };

  const getPurposeName = (purpose: string) => {
    return PURPOSES[purpose as keyof typeof PURPOSES] || purpose;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            Analytics & Usage
          </h1>
          <p className="text-gray-600 mt-1">Monitor service performance and usage metrics</p>
        </div>
       
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Credits Used</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(overview.totalCreditsUsed)}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Active API Keys</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.apiKeys.active}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Organizations</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.totalOrganizations}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="p-6">
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total API Keys</p>
                  <p className="text-2xl font-bold text-gray-900">{overview.apiKeys.total}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Usage by Purpose */}
      {overview && overview.usageByPurpose && overview.usageByPurpose.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              Credits Usage by Purpose
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {overview.usageByPurpose.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-4 border-l-4 border-l-blue-400">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        
                        <p className="text-sm font-medium text-gray-700">{getPurposeName(item.purpose)}</p>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{formatNumber(item.totalCredits)} <span className="text-sm font-normal text-gray-500">credits</span></p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Usage Details */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            API Usage History
          </h3>
          
          {usage.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No data available</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Purpose
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Credits Used
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      API Key ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {usage.map((metric) => (
                    <tr key={metric.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-left whitespace-nowrap">
                        <div className="flex items-center">
                          <Badge variant="default" className="font-mono">
                            {getPurposeName(metric.purpose)}
                          </Badge>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">{metric.creditsUsed}</span> credits
                      </td>
                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-900">
                        {metric.orgName} 
                      </td>
                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-900">
                        {metric.apiKeyId}
                      </td>
                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          {new Date(metric.createdAt).toLocaleString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 