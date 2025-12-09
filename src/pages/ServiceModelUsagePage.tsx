import { useState, useEffect, useMemo } from 'react';
import { serviceApi } from '@/services/serviceApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

interface UsageRecord {
  id: number;
  model: string;
  provider: string;
  orgId: number;
  apiKeyId: number;
  inputTokens: number | string;
  outputTokens: number | string;
  totalTokens: number | string;
  inputCost: number | string;
  outputCost: number | string;
  totalCost: number | string;
  createdAt: string;
  orgName: string;
}

interface AggregatedUsage {
  orgId: number;
  orgName: string;
  model: string;
  provider: string;
  totalInputTokens: number | string;
  totalOutputTokens: number | string;
  totalTokens: number | string;
  totalInputCost: number | string;
  totalOutputCost: number | string;
  totalCost: number | string;
  usageCount: number | string;
}

interface ModelUsageResponse {
  usage: UsageRecord[];
  aggregatedUsage: AggregatedUsage[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Organization {
  id: number;
  name: string;
}

interface Model {
  id: number;
  model: string;
  providerId: number;
  provider?: {
    id: number;
    name: string;
  };
}

interface ModelProvider {
  id: number;
  name: string;
}

export default function ServiceModelUsagePage() {
  const [usageData, setUsageData] = useState<ModelUsageResponse | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingFilters, setIsLoadingFilters] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [filters, setFilters] = useState({
    orgId: '',
    model: '',
    provider: ''
  });
  const [activeView, setActiveView] = useState<'detailed' | 'aggregated'>('aggregated');

  useEffect(() => {
    fetchFilterOptions();
  }, []);

  useEffect(() => {
    fetchUsageData();
  }, [page, limit]);

  const fetchFilterOptions = async () => {
    try {
      setIsLoadingFilters(true);
      const [orgsData, modelsData, providersData] = await Promise.all([
        serviceApi.getOrganizations(),
        serviceApi.getModels(),
        serviceApi.getModelProviders()
      ]);
      setOrganizations(orgsData as Organization[]);
      setModels(modelsData as Model[]);
      setProviders(providersData as ModelProvider[]);
    } catch (error) {
      console.error('Failed to fetch filter options:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch filter options');
    } finally {
      setIsLoadingFilters(false);
    }
  };

  const fetchUsageData = async () => {
    try {
      setIsLoading(true);
      const params: any = { page, limit };
      
      if (filters.orgId) params.orgId = parseInt(filters.orgId);
      if (filters.model) params.model = filters.model;
      if (filters.provider) params.provider = filters.provider;

      const data = await serviceApi.getModelUsage(params);
      setUsageData(data as ModelUsageResponse);
    } catch (error) {
      console.error('Failed to fetch model usage:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch model usage');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleApplyFilters = () => {
    setPage(1);
    fetchUsageData();
  };

  const handleClearFilters = () => {
    setFilters({ orgId: '', model: '', provider: '' });
    setPage(1);
    setTimeout(() => fetchUsageData(), 0);
  };

  const organizationOptions = useMemo(() => {
    return [
      { value: '', label: 'All Organizations' },
      ...organizations.map(org => ({ value: org.id.toString(), label: `${org.name} (ID: ${org.id})` }))
    ];
  }, [organizations]);

  const modelOptions = useMemo(() => {
    const uniqueModels = Array.from(new Set(models.map(m => m.model))).sort();
    return [
      { value: '', label: 'All Models' },
      ...uniqueModels.map(model => ({ value: model, label: model }))
    ];
  }, [models]);

  const providerOptions = useMemo(() => {
    return [
      { value: '', label: 'All Providers' },
      ...providers.map(provider => ({ value: provider.name, label: provider.name }))
    ];
  }, [providers]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCost = (cost: number | string) => {
    const numCost = typeof cost === 'string' ? parseFloat(cost) || 0 : cost;
    return `$${numCost.toFixed(4)}`;
  };

  const formatTokens = (tokens: number | string) => {
    const numTokens = typeof tokens === 'string' ? parseFloat(tokens) || 0 : tokens;
    return numTokens.toLocaleString();
  };

  const getTotalStats = () => {
    if (!usageData?.aggregatedUsage) return null;
    
    const totalTokens = usageData.aggregatedUsage.reduce((sum, item) => {
      const tokens = typeof item.totalTokens === 'string' ? parseFloat(item.totalTokens) || 0 : item.totalTokens;
      return sum + tokens;
    }, 0);
    const totalCost = usageData.aggregatedUsage.reduce((sum, item) => {
      const cost = typeof item.totalCost === 'string' ? parseFloat(item.totalCost) || 0 : item.totalCost;
      return sum + cost;
    }, 0);
    const totalOrgs = new Set(usageData.aggregatedUsage.map(item => item.orgId)).size;
    const totalRecords = usageData.aggregatedUsage.reduce((sum, item) => {
      const count = typeof item.usageCount === 'string' ? parseInt(item.usageCount, 10) || 0 : item.usageCount;
      return sum + count;
    }, 0);

    return { totalTokens, totalCost, totalOrgs, totalRecords };
  };

  const stats = getTotalStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Model Usage</h1>
          <p className="text-gray-600 mt-1">Organization-wise model usage and cost analytics</p>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-blue-500">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Organizations</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrgs}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Tokens</p>
                  <p className="text-2xl font-bold text-gray-900">{formatTokens(stats.totalTokens)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Cost</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCost(stats.totalCost)}</p>
                </div>
                <DollarSign className="h-8 w-8 text-purple-500" />
              </div>
            </div>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Usage Records</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalRecords}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card>
        <div className="p-6">
          <div className="mb-4 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <Select
                  label="Organization"
                  value={filters.orgId}
                  onChange={(e) => handleFilterChange('orgId', e.target.value)}
                  options={organizationOptions}
                  disabled={isLoadingFilters}
                />
              </div>
              <div className="flex-1">
                <Select
                  label="Model"
                  value={filters.model}
                  onChange={(e) => handleFilterChange('model', e.target.value)}
                  options={modelOptions}
                  disabled={isLoadingFilters}
                />
              </div>
              <div className="flex-1">
                <Select
                  label="Provider"
                  value={filters.provider}
                  onChange={(e) => handleFilterChange('provider', e.target.value)}
                  options={providerOptions}
                  disabled={isLoadingFilters}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleApplyFilters} size="sm" disabled={isLoadingFilters}>
                Apply Filters
              </Button>
              <Button onClick={handleClearFilters} variant="outline" size="sm" disabled={isLoadingFilters}>
                Clear Filters
              </Button>
            </div>
          </div>

          <div className="mb-4 border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveView('aggregated')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'aggregated'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Aggregated View
              </button>
              <button
                onClick={() => setActiveView('detailed')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeView === 'detailed'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Detailed View
              </button>
            </nav>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : !usageData ? (
            <div className="text-center py-12 text-gray-500">No data available</div>
          ) : (
            <>
              {activeView === 'aggregated' && usageData.aggregatedUsage.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Tokens
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Total Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Records
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usageData.aggregatedUsage.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{item.orgName}</div>
                            <div className="text-xs text-gray-500">ID: {item.orgId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.model}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.provider}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatTokens(item.totalTokens)}</div>
                            <div className="text-xs text-gray-500">
                              In: {formatTokens(item.totalInputTokens)} | Out: {formatTokens(item.totalOutputTokens)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{formatCost(item.totalCost)}</div>
                            <div className="text-xs text-gray-500">
                              In: {formatCost(item.totalInputCost)} | Out: {formatCost(item.totalOutputCost)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {typeof item.usageCount === 'string' 
                                ? parseInt(item.usageCount, 10).toLocaleString() 
                                : item.usageCount.toLocaleString()}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {activeView === 'detailed' && usageData.usage.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Organization
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Model
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Provider
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tokens
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Cost
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          API Key ID
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Created At
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {usageData.usage.map((record) => (
                        <tr key={record.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{record.orgName}</div>
                            <div className="text-xs text-gray-500">ID: {record.orgId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{record.model}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{record.provider}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatTokens(record.totalTokens)}</div>
                            <div className="text-xs text-gray-500">
                              In: {formatTokens(record.inputTokens)} | Out: {formatTokens(record.outputTokens)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{formatCost(record.totalCost)}</div>
                            <div className="text-xs text-gray-500">
                              In: {formatCost(record.inputCost)} | Out: {formatCost(record.outputCost)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{record.apiKeyId}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{formatDate(record.createdAt)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {((activeView === 'aggregated' && usageData.aggregatedUsage.length === 0) ||
                (activeView === 'detailed' && usageData.usage.length === 0)) && (
                <div className="text-center py-12 text-gray-500">
                  No usage data found
                </div>
              )}

              {activeView === 'detailed' && usageData.pagination && (
                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    Page {usageData.pagination.page} of {usageData.pagination.totalPages} (Total: {usageData.pagination.total} records)
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => p + 1)}
                      disabled={page >= usageData.pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </Card>
    </div>
  );
}
