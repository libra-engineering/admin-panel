import { api } from './api'

export interface AgentLibraryItem {
  id: string
  name: string
  description: string | null
  customInstructions: string | null
  tools: string[]
  createdAt: string
  updatedAt: string
  category: string | null
}

export interface CreateAgentLibraryRequest {
  name: string
  description?: string | null
  customInstructions?: string | null
  tools?: string[]
  category?: string | null
}

export interface UpdateAgentLibraryRequest {
  name?: string
  description?: string | null
  customInstructions?: string | null
  tools?: string[]
  category?: string | null
}

export interface WorkflowLibraryItem {
  id: string
  name: string
  nodes: unknown[]
  edges: unknown[]
  workflowType: 'polling' | 'webhook'
  toolPreference?: 'all' | string
  webhookEventName?: string | null
  webhookConnectorType?: string | null
  enabled: boolean
  createdAt: string
  updatedAt: string
  category: string | null
}

export interface CreateWorkflowLibraryRequest {
  name: string
  nodes?: unknown[]
  edges?: unknown[]
  workflowType?: 'polling' | 'webhook'
  toolPreference?: 'all' | string
  webhookEventName?: string | null
  webhookConnectorType?: string | null
  enabled?: boolean
  category?: string | null
}

export interface UpdateWorkflowLibraryRequest {
  name?: string
  nodes?: unknown[]
  edges?: unknown[]
  workflowType?: 'polling' | 'webhook'
  toolPreference?: 'all' | string
  webhookEventName?: string | null
  webhookConnectorType?: string | null
  enabled?: boolean
}

export interface Agent {
  id: string
  name: string
  description?: string
  customInstructions?: string
  tools: string[]
  organizationId: string
  userId: string
  createdAt: string
  updatedAt: string
  sourceLibraryId?: string | null
}

export interface AgentCreatePayload {
  name: string
  description?: string
  customInstructions?: string
  tools: string[]
}

export interface AgentUpdatePayload {
  name?: string
  description?: string
  customInstructions?: string
  tools?: string[]
}

export interface AvailableTool {
  connectorId: string
  connectorName: string
  connectorType: string
  tools: string[]
}

export interface AvailableToolsResponse {
  connectors: Array<{
      id: string
      name: string
      type: string
  }>
  availableTools: AvailableTool[]
}

export interface GenerateAgentConfigPayload {
  requirement: string
}

export interface GenerateAgentConfigResponse {
  name: string
  description: string
  customInstructions: string
  suggestedTools: string[]
  availableTools: AvailableTool[]
}

export interface AgentFormData {
  name: string
  description: string
  customInstructions: string
  tools: string[]
}

export type AgentModalType = 'create' | 'edit' | 'delete' | null

export interface AgentViewState {
  activeModal: AgentModalType
  selectedAgentId: string | null
}

export interface AgentError {
  message: string
  field?: string
  code?: string
}


export interface BulkCsvResultItem {
  index: number
  type: 'agent' | 'workflow'
  status: 'created' | 'preview' | 'error' | 'skipped'
  id?: string
  name?: string
  error?: string
}

export interface BulkCsvResponse {
  total: number
  created: number
  preview: number
  errors: number
  skipped: number
  results: BulkCsvResultItem[]
}

const API_BASE = '/admin'

export const libraryApi = {
  // Agents
  async listAgentTemplates(): Promise<AgentLibraryItem[]> {
    const res = await api.get('/admin/library/agents')
    return res.data
  },
  async createAgentTemplate(body: CreateAgentLibraryRequest): Promise<AgentLibraryItem> {
    const res = await api.post('/admin/library/agents', body)
    return res.data
  },
  async updateAgentTemplate(id: string, body: UpdateAgentLibraryRequest): Promise<AgentLibraryItem> {
    const res = await api.put(`/admin/library/agents/${id}`, body)
    return res.data
  },
  async deleteAgentTemplate(id: string): Promise<void> {
    await api.delete(`${API_BASE}/library/agents/${id}`)
  },

  // Workflows
  async listWorkflowTemplates(): Promise<WorkflowLibraryItem[]> {
    const res = await api.get('/admin/library/workflows')
    return res.data
  },
  async createWorkflowTemplate(body: CreateWorkflowLibraryRequest): Promise<WorkflowLibraryItem> {
    const res = await api.post('/admin/library/workflows', body)
    return res.data
  },
  async updateWorkflowTemplate(id: string, body: UpdateWorkflowLibraryRequest): Promise<WorkflowLibraryItem> {
    const res = await api.put(`/admin/library/workflows/${id}`, body)
    return res.data
  },
  async deleteWorkflowTemplate(id: string): Promise<void> {
    await api.delete(`/admin/library/workflows/${id}`)
  },
  async getWorkflowTemplate(id: string): Promise<WorkflowLibraryItem> {
    const res = await api.get(`/admin/library/workflows/${id}`)
    return res.data
  },
}
  export const agentApi = {
    listAgents: async (): Promise<Agent[]> => {
        const response = await api.get<Agent[]>('/agents')
        return response.data
    },

    getAgent: async (agentId: string): Promise<Agent> => {
        const response = await api.get<any>(`/agents/${agentId}`)
        console.log('getAgent', response.data)
        return response.data
    },

    createAgent: async (payload: AgentCreatePayload): Promise<Agent> => {
        const response = await api.post<Agent>('/agents', payload)
        return response.data
    },

    updateAgent: async (agentId: string, payload: AgentUpdatePayload): Promise<Agent> => {
        const response = await api.put<Agent>(`/agents/${agentId}`, payload)
        return response.data
    },

    deleteAgent: async (agentId: string): Promise<void> => {
        await api.delete(`/agents/${agentId}`)
    },

    getAvailableTools: async (): Promise<AvailableToolsResponse> => {
        const response = await api.get<AvailableToolsResponse>('/agents/tools')
        return response.data
    },

    generateAgentConfig: async (
        payload: GenerateAgentConfigPayload
    ): Promise<GenerateAgentConfigResponse> => {
        const response = await api.post<GenerateAgentConfigResponse>(
            '/agents/generate-config',
            payload
        )
        return response.data
    },

    bulkCreateFromCsv: async (file: File, opts?: { dryRun?: boolean }): Promise<BulkCsvResponse> => {
        const form = new FormData()
        form.append('file', file)
        if (opts?.dryRun) form.append('dryRun', 'true')
        const response = await api.post<BulkCsvResponse>(
            `/agents/bulk-csv${opts?.dryRun ? '?dryRun=true' : ''}`,
            form,
            { headers: { 'Content-Type': 'multipart/form-data' } }
        )
        return response.data
    },
}

