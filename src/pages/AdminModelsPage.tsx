import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/adminApi'
import type { Model, ModelType, Provider, Organization } from '@/types/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

const MODEL_TYPE_OPTIONS: Array<{ value: ModelType | string; label: string }> = [
  { value: 'CHAT', label: 'Chat' },
  { value: 'EMBEDDING', label: 'Embedding' },
  { value: 'PDF', label: 'PDF' },
  { value: 'VISION', label: 'Image' },
  { value: 'WORKFLOW', label: 'Workflow' },
  { value: 'MEMORY', label: 'Memory' },
  { value: 'METADATA', label: 'Metadata' },
  { value: 'TYPESENSE', label: 'Typesense'},
  { value: 'BI', label: 'BI Chat' },
  { value: 'POSTGRES', label: 'Postgres & MySQL'},
    {value: 'DEEP_RESEARCH', label: 'Deep Research'},
    { value: 'TRIAGE', label: 'Triage' },
  { value: 'AGENT', label: 'Agent' },
  { value: 'TITLE', label: 'Title'},
  { value: 'SUMMARY', label: 'Summary' },
  { value: 'DYNAMIC_TOOLS', label: 'Dynamic Tools'},
    {value: 'SUB_AGENTS', label: 'Sub Agent'},
  
]

interface SetModelForAllOrgsState {
  providerId: string
  modelId: string
  modelType: string
}

const emptySetModelForm: SetModelForAllOrgsState = {
  providerId: '',
  modelId: '',
  modelType: '',
}

interface ModelFormState {
  name: string
  providerId: string
  modelType: ModelType
}

const emptyModelForm: ModelFormState = {
  name: '',
  providerId: '',
  modelType: 'CHAT',
}

export default function AdminModelsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [organizationId, setOrganizationId] = useState('')
  const [providers, setProviders] = useState<Provider[]>([])
  const [models, setModels] = useState<Model[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [providerFilter, setProviderFilter] = useState('all')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isSetModelOpen, setIsSetModelOpen] = useState(false)
  const [selectedModel, setSelectedModel] = useState<Model | null>(null)
  const [formState, setFormState] = useState<ModelFormState>(emptyModelForm)
  const [setModelFormState, setSetModelFormState] = useState<SetModelForAllOrgsState>(emptySetModelForm)
  const [initialLoad, setInitialLoad] = useState(true)

  useEffect(() => {
    loadOrganizations()
    loadProviders()
  }, [])

  useEffect(() => {
    if (!organizationId) return
    loadModels(organizationId)
  }, [organizationId])

  const loadOrganizations = async () => {
    try {
      const list = await adminApi.getOrganizations()
      setOrganizations(list)
      if (list.length > 0) {
        setOrganizationId(prev => prev || list[0].id)
      }
    } catch (error: any) {
      console.error('Failed to load organizations', error)
      toast.error(error?.response?.data?.error || 'Failed to load organizations')
    }
  }

  const loadProviders = async () => {
    try {
      const list = await adminApi.getProviders()
      setProviders(list)
    } catch (error: any) {
      console.error('Failed to load providers', error)
      toast.error(error?.response?.data?.error || 'Failed to load providers')
    }
  }

  const loadModels = async (orgId: string) => {
    try {
      setLoading(true)
      const list = await adminApi.getModels({ organizationId: orgId })
      setModels(list)
    } catch (error: any) {
      console.error('Failed to load models', error)
      toast.error(error?.response?.data?.error || 'Failed to load models')
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }

  const filteredModels = useMemo(() => {
    return models.filter(model => {
      const matchesSearch = !search || model.name.toLowerCase().includes(search.toLowerCase())
      const matchesProvider = providerFilter === 'all' || model.providerId === providerFilter
      return matchesSearch && matchesProvider
    })
  }, [models, search, providerFilter])

  const providerOptions = useMemo(() => {
    return providers.map(provider => ({ value: provider.id, label: provider.name }))
  }, [providers])

  const availableModelsForProvider = useMemo(() => {
    if (!setModelFormState.providerId) return []
    return models.filter(model => model.providerId === setModelFormState.providerId)
  }, [models, setModelFormState.providerId])

  const modelOptionsForProvider = useMemo(() => {
    return availableModelsForProvider.map(model => ({ value: model.id, label: model.name }))
  }, [availableModelsForProvider])


  const openCreateModal = () => {
    setFormState({ ...emptyModelForm, providerId: providerOptions[0]?.value || '' })
    setIsCreateOpen(true)
  }

  const openEditModal = (model: Model) => {
    setSelectedModel(model)
    setFormState({ name: model.name, providerId: model.providerId, modelType: model.modelType as ModelType })
    setIsEditOpen(true)
  }

  const closeModals = () => {
    setIsCreateOpen(false)
    setIsEditOpen(false)
    setIsSetModelOpen(false)
    setSelectedModel(null)
    setFormState(emptyModelForm)
    setSetModelFormState(emptySetModelForm)
  }

  const openSetModelModal = () => {
    setSetModelFormState(emptySetModelForm)
    setIsSetModelOpen(true)
  }

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!organizationId) {
      toast.error('Select an organization before creating models')
      return
    }
    if (!formState.name.trim() || !formState.providerId || !formState.modelType) {
      toast.error('All fields are required')
      return
    }
    try {
      setSaving(true)
      await adminApi.createModel({
        name: formState.name.trim(),
        providerId: formState.providerId,
        organizationId,
        modelType: formState.modelType,
      })
      toast.success('Model created successfully')
      closeModals()
      await loadModels(organizationId)
    } catch (error: any) {
      console.error('Failed to create model', error)
      toast.error(error?.response?.data?.error || 'Failed to create model')
    } finally {
      setSaving(false)
    }
  }

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedModel) return
    if (!formState.name.trim()) {
      toast.error('Model name is required')
      return
    }
    try {
      setSaving(true)
      await adminApi.updateModel(selectedModel.id, {
        name: formState.name.trim(),
        modelType: formState.modelType,
      })
      toast.success('Model updated successfully')
      closeModals()
      if (organizationId) {
        await loadModels(organizationId)
      }
    } catch (error: any) {
      console.error('Failed to update model', error)
      toast.error(error?.response?.data?.error || 'Failed to update model')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (model: Model) => {
    if (!confirm(`Delete model "${model.name}"?`)) return
    try {
      await adminApi.deleteModel(model.id)
      toast.success('Model deleted successfully')
      if (organizationId) {
        await loadModels(organizationId)
      }
    } catch (error: any) {
      console.error('Failed to delete model', error)
      toast.error(error?.response?.data?.error || 'Failed to delete model')
    }
  }

  const handleSetModelForAllOrgs = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!setModelFormState.providerId || !setModelFormState.modelId || !setModelFormState.modelType) {
      toast.error('All fields are required')
      return
    }

    const selectedModel = models.find(m => m.id === setModelFormState.modelId)
    const selectedProvider = providers.find(p => p.id === setModelFormState.providerId)
    const selectedModelType = MODEL_TYPE_OPTIONS.find(mt => mt.value === setModelFormState.modelType)

 

    try {
      setSaving(true)
      
      const result = await adminApi.setModelForAllOrganizations({
        model: selectedModel!.name,
        providerId: setModelFormState.providerId,
        type: setModelFormState.modelType as ModelType,
      })
      
      toast.success(result.message || `Model settings applied successfully`)
      closeModals()
      if (organizationId) {
        await loadModels(organizationId)
      }
    } catch (error: any) {
      console.error('Failed to set model for all organizations', error)
      toast.error(error?.response?.data?.error || 'Failed to set model for all organizations')
    } finally {
      setSaving(false)
    }
  }

  const organizationOptions = organizations.map(org => ({ value: org.id, label: org.name }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Models</h1>
          
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {/* <Select
            value={organizationId}
            onChange={event => setOrganizationId(event.target.value)}
            options={organizationOptions}
            className="sm:w-64"
            label="Organization"
          /> */}
          <Input
            placeholder="Search models..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="sm:w-64"
          />
          <Button
            onClick={openSetModelModal}
            className="bg-green-600 hover:bg-green-700"
            disabled={providers.length === 0 || organizations.length === 0}
          >
            Set Model for All Orgs
          </Button>
          <Button
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700"
            disabled={!organizationId || providers.length === 0}
          >
            New Model
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-left">
            Models
            {/* {organizationId && selectedOrg ? `${selectedOrg.name} Models (${filteredModels.length})` : 'Models'} */}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Filter by Provider"
              value={providerFilter}
              onChange={event => setProviderFilter(event.target.value)}
              options={[{ value: 'all', label: 'All Providers' }, ...providerOptions]}
            />
          </div>

          {loading && initialLoad ? (
            <div className="py-10 text-center text-gray-600">Loading models…</div>
          ) : filteredModels.length === 0 ? (
            <div className="py-10 text-center text-gray-500">
              {organizationId ? 'No models found for this organization.' : 'Select an organization to view models.'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredModels.map(model => (
                  <TableRow key={model.id}>
                    <TableCell className="font-medium text-gray-900">{model.name}</TableCell>
                    <TableCell>{model.provider?.name || providerOptions.find(p => p.value === model.providerId)?.label || '—'}</TableCell>
                    
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditModal(model)}>
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(model)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {(isCreateOpen || isEditOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditOpen ? 'Edit Model' : 'Create Model'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {isEditOpen
                ? 'Edit model'
                : 'Publish a new model.'}
            </p>
            <form onSubmit={isEditOpen ? handleEditSubmit : handleCreateSubmit} className="mt-6 space-y-4">
              <Input
                label="Name"
                value={formState.name}
                onChange={event => setFormState(prev => ({ ...prev, name: event.target.value }))}
                placeholder="e.g. gpt-4o"
                required
              />
              <Select
                label="Provider"
                value={formState.providerId}
                onChange={event =>
                  setFormState(prev => ({ ...prev, providerId: event.target.value }))
                }
                options={providerOptions}
                disabled={isEditOpen}
              />
              {/* <Select
                label="Model Type"
                value={formState.modelType}
                onChange={event =>
                  setFormState(prev => ({ ...prev, modelType: event.target.value as ModelType }))
                }
                options={MODEL_TYPE_OPTIONS}
              /> */}
              {/* {selectedOrg && (
                <div className="text-sm text-gray-500">
                  Organization: <span className="font-medium text-gray-700">{selectedOrg.name}</span>
                </div>
              )} */}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModals} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving || (!isEditOpen && !formState.providerId)} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? 'Saving…' : isEditOpen ? 'Save Changes' : 'Create Model'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSetModelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">
              Set Model for All Organizations
            </h2>
       
            <form onSubmit={handleSetModelForAllOrgs} className="mt-6 space-y-4">
              <Select
                label="Provider"
                value={setModelFormState.providerId}
                onChange={event => {
                  setSetModelFormState(prev => ({ 
                    ...prev, 
                    providerId: event.target.value,
                    modelId: '' // Reset model when provider changes
                  }))
                }}
                options={[{ value: '', label: 'Select a provider...' }, ...providerOptions]}
                required
              />
              <Select
                label="Model"
                value={setModelFormState.modelId}
                onChange={event =>
                  setSetModelFormState(prev => ({ ...prev, modelId: event.target.value }))
                }
                options={[{ value: '', label: 'Select a model...' }, ...modelOptionsForProvider]}
                disabled={!setModelFormState.providerId || modelOptionsForProvider.length === 0}
                required
              />
              {setModelFormState.providerId && modelOptionsForProvider.length === 0 && (
                <p className="text-sm text-amber-600">
                  No models available for the selected provider. Please create a model first.
                </p>
              )}
              <Select
                label="Model Type"
                value={setModelFormState.modelType}
                onChange={event =>
                  setSetModelFormState(prev => ({ ...prev, modelType: event.target.value }))
                }
                options={[{ value: '', label: 'Select a model type...' }, ...MODEL_TYPE_OPTIONS]}
                required
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModals} disabled={saving}>
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={saving || !setModelFormState.providerId || !setModelFormState.modelId || !setModelFormState.modelType} 
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? 'Applying...' : 'Apply'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
