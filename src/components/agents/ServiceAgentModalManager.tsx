import React, { useState, useEffect } from 'react'
import { serviceApi } from '../../services/serviceApi'
import { adminApi } from '../../services/adminApi'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { toast } from 'sonner'

// Service agent type based on the actual API response
interface ServiceAgent {
  id: number;
  name: string;
  description?: string | null;
  customInstructions?: string | null;
  tools?: string[];
  category?: string | null;
  createdAt: string;
  updatedAt: string;
}

export type ServiceAgentModalType = 'create' | 'edit' | 'delete' | 'bulkImport' | 'bulkImportWF' | null

interface ServiceAgentModalManagerProps {
  activeModal: ServiceAgentModalType
  selectedAgent?: ServiceAgent | null
  onClose: () => void
  onAgentCreated: (agent: ServiceAgent) => void
  onAgentUpdated: (agent: ServiceAgent) => void
  onAgentDeleted: (id: string) => void
  onBulkImportSuccess?: () => void
  onBulkImportWFSuccess?: () => void
}

const ModalBase: React.FC<{ title: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; }>
  = ({ title, onClose, children, footer }) => (
  <div className="fixed inset-0 z-50 grid place-items-center p-4">
    <div className="fixed inset-0 bg-black/40" onClick={onClose} />
    <div className="relative w-full max-w-lg rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <button onClick={onClose} className="text-sm text-gray-600 hover:text-gray-900 px-2 py-1">Close</button>
      </div>
      <div className="px-5 py-4">{children}</div>
      <div className="flex justify-end gap-2 px-5 py-3 border-t border-gray-200 bg-gray-50">{footer}</div>
    </div>
  </div>
)

function ToolsMultiSelect({ value, onChange }: { value: string[]; onChange: (tools: string[]) => void }) {
  const [allTools, setAllTools] = useState<string[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [open, setOpen] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const meta = await adminApi.getConnectorsMetadata()
        const connectorTools = (meta.connectors || []).flatMap((c: any) => Array.isArray(c.tools) ? c.tools : [])
        const core = Array.isArray(meta.coreTools) ? meta.coreTools : []
        const s = new Set<string>([...connectorTools, ...core])
        setAllTools(Array.from(s).sort())
      } catch (e) {
        console.error('Failed to load tools', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const filtered = allTools.filter(t => t.toLowerCase().includes(query.toLowerCase()))

  const toggle = (tool: string) => {
    if (value.includes(tool)) onChange(value.filter(t => t !== tool))
    else onChange([...value, tool])
  }

  const formatToolName = (raw: string): string => {
    const withSpaces = raw
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    return withSpaces
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }

  const MAX_VISIBLE_CHIPS = 2
  const visibleTools = value.slice(0, MAX_VISIBLE_CHIPS)
  const overflowCount = value.length - visibleTools.length
  const overflowList = overflowCount > 0 ? value.slice(MAX_VISIBLE_CHIPS) : []

  return (
    <div>
      <label className="block text-start text-sm font-medium text-gray-700 mb-1">Tools</label>
      <div className="relative">
        <button type="button" className="w-full px-3 py-2 border border-gray-300 rounded-md text-left bg-white" onClick={() => setOpen(o => !o)}>
          {value.length ? `${value.length} selected` : 'Select tools'}
        </button>
        {open && (
          <div className="absolute z-10 mt-1 w-full border border-gray-200 rounded-md bg-white shadow max-h-64 overflow-auto">
            <div className="p-2 sticky top-0 bg-white border-b">
              <input
                placeholder="Search tools"
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
              />
            </div>
                         <div className="p-2">
               {loading ? (
                 <div className="text-xs text-gray-500">Loading…</div>
               ) : filtered.length === 0 ? (
                 <div className="text-xs text-gray-500">No tools found</div>
               ) : (
                 filtered.map(tool => {
                   const selected = value.includes(tool)
                   return (
                     <label key={tool} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer">
                       <input type="checkbox" checked={selected} readOnly onClick={() => toggle(tool)} />
                       <span className="text-sm">{formatToolName(tool)}</span>
                     </label>
                   )
                 })
               )}
             </div>
          </div>
        )}
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {visibleTools.map(t => (
            <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-300 bg-gray-50">
              {formatToolName(t)}
              <button type="button" className="text-gray-500 hover:text-gray-800" onClick={() => toggle(t)}>×</button>
            </span>
          ))}
          {overflowCount > 0 && (
            <span
              className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-300 bg-gray-50"
              title={overflowList.map(formatToolName).join(', ')}
            >
              +{overflowCount}{" Tools"}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

const ServiceAgentCreateModal: React.FC<{ onClose: () => void; onSuccess: (agent: ServiceAgent) => void }>
  = ({ onClose, onSuccess }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [tools, setTools] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [category, setCategory] = useState('')
  
  const submit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        customInstructions: customInstructions.trim() || undefined,
        tools,
        category: category.trim() || undefined,
      }
      const created = await serviceApi.createAgent(body) as ServiceAgent
      toast.success('Agent created successfully')
      onSuccess(created)
    } catch (error: any) {
      console.error('Failed to create agent:', error)
      toast.error(error?.message || 'Failed to create agent')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalBase
      title="Create Agent"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || submitting}>{submitting ? 'Creating…' : 'Create'}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} />
        <ToolsMultiSelect value={tools} onChange={setTools} />
        <div>
          <label className="block text-sm text-start font-medium text-gray-700 mb-1">Description</label>
          <textarea className="w-full border border-gray-300 rounded-md px-3 py-2" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block text-start text-sm font-medium text-gray-700 mb-1">Custom Instructions</label>
          <textarea className="w-full border border-gray-300 rounded-md px-3 py-2" rows={3} value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm text-start font-medium text-gray-700 mb-1">Category</label>
          <input className="w-full border border-gray-300 rounded-md px-3 py-2" value={category} onChange={e => setCategory(e.target.value)} />
        </div>
      </div>
    </ModalBase>
  )
}

const ServiceAgentBulkImportModal: React.FC<{ onClose: () => void; onSuccess: () => void }>
  = ({ onClose, onSuccess }) => {
  const [bulkCsvUploading, setBulkCsvUploading] = useState(false)

  return (
    <ModalBase
      title="Bulk Import CSV"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-muted/30">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className='text-left'>
              <div className="block text-[13px] font-medium text-foreground">Upload CSV</div>
            </div>
          </div>
           
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={bulkCsvUploading}
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    setBulkCsvUploading(true)
                    await serviceApi.bulkImportAgents(file)
                    toast.success('Bulk agents imported successfully')
                    onSuccess()
                    onClose()
                  } catch (err: any) {
                    const msg = err?.response?.data?.message || err?.message || 'Bulk import failed'
                    toast.error(msg)
                  } finally {
                    setBulkCsvUploading(false)
                    e.currentTarget.value = ''
                  }
                }}
                className="text-xs file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-foreground hover:file:bg-muted/50 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>
    </ModalBase>
  )
}

const ServiceAgentBulkImportWFModal: React.FC<{ onClose: () => void; onSuccess: () => void }>
  = ({ onClose, onSuccess }) => {
  const [bulkCsvUploading, setBulkCsvUploading] = useState(false)

  return (
    <ModalBase
      title="Bulk Import CSV"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-muted/30">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className='text-left'>
              <div className="block text-[13px] font-medium text-foreground">Upload CSV</div>
            </div>
          </div>
           
          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".csv,text/csv"
                disabled={bulkCsvUploading}
                onChange={async e => {
                  const file = e.target.files?.[0]
                  if (!file) return
                  try {
                    setBulkCsvUploading(true)
                    await serviceApi.bulkImportWorkflows(file)
                    toast.success('Bulk workflows imported successfully')
                    onSuccess()
                    onClose()
                  } catch (err: any) {
                    const msg = err?.response?.data?.message || err?.message || 'Bulk import failed'
                    toast.error(msg)
                  } finally {
                    setBulkCsvUploading(false)
                    e.currentTarget.value = ''
                  }
                }}
                className="text-xs file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-foreground hover:file:bg-muted/50 disabled:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>
    </ModalBase>
  )
}

const ServiceAgentEditModal: React.FC<{ agent: ServiceAgent; onClose: () => void; onSuccess: (agent: ServiceAgent) => void }>
  = ({ agent, onClose, onSuccess }) => {
  const [name, setName] = useState(agent.name)
  const [description, setDescription] = useState(agent.description || '')
  const [customInstructions, setCustomInstructions] = useState(agent.customInstructions || '')
  const [tools, setTools] = useState<string[]>(agent.tools || [])
  const [submitting, setSubmitting] = useState(false)
  const [category, setCategory] = useState(agent.category || '')

  const submit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const body = {
        name: name.trim(),
        description: description.trim() || undefined,
        customInstructions: customInstructions.trim() || undefined,
        tools,
        category: category.trim() || undefined,
      }
      const updated = await serviceApi.updateAgent(agent.id.toString(), body) as ServiceAgent
      toast.success('Agent updated successfully')
      onSuccess(updated)
    } catch (error: any) {
      console.error('Failed to update agent:', error)
      toast.error(error?.message || 'Failed to update agent')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalBase
      title="Edit Agent"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || submitting}>{submitting ? 'Saving…' : 'Save'}</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} />
        <ToolsMultiSelect value={tools} onChange={setTools} />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea className="w-full border border-gray-300 rounded-md px-3 py-2" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Custom Instructions</label>
          <textarea className="w-full border border-gray-300 rounded-md px-3 py-2" rows={3} value={customInstructions} onChange={e => setCustomInstructions(e.target.value)} />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
          <input className="w-full border border-gray-300 rounded-md px-3 py-2" value={category} onChange={e => setCategory(e.target.value)} />
        </div>
      </div>
    </ModalBase>
  )
}

const ServiceAgentDeleteModal: React.FC<{ agent: ServiceAgent; onClose: () => void; onSuccess: (id: string) => void }>
  = ({ agent, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await serviceApi.deleteAgent(agent.id.toString())
      toast.success('Agent deleted successfully')
      onSuccess(agent.id.toString())
    } catch (error: any) {
      console.error('Failed to delete agent:', error)
      toast.error(error?.message || 'Failed to delete agent')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalBase
      title="Delete Agent"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={submit} disabled={submitting}>{submitting ? 'Deleting…' : 'Delete'}</Button>
        </>
      }
    >
      <p className="text-sm text-gray-700">Are you sure you want to delete "{agent.name}"?</p>
    </ModalBase>
  )
}

const ServiceAgentModalManager: React.FC<ServiceAgentModalManagerProps> = ({ activeModal, selectedAgent, onClose, onAgentCreated, onAgentUpdated, onAgentDeleted, onBulkImportSuccess, onBulkImportWFSuccess }) => {
  if (!activeModal) return null
  
  if (activeModal === 'create') {
    return (
      <ServiceAgentCreateModal
        onClose={onClose}
        onSuccess={(created) => onAgentCreated(created)}
      />
    )
  }
  if (activeModal === 'edit' && selectedAgent) {
    return (
      <ServiceAgentEditModal
        agent={selectedAgent}
        onClose={onClose}
        onSuccess={(updated) => onAgentUpdated(updated)}
      />
    )
  }
  if (activeModal === 'delete' && selectedAgent) {
    return (
      <ServiceAgentDeleteModal
        agent={selectedAgent}
        onClose={onClose}
        onSuccess={(id) => onAgentDeleted(id)}
      />
    )
  }
  if (activeModal === 'bulkImport') {
    return (
      <ServiceAgentBulkImportModal
        onClose={onClose}
        onSuccess={() => {
          onBulkImportSuccess?.()
          onClose()
        }}
      />
    )
  }
  if (activeModal === 'bulkImportWF') {
    return (
      <ServiceAgentBulkImportWFModal
        onClose={onClose}
        onSuccess={() => {
          onBulkImportWFSuccess?.()
          onClose()
        }}
      />
    )
  }
  return null
}

export default ServiceAgentModalManager
export type { ServiceAgent } 