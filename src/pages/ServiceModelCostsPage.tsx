import { useState, useEffect, useMemo } from 'react';
import { serviceApi } from '@/services/serviceApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, DollarSign } from 'lucide-react';

interface ModelCost {
  id: number;
  model: string;
  provider: string;
  inputCost: number;
  outputCost: number;
  createdAt: string;
  updatedAt: string;
}

interface AIModel {
  id: number;
  providerId: number;
  model: string;
  provider?: {
    id: number;
    name: string;
  };
}

interface ModelProvider {
  id: number;
  name: string;
}

export default function ServiceModelCostsPage() {
  const [modelCosts, setModelCosts] = useState<ModelCost[]>([]);
  const [models, setModels] = useState<AIModel[]>([]);
  const [providers, setProviders] = useState<ModelProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCost, setSelectedCost] = useState<ModelCost | null>(null);
  const [formData, setFormData] = useState({
    model: '',
    provider: '',
    inputCost: '',
    outputCost: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([
      fetchModelCosts(),
      fetchOptions()
    ]);
  };

  const fetchOptions = async () => {
    try {
      setIsLoadingOptions(true);
      const [modelsData, providersData] = await Promise.all([
        serviceApi.getModels(),
        serviceApi.getModelProviders()
      ]);
      setModels(modelsData as AIModel[]);
      setProviders(providersData as ModelProvider[]);
    } catch (error) {
      console.error('Failed to fetch options:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch options');
    } finally {
      setIsLoadingOptions(false);
    }
  };

  const fetchModelCosts = async () => {
    try {
      setIsLoading(true);
      const data = await serviceApi.getModelCosts();
      setModelCosts(data as ModelCost[]);
    } catch (error) {
      console.error('Failed to fetch model costs:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch model costs');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCosts = useMemo(() => {
    if (!searchTerm) return modelCosts;
    const term = searchTerm.toLowerCase();
    return modelCosts.filter(cost => 
      cost.model.toLowerCase().includes(term) || 
      cost.provider.toLowerCase().includes(term)
    );
  }, [modelCosts, searchTerm]);

  const existingCombinations = useMemo(() => {
    return new Set(modelCosts.map(cost => `${cost.model}::${cost.provider}`));
  }, [modelCosts]);

  const availableModelOptions = useMemo(() => {
    const modelsWithCosts = new Set(modelCosts.map(cost => cost.model));
    const uniqueModels = new Set<string>();
    
    if (isEditing && selectedCost) {
      uniqueModels.add(selectedCost.model);
    }
    
    models.forEach(model => {
      if (!modelsWithCosts.has(model.model)) {
        uniqueModels.add(model.model);
      }
    });
    
    return Array.from(uniqueModels).sort().map(model => ({ value: model, label: model }));
  }, [models, modelCosts, isEditing, selectedCost]);

  const availableProviderOptions = useMemo(() => {
    const selectedModel = formData.model || (isEditing && selectedCost ? selectedCost.model : '');
    
    if (!selectedModel) {
      return providers.map(provider => ({ value: provider.name, label: provider.name }));
    }

    if (isEditing && selectedCost) {
      const availableProviders = new Set<string>();
      availableProviders.add(selectedCost.provider);
      
      providers.forEach(provider => {
        const combination = `${selectedModel}::${provider.name}`;
        if (!existingCombinations.has(combination) || provider.name === selectedCost.provider) {
          availableProviders.add(provider.name);
        }
      });
      
      return Array.from(availableProviders).sort().map(provider => ({ value: provider, label: provider }));
    }

    return providers
      .filter(provider => {
        const combination = `${selectedModel}::${provider.name}`;
        return !existingCombinations.has(combination);
      })
      .map(provider => ({ value: provider.name, label: provider.name }));
  }, [providers, formData.model, existingCombinations, isEditing, selectedCost]);

  const handleCreate = () => {
    setIsEditing(false);
    setSelectedCost(null);
    setFormData({ model: '', provider: '', inputCost: '', outputCost: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (cost: ModelCost) => {
    setIsEditing(true);
    setSelectedCost(cost);
    setFormData({
      model: cost.model,
      provider: cost.provider,
      inputCost: cost.inputCost.toString(),
      outputCost: cost.outputCost.toString()
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (cost: ModelCost) => {
    if (!confirm(`Are you sure you want to delete cost configuration for "${cost.model}" (${cost.provider})?`)) {
      return;
    }

    try {
      await serviceApi.deleteModelCost(cost.id.toString());
      toast.success('Model cost deleted successfully');
      fetchModelCosts();
    } catch (error) {
      console.error('Failed to delete model cost:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete model cost');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.model.trim() || !formData.provider.trim() || !formData.inputCost || !formData.outputCost) {
      toast.error('All fields are required');
      return;
    }

    const inputCost = parseFloat(formData.inputCost);
    const outputCost = parseFloat(formData.outputCost);

    if (isNaN(inputCost) || isNaN(outputCost) || inputCost < 0 || outputCost < 0) {
      toast.error('Costs must be valid positive numbers');
      return;
    }

    try {
      setIsSaving(true);
      const payload = {
        model: formData.model.trim(),
        provider: formData.provider.trim(),
        inputCost,
        outputCost
      };

      if (isEditing && selectedCost) {
        await serviceApi.updateModelCost(selectedCost.id.toString(), payload);
        toast.success('Model cost updated successfully');
      } else {
        await serviceApi.createModelCost(payload);
        toast.success('Model cost created successfully');
      }
      setIsModalOpen(false);
      fetchModelCosts();
    } catch (error) {
      console.error('Failed to save model cost:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save model cost');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(2)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 text-left">Model Costs</h1>
          <p className="text-gray-600 mt-1">Manage pricing for AI models (per million tokens)</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Model Cost
        </Button>
      </div>

      <Card>
        <div className="p-6">
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by model or provider..."
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
          ) : filteredCosts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'No model costs found matching your search' : 'No model costs configured'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Model
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Input Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Output Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCosts.map((cost) => (
                    <tr key={cost.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{cost.model}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{cost.provider}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-green-600" />
                          {formatCost(cost.inputCost)} / 1M tokens
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-blue-600" />
                          {formatCost(cost.outputCost)} / 1M tokens
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(cost.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(cost)}
                            className="flex items-center"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(cost)}
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
              {isEditing ? 'Edit Model Cost' : 'Create Model Cost'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Costs are per million tokens
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Model Name *
                </label>
                <Select
                  value={formData.model}
                  onChange={(e) => {
                    setFormData({ ...formData, model: e.target.value, provider: '' });
                  }}
                  options={[
                    { value: '', label: 'Select a model...' },
                    ...availableModelOptions
                  ]}
                  required
                  disabled={isLoadingOptions}
                />
                {isLoadingOptions && (
                  <p className="text-xs text-gray-500 mt-1">Loading models...</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Provider *
                </label>
                <Select
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  options={[
                    { value: '', label: 'Select a provider...' },
                    ...availableProviderOptions
                  ]}
                  required
                  disabled={isLoadingOptions || !formData.model}
                />
                {!formData.model && (
                  <p className="text-xs text-gray-500 mt-1">Please select a model first</p>
                )}
                {formData.model && availableProviderOptions.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1">
                    All providers for this model already have costs configured
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Input Cost ($ per 1M tokens) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.inputCost}
                  onChange={(e) => setFormData({ ...formData, inputCost: e.target.value })}
                  placeholder="e.g. 30.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Output Cost ($ per 1M tokens) *
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.outputCost}
                  onChange={(e) => setFormData({ ...formData, outputCost: e.target.value })}
                  placeholder="e.g. 60.00"
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
