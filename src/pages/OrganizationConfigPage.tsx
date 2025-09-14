import React, { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { adminApi } from '@/services/adminApi'

type EntryMap = Record<string, string>

export default function OrganizationConfigPage() {
  const { organizationId } = useParams<{ organizationId: string }>()
  const orgId = organizationId || ''

  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState<EntryMap>({})
  const [initialEntries, setInitialEntries] = useState<EntryMap>({})
  const [showValues, setShowValues] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    if (!orgId) return
    setLoading(true)
    setError(null)
    try {
      const list = await adminApi.getOrganizationConfig(orgId)
      const data: EntryMap = {}
      for (const item of list) {
        data[item.key] = item.value || ''
      }
      setEntries(data)
      setInitialEntries(JSON.parse(JSON.stringify(data)))
      const hasAnyValue = Object.values(data).some(v => (v || '').trim().length > 0)
      if (!hasAnyValue) setIsEditing(true)
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to load configuration')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId])

  const handleChange = (key: string, value: string) => {
    setEntries(prev => ({ ...prev, [key]: value }))
  }

  const handleEditClick = () => {
    setIsEditing(true)
  }

  const handleCancelClick = () => {
    setEntries(JSON.parse(JSON.stringify(initialEntries)))
    setIsEditing(false)
  }

  const handleSave = async () => {
    if (!isEditing || saving) return
    setSaving(true)
    setError(null)
    try {
      const changedKeys = Object.keys(entries).filter(k => (entries[k] || '') !== (initialEntries[k] || ''))
      if (changedKeys.length === 0) {
        setIsEditing(false)
        return
      }
      await Promise.all(
        changedKeys.map(k => adminApi.setOrganizationConfig(orgId, k, entries[k] || ''))
      )
      await load()
      setIsEditing(false)
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Failed to save configuration')
    } finally {
      setSaving(false)
    }
  }

  const keys = useMemo(() => Object.keys(entries).sort((a, b) => a.localeCompare(b)), [entries])

  const inputBaseStyles = 'block w-full px-3 py-2.5 border rounded-md placeholder-gray-400 focus:outline-none sm:text-sm transition-colors duration-150 ease-in-out'
  const activeEditableStyles = 'bg-white border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900'
  const readOnlyStyles = 'bg-gray-100 border-gray-200 cursor-not-allowed text-gray-500'
  const inputClasses = `${inputBaseStyles} ${!isEditing || saving ? readOnlyStyles : activeEditableStyles}`

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-semibold text-gray-900">Environment Configuration</h3>
          <p className="text-sm text-gray-600 mt-1">Manage environment settings for this organization.</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto sm:min-w-[310px] justify-end shrink-0">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={handleCancelClick}
                disabled={saving}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium border border-gray-300 bg-white text-gray-900 shadow-sm hover:bg-gray-50 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className={`inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium text-white ${saving ? 'bg-blue-500/70 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {saving ? 'Saving…' : 'Save Configuration'}
              </button>
            </>
          ) : (
            <>
              <label className="text-sm flex items-center gap-2 mr-2">
                <input
                  type="checkbox"
                  checked={showValues}
                  onChange={e => setShowValues(e.target.checked)}
                />
                Show values
              </label>
              <button
                type="button"
                onClick={handleEditClick}
                className="inline-flex items-center justify-center px-4 py-2.5 rounded-md text-sm font-medium w-auto sm:min-w-[180px] whitespace-nowrap bg-blue-600 text-white hover:bg-blue-700"
              >
                Edit Configuration
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      {loading ? (
        <div className="text-sm text-gray-600">Loading…</div>
      ) : (
        <div className="grid gap-6">
          {keys.map(k => {
            const hasValue = !!(entries[k] || '').trim()
            return (
              <div
                key={k}
                className={`border rounded-lg p-4 transition-colors duration-200 ${hasValue ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-white'}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium text-gray-900 break-all">{k}</h5>
                  </div>
                  {hasValue && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">Configured</span>
                  )}
                </div>
                <input
                  type={showValues ? 'text' : 'password'}
                  className={inputClasses}
                  value={entries[k] || ''}
                  onChange={e => handleChange(k, e.target.value)}
                  readOnly={!isEditing || saving}
                />
              </div>
            )
          })}
          {keys.length === 0 && (
            <div className="text-sm text-gray-600">No configuration keys available for this organization.</div>
          )}
        </div>
      )}
    </div>
  )
} 