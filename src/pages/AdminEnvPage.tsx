import React, { useEffect, useMemo, useState } from 'react'
import { adminApi } from '@/services/adminApi'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Edit2, Save, Settings, Trash2, X, Eye, EyeOff, Plus } from 'lucide-react'
import { toast } from 'sonner'

interface AdminEnvVariable {
  id: string
  key: string
  value: string
  createdAt?: string
  updatedAt?: string
}

export default function AdminEnvPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [envVariables, setEnvVariables] = useState<AdminEnvVariable[]>([])
  const [maskedVariables, setMaskedVariables] = useState<Set<string>>(new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)
  
  const [editForm, setEditForm] = useState<Partial<AdminEnvVariable>>({})
  const [createForm, setCreateForm] = useState<Partial<AdminEnvVariable>>({
    key: '',
    value: '',
  })

  const load = async () => {
    setLoading(true)
    try {
      const variables = await adminApi.getAdminEnvVariables()
      setEnvVariables(variables)
      // Initially mask all variables
      const allIds = variables.map(v => v.id)
      setMaskedVariables(new Set(allIds))
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || 'Failed to load environment variables')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const handleCreate = async () => {
    if (!createForm.key || !createForm.value) {
      toast.error('Key and value are required')
      return
    }

    setSaving(true)
    try {
      await adminApi.createAdminEnvVariable({
        key: createForm.key!,
        value: createForm.value!,
      })
      setCreateForm({ key: '', value: ''})
      setShowCreateForm(false)
      toast.success('Environment variable created successfully')
      await load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || 'Failed to create environment variable')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdate = async (key: string) => {
    if (!editForm.value) {
      toast.error('Value is required')
      return
    }

    setSaving(true)
    try {
      await adminApi.updateAdminEnvVariable(key, editForm.value)
      setEditingId(null)
      setEditForm({})
      toast.success('Environment variable updated successfully')
      await load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || 'Failed to update environment variable')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this environment variable?')) {
      return
    }

    try {
      await adminApi.deleteAdminEnvVariable(key)
      toast.success('Environment variable deleted successfully')
      await load()
    } catch (e: any) {
      toast.error(e?.response?.data?.error || e?.message || 'Failed to delete environment variable')
    }
  }

  const startEdit = (envVar: AdminEnvVariable) => {
    setEditingId(envVar.id)
    setEditForm({
      key: envVar.key,
      value: envVar.value,
    })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditForm({})
  }

  const toggleMask = (id: string) => {
    setMaskedVariables(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const getMaskedValue = (value: string, id: string) => {
    if (!maskedVariables.has(id)) {
      return value
    }
    return value.substring(0, 6) + '*'.repeat(Math.max(0, Math.min(value.length - 6, 44)))
  }

  const sortedVariables = useMemo(() => 
    envVariables.sort((a, b) => a.key.localeCompare(b.key)), 
    [envVariables]
  )

  const inputBaseStyles = 'block w-full px-3 py-2.5 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm transition-colors duration-150 ease-in-out'
  const activeEditableStyles = 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900'
  const readOnlyStyles = 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500'

  return (
    <div className="space-y-6 p-6">
      <div className="flex text-left flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">Environment Variables</h3>
          <p className="text-sm text-gray-600 mt-1">Manage global environment settings for the system.</p>
        </div>
        
      </div>

      
      {/* Create Form */}
      {showCreateForm && (
        <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
          <div className="grid text-left gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Key *</label>
              <input
                type="text"
                className={`${inputBaseStyles} ${activeEditableStyles}`}
                value={createForm.key || ''}
                onChange={e => setCreateForm({ ...createForm, key: e.target.value })}
                placeholder="VARIABLE_NAME"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Value *</label>
              <input
                type="text"
                className={`${inputBaseStyles} ${activeEditableStyles}`}
                value={createForm.value || ''}
                onChange={e => setCreateForm({ ...createForm, value: e.target.value })}
                placeholder="Variable value"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-3 mt-4">
            <button
              type="button"
              onClick={() => {
                setShowCreateForm(false)
                setCreateForm({ key: '', value: '' })
              }}
              disabled={saving}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={saving || !createForm.key || !createForm.value}
              className={`inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium text-white ${saving ? 'bg-blue-500/70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
            >
              {saving ? 'Creating…' : 'Create Variable'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : (
        <div className="grid gap-6">
          {sortedVariables.map(envVar => {
            const hasValue = !!(envVar.value || '').trim()
            const isEditing = editingId === envVar.id
            
            return (
              <div
                key={envVar.id}
                className={`border rounded-lg p-4 transition-colors duration-200 ${hasValue ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 text-left">
                    <h5 className="font-medium text-gray-900 break-all">{envVar.key}</h5>
                    
                  </div>
                  {hasValue && !isEditing && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full ml-3">Configured</span>
                  )}
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-1">
                      
                      <div>
                        <label className="block text-left text-sm font-medium text-gray-700 mb-1">Value</label>
                        <input
                          type="text"
                          className={`${inputBaseStyles} ${activeEditableStyles}`}
                          value={editForm.value || ''}
                          onChange={e => setEditForm({ ...editForm, value: e.target.value })}
                        />
                      </div>
                    </div>
                   
                    <div className="flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed"
                      >
                        Cancel
                      </button>
                                             <button
                         type="button"
                         onClick={() => handleUpdate(envVar.key)}
                         disabled={saving}
                         className={`inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium text-white ${saving ? 'bg-blue-500/70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                       >
                         {saving ? 'Saving…' : 'Save Changes'}
                       </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      className={`${inputBaseStyles} ${readOnlyStyles} flex-1`}
                      value={getMaskedValue(envVar.value || '', envVar.id)}
                      readOnly
                    />
                    <button
                      type="button"
                      onClick={() => toggleMask(envVar.id)}
                      className="inline-flex items-center justify-center p-2.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-600 hover:text-gray-700 hover:bg-gray-50"
                    >
                      {maskedVariables.has(envVar.id) ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(envVar)}
                      disabled={editingId !== null}
                      className="inline-flex items-center justify-center p-2.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-600 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(envVar.key)}
                      className="inline-flex items-center justify-center p-2.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {sortedVariables.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No environment variables found</p>
              <p className="text-sm">Add your first variable to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 