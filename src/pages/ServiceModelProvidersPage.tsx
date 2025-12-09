import { useState, useEffect, useMemo } from 'react';
import { serviceApi } from '@/services/serviceApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

interface ModelProvider {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  aiModels?: Array<{
    id: number;
    providerId: number;
    model: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export default function ServiceModelProvidersPage() {
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ModelProvider | null>(null);
  const [formData, setFormData] = useState({ name: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      setIsLoading(true);
      const data = await serviceApi.getModelProviders();
      setProviders(data as ModelProvider[]);
    } catch (error) {
      console.error('Failed to fetch model providers:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch model providers');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProviders = useMemo(() => {
    if (!searchTerm) return providers;
    const term = searchTerm.toLowerCase();
    return providers.filter(provider => provider.name.toLowerCase().includes(term));
  }, [providers, searchTerm]);

  const handleCreate = () => {
    setIsEditing(false);
    setSelectedProvider(null);
    setFormData({ name: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (provider: ModelProvider) => {
    setIsEditing(true);
    setSelectedProvider(provider);
    setFormData({ name: provider.name });
    setIsModalOpen(true);
  };

  const handleDelete = async (provider: ModelProvider) => {
    if (!confirm(`Are you sure you want to delete "${provider.name}"? This will also delete all associated models.`)) {
      return;
    }

    try {
      await serviceApi.deleteModelProvider(provider.id.toString());
      toast.success('Model provider deleted successfully');
      fetchProviders();
    } catch (error) {
      console.error('Failed to delete model provider:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete model provider');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Provider name is required');
      return;
    }

    try {
      setIsSaving(true);
      if (isEditing && selectedProvider) {
        await serviceApi.updateModelProvider(selectedProvider.id.toString(), formData);
        toast.success('Model provider updated successfully');
      } else {
        await serviceApi.createModelProvider(formData);
        toast.success('Model provider created successfully');
      }
      setIsModalOpen(false);
      fetchProviders();
    } catch (error) {
      console.error('Failed to save model provider:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save model provider');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Model Providers</h1>
          <p className="text-gray-600 mt-1">Manage AI model providers</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Provider
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search providers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'No providers found matching your search' : 'No model providers found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Models Count
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Updated At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProviders.map((provider) => (
                    <tr key={provider.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{provider.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{provider.aiModels?.length || 0}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(provider.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(provider.updatedAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(provider)}
                            className="flex items-center"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(provider)}
                            className="flex items-center text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Model Provider' : 'Create Model Provider'}
            </h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider Name *
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ name: e.target.value })}
                  placeholder="e.g. OpenAI, Anthropic"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsModalOpen(false)}
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : isEditing ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
