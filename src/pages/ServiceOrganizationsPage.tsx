import { useState, useEffect } from 'react';
import { serviceApi } from '@/services/serviceApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Eye, 
  Users, 
  Calendar, 
  Activity,
  Globe,
  Mail,
  Phone,
  Plus,
  Save,
  X,
  CheckCircle,
  ArrowLeft
} from 'lucide-react';

interface Organization {
  id: string;
  name: string;
  domain?: string;
  email?: string;
  phone?: string;
  website?: string;
  status: 'active' | 'inactive' | 'suspended';
  userCount: number;
  apiKeyCount: number;
  seats: number;
  createdAt: string;
  updatedAt: string;
  lastActivity?: string;
}

interface CreateOrgForm {
  name: string;
  domain: string;
  seats: number;
}

export default function ServiceOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateOrgForm>({
    name: '',
    domain: '',
    seats: 1
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  useEffect(() => {
    // Filter organizations based on search term
    if (searchTerm) {
      const filtered = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.domain?.toLowerCase().includes(searchTerm.toLowerCase()) 
      );
      setFilteredOrganizations(filtered);
    } else {
      setFilteredOrganizations(organizations);
    }
  }, [searchTerm, organizations]);

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const orgs = await serviceApi.getOrganizations() as Organization[];
      setOrganizations(orgs);
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch organizations');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchOrganizationDetails = async (id: string) => {
    try {
      setError(null);
      const orgDetails = await serviceApi.getOrganizationById(id) as Organization;
      setSelectedOrg(orgDetails);
      setShowDetails(true);
    } catch (error) {
      console.error('Failed to fetch organization details:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch organization details');
    }
  };

  const handleCreateOrganization = async () => {
    if (!createForm.name || !createForm.domain || createForm.seats < 1) {
      setError('Please fill in all required fields with valid values');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      setSuccess(null);
      
      await serviceApi.createOrganization(createForm);
      
      setSuccess(`Organization "${createForm.name}" created successfully!`);
      setCreateForm({ name: '', domain: '', seats: 1 });
      setShowCreateModal(false);
      
      // Refresh the organizations list
      await fetchOrganizations();
    } catch (error) {
      console.error('Failed to create organization:', error);
      setError(error instanceof Error ? error.message : 'Failed to create organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (field: keyof CreateOrgForm, value: string | number) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">Active</Badge>;
      case 'inactive':
        return <Badge variant="warning">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="error">Suspended</Badge>;
      default:
        return <Badge variant="default">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (showDetails && selectedOrg) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDetails(false);
                setSelectedOrg(null);
              }}
              >
              <ArrowLeft />
              Back 
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                {selectedOrg.name}
              </h1>
              <p className="text-gray-600 mt-1">Organization Details</p>
            </div>
          </div>
          {getStatusBadge(selectedOrg.status)}
        </div>

        {/* Organization Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <Card>
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Organization Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Organization ID</p>
                    <p className="text-sm text-gray-900 font-mono">{selectedOrg.id}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Name</p>
                    <p className="text-sm text-gray-900">{selectedOrg.name}</p>
                  </div>
                  {selectedOrg.domain && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 flex items-center">
                        Domain
                      </p>
                      <p className="text-sm text-gray-900">{selectedOrg.domain}</p>
                    </div>
                  )}
                 
                  {selectedOrg.website && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 flex items-center">
                        Website
                      </p>
                      <a 
                        href={selectedOrg.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-500"
                      >
                        {selectedOrg.website}
                      </a>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      Created
                    </p>
                    <p className="text-sm text-gray-900">{formatDate(selectedOrg.createdAt)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      Last Updated
                    </p>
                    <p className="text-sm text-gray-900">{formatDate(selectedOrg.updatedAt)}</p>
                  </div>
                  {selectedOrg.lastActivity && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 flex items-center">
                        Last Activity
                      </p>
                      <p className="text-sm text-gray-900">{formatDate(selectedOrg.lastActivity)}</p>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Stats */}
          <div className="space-y-4">
            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedOrg.userCount}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">API Keys</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedOrg.apiKeyCount}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center">
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Seats</p>
                    <p className="text-2xl font-bold text-gray-900">{selectedOrg.seats}</p>
                  </div>
                </div>
              </div>
            </Card>

            <Card>
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="text-lg font-semibold text-gray-900 capitalize">{selectedOrg.status}</p>
                  </div>
                  {getStatusBadge(selectedOrg.status)}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            Organizations
          </h1>
          <p className="text-gray-600 mt-1">Manage and view organization </p>
        </div>
        <div className="flex items-center space-x-3">
         
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Organization
          </Button>
        </div>
      </div>

      {/* Search */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Create Organization Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">Create New Organization</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowCreateModal(false);
                    setCreateForm({ name: '', domain: '', seats: 1 });
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Card>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2  gap-4">
              <div>
                <label className="block text-sm text-left font-medium text-gray-700 mb-1">Organization Name *</label>
                <Input
                  value={createForm.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Enter organization name"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-left font-medium text-gray-700 mb-1">Domain *</label>
                <Input
                  value={createForm.domain}
                  onChange={(e) => handleFormChange('domain', e.target.value)}
                  placeholder="example.com"
                  className="w-full"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm text-left font-medium text-gray-700 mb-1">Seats *</label>
                <Input
                  type="number"
                  min="1"
                  value={createForm.seats}
                  onChange={(e) => handleFormChange('seats', parseInt(e.target.value) || 1)}
                  placeholder="Number of seats"
                  className="w-full max-w-xs"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateModal(false);
                  setCreateForm({ name: '', domain: '', seats: 1 });
                  setError(null);
                  setSuccess(null);
                }}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCreateOrganization}
                disabled={isSubmitting || !createForm.name || !createForm.domain || createForm.seats < 1}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Organization'}
              </Button>
            </div>
          </div>
        </Card>
            </div>
          </div>
        </div>
      )}

      {/* Organizations List */}
      <Card>
        <div className="p-6">
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>{searchTerm ? 'No organizations found matching your search' : 'No organizations found'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Organization
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Domain
                      </th>
                     
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Seats
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                     
                    </tr>
                  </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredOrganizations.map((org) => (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="text-left px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{org.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {org.domain ? (
                            <div className="flex items-center">
                              {org.domain}
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                     
                      <td className="px-6 py-4 text-left whitespace-nowrap text-sm text-gray-900">
                        <div className="flex items-center">
                          {org.seats}
                        </div>
                      </td>
                      <td className="px-6 text-left py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(org.createdAt)}
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