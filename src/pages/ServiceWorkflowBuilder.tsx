import React, { useCallback, useEffect, useState, useMemo, useRef } from 'react'
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
  useReactFlow,
  useKeyPress,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Edge,
  type Node,
  type NodeProps,
  type NodeTypes,
  type OnConnect,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  Wrench,
  Webhook,
  RefreshCw,
  Search as SearchIcon,
  ArrowLeft,
  Flag,
  Trash2,
  ChevronDown,
  Settings,
} from 'lucide-react'
import { serviceApi } from '../services/serviceApi'
import { adminApi } from '@/services/adminApi'
import { ToolIconRegistry } from '@/lib/toolIconRegistry'

interface ServiceWorkflow {
  name: string
  category: string
  nodes: any[]
  edges: any[]
  webhookEventName?: string
  webhookConnectorType?: string
  webhookEntityType?: string
  customInstructions?: string
}

interface ConnectorEntityInfo {
  [connectorType: string]: string[]
}

function WorkflowCanvas(props: {
  nodes: Node[]
  edges: Edge[]
  onNodesChange: OnNodesChange
  onEdgesChange: OnEdgesChange
  onConnect: OnConnect
  nodeTypes: NodeTypes
  onNodesDelete: (nodes: Node[]) => void
  onEdgesDelete: (edges: Edge[]) => void
  onSelectionChange: (s: { nodes: Node[]; edges: Edge[] }) => void
  setContextMenu: React.Dispatch<
    React.SetStateAction<{ x: number; y: number; nodeId?: string; edgeId?: string } | null>
  >
  onDrop: (event: React.DragEvent, position: { x: number; y: number }) => void
}) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    nodeTypes,
    onNodesDelete,
    onEdgesDelete,
    onSelectionChange,
    setContextMenu,
    onDrop,
  } = props
  const { deleteElements, screenToFlowPosition } = useReactFlow()
  const isDeletePressed = useKeyPress(['Delete'])
  const [selectedNodes, setSelectedNodes] = React.useState<Node[]>([])
  const [selectedEdges, setSelectedEdges] = React.useState<Edge[]>([])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Backspace') return

      const active = document.activeElement as HTMLElement | null
      const isEditable =
        !!active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          (active as HTMLElement).isContentEditable ||
          (typeof active.closest === 'function' &&
            !!active.closest('input, textarea, [contenteditable]')))

      if (isEditable) return

      if (selectedNodes.length > 0 || selectedEdges.length > 0) {
        e.preventDefault()
        e.stopImmediatePropagation()
        e.stopPropagation()
      }
    }

    document.addEventListener('keydown', onKeyDown, true)
    return () => document.removeEventListener('keydown', onKeyDown, true)
  }, [selectedNodes, selectedEdges])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const handleDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault()

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      })

      onDrop(event, position)
    },
    [onDrop, screenToFlowPosition]
  )

  React.useEffect(() => {
    if (!isDeletePressed) return
    if (selectedNodes.length === 0 && selectedEdges.length === 0) return
    deleteElements({ nodes: selectedNodes, edges: selectedEdges })
  }, [isDeletePressed, deleteElements, selectedNodes, selectedEdges])

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      onNodesDelete={onNodesDelete}
      onEdgesDelete={onEdgesDelete}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      fitView
      nodesDraggable={true}
      elementsSelectable={true}
      selectNodesOnDrag={false}
      panOnDrag={[1, 2]}
      zoomOnScroll={true}
      zoomOnPinch={true}
      preventScrolling={true}
      onPaneContextMenu={e => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY })
      }}
      onSelectionChange={({ nodes: ns, edges: es }) => {
        setSelectedNodes(ns)
        setSelectedEdges(es)
        onSelectionChange({ nodes: ns, edges: es })
      }}
      onNodeContextMenu={(e, node) => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, nodeId: node.id })
      }}
      onEdgeContextMenu={(e, edge) => {
        e.preventDefault()
        setContextMenu({ x: e.clientX, y: e.clientY, edgeId: edge.id })
      }}
    >
      <Background />
      <MiniMap />
      <Controls />
    </ReactFlow>
  )
}

function TriggerNode({ data }: NodeProps) {
  const nodeData = (data || {}) as {
    label: string
    subtype?: string
    connectorType?: string
    eventType?: string
  }
  const isWebhook = nodeData.subtype?.includes('webhook')
  const isPolling = nodeData.subtype?.includes('polling')
  return (
    <div className="rounded-lg border border-main/60 bg-main/10 dark:bg-main/40 text-main dark:text-main px-3 py-2 shadow-sm min-w-[180px]">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-main/10 flex items-center justify-center">
          {isWebhook ? (
            <Webhook className="w-4 h-4 text-main" />
          ) : isPolling ? (
            <RefreshCw className="w-4 h-4 text-main" />
          ) : (
            <Webhook className="w-4 h-4 text-main" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{nodeData.label}</div>
          {isWebhook && (
            <div className="text-xs text-muted-foreground truncate">
              {nodeData.connectorType && nodeData.eventType
                ? `${nodeData.connectorType} • ${nodeData.eventType.replace(/_/g, ' ')}`
                : 'Click to configure connector & event'}
            </div>
          )}
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="!w-2 !h-2 !bg-main"
      />
    </div>
  )
}

function GoalNode({ data }: NodeProps) {
  const nodeData = (data || {}) as { label: string; subtype?: string }
  return (
    <div className="rounded-lg border border-border bg-card text-foreground px-3 py-2 shadow-sm min-w-[180px]">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-main/10 flex items-center justify-center">
          <Flag className="w-4 h-4 text-main" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{nodeData.label}</div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="!w-2 !h-2 !bg-border"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="!w-2 !h-2 !bg-border"
      />
    </div>
  )
}

function ToolNode({ data }: NodeProps) {
  const nodeData = (data || {}) as { label: string; subtype?: string; toolId?: string }
  const toolId = nodeData.toolId || nodeData.label.toLowerCase().split(' ').join('_')
  const icon = ToolIconRegistry.getToolIcon(toolId)
  const iconElement = ToolIconRegistry.isImageIcon(icon)
    ? React.createElement('img', {
        src: icon,
        alt: nodeData.label,
        className: 'w-4 h-4 object-contain',
      })
    : React.createElement(icon, {
        className: 'w-4 h-4 text-muted-foreground',
      })

  return (
    <div className="rounded-lg border border-border bg-card text-foreground px-3 py-2 shadow-sm min-w-[180px]">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-md bg-muted flex items-center justify-center">
          {iconElement}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{nodeData.label}</div>
        </div>
      </div>
      <Handle
        type="target"
        position={Position.Top}
        id="in"
        className="!w-2 !h-2 !bg-border"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="out"
        className="!w-2 !h-2 !bg-border"
      />
    </div>
  )
}

export default function ServiceWorkflowBuilder() {
  const navigate = useNavigate()
  const params = useParams()
  const workflowId = params?.id as string | undefined

  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [workflowName, setWorkflowName] = useState<string>('Untitled Workflow')
  const [category, setCategory] = useState<string>('')
  const [customInstructions, setCustomInstructions] = useState<string>('')
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [toolSearchQuery, setToolSearchQuery] = useState('')
  const [nodeCounter, setNodeCounter] = useState(1)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    nodeId?: string
    edgeId?: string
  } | null>(null)

  const [connectorsMeta, setConnectorsMeta] = useState<
    Array<{ type: string; tools: string[]; webhookEvents: string[] }>
  >([])
  const [coreTools, setCoreTools] = useState<string[]>([])
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [connectorEntitiesInfo, setConnectorEntitiesInfo] = useState<ConnectorEntityInfo>({})
  const [webhookEntityType, setWebhookEntityType] = useState<string>('')
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false)
  const dayDropdownRef = useRef<HTMLDetailsElement | null>(null)
  const [isMonthDropdownOpen, setIsMonthDropdownOpen] = useState(false)
  const monthDropdownRef = useRef<HTMLDetailsElement | null>(null)

  const getNodeById = (id: string) => nodes.find(node => node.id === id)

  const nodesWithIncomingEdges = new Set(edges.map(edge => edge.target))
  const firstNode = nodes.find(node => !nodesWithIncomingEdges.has(node.id))

  const edgesFromFirstNode = edges.filter(edge => edge.source === firstNode?.id)

  const secondNode =
    edgesFromFirstNode.length > 0 ? getNodeById(edgesFromFirstNode[0].target) : null

  const edgesFromGoal = edges.filter(edge => edge.source === secondNode?.id)
  const nodesAfterGoal = edgesFromGoal.map(edge => getNodeById(edge.target)).filter(Boolean)

  const firstNodeIsTrigger =
    firstNode && (firstNode.data as { subtype?: string })?.subtype?.startsWith('trigger')
  const secondNodeIsGoal =
    secondNode && (secondNode.data as { subtype?: string })?.subtype === 'goal'
  const goalPropertyNotEmpty =
    secondNode && ((secondNode.data as { goal?: string })?.goal?.trim().length ?? 0) > 0
  const hasToolOrAgentAfterGoal = nodesAfterGoal.some(node => {
    const data = node?.data as { subtype?: string }
    return data?.subtype?.includes('tool') || data?.subtype?.includes('agent')
  })

  const webhookTriggerValid =
    firstNode &&
    (() => {
      const data = firstNode.data as {
        subtype?: string
        connectorType?: string
        eventType?: string
      }
      if (data?.subtype?.includes('webhook')) {
        return (
          data.connectorType &&
          data.eventType &&
          data.connectorType.trim().length > 0 &&
          data.eventType.trim().length > 0
        )
      }
      return true
    })()

  const isWorkflowValid =
    firstNodeIsTrigger &&
    secondNodeIsGoal &&
    goalPropertyNotEmpty &&
    hasToolOrAgentAfterGoal &&
    webhookTriggerValid

  useEffect(() => {
    ;(async () => {
      try {
        setLoadingMeta(true)
        const [metaRes, entitiesRes] = await Promise.all([
          adminApi.getConnectorsMetadata(),
          adminApi.getConnectorEntitiesInfo(),
        ])
        setCoreTools(Array.isArray(metaRes.coreTools) ? metaRes.coreTools : [])
        const connectors = Array.isArray(metaRes.connectors) ? metaRes.connectors : []
        setConnectorsMeta(connectors)
        setConnectorEntitiesInfo(entitiesRes || {})
        
        ToolIconRegistry.buildToolMap(connectors)
      } catch (e) {
        console.error('Failed to load connectors metadata', e)
      } finally {
        setLoadingMeta(false)
      }
    })()
  }, [])

  useEffect(() => {
    if (!workflowId) return
    ;(async () => {
      try {
        const wf = (await serviceApi.getWorkflow(workflowId)) as ServiceWorkflow
        if (wf?.name) setWorkflowName(wf.name)
        if (wf?.category) setCategory(wf.category)
        if (wf?.customInstructions) setCustomInstructions(wf.customInstructions)
        if (Array.isArray(wf?.nodes)) setNodes(wf.nodes as any)
        if (Array.isArray(wf?.edges)) setEdges(wf.edges as any)
        if (wf?.webhookEntityType) setWebhookEntityType(wf.webhookEntityType)
      } catch (e) {
        console.error('Failed to load workflow', e)
        toast.error('Failed to load workflow')
      }
    })()
  }, [workflowId])

  const allTools = useMemo(() => {
    const connectorTools = connectorsMeta.flatMap(c =>
      Array.isArray(c.tools) ? c.tools : []
    )
    const set = new Set<string>([...connectorTools, ...coreTools])
    return Array.from(set).sort()
  }, [connectorsMeta, coreTools])

  const filteredTools = useMemo(() => {
    if (!toolSearchQuery) return allTools
    const query = toolSearchQuery.toLowerCase().replace(/ /g, '_')
    return allTools.filter(t => t.toLowerCase().includes(query))
  }, [allTools, toolSearchQuery])

  const availableWebhookConnectors = useMemo(
    () => connectorsMeta.filter(c => c.webhookEvents && c.webhookEvents.length > 0),
    [connectorsMeta]
  )

  const onNodesChange: OnNodesChange = useCallback(
    changes => setNodes(existing => applyNodeChanges(changes, existing)),
    []
  )
  const onEdgesChange: OnEdgesChange = useCallback(
    changes => setEdges(existing => applyEdgeChanges(changes, existing)),
    []
  )
  const onConnect: OnConnect = useCallback(
    connection => {
      setEdges(existing => addEdge(connection, existing))
    },
    []
  )

  const onNodesDelete = useCallback((deletedNodes: Node[]) => {
    const deletedIds = new Set(deletedNodes.map(n => n.id))
    setNodes(current => current.filter(n => !deletedIds.has(n.id)))
    setEdges(current =>
      current.filter(e => !deletedIds.has(e.source) && !deletedIds.has(e.target))
    )
    setSelectedNodeId(prev => (prev && deletedIds.has(prev) ? null : prev))
  }, [])

  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    const deletedEdgeIds = new Set(deletedEdges.map(e => e.id))
    setEdges(current => current.filter(e => !deletedEdgeIds.has(e.id)))
  }, [])

  const handleSave = useCallback(async () => {
    if (!firstNodeIsTrigger) {
      toast.error('First node must be a trigger (webhook or polling)')
      return
    }

    if (!secondNodeIsGoal) {
      toast.error('Second node must be a goal')
      return
    }

    if (!goalPropertyNotEmpty) {
      toast.error('Goal node must have a non-empty goal description')
      return
    }

    if (!hasToolOrAgentAfterGoal) {
      toast.error('Workflow must have at least one tool or agent after the goal')
      return
    }

    if (
      firstNode &&
      (() => {
        const data = firstNode.data as {
          subtype?: string
          connectorType?: string
          eventType?: string
        }
        if (data?.subtype?.includes('webhook')) {
          return (
            !data.connectorType ||
            !data.eventType ||
            data.connectorType.trim().length === 0 ||
            data.eventType.trim().length === 0
          )
        }
        return false
      })()
    ) {
      toast.error('Click on the webhook trigger to configure connector and event')
      return
    }

    try {
      const triggerSubtype = (firstNode?.data as { subtype?: string })?.subtype
      const workflowType: 'webhook' | 'polling' = triggerSubtype?.includes('webhook')
        ? 'webhook'
        : 'polling'

      const firstNodeData = firstNode?.data as {
        subtype?: string
        connectorType?: string
        eventType?: string
      }
      const webhookEventName =
        workflowType === 'webhook' && firstNodeData?.eventType
          ? firstNodeData.eventType
          : undefined
      const webhookConnectorType =
        workflowType === 'webhook' && firstNodeData?.connectorType
          ? firstNodeData.connectorType
          : undefined

      const payload = {
        name: workflowName.trim() || 'Untitled Workflow',
        nodes: nodes,
        edges: edges,
        workflowType,
        ...(webhookEventName ? { webhookEventName } : {}),
        ...(webhookConnectorType ? { webhookConnectorType } : {}),
        ...(webhookEntityType ? { webhookEntityType } : {}),
        ...(customInstructions ? { customInstructions } : {}),
        enabled: true,
        category: category.trim() || undefined,
      }

      if (workflowId) {
        await serviceApi.updateWorkflow(workflowId, payload)
        toast.success('Workflow updated')
      } else {
        const created = (await serviceApi.createWorkflow(payload)) as ServiceWorkflow
        toast.success(`Workflow "${created.name}" created`)
      }
      navigate('/service/agents?tab=workflows')
    } catch (e) {
      console.error(e)
      toast.error('Failed to save workflow')
    }
  }, [
    workflowName,
    category,
    customInstructions,
    nodes,
    edges,
    workflowId,
    firstNodeIsTrigger,
    secondNodeIsGoal,
    goalPropertyNotEmpty,
    hasToolOrAgentAfterGoal,
    firstNode,
    webhookEntityType,
    navigate,
  ])

  const nodeTypes: NodeTypes = React.useMemo(
    () => ({
      trigger: TriggerNode,
      goal: GoalNode,
      tool: ToolNode,
    }),
    []
  )

  const addNodeToCanvas = useCallback(
    (
      label: string,
      subtype: string,
      connectorType?: string,
      eventType?: string,
      position?: { x: number; y: number },
      toolId?: string
    ) => {
      setNodes(existingNodes => {
        if (
          subtype.startsWith('trigger') &&
          existingNodes.some(n => {
            const dataUnknown = (n as Node).data as unknown
            const subtypeStr =
              typeof (dataUnknown as { subtype?: unknown })?.subtype === 'string'
                ? ((dataUnknown as { subtype?: string }).subtype as string)
                : undefined
            return (
              n.type === 'trigger' ||
              (subtypeStr ? subtypeStr.startsWith('trigger') : false)
            )
          })
        ) {
          toast.warning('Only one trigger is allowed per workflow')
          return existingNodes
        }
        const id = `n-${Date.now()}-${nodeCounter}`
        setNodeCounter(c => c + 1)

        let nodePosition: { x: number; y: number }
        if (position) {
          nodePosition = position
        } else {
          const index = existingNodes.length
          const col = index % 3
          const row = Math.floor(index / 3)
          nodePosition = { x: 100 + col * 220, y: 100 + row * 140 }
        }

        const isGoal = subtype === 'goal'
        const isTool = subtype.includes('tool')

        let nodeType = 'default'
        if (subtype.startsWith('trigger')) {
          nodeType = 'trigger'
        } else if (isGoal) {
          nodeType = 'goal'
        } else if (isTool) {
          nodeType = 'tool'
        }

        const newNode: Node = {
          id,
          position: nodePosition,
          data: {
            label,
            subtype,
            ...(subtype.includes('polling') ? { schedule: '1800' } : {}),
            ...(subtype.includes('webhook')
              ? {
                  connectorType: connectorType || '',
                  eventType: eventType || '',
                }
              : {}),
            ...(isTool && toolId ? { toolId } : {}),
          },
          type: nodeType,
          ...(isGoal
            ? {
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
              }
            : {}),
        }

        return [...existingNodes, newNode]
      })
    },
    [nodeCounter]
  )

  const handleDrop = useCallback(
    (event: React.DragEvent, position: { x: number; y: number }) => {
      event.preventDefault()

      const type = event.dataTransfer.getData('application/reactflow')
      const label = event.dataTransfer.getData('application/reactflow-label')
      const subtype = event.dataTransfer.getData('application/reactflow-subtype')
      const connectorType = event.dataTransfer.getData('application/reactflow-connector-type')
      const eventType = event.dataTransfer.getData('application/reactflow-event-type')
      const toolId = event.dataTransfer.getData('application/reactflow-tool-id')

      if (!type || !label || !subtype) return

      addNodeToCanvas(label, subtype, connectorType, eventType, position, toolId || undefined)
    },
    [addNodeToCanvas]
  )

  const selectedNode = selectedNodeId ? nodes.find(n => n.id === selectedNodeId) || null : null

  function updateSelectedNodeData(partial: Record<string, unknown>) {
    if (!selectedNodeId) return
    setNodes(current =>
      current.map(n => {
        if (n.id === selectedNodeId) {
          const currentData = n.data as Record<string, unknown>
          const updatedData = { ...currentData, ...partial }

          if (
            currentData.subtype?.toString().includes('trigger:polling') &&
            partial.schedule
          ) {
            const newLabel = generatePollingTriggerLabel(partial.schedule)
            if (newLabel) {
              updatedData.label = newLabel
            }
          } else if (
            currentData.subtype?.toString().includes('trigger:webhook') &&
            (partial.connectorType || partial.eventType)
          ) {
            const connectorType = (
              partial.connectorType || currentData.connectorType
            )?.toString()
            const eventType = (partial.eventType || currentData.eventType)?.toString()
            if (connectorType && eventType) {
              const newLabel = generateWebhookTriggerLabel(connectorType, eventType)
              if (newLabel) {
                updatedData.label = newLabel
              }
            }
          }

          return { ...n, data: updatedData }
        }
        return n
      })
    )
  }

  function generatePollingTriggerLabel(schedule: unknown): string | null {
    try {
      let seconds = 0

      if (typeof schedule === 'string' || typeof schedule === 'number') {
        seconds = Number(schedule) || 0
      } else if (schedule && typeof schedule === 'object') {
        const scheduleObj = schedule as Record<string, unknown>
        if (scheduleObj.type === 'interval' && typeof scheduleObj.value === 'number') {
          seconds = scheduleObj.value
        } else if (scheduleObj.type === 'dayBased' && scheduleObj.value) {
          const dayValue = scheduleObj.value as {
            daysOfWeek?: number[]
            dayOfWeek?: number
            time: string
          }
          const days = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
          ]
          const formattedTime = formatTimeTo12Hour(dayValue.time)
          const dayList =
            Array.isArray(dayValue.daysOfWeek) && dayValue.daysOfWeek.length > 0
              ? dayValue.daysOfWeek
              : typeof dayValue.dayOfWeek === 'number'
                ? [dayValue.dayOfWeek]
                : []
          const labelDays = dayList.map(d => days[d]).join(', ')
          return labelDays ? `Every ${labelDays} at ${formattedTime}` : null
        } else if (scheduleObj.type === 'monthBased' && scheduleObj.value) {
          const m = scheduleObj.value as { daysOfMonth: number[]; time: string }
          const formattedTime = formatTimeTo12Hour(m.time)
          const labelDays = (m.daysOfMonth || []).join(', ')
          return labelDays ? `Every month on ${labelDays} at ${formattedTime}` : null
        }
      }

      if (!Number.isFinite(seconds) || seconds <= 0) return null

      if (seconds % 86400 === 0)
        return `Every ${seconds / 86400} day${seconds === 86400 ? '' : 's'}`
      if (seconds % 3600 === 0)
        return `Every ${seconds / 3600} hour${seconds === 3600 ? '' : 's'}`
      if (seconds % 60 === 0)
        return `Every ${seconds / 60} minute${seconds === 60 ? '' : 's'}`
      return `Every ${seconds} seconds`
    } catch {
      return null
    }
  }

  function formatTimeTo12Hour(time24: string): string {
    try {
      const [hours, minutes] = time24.split(':').map(Number)
      if (
        isNaN(hours) ||
        isNaN(minutes) ||
        hours < 0 ||
        hours > 23 ||
        minutes < 0 ||
        minutes > 59
      ) {
        return time24
      }

      const period = hours >= 12 ? 'PM' : 'AM'
      const hours12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours
      const formattedMinutes = minutes.toString().padStart(2, '0')

      return `${hours12}:${formattedMinutes} ${period}`
    } catch {
      return time24
    }
  }

  function generateWebhookTriggerLabel(connectorType: string, eventType: string): string | null {
    try {
      const formattedConnector =
        connectorType.charAt(0).toUpperCase() + connectorType.slice(1)

      const formattedEvent = eventType
        .replace(/_/g, ' ')
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')

      return `${formattedConnector} ${formattedEvent}`
    } catch {
      return null
    }
  }

  const pollingOptions: Array<{ value: string; label: string }> = [
    { value: '1800', label: '30 mins' },
    { value: '3600', label: '1 hr once' },
    { value: '21600', label: '6 hr once' },
    { value: '43200', label: '12 hr once' },
    { value: 'custom', label: 'Custom' },
    { value: 'dayBased', label: 'Day-based' },
    { value: 'monthBased', label: 'Month-based' },
  ]

  const dayOptions = [
    { value: 0, label: 'Sunday' },
    { value: 1, label: 'Monday' },
    { value: 2, label: 'Tuesday' },
    { value: 3, label: 'Wednesday' },
    { value: 4, label: 'Thursday' },
    { value: 5, label: 'Friday' },
    { value: 6, label: 'Saturday' },
  ]

  const monthDayOptions = Array.from({ length: 31 }, (_, i) => ({
    value: i + 1,
    label: String(i + 1),
  }))

  const parseScheduleConfig = (schedule: unknown) => {
    if (typeof schedule === 'string' || typeof schedule === 'number') {
      return {
        type: 'interval' as const,
        value: Number(schedule) || 1800,
      }
    }
    if (schedule && typeof schedule === 'object') {
      const scheduleObj = schedule as Record<string, unknown>
      if (scheduleObj.type === 'dayBased' && scheduleObj.value) {
        const v = scheduleObj.value as any
        const days: number[] = Array.isArray(v.daysOfWeek)
          ? (v.daysOfWeek as any[])
              .map(n => Number(n))
              .filter(n => Number.isInteger(n) && n >= 0 && n <= 6)
          : typeof v.dayOfWeek === 'number'
            ? [v.dayOfWeek]
            : [1]
        return {
          type: 'dayBased' as const,
          value: { daysOfWeek: days, time: String(v.time || '09:00') },
        }
      }
      if (scheduleObj.type === 'monthBased' && scheduleObj.value) {
        const v = scheduleObj.value as any
        const days: number[] = Array.isArray(v.daysOfMonth)
          ? (v.daysOfMonth as any[])
              .map(n => Number(n))
              .filter(n => Number.isInteger(n) && n >= 1 && n <= 31)
          : typeof v.dayOfMonth === 'number'
            ? [v.dayOfMonth]
            : [1]
        return {
          type: 'monthBased' as const,
          value: { daysOfMonth: days, time: String(v.time || '09:00') },
        }
      }
      if (scheduleObj.type === 'interval') {
        return {
          type: 'interval' as const,
          value: Number(scheduleObj.value) || 1800,
        }
      }
    }
    return {
      type: 'interval' as const,
      value: 1800,
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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as unknown as HTMLElement
      if (
        isDayDropdownOpen &&
        dayDropdownRef.current &&
        target &&
        !dayDropdownRef.current.contains(target)
      ) {
        setIsDayDropdownOpen(false)
      }
      if (
        isMonthDropdownOpen &&
        monthDropdownRef.current &&
        target &&
        !monthDropdownRef.current.contains(target)
      ) {
        setIsMonthDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isDayDropdownOpen, isMonthDropdownOpen])

  return (
    <div className="flex h-screen w-full flex-col pl-10">
      <header className="shrink-0 h-14 w-full bg-background/95 backdrop-blur-sm border-b border-border sticky top-0 z-10 flex items-center justify-between pl-2 pr-6 gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors hover:bg-main/5 rounded-md px-2 py-1"
            aria-label="go-back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-2">
            <div
              className={`w-2 h-2 rounded-full transition-colors ${
                isWorkflowValid ? 'bg-green-500' : 'bg-orange-400'
              }`}
            />
            <span className="text-xs text-muted-foreground">
              {isWorkflowValid ? 'Ready' : 'Incomplete'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-[500px]">
          <input
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
            placeholder="Untitled Workflow"
            className="flex-1 text-base font-medium text-foreground bg-transparent border border-border rounded-md px-3 py-1.5 focus:outline-none focus:border-main transition-colors"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={!isWorkflowValid}
            className={`inline-flex items-center gap-2 px-4 py-1.5 text-sm rounded-md font-medium transition-all ${
              isWorkflowValid
                ? 'bg-main text-white hover:bg-main/90'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </header>
      <div className="flex-1 min-h-0">
        <div className="flex h-full w-full overflow-hidden">
          <aside className="w-80 lg:w-[20%] min-w-[280px] max-w-[400px] shrink-0 border-r border-border bg-card/50">
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-border">
                <h2 className="text-sm font-semibold text-foreground">Nodes</h2>
                <p className="text-xs text-muted-foreground">
                  Drag items into the canvas
                </p>
              </div>

              <div className="flex-1 min-h-0 flex flex-col">
                <div className="flex-shrink-0 overflow-y-auto">
                  <details className="p-4 border-b border-border group">
                    <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground list-none">
                      <div className="flex-1 flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        <span>Workflow Status</span>
                      </div>
                      <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="text-sm space-y-2 mt-4">
                      <li className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            firstNodeIsTrigger ? 'bg-green-500' : 'bg-orange-400/80'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">
                          First node is a trigger
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            secondNodeIsGoal ? 'bg-green-500' : 'bg-orange-400/80'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">
                          Second node is a goal
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            goalPropertyNotEmpty ? 'bg-green-500' : 'bg-orange-400/80'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">
                          Goal has a description
                        </span>
                      </li>
                      <li className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            hasToolOrAgentAfterGoal ? 'bg-green-500' : 'bg-orange-400/80'
                          }`}
                        />
                        <span className="text-xs text-muted-foreground">
                          Tool/agent after goal
                        </span>
                      </li>
                      {firstNodeIsTrigger &&
                        (() => {
                          const data = firstNode?.data as {
                            subtype?: string
                            connectorType?: string
                            eventType?: string
                          }
                          if (data?.subtype?.includes('webhook')) {
                            const isValid =
                              data.connectorType &&
                              data.eventType &&
                              data.connectorType.trim().length > 0 &&
                              data.eventType.trim().length > 0
                            return (
                              <li className="flex items-center gap-2">
                                <div
                                  className={`w-3 h-3 rounded-full ${
                                    isValid ? 'bg-green-500' : 'bg-orange-400/80'
                                  }`}
                                />
                                <span className="text-xs text-muted-foreground">
                                  Webhook configured
                                </span>
                              </li>
                            )
                          }
                          return null
                        })()}
                    </ul>
                  </details>

                  <details className="p-4 border-b border-border group" open>
                    <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground list-none">
                      <div className="flex-1 flex items-center gap-2">
                        <Webhook className="w-4 h-4" />
                        <span>Triggers</span>
                      </div>
                      <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-4 space-y-2">
                      <div
                        className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-main/5 hover:border-main/40 transition-all duration-200 cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('application/reactflow', 'trigger')
                          e.dataTransfer.setData(
                            'application/reactflow-label',
                            'Webhook Trigger'
                          )
                          e.dataTransfer.setData(
                            'application/reactflow-subtype',
                            'trigger:webhook'
                          )
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onClick={() => addNodeToCanvas('Webhook Trigger', 'trigger:webhook')}
                      >
                        <div className="w-8 h-8 rounded-md bg-main/10 flex items-center justify-center flex-shrink-0">
                          <Webhook className="w-4 h-4 text-main" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">Webhook</div>
                          <div className="text-xs text-muted-foreground">
                            Start on HTTP request
                          </div>
                        </div>
                      </div>
                      <div
                        className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-main/5 hover:border-main/40 transition-all duration-200 cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('application/reactflow', 'trigger')
                          e.dataTransfer.setData(
                            'application/reactflow-label',
                            'Polling Trigger'
                          )
                          e.dataTransfer.setData(
                            'application/reactflow-subtype',
                            'trigger:polling'
                          )
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onClick={() => addNodeToCanvas('Polling Trigger', 'trigger:polling')}
                      >
                        <div className="w-8 h-8 rounded-md bg-main/10 flex items-center justify-center flex-shrink-0">
                          <RefreshCw className="w-4 h-4 text-main" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">Polling</div>
                          <div className="text-xs text-muted-foreground">
                            Run on a schedule
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>

                  <details className="p-4 border-b border-border group" open>
                    <summary className="flex items-center gap-2 cursor-pointer text-sm font-medium text-foreground list-none">
                      <div className="flex-1 flex items-center gap-2">
                        <Flag className="w-4 h-4" />
                        <span>Workflow Nodes</span>
                      </div>
                      <ChevronDown className="w-4 h-4 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="mt-4 space-y-2">
                      <div
                        className="flex items-center gap-3 p-3 rounded-lg border bg-background hover:bg-main/5 hover:border-main/40 transition-all duration-200 cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={e => {
                          e.dataTransfer.setData('application/reactflow', 'goal')
                          e.dataTransfer.setData('application/reactflow-label', 'Goal')
                          e.dataTransfer.setData('application/reactflow-subtype', 'goal')
                          e.dataTransfer.effectAllowed = 'move'
                        }}
                        onClick={() => addNodeToCanvas('Goal', 'goal')}
                      >
                        <div className="w-8 h-8 rounded-md bg-main/10 flex items-center justify-center flex-shrink-0">
                          <Flag className="w-4 h-4 text-main" />
                        </div>
                        <div>
                          <div className="text-sm font-medium text-foreground">Goal</div>
                          <div className="text-xs text-muted-foreground">
                            Define workflow objective
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                </div>

                <div className="flex-1 min-h-0 flex flex-col">
                  <div className="p-4 border-b-0 flex flex-col h-full">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground flex-shrink-0 mb-4">
                      <Wrench className="w-4 h-4" />
                      <span>Tools</span>
                    </div>
                    <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                      <div className="relative flex-shrink-0 mb-3">
                        <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          value={toolSearchQuery}
                          onChange={e => setToolSearchQuery(e.target.value)}
                          placeholder="Search tools"
                          className="w-full pl-9 pr-3 py-2 text-sm rounded-md border border-border bg-transparent focus:outline-none focus:ring-1 focus:ring-main focus:border-main transition-colors"
                        />
                      </div>
                      <div className="flex-1 min-h-0 overflow-y-auto hide-scrollbar space-y-2">
                        {loadingMeta ? (
                          <div className="text-center text-xs text-muted-foreground py-4">
                            Loading tools…
                          </div>
                        ) : filteredTools.length === 0 ? (
                          <div className="text-center text-xs text-muted-foreground py-4">
                            No tools match
                          </div>
                        ) : (
                          filteredTools.map(tool => {
                            const displayName = formatToolName(tool)
                            const icon = ToolIconRegistry.getToolIcon(tool)
                            const iconElement = ToolIconRegistry.isImageIcon(icon)
                              ? React.createElement('img', {
                                  src: icon,
                                  alt: displayName,
                                  className: 'w-5 h-5 object-contain',
                                })
                              : React.createElement(icon, {
                                  className: 'w-5 h-5 text-muted-foreground',
                                })
                            return (
                              <div
                                key={tool}
                                className="flex items-center gap-3 p-2 rounded-lg border bg-background hover:bg-main/5 hover:border-main/40 transition-all duration-200 cursor-grab active:cursor-grabbing"
                                draggable
                                onDragStart={e => {
                                  e.dataTransfer.setData('application/reactflow', 'tool')
                                  e.dataTransfer.setData(
                                    'application/reactflow-label',
                                    displayName
                                  )
                                  e.dataTransfer.setData(
                                    'application/reactflow-subtype',
                                    'tool'
                                  )
                                  e.dataTransfer.setData(
                                    'application/reactflow-tool-id',
                                    tool
                                  )
                                  e.dataTransfer.effectAllowed = 'move'
                                }}
                                onClick={() =>
                                  addNodeToCanvas(
                                    displayName,
                                    'tool',
                                    undefined,
                                    undefined,
                                    undefined,
                                    tool
                                  )
                                }
                              >
                                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                                  {iconElement}
                                </div>
                                <div className="text-sm font-medium text-foreground truncate">
                                  {displayName}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-w-0 bg-background">
            <div className="h-full w-full">
              <ReactFlowProvider>
                <WorkflowCanvas
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  nodeTypes={nodeTypes}
                  onNodesDelete={onNodesDelete}
                  onEdgesDelete={onEdgesDelete}
                  onSelectionChange={({ nodes: ns }) => {
                    if (ns && ns.length > 0) setSelectedNodeId(ns[0].id)
                    else setSelectedNodeId(null)
                  }}
                  setContextMenu={setContextMenu}
                  onDrop={handleDrop}
                />
              </ReactFlowProvider>
            </div>
          </main>

          <aside className="w-80 lg:w-[20%] min-w-[280px] max-w-[400px] shrink-0 border-l border-border bg-card/50 overflow-y-auto">
            <div className="p-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground">Properties</h2>
              <p className="text-xs text-muted-foreground">
                Configure the selected node
              </p>
            </div>
            <div className="p-4 text-sm text-foreground space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
                    Category
                  </label>
                  <input
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    placeholder="e.g., CRM, Support, Analytics"
                    className="w-full px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="text-xs text-muted-foreground uppercase tracking-wide block mb-2">
                    Custom Instructions
                  </label>
                  <textarea
                    value={customInstructions}
                    onChange={e => setCustomInstructions(e.target.value)}
                    placeholder="Add custom instructions for this workflow template..."
                    className="w-full min-h-[100px] px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              {!selectedNode ? (
                <div className="text-muted-foreground mt-4">
                  Select a node in the canvas to edit its properties here.
                </div>
              ) : (
                (() => {
                  const data = (selectedNode.data || {}) as {
                    label?: string
                    subtype?: string
                    schedule?: string
                    goal?: string
                    connectorType?: string
                    eventType?: string
                  }
                  const subtype = data.subtype || ''
                  if (subtype.includes('polling')) {
                    const scheduleConfig = parseScheduleConfig(data.schedule)
                    const isInterval = scheduleConfig.type === 'interval'
                    const isDayBased = scheduleConfig.type === 'dayBased'
                    const isMonthBased = (scheduleConfig as any).type === 'monthBased'

                    const current = isInterval ? String(scheduleConfig.value) : '1800'
                    const isPreset = pollingOptions.some(
                      opt =>
                        opt.value === current &&
                        opt.value !== 'custom' &&
                        opt.value !== 'dayBased' &&
                        opt.value !== 'monthBased'
                    )
                    const isCustomInterval = isInterval && !isPreset
                    const seconds = isInterval ? scheduleConfig.value : 1800
                    const derivedUnit: 'minute' | 'hour' =
                      seconds % 3600 === 0 && seconds > 0 ? 'hour' : 'minute'
                    const derivedEvery = Math.max(
                      1,
                      Math.floor(seconds / (derivedUnit === 'hour' ? 3600 : 60)) || 1
                    )

                    const dayBasedValue = isDayBased
                      ? (scheduleConfig.value as {
                          daysOfWeek: number[]
                          time: string
                        })
                      : { daysOfWeek: [1], time: '09:00' }
                    const monthBasedValue = isMonthBased
                      ? ((scheduleConfig as any).value as {
                          daysOfMonth: number[]
                          time: string
                        })
                      : { daysOfMonth: [1], time: '09:00' }

                    return (
                      <div className="space-y-2 mt-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">
                          Polling schedule
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          {pollingOptions.map(opt => {
                            let active = false
                            if (opt.value === 'custom') {
                              active = isCustomInterval
                            } else if (opt.value === 'dayBased') {
                              active = isDayBased
                            } else if (opt.value === 'monthBased') {
                              active = isMonthBased
                            } else {
                              active = isInterval && current === opt.value
                            }

                            return (
                              <button
                                key={opt.value}
                                className={`px-2 py-1.5 text-xs rounded-md border transition-colors ${
                                  active
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background text-foreground border-border hover:bg-muted/50'
                                }`}
                                onClick={() => {
                                  if (opt.value === 'custom') {
                                    updateSelectedNodeData({
                                      schedule: {
                                        type: 'interval',
                                        value: 600,
                                      },
                                    })
                                  } else if (opt.value === 'dayBased') {
                                    updateSelectedNodeData({
                                      schedule: {
                                        type: 'dayBased',
                                        value: {
                                          daysOfWeek: [1],
                                          time: '09:00',
                                        },
                                      },
                                    })
                                  } else if (opt.value === 'monthBased') {
                                    updateSelectedNodeData({
                                      schedule: {
                                        type: 'monthBased',
                                        value: {
                                          daysOfMonth: [1],
                                          time: '09:00',
                                        },
                                      },
                                    })
                                  } else {
                                    updateSelectedNodeData({
                                      schedule: {
                                        type: 'interval',
                                        value: Number(opt.value),
                                      },
                                    })
                                  }
                                }}
                              >
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>

                        {isCustomInterval && (
                          <div className="space-y-2">
                            <div className="grid grid-cols-3 gap-2">
                              <div className="col-span-1">
                                <label className="text-xs text-muted-foreground">Every</label>
                                <input
                                  type="number"
                                  min={1}
                                  value={derivedEvery}
                                  onChange={e => {
                                    const newEvery = Math.max(
                                      1,
                                      parseInt(e.target.value || '1', 10)
                                    )
                                    const factor = derivedUnit === 'hour' ? 3600 : 60
                                    updateSelectedNodeData({
                                      schedule: {
                                        type: 'interval',
                                        value: newEvery * factor,
                                      },
                                    })
                                  }}
                                  className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                              <div className="col-span-2">
                                <label className="text-xs text-muted-foreground">Unit</label>
                                <select
                                  className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                  value={derivedUnit}
                                  onChange={e => {
                                    const newUnit = e.target.value === 'hour' ? 'hour' : 'minute'
                                    const factor = newUnit === 'hour' ? 3600 : 60
                                    updateSelectedNodeData({
                                      schedule: {
                                        type: 'interval',
                                        value: derivedEvery * factor,
                                      },
                                    })
                                  }}
                                >
                                  <option value="minute">Minutes</option>
                                  <option value="hour">Hours</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {isDayBased && (
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground font-medium">
                              Schedule Details
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">
                                  Days of Week
                                </label>
                                <details
                                  className="relative"
                                  ref={dayDropdownRef}
                                  open={isDayDropdownOpen}
                                >
                                  <summary
                                    className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-background cursor-pointer list-none select-none"
                                    onClick={e => {
                                      e.preventDefault()
                                      setIsDayDropdownOpen(o => !o)
                                    }}
                                  >
                                    {dayBasedValue.daysOfWeek
                                      .map(d => dayOptions.find(x => x.value === d)?.label)
                                      .filter(Boolean)
                                      .join(', ') || 'Select days...'}
                                  </summary>
                                  <div className="absolute z-10 mt-1 w-full border border-border rounded-md bg-background p-2 max-h-48 overflow-auto shadow">
                                    {dayOptions.map(day => {
                                      const checked = dayBasedValue.daysOfWeek.includes(day.value)
                                      return (
                                        <label
                                          key={day.value}
                                          className="flex items-center gap-2 text-xs px-1 py-1 rounded hover:bg-muted/50 cursor-pointer"
                                          onClick={e => {
                                            e.preventDefault()
                                            const next = new Set(dayBasedValue.daysOfWeek)
                                            if (checked) next.delete(day.value)
                                            else next.add(day.value)
                                            const normalized = Array.from(next).sort()
                                            updateSelectedNodeData({
                                              schedule: {
                                                type: 'dayBased',
                                                value: {
                                                  ...dayBasedValue,
                                                  daysOfWeek: normalized.length
                                                    ? normalized
                                                    : [day.value],
                                                },
                                              },
                                            })
                                          }}
                                        >
                                          <input type="checkbox" checked={checked} readOnly />
                                          {day.label}
                                        </label>
                                      )
                                    })}
                                  </div>
                                </details>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">
                                  Time
                                </label>
                                <input
                                  type="time"
                                  value={dayBasedValue.time}
                                  onChange={e => {
                                    updateSelectedNodeData({
                                      schedule: {
                                        type: 'dayBased',
                                        value: {
                                          ...dayBasedValue,
                                          time: e.target.value,
                                        },
                                      },
                                    })
                                  }}
                                  className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-md">
                              <strong>Note:</strong> The workflow will run every{' '}
                              {dayBasedValue.daysOfWeek
                                .map(d => dayOptions.find(x => x.value === d)?.label)
                                .filter(Boolean)
                                .join(', ')}{' '}
                              at {dayBasedValue.time} in your timezone.
                            </div>
                          </div>
                        )}
                        {isMonthBased && (
                          <div className="space-y-2">
                            <div className="text-xs text-muted-foreground font-medium">
                              Schedule Details
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">
                                  Days of Month
                                </label>
                                <details
                                  className="relative"
                                  ref={monthDropdownRef}
                                  open={isMonthDropdownOpen}
                                >
                                  <summary
                                    className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-background cursor-pointer list-none select-none"
                                    onClick={e => {
                                      e.preventDefault()
                                      setIsMonthDropdownOpen(o => !o)
                                    }}
                                  >
                                    {(monthBasedValue.daysOfMonth || []).join(', ') ||
                                      'Select days...'}
                                  </summary>
                                  <div className="absolute z-10 mt-1 w-full border border-border rounded-md bg-background p-2 max-h-48 overflow-auto shadow">
                                    {monthDayOptions.map(d => {
                                      const checked = monthBasedValue.daysOfMonth.includes(d.value)
                                      return (
                                        <label
                                          key={d.value}
                                          className="flex items-center gap-2 text-xs px-1 py-1 rounded hover:bg-muted/50 cursor-pointer"
                                          onClick={e => {
                                            e.preventDefault()
                                            const next = new Set(monthBasedValue.daysOfMonth)
                                            if (checked) next.delete(d.value)
                                            else next.add(d.value)
                                            const normalized = Array.from(next).sort((a, b) => a - b)
                                            updateSelectedNodeData({
                                              schedule: {
                                                type: 'monthBased',
                                                value: {
                                                  ...monthBasedValue,
                                                  daysOfMonth: normalized.length
                                                    ? normalized
                                                    : [d.value],
                                                },
                                              },
                                            })
                                          }}
                                        >
                                          <input type="checkbox" checked={checked} readOnly />
                                          {d.label}
                                        </label>
                                      )
                                    })}
                                  </div>
                                </details>
                              </div>
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">
                                  Time
                                </label>
                                <input
                                  type="time"
                                  value={monthBasedValue.time}
                                  onChange={e => {
                                    updateSelectedNodeData({
                                      schedule: {
                                        type: 'monthBased',
                                        value: {
                                          ...monthBasedValue,
                                          time: e.target.value,
                                        },
                                      },
                                    })
                                  }}
                                  className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                />
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-md">
                              <strong>Note:</strong> The workflow will run on days{' '}
                              {monthBasedValue.daysOfMonth.join(', ')} at {monthBasedValue.time} in
                              your timezone.
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }

                  if (subtype.includes('webhook')) {
                    const connectorType = (data.connectorType as string) || ''
                    const eventType = (data.eventType as string) || ''
                    return (
                      <div className="space-y-2 mt-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">
                          Webhook Configuration
                        </div>
                        {availableWebhookConnectors.length === 0 ? (
                          <div className="text-xs text-muted-foreground">
                            No webhook connectors available. Please connect a service first.
                          </div>
                        ) : (
                          <>
                            <div>
                              <label className="text-xs text-muted-foreground block mb-1">
                                Connector
                              </label>
                              <select
                                value={connectorType}
                                onChange={e =>
                                  updateSelectedNodeData({
                                    connectorType: e.target.value,
                                  })
                                }
                                className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                              >
                                <option value="">Choose a connector...</option>
                                {availableWebhookConnectors.map(connector => (
                                  <option key={connector.type} value={connector.type}>
                                    {connector.type.charAt(0).toUpperCase() +
                                      connector.type.slice(1)}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {connectorType && (
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">
                                  Event
                                </label>
                                <select
                                  value={eventType}
                                  onChange={e =>
                                    updateSelectedNodeData({
                                      eventType: e.target.value,
                                    })
                                  }
                                  className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                  <option value="">Choose an event...</option>
                                  {availableWebhookConnectors
                                    .find(c => c.type === connectorType)
                                    ?.webhookEvents.map(event => (
                                      <option key={event} value={event}>
                                        {event
                                          .replace(/_/g, ' ')
                                          .replace(/\b\w/g, l => l.toUpperCase())}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            )}
                            {connectorType && connectorEntitiesInfo[connectorType] && (
                              <div>
                                <label className="text-xs text-muted-foreground block mb-1">
                                  Entity Type (Optional)
                                </label>
                                <select
                                  value={webhookEntityType}
                                  onChange={e => setWebhookEntityType(e.target.value)}
                                  className="w-full px-2 py-1.5 text-xs rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                                >
                                  <option value="">All entities...</option>
                                  {connectorEntitiesInfo[connectorType].map(entity => (
                                    <option key={entity} value={entity}>
                                      {entity}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )
                  }

                  if (subtype === 'goal') {
                    const goal = (data.goal as string) || ''
                    return (
                      <div className="space-y-2 mt-4">
                        <div className="text-xs text-muted-foreground uppercase tracking-wide">
                          Goal
                        </div>
                        <textarea
                          value={goal}
                          onChange={e =>
                            updateSelectedNodeData({
                              goal: e.target.value,
                            })
                          }
                          placeholder="Describe the goal for this workflow..."
                          className="w-full min-h-[120px] px-3 py-2 text-sm rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
                        />
                      </div>
                    )
                  }

                  return (
                    <div className="text-muted-foreground mt-4">
                      No properties available for this node.
                    </div>
                  )
                })()
              )}
            </div>
          </aside>

          {contextMenu && (
            <div
              className="fixed z-[100] bg-popover border border-border rounded-md shadow-lg text-sm"
              style={{ left: contextMenu.x, top: contextMenu.y }}
              onMouseLeave={() => setContextMenu(null)}
            >
              <button
                className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-muted"
                onClick={() => {
                  if (contextMenu.nodeId) {
                    setNodes(current => current.filter(n => n.id !== contextMenu.nodeId))
                    setEdges(current =>
                      current.filter(
                        e => e.source !== contextMenu.nodeId && e.target !== contextMenu.nodeId
                      )
                    )
                  } else if (contextMenu.edgeId) {
                    setEdges(current => current.filter(e => e.id !== contextMenu.edgeId))
                  }
                  setContextMenu(null)
                }}
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
