import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Button } from '../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Input } from '../components/ui/input'
import { serviceApi } from '../services/serviceApi'

function TriggerNode({ data }: NodeProps) {
  const nodeData = (data || {}) as { label?: string; subtype?: string; connectorType?: string; eventType?: string; schedule?: string }
  const isWebhook = (nodeData.subtype || '').includes('webhook')
  const isPolling = (nodeData.subtype || '').includes('polling')
  return (
    <div className="rounded-lg border border-blue-500/50 bg-blue-50 text-blue-700 px-3 py-2 shadow-sm min-w-[180px]">
      <div className="text-sm font-medium truncate">{nodeData.label || (isWebhook ? 'Webhook Trigger' : isPolling ? 'Polling Trigger' : 'Trigger')}</div>
      <Handle type="source" position={Position.Bottom} id="out" className="!w-2 !h-2 !bg-blue-500" />
    </div>
  )
}

interface ServiceWorkflow {
  name: string;
  category: string;
  nodes: any[];
  edges: any[];
  toolPreference: 'workflow' | 'all';
  webhookEventName?: string;
  webhookConnectorType?: string;
}

function GoalNode({ data }: NodeProps) {
  const nodeData = (data || {}) as { label?: string }
  return (
    <div className="rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 shadow-sm min-w-[180px]">
      <div className="text-sm font-medium truncate">{nodeData.label || 'Goal'}</div>
      <Handle type="target" position={Position.Top} id="in" className="!w-2 !h-2 !bg-gray-400" />
      <Handle type="source" position={Position.Bottom} id="out" className="!w-2 !h-2 !bg-gray-400" />
    </div>
  )
}

function ToolNode({ data }: NodeProps) {
  const nodeData = (data || {}) as { label?: string }
  const formatToolName = (raw: string): string => {
    if (!raw) return 'Tool'
    const withSpaces = raw
      .replace(/[_-]+/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    return withSpaces
      .split(' ')
      .filter(Boolean)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ')
  }
  return (
    <div className="rounded-lg border border-gray-300 bg-white text-gray-900 px-3 py-2 shadow-sm min-w-[180px]">
      <div className="text-sm font-medium truncate">{formatToolName(nodeData.label|| 'Tool')}</div>
      <Handle type="target" position={Position.Top} id="in" className="!w-2 !h-2 !bg-gray-400" />
      <Handle type="source" position={Position.Bottom} id="out" className="!w-2 !h-2 !bg-gray-400" />
    </div>
  )
}

function AgentNode({ data }: NodeProps) {
  const nodeData = (data || {}) as { label?: string }
  return (
    <div className="rounded-lg border border-purple-400 bg-purple-50 text-purple-700 px-3 py-2 shadow-sm min-w-[180px]">
      <div className="text-sm font-medium truncate">{nodeData.label || 'Agent'}</div>
      <Handle type="target" position={Position.Top} id="in" className="!w-2 !h-2 !bg-purple-500" />
      <Handle type="source" position={Position.Bottom} id="out" className="!w-2 !h-2 !bg-purple-500" />
    </div>
  )
}

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  goal: GoalNode,
  tool: ToolNode,
  agent: AgentNode,
}

function DeleteKeyHandler() {
  const { deleteElements, getNodes, getEdges } = useReactFlow()
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = (target?.tagName || '').toLowerCase()
      const isTyping = tag === 'input' || tag === 'textarea' || Boolean(target?.isContentEditable)
      if (isTyping) return
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        const selectedNodes = getNodes().filter(n => n.selected)
        const selectedEdges = getEdges().filter(e => e.selected)
        if (selectedNodes.length === 0 && selectedEdges.length === 0) return
        deleteElements({ nodes: selectedNodes, edges: selectedEdges })
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [deleteElements, getNodes, getEdges])
  return null
}

export default function ServiceWorkflowBuilder() {
  const navigate = useNavigate()
  const params = useParams()
  const workflowId = params?.id as string | undefined
  const [workflowName, setWorkflowName] = useState<string>('Untitled Workflow')
  const [category, setCategory] = useState<string>('')
  const [toolPreference, setToolPreference] = useState<'workflow' | 'all'>('all')
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [nodeCounter, setNodeCounter] = useState<number>(1)
  const selectedNode = useMemo(() => nodes.find(n => n.id === selectedNodeId) || null, [nodes, selectedNodeId])

  useEffect(() => {
    if (!workflowId) return
    ;(async () => {
      try {
        const wf = await serviceApi.getWorkflow(workflowId) as ServiceWorkflow
        if (wf?.name) setWorkflowName(wf.name)
        if (wf?.category) setCategory(wf.category)
        if (Array.isArray(wf?.nodes)) setNodes(wf.nodes as any)
        if (Array.isArray(wf?.edges)) setEdges(wf.edges as any)
        if (wf?.toolPreference && (wf.toolPreference === 'all' || wf.toolPreference === 'workflow')) setToolPreference(wf.toolPreference as any)
      } catch (e) {
        console.error('Failed to load workflow', e)
        toast.error('Failed to load workflow')
      }
    })()
  }, [workflowId])

  // Simple tool list for demo purposes
  const [allTools] = useState<string[]>([
    'web_search',
    'send_email',
    'create_calendar_event',
    'slack_message',
    'github_create_issue',
    'notion_create_page'
  ])

  const [toolFilter, setToolFilter] = useState<string>('')

  const filteredTools = useMemo(() => {
    const q = toolFilter.toLowerCase()
    return allTools.filter(t => t.toLowerCase().includes(q))
  }, [allTools, toolFilter])

  const onNodesChange: OnNodesChange = useCallback(
    (changes) => setNodes((nds) => applyNodeChanges(changes, nds)),
    []
  )
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((eds) => applyEdgeChanges(changes, eds)),
    []
  )
  const onConnect: OnConnect = useCallback(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    []
  )

  const onNodesDelete = useCallback((deleted: Node[]) => {
    const ids = new Set(deleted.map(n => n.id))
    setNodes(current => current.filter(n => !ids.has(n.id)))
    setEdges(current => current.filter(e => !ids.has(e.source) && !ids.has(e.target)))
    setSelectedNodeId(prev => (prev && ids.has(prev) ? null : prev))
  }, [])

  const onEdgesDelete = useCallback((deleted: Edge[]) => {
    const ids = new Set(deleted.map(e => e.id))
    setEdges(current => current.filter(e => !ids.has(e.id)))
  }, [])

  const addNode = (label: string, subtype: string) => {
    setNodes((existing) => {
      // Only one trigger
      if (subtype.startsWith('trigger') && existing.some(n => (n.data as any)?.subtype?.toString().startsWith('trigger') || n.type === 'trigger')) {
        toast.warning('Only one trigger is allowed')
        return existing
      }
      const id = `n-${Date.now()}-${nodeCounter}`
      setNodeCounter(c => c + 1)
      const position = { x: 100 + (existing.length % 3) * 220, y: 80 + Math.floor(existing.length / 3) * 140 }
      const type = subtype.startsWith('trigger') ? 'trigger' : subtype === 'goal' ? 'goal' : subtype.includes('agent') ? 'agent' : 'tool'
      const node: Node = {
        id,
        position,
        type,
        data: {
          label,
          subtype,
          ...(subtype.includes('polling') ? { schedule: '1800' } : {}),
          ...(subtype.includes('webhook') ? { connectorType: '', eventType: '' } : {}),
          ...(subtype === 'goal' ? { goal: '' } : {}),
        },
        ...(type === 'goal' ? { sourcePosition: Position.Bottom, targetPosition: Position.Top } : {}),
      }
      return [...existing, node]
    })
  }

  const updateSelectedNodeData = (partial: Record<string, unknown>) => {
    if (!selectedNodeId) return
    setNodes((current) => current.map(n => n.id === selectedNodeId ? { ...n, data: { ...(n.data as any), ...partial } } : n))
  }

  const getFirstNode = (): Node | null => {
    const targets = new Set(edges.map(e => e.target))
    return nodes.find(n => !targets.has(n.id)) || null
  }

  const handleSave = async () => {
    const first = getFirstNode()
    if (!first) {
      toast.error('Add a trigger as the first node')
      return
    }
    const subtype = (first.data as any)?.subtype?.toString() || ''
    const workflowType: 'webhook' | 'polling' = subtype.includes('webhook') ? 'webhook' : 'polling'
    const webhookEventName = workflowType === 'webhook' ? ((first.data as any)?.eventType || undefined) : undefined
    const webhookConnectorType = workflowType === 'webhook' ? ((first.data as any)?.connectorType || undefined) : undefined

    const payload = {
      name: workflowName.trim() || 'Untitled Workflow',
      nodes: nodes,
      edges: edges,
      workflowType,
      toolPreference,
      ...(webhookEventName ? { webhookEventName } : {}),
      ...(webhookConnectorType ? { webhookConnectorType } : {}),
      enabled: true,
      category: category.trim() || undefined,
    }

    try {
      if (workflowId) {
        await serviceApi.updateWorkflow(workflowId, payload)
        toast.success('Workflow updated')
      } else {
        const created = await serviceApi.createWorkflow(payload) as ServiceWorkflow
        toast.success(`Workflow "${created.name}" created`)
      }
      navigate('/service/agents?tab=workflows')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save workflow')
    }
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

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate(-1)}>Back</Button>
          <h1 className="text-xl font-semibold">{workflowId ? 'Edit Workflow' : 'Workflow Builder'}</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleSave}>{workflowId ? 'Save Changes' : 'Save'}</Button>
        </div>
      </div>

      <Card className="shadow-sm border-0 ring-1 ring-gray-200">
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Workflow Name" value={workflowName} onChange={(e) => setWorkflowName(e.target.value)} />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tool Preference</label>
            <select
              className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none"
              value={toolPreference}
              onChange={(e) => setToolPreference(e.target.value as 'workflow' | 'all')}
            >
              <option value="workflow">Workflow Tools Only</option>
              <option value="all">All Tools</option>
            </select>
          </div>
          <Input label="Category" value={category} onChange={(e) => setCategory(e.target.value)} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[60vh]">
        <aside className="lg:col-span-3 space-y-3">
          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardHeader>
              <CardTitle>Nodes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" onClick={() => addNode('Webhook Trigger', 'trigger:webhook')}>Add Webhook Trigger</Button>
              <Button variant="outline" onClick={() => addNode('Polling Trigger', 'trigger:polling')}>Add Polling Trigger</Button>
              <Button variant="outline" onClick={() => addNode('Goal', 'goal')}>Add Goal</Button>
              <Button variant="outline" onClick={() => addNode('Agent', 'agent')}>Add Agent</Button>
              <div className="pt-2 mt-2 border-t">
                <div className="text-sm font-medium mb-2">Tools</div>
                <input
                  value={toolFilter}
                  onChange={(e) => setToolFilter(e.target.value)}
                  placeholder="Search tools"
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md mb-2"
                />
                {filteredTools.length === 0 ? (
                  <div className="text-xs text-gray-500">No tools available</div>
                ) : (
                  <div className="max-h-56 overflow-y-auto space-y-2">
                    {filteredTools.map((tool) => (
                      <Button key={tool} variant="outline" onClick={() => addNode(tool, 'tool')} className="w-full justify-start">
                        {formatToolName(tool)}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-0 ring-1 ring-gray-200">
            <CardHeader>
              <CardTitle>Selected Node</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!selectedNode ? (
                <div className="text-sm text-gray-600">Select a node to edit its properties.</div>
              ) : (
                (() => {
                  const data = (selectedNode.data || {}) as any
                  const subtype = String(data.subtype || '')

                  if (subtype === 'goal') {
                    const goalText = String(data.goal || '')
                    return (
                      <div className="space-y-2">
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea
                          value={goalText}
                          onChange={(e) => updateSelectedNodeData({ goal: e.target.value })}
                          placeholder="Describe the goal for this workflow..."
                          className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-gray-300 bg-white focus:outline-none"
                        />
                      </div>
                    )
                  }

                  return (
                    <div className="text-sm text-gray-600">No editable properties for this node.</div>
                  )
                })()
              )}
            </CardContent>
          </Card>
        </aside>

        <main className="lg:col-span-9 min-h-[50vh] h-[70vh] border rounded-lg">
          <ReactFlowProvider>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              onNodesDelete={onNodesDelete}
              onEdgesDelete={onEdgesDelete}
              onSelectionChange={({ nodes: ns }) => setSelectedNodeId(ns && ns[0] ? ns[0].id : null)}
              fitView
            >
              <Background />
              <MiniMap />
              <Controls />
              <DeleteKeyHandler />
            </ReactFlow>
          </ReactFlowProvider>
        </main>
      </div>
    </div>
  )
} 