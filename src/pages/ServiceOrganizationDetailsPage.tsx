import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serviceApi } from '@/services/serviceApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  AlertCircle, 
  ArrowLeft,
  Edit,
  Key,
  BarChart3,
  Zap,
  Activity,
  Users,
  Save,
  X,
  CheckCircle,
  Copy,
  RefreshCw,
  Server
} from 'lucide-react';
import { toast } from 'sonner';
import { getToolIcon } from '@/lib/icons';

interface ApiKey {
  id: number;
  orgId: number;
  key: string;
  deleted: boolean;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UsageMetric {
  id: number;
  orgId: number;
  apiKeyId: number;
  creditsUsed: number;
  purpose: string;
  createdAt: string;
}

interface Organization {
  id: number;
  name: string;
  domain?: string;
  seats: number;
  active: boolean;
  selfHosted: boolean;
  selfHostedApiUrl?: string;
  createdAt: string;
  updatedAt: string;
  apiKeys?: ApiKey[];
  usageMetrics?: UsageMetric[];
}

interface EditOrgForm {
  name: string;
  domain: string;
  seats: number;
  selfHosted: boolean;
  selfHostedApiUrl: string;
}

interface UsageUser {
  id: string;
  name: string;
  email: string;
  role: string;
  title: string;
  function: string;
  createdAt: string;
  updatedAt: string;
  noOfChats: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  noOfUserMemories: number;
  onboardingComplete: boolean;
}

interface UsageData {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  users: UsageUser[];
}

const PURPOSES = {
  fc_search: 'FirstClass Search',
  fc_scrape: 'FirstClass Scrape', 
  tvly_search: 'Tavily Search',
  tvly_scrape: 'Tavily Scrape',
  apolloio_people_search: 'Apollo People Search',
  apolloio_organization_search: 'Apollo Organization Search',
  resend_email: 'Resend Email'
} as const;

const getPurposeName = (purpose: string) => {
  return PURPOSES[purpose as keyof typeof PURPOSES] || purpose;
};

export default function ServiceOrganizationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoadingUsage, setIsLoadingUsage] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<EditOrgForm>({
    name: '',
    domain: '',
    seats: 1,
    selfHosted: false,
    selfHostedApiUrl: ''
  });

  // Refresh states
  const [refreshing, setRefreshing] = useState<{
    toolPrompts: boolean;
    prompts: boolean;
    agents: boolean;
    workflows: boolean;
  }>({
    toolPrompts: false,
    prompts: false,
    agents: false,
    workflows: false
  });

  // Available items for refresh
  const [availableItems, setAvailableItems] = useState<{
    toolPrompts: any[];
    prompts: any[];
    agents: any[];
    workflows: any[];
  }>({
    toolPrompts: [],
    prompts: [],
    agents: [],
    workflows: []
  });

  const [loadingItems, setLoadingItems] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'toolPrompts' | 'prompts' | 'agents' | 'workflows'>('toolPrompts');
  const [mainTab, setMainTab] = useState<'dashboard' | 'cache' | 'users'>('dashboard');

  useEffect(() => {
    if (id) {
      fetchOrganizationDetails(id);
    }
  }, [id]);

  useEffect(() => {
    if (organization?.selfHosted && organization?.selfHostedApiUrl && id) {
      fetchUsageData(id);
    }
  }, [organization?.selfHosted, organization?.selfHostedApiUrl, id]);

  useEffect(() => {
    if (organization?.selfHosted && organization?.selfHostedApiUrl) {
      fetchAvailableItems();
    }
  }, [organization?.selfHosted, organization?.selfHostedApiUrl]);

  const handleCopyApiKey = (key: string) => {
    navigator.clipboard.writeText(key);
    toast.success('API Key copied to clipboard');
  };

  const fetchOrganizationDetails = async (orgId: string) => {
    try {
      setIsLoading(true);
      const orgDetails = await serviceApi.getOrganizationById(orgId) as Organization;
      setOrganization(orgDetails);
      setEditForm({
        name: orgDetails.name,
        domain: orgDetails.domain || '',
        seats: orgDetails.seats,
        selfHosted: orgDetails.selfHosted || false,
        selfHostedApiUrl: orgDetails.selfHostedApiUrl || ''
      });
    } catch (error) {
      console.error('Failed to fetch organization details:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch organization details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsageData = async (orgId: string) => {
    if (!organization?.selfHosted || !organization?.selfHostedApiUrl) {
      return;
    }

    try {
      setIsLoadingUsage(true);
      
      const baseUrl = organization.selfHostedApiUrl.replace(/\/$/, ''); // Remove trailing slash
      const url = `${baseUrl}/api/libra/usage`;
      
      const token = localStorage.getItem('service_jwt_token');
      if (!token) {
        toast.error('Admin authentication token not found');
        return;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const usage = await response.json() as UsageData;
      setUsageData(usage);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to fetch usage data from self-hosted instance');
    } finally {
      setIsLoadingUsage(false);
    }
  };

  const handleEditOrganization = async () => {
    if (!editForm.name || !editForm.domain || editForm.seats < 1 || !organization) {
      toast.error('Please fill in all required fields with valid values');
      return;
    }

    if (editForm.selfHosted && !editForm.selfHostedApiUrl) {
      toast.error('Please provide a self-hosted API URL when self-hosted is enabled');
      return;
    }

    try {
      setIsSubmitting(true);
      
      await serviceApi.updateOrganization(organization.id.toString(), editForm);
      
      toast.success(`Organization updated successfully!`);
      setIsEditing(false);
      
      // Refresh organization details
      await fetchOrganizationDetails(organization.id.toString());
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFormChange = (field: keyof EditOrgForm, value: string | number | boolean) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
    // Clear messages when user starts typing
  };

  const getStatusBadge = (active: boolean) => {
    return active ? 
      <Badge variant="success">Active</Badge> : 
      <Badge variant="error">Inactive</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getTotalCreditsUsed = (usageMetrics?: UsageMetric[]) => {
    return usageMetrics?.reduce((total, metric) => total + metric.creditsUsed, 0) || 0;
  };

  const getActiveApiKeysCount = (apiKeys?: ApiKey[]) => {
    return apiKeys?.filter(key => !key.deleted && !key.disabled).length || 0;
  };

  // Refresh functions for self-hosted instances
  const refreshSelfHosted = async (endpoint: string, refreshType: keyof typeof refreshing) => {
    if (!organization?.selfHosted || !organization?.selfHostedApiUrl) {
      toast.error('Organization is not self-hosted or API URL is not configured');
      return;
    }

    try {
      setRefreshing(prev => ({ ...prev, [refreshType]: true }));
      
      const baseUrl = organization.selfHostedApiUrl.replace(/\/$/, ''); // Remove trailing slash
      const url = `${baseUrl}/api/libra/refresh/${endpoint}`;
      
      // Get the JWT token from localStorage (assuming it's stored there)
      const token = localStorage.getItem('service_jwt_token')
      if (!token) {
        toast.error('Admin authentication token not found');
        return;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || `${refreshType} refreshed successfully`);
      } else {
        throw new Error(data.message || `Failed to refresh ${refreshType}`);
      }
    } catch (error) {
      console.error(`Failed to refresh ${refreshType}:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to refresh ${refreshType}`);
    } finally {
      setRefreshing(prev => ({ ...prev, [refreshType]: false }));
    }
  };

  // Refresh specific tool prompts (you can expand this to include more tools)
  const refreshToolPrompts = async () => {
    if (!organization?.selfHosted || !organization?.selfHostedApiUrl) {
      toast.error('Organization is not self-hosted or API URL is not configured');
      return;
    }

    try {
      setRefreshing(prev => ({ ...prev, toolPrompts: true }));
      
      const baseUrl = organization.selfHostedApiUrl.replace(/\/$/, '');
      const token = localStorage.getItem('service_jwt_token')
      if (!token) {
        toast.error('Admin authentication token not found');
        return;
      }

      // Refresh common tool prompts
      const toolPrompts = [
        'tool-prompts/jira/read',
        'tool-prompts/jira/write', 
        'tool-prompts/slack/read',
        'tool-prompts/slack/write',
        'tool-prompts/notion/read',
        'tool-prompts/notion/write'
      ];

      const promises = toolPrompts.map(async (endpoint) => {
        const url = `${baseUrl}/api/libra/refresh/${endpoint}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        return response.json();
      });

      await Promise.all(promises);
      toast.success('Tool prompts refreshed successfully');
    } catch (error) {
      console.error('Failed to refresh tool prompts:', error);
      toast.error('Failed to refresh tool prompts');
    } finally {
      setRefreshing(prev => ({ ...prev, toolPrompts: false }));
    }
  };

  const refreshPrompts = () => refreshSelfHosted('prompt/system', 'prompts');
  const refreshAgents = () => refreshSelfHosted('agents/productivity', 'agents');
  const refreshWorkflows = () => refreshSelfHosted('workflows', 'workflows');

  // Fetch all available items for refresh
  const fetchAvailableItems = async () => {
    if (!organization?.selfHosted || !organization?.selfHostedApiUrl) {
      return;
    }

    try {
      setLoadingItems(true);
      
      const baseUrl = organization.selfHostedApiUrl.replace(/\/$/, '');
      const token = localStorage.getItem('service_jwt_token');
      if (!token) {
        toast.error('Admin authentication token not found');
        return;
      }

      // Fetch all available items in parallel
      const [toolPromptsRes, promptsRes, agentsRes, workflowsRes] = await Promise.allSettled([
        serviceApi.getToolPrompts(),
        serviceApi.getPrompts(),
        serviceApi.getAgents(),
        serviceApi.getWorkflows()
      ]);

      // Debug logging to understand API response structure
      console.log('API Responses:', {
        toolPrompts: toolPromptsRes,
        prompts: promptsRes,
        agents: agentsRes,
        workflows: workflowsRes
      });

      setAvailableItems({
        toolPrompts: toolPromptsRes.status === 'fulfilled' ? (Array.isArray(toolPromptsRes.value) ? toolPromptsRes.value : []) : [],
        prompts: promptsRes.status === 'fulfilled' ? (Array.isArray(promptsRes.value) ? promptsRes.value : []) : [],
        agents: agentsRes.status === 'fulfilled' ? (Array.isArray(agentsRes.value) ? agentsRes.value : []) : [],
        workflows: workflowsRes.status === 'fulfilled' ? (Array.isArray(workflowsRes.value) ? workflowsRes.value : []) : []
      });

    } catch (error) {
      console.error('Failed to fetch available items:', error);
      toast.error('Failed to fetch available items');
    } finally {
      setLoadingItems(false);
    }
  };

  // Refresh individual item
  const refreshIndividualItem = async (type: 'tool-prompts' | 'prompt' | 'agent' | 'workflow', identifier: string, toolName?: string, connectorType?: string) => {
    if (!organization?.selfHosted || !organization?.selfHostedApiUrl) {
      toast.error('Organization is not self-hosted or API URL is not configured');
      return;
    }

    try {
      const baseUrl = organization.selfHostedApiUrl.replace(/\/$/, '');
      const token = localStorage.getItem('service_jwt_token');
      if (!token) {
        toast.error('Admin authentication token not found');
        return;
      }

      let endpoint = '';
      if (type === 'tool-prompts' && toolName && connectorType) {
        endpoint = `tool-prompts/${toolName}/${connectorType}`;
      } else if (type === 'prompt') {
        endpoint = `prompt/${identifier}`;
      } else if (type === 'agent') {
        endpoint = `agent/${identifier}`;
      } else if (type === 'workflow') {
        endpoint = `workflow/${identifier}`;
      }

      const url = `${baseUrl}/api/libra/refresh/${endpoint}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.success) {
        toast.success(data.message || `${type} refreshed successfully`);
      } else {
        throw new Error(data.message || `Failed to refresh ${type}`);
      }
    } catch (error) {
      console.error(`Failed to refresh ${type}:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to refresh ${type}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/service/organizations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-600">Organization not found</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/service/organizations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back 
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              {organization.name}
            </h1>
            <p className="text-gray-600 mt-1">Organization ID: {organization.id}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(organization.active)}
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    name: organization.name,
                    domain: organization.domain || '',
                    seats: organization.seats,
                    selfHosted: organization.selfHosted || false,
                    selfHostedApiUrl: organization.selfHostedApiUrl || ''
                  });
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleEditOrganization}
                disabled={isSubmitting}
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setMainTab('dashboard')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              mainTab === 'dashboard'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Dashboard
          </button>
          {organization?.selfHosted && organization?.selfHostedApiUrl && (
            <button
              onClick={() => setMainTab('cache')}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                mainTab === 'cache'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Cache Refresh
            </button>
          )}
          <button
            onClick={() => setMainTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              mainTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 mr-2" />
            Users
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {mainTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

      <Card className="border-l-4 border-l-blue-500">
          <div className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total API Keys</p>
                <p className="text-2xl font-bold text-gray-900">
                {organization.apiKeys?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </Card>


        <Card className="border-l-4 border-l-blue-500">
          <div className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Billed Seats</p>
                <p className="text-2xl font-bold text-gray-900">
                {organization.seats}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <div className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Input Tokens</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageData ? usageData.totalInputTokens.toLocaleString() : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <div className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Credits Used</p>
                <p className="text-2xl font-bold text-gray-900">
                {getTotalCreditsUsed(organization.usageMetrics)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <div className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Active API Keys</p>
                <p className="text-2xl font-bold text-gray-900">
                {getActiveApiKeysCount(organization.apiKeys)}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <div className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Number of Users Registered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageData ? usageData.users.length : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </Card>


        <Card className="border-l-4 border-l-blue-500">
          <div className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Tokens</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageData ? usageData.totalTokens.toLocaleString() : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <div className="p-6">
            <div className="flex items-center">
              <div>
                <p className="text-sm font-medium text-gray-500">Output Tokens</p>
                <p className="text-2xl font-bold text-gray-900">
                  {usageData ? usageData.totalOutputTokens.toLocaleString() : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Organization Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main Info */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              Organization Information
            </h3>
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <Input
                    value={editForm.name}
                    onChange={(e) => handleEditFormChange('name', e.target.value)}
                    placeholder="Organization name"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Domain *</label>
                  <Input
                    value={editForm.domain}
                    onChange={(e) => handleEditFormChange('domain', e.target.value)}
                    placeholder="example.com"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Seats *</label>
                  <Input
                    type="number"
                    min="1"
                    value={editForm.seats}
                    onChange={(e) => handleEditFormChange('seats', parseInt(e.target.value) || 1)}
                    placeholder="Number of seats"
                    className="w-full"
                  />
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <input
                    id="selfHosted"
                    type="checkbox"
                    checked={!!editForm.selfHosted}
                    onChange={(e) => handleEditFormChange('selfHosted', e.target.checked)}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                  <label htmlFor="selfHosted" className="block text-sm font-medium text-gray-700">
                    Self-hosted
                  </label>
                </div>
                {editForm.selfHosted && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Self-hosted API URL *</label>
                    <Input
                      value={editForm.selfHostedApiUrl || ''}
                      onChange={(e) => handleEditFormChange('selfHostedApiUrl', e.target.value)}
                      placeholder="https://api.example.com"
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Name</span>
                  <span className="text-sm text-gray-900 font-semibold">{organization.name}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Domain</span>
                  <span className="text-sm text-gray-900">{organization.domain || 'Not set'}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Seats</span>
                  <span className="text-sm text-gray-900 font-semibold">{organization.seats}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Self-hosted</span>
                  <Badge variant={organization.selfHosted ? "success" : "default"}>
                    {organization.selfHosted ? "Yes" : "No"}
                  </Badge>
                </div>
                {organization.selfHosted && organization.selfHostedApiUrl && (
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">API URL</span>
                    <span className="text-sm text-gray-900 font-mono">{organization.selfHostedApiUrl}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Status</span>
                  {getStatusBadge(organization.active)}
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Created</span>
                  <span className="text-sm text-gray-900">{formatDate(organization.createdAt)}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium text-gray-500">Last Updated</span>
                  <span className="text-sm text-gray-900">{formatDate(organization.updatedAt)}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* API Keys */}
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              API Keys ({organization.apiKeys?.length || 0})
            </h3>
            {organization.apiKeys && organization.apiKeys.length > 0 ? (
              <div className="space-y-3  overflow-y-auto">
                {organization.apiKeys.map((apiKey) => (
                  <div key={apiKey.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-gray-500">API Key {apiKey.id}</span>
                      <div className="flex space-x-2">
                        <Badge variant={!apiKey.deleted && !apiKey.disabled ? "success" : "error"}>
                          {!apiKey.deleted && !apiKey.disabled ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-xs text-left font-mono text-gray-600 bg-gray-50 p-2 rounded border">
                      <div className="flex items-center justify-between">
                        {apiKey.key.substring(0, 20)}...
                        <Copy className="h-4 w-4 ml-2 cursor-pointer" onClick={() => handleCopyApiKey(apiKey.key)} />
                      </div>
                    </div>
                    <div className="text-xs text-left text-gray-400 mt-1">
                      Created: {formatDate(apiKey.createdAt)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No API keys found</p>
              </div>
            )}
          </div>
        </Card>
      </div>

        </div>
      )}

      {/* Cache Refresh Tab */}
      {mainTab === 'cache' && organization.selfHosted && organization.selfHostedApiUrl && (
        <Card>
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Server className="h-5 w-5 mr-2" />
                  Self-hosted Cache Refresh
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Manually refresh cached data on the self-hosted instance at <code className="bg-gray-100 px-2 py-1 rounded text-xs">{organization.selfHostedApiUrl}</code>
                </p>
              </div>
              <Button
                onClick={fetchAvailableItems}
                disabled={loadingItems}
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingItems ? 'animate-spin' : ''}`} />
                Refresh List
              </Button>
            </div>

            {/* Search */}
            <div className="mb-6">
              <Input
                type="text"
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
              <nav className="-mb-px flex space-x-8">
                <button
                  onClick={() => setActiveTab('toolPrompts')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'toolPrompts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Tool Prompts ({Array.isArray(availableItems.toolPrompts) ? availableItems.toolPrompts.length : 0})
                </button>
                <button
                  onClick={() => setActiveTab('prompts')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'prompts'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Prompts ({Array.isArray(availableItems.prompts) ? availableItems.prompts.length : 0})
                </button>
                <button
                  onClick={() => setActiveTab('agents')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'agents'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Users className="h-4 w-4 mr-2" />
                  Agents ({Array.isArray(availableItems.agents) ? availableItems.agents.length : 0})
                </button>
                <button
                  onClick={() => setActiveTab('workflows')}
                  className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                    activeTab === 'workflows'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Workflows ({Array.isArray(availableItems.workflows) ? availableItems.workflows.length : 0})
                </button>
              </nav>
            </div>

            {/* Tab Content */}
            {loadingItems ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div>
                {/* Tool Prompts Tab */}
                {activeTab === 'toolPrompts' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-gray-900 flex items-center">
                        <Zap className="h-4 w-4 mr-2" />
                        Tool Prompts
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.isArray(availableItems.toolPrompts) ? availableItems.toolPrompts
                        .filter(item => 
                          !searchTerm || 
                          item.toolName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.connectorType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((item, index) => {
                          // Format tool name by removing underscores and capitalizing (same as tools page)
                          const formatToolName = (name: string) => {
                            const withSpaces = name
                              .replace(/[_-]+/g, ' ')
                              .replace(/([a-z0-9])([A-Z])/g, '$1 $2');
                            return withSpaces
                              .split(' ')
                              .filter(Boolean)
                              .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                              .join(' ');
                          };

                          // Format connector type display name (same as tools page)
                          const getConnectorDisplayName = (connectorType: string) => {
                            return connectorType.charAt(0).toUpperCase() + connectorType.slice(1);
                          };

                          return (
                            <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center flex-1">
                                  <div className="flex items-center justify-center mr-3">
                                    {getToolIcon(item.connectorType)}
                                  </div>
                                  <div className="flex-1">
                                    <div className="text-sm font-medium text-gray-900">
                                      {formatToolName(item.toolName)}
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                      {getConnectorDisplayName(item.connectorType)} Operation
                                    </div>
                                    {item.description && (
                                      <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                                    )}
                                  </div>
                                </div>
                                <Button
                                  onClick={() => refreshIndividualItem('tool-prompts', item.id, item.toolName, item.connectorType)}
                                  size="sm"
                                  variant="outline"
                                  className="ml-2"
                                >
                                  <RefreshCw className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        }) : <div className="text-gray-500 text-sm">No tool prompts available</div>}
                    </div>
                  </div>
                )}

                {/* Prompts Tab */}
                {activeTab === 'prompts' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-gray-900 flex items-center">
                        <Key className="h-4 w-4 mr-2" />
                        System Prompts
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.isArray(availableItems.prompts) ? availableItems.prompts
                        .filter(item => 
                          !searchTerm || 
                          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.identifier?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((item, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{item.name || item.identifier}</div>
                                {item.description && (
                                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                )}
                                <div className="text-xs text-gray-400 mt-1">ID: {item.identifier}</div>
                              </div>
                              <Button
                                onClick={() => refreshIndividualItem('prompt', item.identifier)}
                                size="sm"
                                variant="outline"
                                className="ml-2"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )) : <div className="text-gray-500 text-sm">No prompts available</div>}
                    </div>
                  </div>
                )}

                {/* Agents Tab */}
                {activeTab === 'agents' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-gray-900 flex items-center">
                        <Users className="h-4 w-4 mr-2" />
                        Agent Library
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.isArray(availableItems.agents) ? availableItems.agents
                        .filter(item => 
                          !searchTerm || 
                          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.description?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((item, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                {item.description && (
                                  <div className="text-xs text-gray-500 mt-1">{item.description}</div>
                                )}
                                {item.category && (
                                  <div className="text-xs text-blue-600 mt-1">Category: {item.category}</div>
                                )}
                              </div>
                              <Button
                                onClick={() => refreshIndividualItem('agent', item.id)}
                                size="sm"
                                variant="outline"
                                className="ml-2"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )) : <div className="text-gray-500 text-sm">No agents available</div>}
                    </div>
                  </div>
                )}

                {/* Workflows Tab */}
                {activeTab === 'workflows' && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-md font-semibold text-gray-900 flex items-center">
                        <Activity className="h-4 w-4 mr-2" />
                        Workflow Library
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {Array.isArray(availableItems.workflows) ? availableItems.workflows
                        .filter(item => 
                          !searchTerm || 
                          item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.workflowType?.toLowerCase().includes(searchTerm.toLowerCase())
                        )
                        .map((item, index) => (
                          <div key={index} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="text-sm font-medium text-gray-900">{item.name}</div>
                                {item.category && (
                                  <div className="text-xs text-blue-600 mt-1">Category: {item.category}</div>
                                )}
                                {item.workflowType && (
                                  <div className="text-xs text-gray-500 mt-1">Type: {item.workflowType}</div>
                                )}
                              </div>
                              <Button
                                onClick={() => refreshIndividualItem('workflow', item.id)}
                                size="sm"
                                variant="outline"
                                className="ml-2"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        )) : <div className="text-gray-500 text-sm">No workflows available</div>}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex">
                <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="ml-2">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> These operations will clear the cache and fetch fresh data from the Services API on the self-hosted instance. 
                    Individual refresh buttons allow you to refresh specific items, while bulk refresh buttons refresh entire categories.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Users Tab */}
      {mainTab === 'users' && (
        <div className="space-y-6">
          {organization?.selfHosted && organization?.selfHostedApiUrl ? (
            usageData ? (
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Users ({usageData.users.length})
                    </h3>
                    <Button
                      onClick={() => fetchUsageData(id!)}
                      disabled={isLoadingUsage}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsage ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </div>
                  
                  {/* Users Table */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Activity</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tokens</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {usageData.users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                    <span className="text-sm font-medium text-gray-700">
                                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                  <div className="text-xs text-gray-400">{user.title} • {user.function}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={user.role === 'superadmin' ? 'success' : 'default'}>
                                {user.role}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>{user.noOfChats} chats</div>
                              <div className="text-xs text-gray-500">{user.noOfUserMemories} memories</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div className="font-medium">{user.totalTokens.toLocaleString()}</div>
                              <div className="text-xs text-gray-500">
                                {user.totalInputTokens.toLocaleString()} in • {user.totalOutputTokens.toLocaleString()} out
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <Badge variant={user.onboardingComplete ? 'success' : 'error'}>
                                {user.onboardingComplete ? 'Onboarded' : 'Pending'}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(user.createdAt)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Card>
            ) : (
              <Card>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Users className="h-5 w-5 mr-2" />
                      Users
                    </h3>
                    <Button
                      onClick={() => fetchUsageData(id!)}
                      disabled={isLoadingUsage}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${isLoadingUsage ? 'animate-spin' : ''}`} />
                      {isLoadingUsage ? 'Loading...' : 'Load Data'}
                    </Button>
                  </div>
                  {isLoadingUsage ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Click "Load Data" to fetch user information</p>
                      <p className="text-sm text-gray-400 mt-1">Data will be fetched from: {organization.selfHostedApiUrl}/api/libra/usage</p>
                    </div>
                  )}
                </div>
              </Card>
            )
          ) : (
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Users
                </h3>
                <div className="text-center py-8 text-gray-500">
                  <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>User data is only available for self-hosted organizations</p>
                  <p className="text-sm text-gray-400 mt-1">This organization is not self-hosted or API URL is not configured</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}


      {/* Legacy Usage Metrics */}
      {organization.usageMetrics && organization.usageMetrics.length > 0 && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              Legacy Usage Activity
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Credits</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">API Key</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {organization.usageMetrics.map((metric) => (
                    <tr key={metric.id} className="hover:bg-gray-50">
                      <td className="px-6 text-left py-4 whitespace-nowrap">
                        <Badge variant="default" className="font-mono">
                          {getPurposeName(metric.purpose)}
                        </Badge>
                      </td>
                      <td className="px-6 text-left py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-semibold">{metric.creditsUsed}</span> credits
                      </td>
                      <td className="px-6 text-left py-4 whitespace-nowrap text-sm text-gray-900">
                        {metric.apiKeyId}
                      </td>
                      <td className="px-6 text-left py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(metric.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
} 