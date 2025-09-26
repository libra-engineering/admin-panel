import { useState, useEffect } from 'react';
import { serviceApi } from '@/services/serviceApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Edit2, Save, Settings, Trash2, X, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';


interface EnvVariable {
  id: string;
  key: string;
  value: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function ServiceEnvVariablesPage() {
  const [envVariables, setEnvVariables] = useState<EnvVariable[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maskedVariables, setMaskedVariables] = useState<Set<string>>(new Set());

  const [editForm, setEditForm] = useState<Partial<EnvVariable>>({});
  const [createForm, setCreateForm] = useState<Partial<EnvVariable>>({
    key: '',
    value: ''
  });

  useEffect(() => {
    fetchEnvVariables();
  }, []);

  const fetchEnvVariables = async () => {
    try {
      setIsLoading(true);
      const variables = await serviceApi.getEnvVariables() as EnvVariable[];
      setEnvVariables(variables);
      const apiKeyIds = variables
        .map(v => v.id);
      setMaskedVariables(new Set(apiKeyIds));
    } catch (error) {
      console.error('Failed to fetch environment variables:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to fetch environment variables');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!createForm.key || !createForm.value) {
      toast.error('Key and value are required');
      return;
    }

    try {
      setIsSubmitting(true);
      await serviceApi.createEnvVariable(createForm as { key: string; value: string });
      setCreateForm({ key: '', value: '' });
      setShowCreateForm(false);
      toast.success('ENV created successfully');
      await fetchEnvVariables();
    } catch (error) {
      console.error('Failed to create environment variable:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create environment variable');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      setIsSubmitting(true);
      await serviceApi.updateEnvVariable(id, editForm);
      setEditingId(null);
      setEditForm({});
      toast.success('ENV updated successfully');
      await fetchEnvVariables();
    } catch (error) {
      console.error('Failed to update environment variable:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update environment variable');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this environment variable?')) {
      return;
    }

    try {
      await serviceApi.deleteEnvVariable(id);
      await fetchEnvVariables();
    } catch (error) {
      console.error('Failed to delete environment variable:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete environment variable');
    }
  };

  const startEdit = (envVar: EnvVariable) => {
    setEditingId(envVar.id);
    setEditForm({
      key: envVar.key,
      value: envVar.value
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const toggleMask = (id: string) => {
    setMaskedVariables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getMaskedValue = (value: string, id: string) => {
    if (!maskedVariables.has(id)) {
      return value;
    }
    // return '********'
    return value.substring(0, 6) + '*'.repeat(Math.max(0, Math.min(value.length - 6, 44)));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            Environment Variables
          </h1>
          <p className="text-gray-600 mt-1">Manage service ENVs and configuration</p>
        </div>
        <div className="flex items-center space-x-3">
          
          <Button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center"
            disabled={showCreateForm}
          >
            Add Env
          </Button>
        </div>
      </div>

      
      {/* Create Form */}
      {showCreateForm && (
        <Card>
          <div className="p-6">
            <h3 className="text-lg font-medium text-left text-gray-900 mb-4">Add New Env</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Key *</label>
                <Input
                  value={createForm.key || ''}
                  onChange={(e) => setCreateForm({ ...createForm, key: e.target.value })}
                  placeholder="VARIABLE_NAME"
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
                <Input
                  value={createForm.value || ''}
                  onChange={(e) => setCreateForm({ ...createForm, value: e.target.value })}
                  placeholder="Variable value"
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({ key: '', value: '' });
                }}
                disabled={isSubmitting}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={isSubmitting || !createForm.key || !createForm.value}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Creating...' : 'Create Variable'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Variables List */}
      <Card>
        {/* <div className="p-6"> */}
          {/* <h3 className="text-lg font-medium text-gray-900 mb-4">Current Variables</h3> */}
          
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : envVariables.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No environment variables found</p>
              <p className="text-sm">Add your first variable to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {envVariables.map((envVar) => (
                <div key={envVar.id} className="border border-gray-200 rounded-lg p-4">
                  {editingId === envVar.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Key</label>
                          <Input
                            value={editForm.key || ''}
                            onChange={(e) => setEditForm({ ...editForm, key: e.target.value })}
                            className="w-full"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
                          <Input
                            value={editForm.value || ''}
                            onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                            className="w-full"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={cancelEdit}
                          disabled={isSubmitting}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleUpdate(envVar.id)}
                          disabled={isSubmitting}
                        >
                          <Save className="h-4 w-4 mr-1" />
                          {isSubmitting ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <Badge variant="default" className="font-mono">
                            {envVar.key}
                          </Badge>
                          <span className="text-gray-600 font-mono">
                            {getMaskedValue(envVar.value, envVar.id)}
                          </span>
                        </div>
                      
                      </div>
                      <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleMask(envVar.id)}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            {maskedVariables.has(envVar.id) ? (
                              <Eye className="h-4 w-4" />
                            ) : (
                              <EyeOff className="h-4 w-4" />
                            )}
                          </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(envVar)}
                          disabled={editingId !== null}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(envVar.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        {/* </div> */}
      </Card>
    </div>
  );
} 