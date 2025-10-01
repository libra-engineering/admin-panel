import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { serviceApi } from '@/services/serviceApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Search, 
  AlertCircle, 
  Plus,
  Save,
  X,
  CheckCircle
} from 'lucide-react';

interface Organization {
  id: number;
  name: string;
  domain?: string;
  seats: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

interface CreateOrgForm {
  name: string;
  domain: string;
  seats: number;
  selfHosted: boolean;
  selfHostedApiUrl: string;
}





export default function ServiceOrganizationsPage() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState<CreateOrgForm>({
    name: '',
    domain: '',
    seats: 1,
    selfHosted: false,
    selfHostedApiUrl: ''
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
      setCreateForm({ name: '', domain: '', seats: 1, selfHosted: false, selfHostedApiUrl: '' });
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

  const handleFormChange = (field: keyof CreateOrgForm, value: string | number | boolean) => {
    setCreateForm(prev => ({ ...prev, [field]: value }));
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  const getStatusBadge = (active: boolean) => {
    return active ? 
      <Badge variant="success">Active</Badge> : 
      <Badge variant="error">Inactive</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };





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
                    setCreateForm({ name: '', domain: '', seats: 1, selfHosted: false, selfHostedApiUrl: '' });
                    setError(null);
                    setSuccess(null);
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <Card>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <div className="md:col-span-2 flex items-center space-x-2 mt-2">
                      <input
                        id="selfHosted"
                        type="checkbox"
                        checked={!!createForm.selfHosted}
                        onChange={(e) => handleFormChange('selfHosted', e.target.checked)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                      <label htmlFor="selfHosted" className="block text-sm font-medium text-gray-700">
                        Self-hosted
                      </label>
                    </div>
                    {createForm.selfHosted && (
                      <div className="md:col-span-2">
                        <label className="block text-sm text-left font-medium text-gray-700 mb-1">Self-hosted API URL *</label>
                        <Input
                          value={createForm.selfHostedApiUrl || ''}
                          onChange={(e) => handleFormChange('selfHostedApiUrl', e.target.value)}
                          placeholder="https://api.example.com"
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end space-x-3 mt-6">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        setCreateForm({ name: '', domain: '', seats: 1, selfHosted: false, selfHostedApiUrl: '' });
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
                      disabled={
                        isSubmitting ||
                        !createForm.name ||
                        !createForm.domain ||
                        createForm.seats < 1 ||
                        (createForm.selfHosted && !createForm.selfHostedApiUrl)
                      }
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
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
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
                      <td className="px-6 text-left py-4 whitespace-nowrap text-sm text-gray-500">
                        <Button variant="outline" size="sm" onClick={() => navigate(`/service/organizations/${org.id}`)}>
                          View
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
    </div>
  );
} 