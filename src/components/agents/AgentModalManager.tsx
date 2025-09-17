import React, { useState, useEffect } from 'react'
import type { AgentLibraryItem, BulkCsvResponse, CreateAgentLibraryRequest, UpdateAgentLibraryRequest } from '../../services/libraryApi'
import { agentApi, libraryApi } from '../../services/libraryApi'
import { adminApi } from '../../services/adminApi'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { toast } from 'sonner'

export type AgentModalType = 'create' | 'edit' | 'delete' | 'bulkImport' | null

interface AgentModalManagerProps {
  activeModal: AgentModalType
  selectedAgent?: AgentLibraryItem | null
  onClose: () => void
  onAgentCreated: (agent: AgentLibraryItem) => void
  onAgentUpdated: (agent: AgentLibraryItem) => void
  onAgentDeleted: (id: string) => void
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

const AgentCreateModal: React.FC<{ onClose: () => void; onSuccess: (agent: AgentLibraryItem) => void }>
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
      const body: CreateAgentLibraryRequest = {
        name: name.trim(),
        description: description.trim() || null,
        customInstructions: customInstructions.trim() || null,
        tools,
        category: category.trim() || null,
      }
      const created = await libraryApi.createAgentTemplate(body)
      onSuccess(created)
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
          <textarea className="w-full border border-gray-300 rounded-md px-3 py-2" rows={3} value={category} onChange={e => setCategory(e.target.value)} />
        </div>
      </div>
    </ModalBase>
  )
}

const AgentBulkImportModal: React.FC<{ onClose: () => void; prop:any; onSuccess: (agent: AgentLibraryItem) => void }>
  = ({ onClose, onSuccess, prop }) => {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [tools, setTools] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  const [bulkCsvUploading, setBulkCsvUploading] = useState(false)
  const [bulkCsvDryRun, setBulkCsvDryRun] = useState(false)
  const [bulkCsvResult, setBulkCsvResult] = useState<BulkCsvResponse | null>(null)
  const subtleBtn = 'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted'

  const focusMain =
        'focus:outline-none focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-0 focus-visible:outline-main/20 focus:border-main/50 focus-visible:border-main/50'

    const labelCls = 'block text-[13px] font-medium text-foreground'

  const submit = async () => {
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const body: CreateAgentLibraryRequest = {
        name: name.trim(),
        description: description.trim() || null,
        customInstructions: customInstructions.trim() || null,
        tools,
      }
      const created = await libraryApi.createAgentTemplate(body)
      onSuccess(created)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <ModalBase
      title="Bulk Import CSV"
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          {
            bulkCsvUploading  &&
              <Button
              type="button"
            disabled={bulkCsvUploading || (bulkCsvResult?.preview || 0)  + (bulkCsvResult?.skipped || 0) === 0}
            onClick={async () => {
                if (!bulkCsvResult) return
                try {
                    setBulkCsvUploading(true)
                    // Prompt user to re-upload with dryRun=false by setting flag; we can't resend file contents here.
                    setBulkCsvDryRun(false)
                    toast.message('Upload the same CSV again to execute creation (dry-run turned off).')
                } finally {
                    setBulkCsvUploading(false)
                }
            }}
            // className={[
                //     'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium',
                //     'border border-border hover:bg-muted',
                //     focusMain,
                // ].join(' ')}
                >
            {bulkCsvUploading ? 'Processing…' : 'Close' }
        </Button>
        }
          {/* <Button onClick={submit} disabled={!name.trim() || submitting}>{submitting ? 'Creating…' : 'Create'}</Button> */}
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-muted/30">
          <div className="px-4 py-3  flex items-center justify-between">
            <div className='text-left'>
              <div className={labelCls}>Upload CSV</div>
             
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
                    setBulkCsvResult(null)
                    const resp = await agentApi.bulkCreateFromCsv(file, { dryRun: bulkCsvDryRun })
                    setBulkCsvResult(resp)
                    toast.success('Bulk agents & workflows created')
                  } catch (err: any) {
                    toast.success('Bulk agents & workflows created')
                  } finally {
                    setBulkCsvUploading(false)
                    e.currentTarget.value = ''
                  }
                }}
                className="text-xs file:mr-3 file:rounded-md file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-foreground hover:file:bg-muted/50 disabled:opacity-50"
              />
              
              {/* <span className="text-[12px] text-muted-foreground">Upload a .csv file to preview or create items.</span> */}
            </div>

            {bulkCsvResult && (
              <div className="rounded-md border border-border bg-background">
                <div className="px-3 py-2 flex items-center justify-between">
                  <div className="flex flex-wrap gap-2 text-[12px]">
                    <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5">Total: {bulkCsvResult.total}</span>
                    <span className="inline-flex items-center rounded-md border border-border bg-green-50 text-green-700 px-2 py-0.5">Created: {bulkCsvResult.created}</span>
                    <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5">Preview: {bulkCsvResult.preview}</span>
                    <span className="inline-flex items-center rounded-md border border-border bg-red-50 text-red-700 px-2 py-0.5">Errors: {bulkCsvResult.errors}</span>
                    <span className="inline-flex items-center rounded-md border border-border bg-muted/40 px-2 py-0.5">Skipped: {bulkCsvResult.skipped}</span>
                  </div>
                  <button
                    type="button"
                    className={[subtleBtn, focusMain].join(' ')}
                    onClick={() => setBulkCsvResult(null)}
                  >
                    Clear
                  </button>
                </div>
                <div className="max-h-48 overflow-y-auto divide-y divide-border">
                  {bulkCsvResult.results.slice(0, 50).map((r, i) => (
                    <div key={i} className="px-3 py-2 grid grid-cols-[auto_auto_auto_1fr_auto] items-center gap-2 text-[12px]">
                      <span className="uppercase tracking-wide text-muted-foreground">#{r.index + 1}</span>
                      <span className="rounded px-1.5 py-0.5 border border-border bg-muted/40 text-foreground/90">{r.type}</span>
                      <span className={r.status === 'error' ? 'rounded px-1.5 py-0.5 bg-red-50 text-red-700 border border-red-200' : r.status === 'created' ? 'rounded px-1.5 py-0.5 bg-green-50 text-green-700 border border-green-200' : 'rounded px-1.5 py-0.5 border border-border text-muted-foreground bg-muted/40'}>
                        {r.status}
                      </span>
                      <span className="truncate text-foreground">{r.name || ''}</span>
                      {r.error && <span className="text-red-600 truncate max-w-[40ch] text-right">{r.error}</span>}
                    </div>
                  ))}
                  {bulkCsvResult.results.length > 50 && (
                    <div className="px-3 py-2 text-[12px] text-muted-foreground">+{bulkCsvResult.results.length - 50} more…</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        <label className="flex ml-2 items-center gap-2 text-[12px] text-muted-foreground">
              <input
                type="checkbox"
                checked={bulkCsvDryRun}
                onChange={e => setBulkCsvDryRun(e.target.checked)}
              />
              Preview only
            </label>
      </div>
    </ModalBase>
  )
}

const AgentEditModal: React.FC<{ agent: AgentLibraryItem; onClose: () => void; onSuccess: (agent: AgentLibraryItem) => void }>
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
      const body: UpdateAgentLibraryRequest = {
        name: name.trim(),
        description: description.trim() || null,
        customInstructions: customInstructions.trim() || null,
        tools,
        category: category.trim() || null,
      }
      const updated = await libraryApi.updateAgentTemplate(agent.id, body)
      onSuccess(updated)
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
          <textarea className="w-full border border-gray-300 rounded-md px-3 py-2" rows={3} value={category} onChange={e => setCategory(e.target.value)} />
        </div>
      </div>
    </ModalBase>
  )
}

const AgentDeleteModal: React.FC<{ agent: AgentLibraryItem; onClose: () => void; onSuccess: (id: string) => void }>
  = ({ agent, onClose, onSuccess }) => {
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await libraryApi.deleteAgentTemplate(agent.id)
      onSuccess(agent.id)
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
      <p className="text-sm text-gray-700">Are you sure you want to delete “{agent.name}”?</p>
    </ModalBase>
  )
}

const AgentModalManager: React.FC<AgentModalManagerProps> = ({ activeModal, selectedAgent, onClose, onAgentCreated, onAgentUpdated, onAgentDeleted }) => {
  if (!activeModal) return null
  if (activeModal === 'create') {
    return (
      <AgentCreateModal
        onClose={onClose}
        onSuccess={(created) => onAgentCreated(created)}
      />
    )
  }
  if (activeModal === 'edit' && selectedAgent) {
    return (
      <AgentEditModal
        agent={selectedAgent}
        onClose={onClose}
        onSuccess={(updated) => onAgentUpdated(updated)}
      />
    )
  }
  if (activeModal === 'delete' && selectedAgent) {
    return (
      <AgentDeleteModal
        agent={selectedAgent}
        onClose={onClose}
        onSuccess={(id) => onAgentDeleted(id)}
      />
    )
  }
  if (activeModal === 'bulkImport') {
    return (
        <AgentBulkImportModal
        prop={{

        }}
        onClose={onClose}
        onSuccess={(created) => onAgentCreated(created)}
        />
    )
  }
  return null
}

export default AgentModalManager 