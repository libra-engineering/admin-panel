import { useState, useEffect, useMemo } from 'react';
import { adminApi } from '@/services/adminApi';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Search, DollarSign } from 'lucide-react';

interface ModelPricing {
  id: string;
  model: string;
  inputCost: number | null;
  outputCost: number | null;
  createdAt: string;
  updatedAt: string;
}

interface LLMModel {
  id: string;
  name: string;
  providerId: string;
  isActive: boolean;
  provider?: {
    id: string;
    name: string;
  };
}

export default function AdminModelPricingPage() {
  const [pricings, setPricings] = useState<ModelPricing[]>([]);
  const [llmModels, setLlmModels] = useState<LLMModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedPricing, setSelectedPricing] = useState<ModelPricing | null>(null);
  const [formData, setFormData] = useState({
    model: '',
    inputCost: '',
    outputCost: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPricings();
    fetchLLMModels();
  }, []);

  const fetchPricings = async () => {
    try {
      setIsLoading(true);
      const data = await adminApi.getModelPricings();
      setPricings(data);
    } catch (error) {
      console.error('Failed to fetch model pricings:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch model pricings');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchLLMModels = async () => {
    try {
      setIsLoadingModels(true);
      const data = await adminApi.getAllLLMModels();
      setLlmModels(data);
    } catch (error) {
      console.error('Failed to fetch LLM models:', error);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const filteredPricings = useMemo(() => {
    if (!searchTerm) return pricings;
    const term = searchTerm.toLowerCase();
    return pricings.filter(pricing => pricing.model.toLowerCase().includes(term));
  }, [pricings, searchTerm]);

  const availableModels = useMemo(() => {
    const pricingModels = new Set(pricings.map(p => p.model));
    return llmModels
      .filter(model => !pricingModels.has(model.name))
      .map(model => ({ value: model.name, label: `${model.name} (${model.provider?.name || 'Unknown'})` }));
  }, [llmModels, pricings]);

  const handleCreate = () => {
    setIsEditing(false);
    setSelectedPricing(null);
    setFormData({ model: '', inputCost: '', outputCost: '' });
    setIsModalOpen(true);
  };

  const handleEdit = (pricing: ModelPricing) => {
    setIsEditing(true);
    setSelectedPricing(pricing);
    setFormData({
      model: pricing.model,
      inputCost: pricing.inputCost?.toString() || '',
      outputCost: pricing.outputCost?.toString() || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (pricing: ModelPricing) => {
    if (!confirm(`Are you sure you want to delete pricing for "${pricing.model}"?`)) {
      return;
    }

    try {
      await adminApi.deleteModelPricing(pricing.id);
      toast.success('Model pricing deleted successfully');
      fetchPricings();
    } catch (error) {
      console.error('Failed to delete model pricing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete model pricing');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.model.trim()) {
      toast.error('Model name is required');
      return;
    }

    const inputCost = formData.inputCost.trim() ? parseFloat(formData.inputCost) : null;
    const outputCost = formData.outputCost.trim() ? parseFloat(formData.outputCost) : null;

    if (inputCost !== null && (isNaN(inputCost) || inputCost < 0)) {
      toast.error('Input cost must be a valid positive number');
      return;
    }

    if (outputCost !== null && (isNaN(outputCost) || outputCost < 0)) {
      toast.error('Output cost must be a valid positive number');
      return;
    }

    try {
      setIsSaving(true);
      const payload: any = {
        model: formData.model.trim()
      };

      if (inputCost !== null) {
        payload.inputCost = inputCost;
      }

      if (outputCost !== null) {
        payload.outputCost = outputCost;
      }

      if (isEditing && selectedPricing) {
        await adminApi.updateModelPricing(selectedPricing.id, payload);
        toast.success('Model pricing updated successfully');
      } else {
        await adminApi.createModelPricing(payload);
        toast.success('Model pricing created successfully');
      }
      setIsModalOpen(false);
      fetchPricings();
    } catch (error) {
      console.error('Failed to save model pricing:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save model pricing');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatCost = (cost: number | null) => {
    if (cost === null) return 'Not set';
    return `$${cost.toFixed(4)}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Model Pricing</h1>
          <p className="text-gray-600 mt-1">Manage pricing for AI models (per million tokens)</p>
        </div>
        <Button onClick={handleCreate} className="flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Add Model Pricing
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-left">All Model Pricings ({filteredPricings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Search by model name..."
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
          ) : filteredPricings.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              {searchTerm ? 'No model pricings found matching your search' : 'No model pricings configured'}
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
                      Input Cost
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Output Cost
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
                  {filteredPricings.map((pricing) => (
                    <tr key={pricing.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{pricing.model}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-green-600" />
                          {formatCost(pricing.inputCost)} / 1M tokens
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex items-center">
                          <DollarSign className="h-3 w-3 mr-1 text-blue-600" />
                          {formatCost(pricing.outputCost)} / 1M tokens
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(pricing.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(pricing.updatedAt)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(pricing)}
                            className="flex items-center"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(pricing)}
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
        </CardContent>
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit Model Pricing' : 'Create Model Pricing'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Costs are per million tokens. Leave empty to set as null.
            </p>
            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                {isEditing ? (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model Name *
                    </label>
                    <Input
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      placeholder="e.g. gpt-4o"
                      required
                    />
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Model *
                    </label>
                    <Select
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      options={[
                        { value: '', label: 'Select a model...' },
                        ...availableModels
                      ]}
                      required
                    />
                    {isLoadingModels && (
                      <p className="text-xs text-gray-500 mt-1">Loading models...</p>
                    )}
                  </>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Input Cost ($ per 1M tokens)
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.inputCost}
                  onChange={(e) => setFormData({ ...formData, inputCost: e.target.value })}
                  placeholder="e.g. 2.5 (leave empty for null)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Output Cost ($ per 1M tokens)
                </label>
                <Input
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.outputCost}
                  onChange={(e) => setFormData({ ...formData, outputCost: e.target.value })}
                  placeholder="e.g. 10.0 (leave empty for null)"
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
