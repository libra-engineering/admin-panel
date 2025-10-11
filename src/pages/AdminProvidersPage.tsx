import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { adminApi } from '@/services/adminApi'
import type { Provider } from '@/types/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ProviderFormState {
  name: string
}

const emptyProviderForm: ProviderFormState = { name: '' }

export default function AdminProvidersPage() {
  const [providers, setProviders] = useState<Provider[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [formState, setFormState] = useState<ProviderFormState>(emptyProviderForm)
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null)

  useEffect(() => {
    loadProviders()
  }, [])

  const loadProviders = async () => {
    try {
      setLoading(true)
      const list = await adminApi.getProviders()
      setProviders(list)
    } catch (error: any) {
      console.error('Failed to load providers', error)
      toast.error(error?.response?.data?.error || 'Failed to load providers')
    } finally {
      setLoading(false)
    }
  }

  const filteredProviders = useMemo(() => {
    if (!search) return providers
    const term = search.toLowerCase()
    return providers.filter(provider => provider.name.toLowerCase().includes(term))
  }, [providers, search])

  const handleCreateSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!formState.name.trim()) {
      toast.error('Provider name is required')
      return
    }
    try {
      setSaving(true)
      await adminApi.createProvider({ name: formState.name.trim() })
      toast.success('Provider created successfully')
      setIsCreateOpen(false)
      setFormState(emptyProviderForm)
      await loadProviders()
    } catch (error: any) {
      console.error('Failed to create provider', error)
      toast.error(error?.response?.data?.error || 'Failed to create provider')
    } finally {
      setSaving(false)
    }
  }

  const handleEditOpen = (provider: Provider) => {
    setSelectedProvider(provider)
    setFormState({ name: provider.name })
    setIsEditOpen(true)
  }

  const handleEditSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedProvider) return
    if (!formState.name.trim()) {
      toast.error('Provider name is required')
      return
    }
    try {
      setSaving(true)
      await adminApi.updateProvider(selectedProvider.id, { name: formState.name.trim() })
      toast.success('Provider updated successfully')
      setIsEditOpen(false)
      setSelectedProvider(null)
      setFormState(emptyProviderForm)
      await loadProviders()
    } catch (error: any) {
      console.error('Failed to update provider', error)
      toast.error(error?.response?.data?.error || 'Failed to update provider')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (provider: Provider) => {
    if (!confirm(`Delete provider "${provider.name}"?`)) return
    try {
      await adminApi.deleteProvider(provider.id)
      toast.success('Provider deleted successfully')
      await loadProviders()
    } catch (error: any) {
      console.error('Failed to delete provider', error)
      toast.error(error?.response?.data?.error || 'Failed to delete provider')
    }
  }

  const closeModals = () => {
    setIsCreateOpen(false)
    setIsEditOpen(false)
    setSelectedProvider(null)
    setFormState(emptyProviderForm)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Providers</h1>
          <p className="text-sm text-gray-600">Manage available LLM providers.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <Input
            placeholder="Search providers..."
            value={search}
            onChange={event => setSearch(event.target.value)}
            className="sm:w-64"
          />
          <Button onClick={() => setIsCreateOpen(true)} className="bg-blue-600 hover:bg-blue-700">
            New Provider
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-left">All Providers ({filteredProviders.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-gray-600">Loading providers…</div>
          ) : filteredProviders.length === 0 ? (
            <div className="py-10 text-center text-gray-500">No providers found.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProviders.map(provider => (
                  <TableRow key={provider.id}>
                    <TableCell className="font-medium text-gray-900">{provider.name}</TableCell>
                    <TableCell>{new Date(provider.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(provider.updatedAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditOpen(provider)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(provider)}
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
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditOpen ? 'Edit Provider' : 'Create Provider'}
            </h2>
            <p className="mt-1 text-sm text-gray-600">
              {isEditOpen
                ? 'Update provider details to keep your catalog accurate.'
                : 'Add a new provider to make its models available for organizations.'}
            </p>
            <form onSubmit={isEditOpen ? handleEditSubmit : handleCreateSubmit} className="mt-6 space-y-4">
              <Input
                label="Name"
                value={formState.name}
                onChange={event => setFormState({ name: event.target.value })}
                placeholder="e.g. OpenAI"
                required
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={closeModals} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700">
                  {saving ? 'Saving…' : isEditOpen ? 'Save Changes' : 'Create Provider'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}


