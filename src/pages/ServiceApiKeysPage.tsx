import { useState, useEffect } from 'react';
import { serviceApi } from '@/services/serviceApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  Copy, 
  CheckCircle,
  Calendar,
  Building2,
  Activity,
  Power,
  PowerOff,
  Plus,
  X
} from 'lucide-react';

interface ApiKey {
  id: number;
  key: string;
  deleted: boolean;
  disabled: boolean;
  createdAt: string;
  updatedAt: string;
  orgName: string;
  orgId: number;
  totalCreditsUsed: string;
}

interface Organization {
  id: number;
  name: string;
  domain: string;
  seats: number;
}

export default function ServiceApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [filteredApiKeys, setFilteredApiKeys] = useState<ApiKey[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [togglingKey, setTogglingKey] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedOrgId, setSelectedOrgId] = useState<number | null>(null);

  useEffect(() => {
    fetchApiKeys();
    fetchOrganizations();
  }, []);

  useEffect(() => {
    // Filter API keys based on search term
    if (searchTerm) {
      const filtered = apiKeys.filter(key =>
        key.orgName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        key.orgId.toString().includes(searchTerm.toLowerCase()) ||
        key.id.toString().includes(searchTerm.toLowerCase())
      );
      setFilteredApiKeys(filtered);
    } else {
      setFilteredApiKeys(apiKeys);
    }
  }, [searchTerm, apiKeys]);

  const fetchApiKeys = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const keys = await serviceApi.getApiKeys() as ApiKey[];
      // Filter out deleted keys
      const activeKeys = keys.filter(key => !key.deleted);
      setApiKeys(activeKeys);
    } catch (error) {
      console.error('Failed to fetch API keys:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch API keys');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const orgs = await serviceApi.getOrganizations() as Organization[];
      setOrganizations(orgs);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const toggleApiKey = async (id: string, currentStatus: string) => {
    try {
      setTogglingKey(id);
      setError(null);
      await serviceApi.toggleApiKey(id, currentStatus !== 'active');
      // Refresh the list to get updated status
      await fetchApiKeys();
    } catch (error) {
      console.error('Failed to toggle API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to toggle API key');
    } finally {
      setTogglingKey(null);
    }
  };

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev);
      if (newSet.has(keyId)) {
        newSet.delete(keyId);
      } else {
        newSet.add(keyId);
      }
      return newSet;
    });
  };

  const copyToClipboard = async (text: string, keyId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(keyId);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  const createApiKey = async () => {
    if (!selectedOrgId) return;
    
    try {
      setIsCreating(true);
      setError(null);
      await serviceApi.createApiKey(selectedOrgId);
      setShowCreateModal(false);
      setSelectedOrgId(null);
      await fetchApiKeys(); // Refresh the list
    } catch (error) {
      console.error('Failed to create API key:', error);
      setError(error instanceof Error ? error.message : 'Failed to create API key');
    } finally {
      setIsCreating(false);
    }
  };

  const maskApiKey = (key: string) => {
    return `${key.substring(0, 8)}${'*'.repeat(24)}${key.substring(key.length - 4)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            API Keys
          </h1>
          <p className="text-gray-600 mt-1">Manage API keys and access permissions</p>
        </div>
        <Button
          onClick={() => setShowCreateModal(true)}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Key
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Keys</p>
                <p className="text-2xl font-bold text-gray-900">{apiKeys.length}</p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active</p>
                <p className="text-2xl font-bold text-gray-900">
                  {apiKeys.filter(key => key.disabled === false).length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Inactive</p>
                <p className="text-2xl font-bold text-gray-900">
                  {apiKeys.filter(key => key.disabled === true).length}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatNumber(apiKeys.reduce((total, key) => total + parseInt(key.totalCreditsUsed), 0))}
                </p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by organization, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredApiKeys.length} of {apiKeys.length} keys
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

      {/* API Keys List */}
      <Card>
        <div className="p-6">
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredApiKeys.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Key className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{searchTerm ? 'No API keys found matching your search' : 'No API keys found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      API Key
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApiKeys.map((apiKey) => (
                    <tr key={apiKey.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div>
                            <div className="text-sm font-medium text-gray-900">API Key #{apiKey.id}</div>
                            <div className="flex items-center space-x-2 mt-1">
                              <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                                {visibleKeys.has(apiKey.id.toString()) ? apiKey.key : maskApiKey(apiKey.key)}
                              </code>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleKeyVisibility(apiKey.id.toString())}
                                className="p-1 h-6 w-6"
                              >
                                {visibleKeys.has(apiKey.id.toString()) ? (
                                  <EyeOff className="h-3 w-3" />
                                ) : (
                                  <Eye className="h-3 w-3" />
                                )}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => copyToClipboard(apiKey.key, apiKey.id.toString())}
                                className="p-1 h-6 w-6"
                              >
                                {copiedKey === apiKey.id.toString() ? (
                                  <CheckCircle className="h-3 w-3 text-green-600" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm text-gray-900">{apiKey.orgName}</div>
                            <div className="text-sm text-gray-500">ID: {apiKey.orgId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {apiKey.disabled ? (
                          <Badge variant="warning">Inactive</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm text-gray-900">
                            {formatNumber(parseInt(apiKey.totalCreditsUsed))} requests
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          {formatDate(apiKey.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center">
                          {formatDate(apiKey.updatedAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleApiKey(apiKey.id.toString(), apiKey.disabled ? 'inactive' : 'active')}
                          disabled={togglingKey === apiKey.id.toString() || apiKey.deleted}
                          className={`${
                            apiKey.disabled 
                              ? 'text-green-600 hover:text-green-700 hover:bg-green-50' 
                              : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                          }`}
                        >
                          {togglingKey === apiKey.id.toString() ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : apiKey.disabled ? (
                            <>
                              <Power className="h-4 w-4 mr-1" />
                              Enable
                            </>
                          ) : (
                            <>
                              <PowerOff className="h-4 w-4 mr-1" />
                              Disable
                            </>
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>

      {/* Create API Key Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Create New API Key</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCreateModal(false);
                  setSelectedOrgId(null);
                }}
                className="p-1 h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-left font-medium text-gray-700 mb-2">
                  Select Organization
                </label>
                <select
                  value={selectedOrgId || ''}
                  onChange={(e) => setSelectedOrgId(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose an organization...</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} (ID: {org.id})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedOrgId(null);
                  }}
                  className="flex-1"
                  disabled={isCreating}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createApiKey}
                  disabled={!selectedOrgId || isCreating}
                  className="flex-1"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Key
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 