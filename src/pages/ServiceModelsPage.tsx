import { useState, useEffect, useMemo } from 'react';
import { serviceApi } from '@/services/serviceApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search } from 'lucide-react';

interface ModelProvider {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

interface AIModel {
  id: number;
  providerId: number;
  model: string;
  createdAt: string;
  updatedAt: string;
  provider?: ModelProvider;
}

export default function ServiceModelsPage() {
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [providerFilter, setProviderFilter] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedModel, setSelectedModel] = useState<AIModel | null>(null);
  const [formData, setFormData] = useState({ model: '', providerId: '' });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [modelsData, providersData] = await Promise.all([
        serviceApi.getModels(),
        serviceApi.getModelProviders()
      ]);
      setModels(modelsData as AIModel[]);
      setProviders(providersData as ModelProvider[]);
    } catch (error) {
      console.error('Failed to fetch data:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredModels = useMemo(() => {
    let filtered = models;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(model => model.model.toLowerCase().includes(term));
    }

    if (providerFilter !== 'all') {
      filtered = filtered.filter(model => model.providerId.toString() === providerFilter);
    }

    return filtered;
  }, [models, searchTerm, providerFilter]);

  const handleCreate = () => {
    setIsEditing(false);
    setSelectedModel(null);
    setFormData({ model: '', providerId: providers[0]?.id.toString() || '' });
    setIsModalOpen(true);
  };

  const handleEdit = (model: AIModel) => {
    setIsEditing(true);
    setSelectedModel(model);
    setFormData({ model: model.model, providerId: model.providerId.toString() });
    setIsModalOpen(true);
  };

  const handleDelete = async (model: AIModel) => {
    if (!confirm(`Are you sure you want to delete "${model.model}"?`)) {
      return;
    }

    try {
      await serviceApi.deleteModel(model.id.toString());
      toast.success('Model deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Failed to delete model:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete model');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.model.trim() || !formData.providerId) {
      toast.error('Model name and provider are required');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        model: formData.model.trim(),
        providerId: parseInt(formData.providerId)
      };

      if (isEditing && selectedModel) {
        await serviceApi.updateModel(selectedModel.id.toString(), payload);
        toast.success('Model updated successfully');
      } else {
        await serviceApi.createModel(payload);
        toast.success('Model created successfully');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save model:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save model');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getProviderName = (providerId: number) => {
    const provider = providers.find(p => p.id === providerId);
    return provider?.name || 'Unknown';
  };

  const providerOptions = useMemo(() => {
    return [
      { value: 'all', label: 'All Providers' },
      ...providers.map(provider => ({ value: provider.id.toString(), label: provider.name }))
    ];
  }, [providers]);

  const providerSelectOptions = useMemo(() => {
    return providers.map(provider => ({ value: provider.id.toString(), label: provider.name }));
  }, [providers]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 text-left">AI Models</h1>
          <p className="text-gray-600 mt-1">Manage available AI models</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center" disabled={providers.length === 0}>
          <Plus className="h-4 w-4 mr-2" />
          Add Model
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <div className="mb-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="sm:w-64">
              <Select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                options={providerOptions}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm || providerFilter !== 'all' ? 'No models found matching your filters' : 'No models found'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
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
                  {filteredModels.map((model) => (
                    <tr key={model.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{model.model}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{model.provider?.name || getProviderName(model.providerId)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(model.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(model.updatedAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(model)}
                            className="flex items-center"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(model)}
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
              {isEditing ? 'Edit AI Model' : 'Create AI Model'}
            </h2>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model Name *
                </label>
                <Input
                  value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  placeholder="e.g. gpt-4, claude-3-opus"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider *
                </label>
                <Select
                  value={formData.providerId}
                  onChange={(e) => setFormData({ ...formData, providerId: e.target.value })}
                  options={providerSelectOptions}
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
