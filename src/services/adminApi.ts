import { api } from './api'
import type { 
  Organization, 
  User, 
  SystemStats, 
  ConnectorStats, 
  TokenUsageStats, 
  PaginatedResponse,
  UserFilters,
  ToolPrompt,
  ToolPromptResponse,
  ToolPromptUpdateRequest,
  ToolPromptUpdateResponse,
  CreateToolPromptRequest,
  CreateToolPromptResponse,
  Prompt,
  CreatePromptRequest,
  UpdatePromptRequest,
  PromptTestRequest,
  PromptTestResponse,
  ClearCacheRequest,
  PromptVersion,
  PromptVersionHistory,
  PromptDiff,
  VersionComparison,
  RevertPromptRequest,
  RevertPromptResponse,
  Connector,
  ConnectorsResponse,
  EnvConfig,
  BulkToolPromptsCsvResponse,
  BulkImportPromptsCsvResponse,
  Provider,
  Model,
  CreateProviderInput,
  UpdateProviderInput,
  CreateModelInput,
  UpdateModelInput,
  ModelType,
  TokenUsageOverview,
  TokenUsageOrganizationsResponse,
  TokenUsageOrganizationDetail,
  TokenUsageUsersResponse,
  TokenUsageUserDetail,
  TokenUsagePurposesResponse,
  TokenUsageModelsResponse,
  TokenUsageDailyBreakdown,
  AvailablePurposesResponse,
  OrganizationUsersResponse,
  UserChat,
  UserChatsResponse,
  UserServiceUsageResponse
} from '../types/admin'

const API_BASE = '/admin'

export const adminApi = {
  // Organizations
  async getOrganizations(): Promise<Organization[]> {
    const response = await api.get(`${API_BASE}/organizations`)
    return response.data
  },

  async getOrganization(id: string): Promise<Organization> {
    const response = await api.get(`${API_BASE}/organizations/${id}`)
    return response.data
  },

  async updateOrganization(id: string, data: Partial<Organization>): Promise<Organization> {
    const response = await api.put(`${API_BASE}/organizations/${id}`, data)
    return response.data
  },

  async deleteOrganization(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/organizations/${id}`)
    return response.data
  },

  // Users
  async getUsers(filters: UserFilters = {}): Promise<PaginatedResponse<User>> {
    const response = await api.get(`${API_BASE}/users`, { params: filters })
    return response.data
  },

  async getUser(id: string): Promise<User> {
    const response = await api.get(`${API_BASE}/users/${id}`)
    return response.data
  },

  async updateUser(id: string, data: Partial<User>): Promise<User> {
    const response = await api.put(`${API_BASE}/users/${id}`, data)
    return response.data
  },

  async deleteUser(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/users/${id}`)
    return response.data
  },

  async getUserChats(userId: string, page: number = 1, limit: number = 10, days?: number): Promise<UserChatsResponse> {
    const params: any = { page, limit }
    if (days) {
      params.days = days
    }
    const response = await api.get(`${API_BASE}/users/${userId}/chats`, { params })
    return response.data
  },

  async getUserServiceUsage(userId: string, page: number = 1, limit: number = 10, days?: number): Promise<UserServiceUsageResponse> {
    const params: any = { page, limit }
    if (days) {
      params.days = days
    }
    const response = await api.get(`${API_BASE}/users/${userId}/service-usage`, { params })
    return response.data
  },

  // Statistics
  async getSystemStats(): Promise<SystemStats> {
    const response = await api.get(`${API_BASE}/stats`)
    return response.data
  },

  async getConnectorStats(): Promise<ConnectorStats> {
    const response = await api.get(`${API_BASE}/connectors/stats`)
    return response.data
  },

  async getConnectorsMetadata(): Promise<any> {
    const response = await api.get(`${API_BASE}/connectors/metadata`)
    return response.data
  },

  async getConnectors(organizationId?: string): Promise<ConnectorsResponse> {
    const params = organizationId ? { organizationId } : {};
    const response = await api.get(`${API_BASE}/connectors`, { params })
    return response.data
  },

  async syncConnector(id: string): Promise<{ message: string }> {
    const response = await api.get(`/connectors/sadmin/${id}/sync`)
    return response.data
  },

  async deleteConnector(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/connectors/${id}`)
    return response.data
  },

  async getTokenUsageStats(period: number = 30, organizationId?: string): Promise<TokenUsageStats> {
    const params: Record<string, any> = { period }
    if (organizationId) params.organizationId = organizationId
    const response = await api.get(`${API_BASE}/token-usage/stats`, { params })
    return response.data
  },

  async getTokenUsageOverview(params?: {
    period?: number;
    organizationId?: string;
    userId?: string;
    purpose?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<TokenUsageOverview> {
    const response = await api.get(`${API_BASE}/token-usage/overview`, { params })
    return response.data
  },

  async getTokenUsageOrganizations(params?: {
    period?: number;
    purpose?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<TokenUsageOrganizationsResponse> {
    const response = await api.get(`${API_BASE}/token-usage/organizations`, { params })
    return response.data
  },

  async getTokenUsageOrganizationDetail(organizationId: string, params?: {
    period?: number;
    purpose?: string;
    includeUsers?: boolean;
    includeDaily?: boolean;
  }): Promise<TokenUsageOrganizationDetail> {
    const response = await api.get(`${API_BASE}/token-usage/organizations/${organizationId}`, { params })
    return response.data
  },

  async getTokenUsageUsers(params?: {
    period?: number;
    organizationId?: string;
    purpose?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<TokenUsageUsersResponse> {
    const response = await api.get(`${API_BASE}/token-usage/users`, { params })
    return response.data
  },

  async getTokenUsageUserDetail(userId: string, params?: {
    period?: number;
    includePurposes?: boolean;
    includeDaily?: boolean;
    includeModels?: boolean;
  }): Promise<TokenUsageUserDetail> {
    const response = await api.get(`${API_BASE}/token-usage/users/${userId}`, { params })
    return response.data
  },

  async getTokenUsagePurposes(params?: {
    period?: number;
    organizationId?: string;
    userId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<TokenUsagePurposesResponse> {
    const response = await api.get(`${API_BASE}/token-usage/purposes`, { params })
    return response.data
  },

  async getTokenUsageModels(params?: {
    period?: number;
    organizationId?: string;
    userId?: string;
    purpose?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<TokenUsageModelsResponse> {
    const response = await api.get(`${API_BASE}/token-usage/models`, { params })
    return response.data
  },

  async getTokenUsageDaily(params?: {
    period?: number;
    organizationId?: string;
    userId?: string;
    purpose?: string;
  }): Promise<TokenUsageDailyBreakdown> {
    const response = await api.get(`${API_BASE}/token-usage/daily`, { params })
    return response.data
  },

  async getAvailablePurposes(): Promise<AvailablePurposesResponse> {
    const response = await api.get(`${API_BASE}/token-usage/purposes/list`)
    return response.data
  },

  async getOrganizationUsers(
    organizationId: string,
    params?: {
      includeStats?: boolean;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Promise<OrganizationUsersResponse> {
    const response = await api.get(`${API_BASE}/token-usage/organizations/${organizationId}/users`, { params })
    return response.data
  },

  // Config Management
  async getOrganizationConfig(organizationId: string): Promise<EnvConfig[]> {
    const response = await api.get(`${API_BASE}/config/${encodeURIComponent(organizationId)}`)
    return response.data
  },

  async setOrganizationConfig(organizationId: string, key: string, value: string): Promise<{ message: string }> {
    const response = await api.post(`${API_BASE}/config/${encodeURIComponent(organizationId)}`, { key, value })
    return response.data
  },

  async deleteOrganizationConfig(organizationId: string, key: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/config/${encodeURIComponent(organizationId)}/${encodeURIComponent(key)}`)
    return response.data
  },

  // Logs
  async getLogs(page: number = 1, limit: number = 50, level?: string, search?: string) {
    const params: Record<string, any> = { page, limit }
    if (level) params.level = level
    if (search) params.search = search
    
    const response = await api.get(`${API_BASE}/logs`, { params })
    return response.data
  },

  // Tool Prompts
  async getToolPrompts(): Promise<ToolPromptResponse> {
    const response = await api.get(`${API_BASE}/tools`)
    return response.data
  },

  async getToolPrompt(toolName: string, connectorType: string): Promise<ToolPrompt> {
    const response = await api.get(`${API_BASE}/tools/${toolName}/${connectorType}`)
    return response.data
  },

  async updateToolPrompt(
    toolName: string, 
    connectorType: string, 
    data: ToolPromptUpdateRequest
  ): Promise<ToolPromptUpdateResponse> {
    const response = await api.put(`${API_BASE}/tools/${toolName}/${connectorType}`, data)
    return response.data
  },

  async createToolPrompt(
    connectorType: string,
    data: CreateToolPromptRequest
  ): Promise<CreateToolPromptResponse> {
    const response = await api.post(`${API_BASE}/tools/${encodeURIComponent(connectorType)}`, data)
    return response.data
  },

  async bulkCreateToolPromptsFromCsv(file: File): Promise<BulkToolPromptsCsvResponse> {
    const form = new FormData()
    form.append('file', file)
    const response = await api.post(`${API_BASE}/tools/import/csv`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async exportToolPromptsCsv(): Promise<string> {
    const response = await api.get(`${API_BASE}/tools/export/csv`, {
      responseType: 'text',
    })
    return response.data
  },

  // Prompt Management
  async getPrompts(): Promise<Prompt[]> {
    const response = await api.get(`${API_BASE}/prompts`)
    return response.data
  },

  async getPrompt(id: string): Promise<Prompt> {
    const response = await api.get(`${API_BASE}/prompts/${id}`)
    return response.data
  },

  async getPromptsByIdentifier(identifier: string): Promise<Prompt[]> {
    const response = await api.get(`${API_BASE}/prompts/identifier/${identifier}`)
    return response.data
  },

  async createPrompt(data: CreatePromptRequest): Promise<Prompt> {
    const response = await api.post(`${API_BASE}/prompts`, data)
    return response.data
  },

  async updatePrompt(id: string, data: UpdatePromptRequest): Promise<Prompt> {
    const response = await api.put(`${API_BASE}/prompts/${id}`, data)
    return response.data
  },

  async deletePrompt(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/prompts/${id}`)
    return response.data
  },

  async testPrompt(id: string, data: PromptTestRequest): Promise<PromptTestResponse> {
    const response = await api.post(`${API_BASE}/prompts/${id}/test`, data)
    return response.data
  },

  async clearPromptCache(data: ClearCacheRequest = {}): Promise<{ message: string }> {
    const response = await api.post(`${API_BASE}/prompts/cache/clear`, data)
    return response.data
  },

  async bulkImortPrompts(file: File): Promise<BulkImportPromptsCsvResponse> {
    const form = new FormData()
    form.append('file', file)
    const response = await api.post(`${API_BASE}/prompts/import/csv`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return response.data
  },

  async exportPromptsCsv(): Promise<string> {
    const response = await api.get(`${API_BASE}/prompts/export/csv`, {
      responseType: 'text',
    })
    return response.data
  },

  // Version Management
  async getPromptVersions(identifier: string): Promise<PromptVersionHistory> {
    const response = await api.get(`${API_BASE}/prompts/identifier/${identifier}/versions`)
    return response.data
  },

  async comparePromptVersions(identifier: string, fromVersion: number, toVersion: number): Promise<VersionComparison> {
    const response = await api.get(`${API_BASE}/prompts/identifier/${identifier}/compare/${fromVersion}/${toVersion}`)
    return response.data
  },

  async getPromptDiff(identifier: string, fromVersion: number, toVersion: number): Promise<PromptDiff> {
    const response = await api.get(`${API_BASE}/prompts/identifier/${identifier}/diff/${fromVersion}/${toVersion}`)
    return response.data
  },

  async revertPromptToVersion(identifier: string, version: number, data: RevertPromptRequest = {}): Promise<RevertPromptResponse> {
    const response = await api.post(`${API_BASE}/prompts/identifier/${identifier}/revert/${version}`, data)
    return response.data
  },

  async updatePromptTemplate(id: string, template: string, changeMessage?: string): Promise<Prompt> {
    const response = await api.put(`${API_BASE}/prompts/${id}`, { 
      template,
      changeMessage 
    })
    return response.data
  },

  async getPromptVersion(identifier: string, version: number): Promise<PromptVersion> {
    const response = await api.get(`${API_BASE}/prompts/identifier/${identifier}/version/${version}`)
    return response.data
  },
  async getPromptChats(): Promise<{ data: import('../types/admin').PromptChatListItem[]; page: number; pageSize: number; total: number; totalPages: number; }> {
    const response = await api.get(`${API_BASE}/prompts/chats`)
    return response.data
  },

  async getPromptChatMessages(chatId: string): Promise<import('../types/admin').AIChatMessage[]> {
    const response = await api.get(`${API_BASE}/prompts/chat/${encodeURIComponent(chatId)}/messages`)
    const payload = response.data
    const list = Array.isArray(payload) ? payload : payload?.messages || payload?.data || []
    const toRole = (r: any): import('../types/admin').AIChatRole => {
      const v = String(r || '').toLowerCase()
      return v === 'user' ? 'user' : 'assistant'
    }
    const blocksToText = (content: any): string => {
      const blocks = content?.blocks
      if (Array.isArray(blocks)) {
        return blocks
          .filter((b: any) => b?.type === 'text' && typeof b?.content === 'string')
          .map((b: any) => b.content)
          .join('\n')
      }
      if (typeof content === 'string') return content
      return ''
    }
    return list.map((m: any) => ({
      role: toRole(m.role),
      content: blocksToText(m.content),
    }))
  },

  async streamPromptAIChat(
    promptId: string,
    body: import('../types/admin').AIChatRequest,
    onChunk: (text: string) => void,
    onError?: (error: any) => void,
    onDone?: () => void,
    onDelta?: (eventName: string, payload: any) => void,
    onOpen?: (chatId: string | null, response: Response) => void,
  ): Promise<void> {
    const url = `${api.defaults.baseURL}${API_BASE}/prompts/${encodeURIComponent(promptId)}/ai-chat`
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          // Forward cookies for session
        },
        body: JSON.stringify(body),
        credentials: 'include',
      })
      if (!response.ok || !response.body) {
        throw new Error(`Chat stream failed: ${response.status} ${response.statusText}`)
      }
      const chatIdHeader = response.headers.get('x-chat-id')
      onOpen && onOpen(chatIdHeader, response)
      const reader = response.body.getReader()
      const decoder = new TextDecoder('utf-8')
      let done = false
      let buffer = ''
      let currentEvent: string | null = null
      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          buffer += decoder.decode(value, { stream: true })
          // Basic SSE line parsing supporting event: and data:
          const lines = buffer.split('\n')
          // Keep the last partial line in buffer
          buffer = lines.pop() || ''
          for (const line of lines) {
            const trimmed = line.trim()
            if (!trimmed) continue
            if (trimmed.startsWith('event:')) {
              currentEvent = trimmed.slice(6).trim()
              continue
            }
            if (trimmed.startsWith('data:')) {
              const payload = trimmed.slice(5).trim()
              if (payload === '[DONE]') {
                onDone && onDone()
                return
              }
              try {
                const evt = JSON.parse(payload)
                if (currentEvent && onDelta) {
                  onDelta(currentEvent, evt)
                } else {
                  if (typeof evt === 'string') {
                    onChunk(evt)
                  } else if (evt?.text) {
                    onChunk(evt.text)
                  } else if (evt?.content) {
                    onChunk(evt.content)
                  } else if (evt?.type === 'error') {
                    onError && onError(evt.error || 'Unknown error')
                  }
                }
              } catch {
                // Fallback to raw text
                onChunk(payload)
              }
            } else {
              // Ignore other lines
              continue
            }
          }
        }
      }
      onDone && onDone()
    } catch (err) {
      onError && onError(err)
      throw err
    }
  },

  async getPromptTokenSize(identifier: string): Promise<import('../types/admin').PromptTokenSizeResponse> {
    const response = await api.get(`${API_BASE}/prompts/token-size/${encodeURIComponent(identifier)}`)
    return response.data
  },

  // Admin Environment Variables
  async getAdminEnvVariables(): Promise<any[]> {
    const response = await api.get(`${API_BASE}/config`)
    return response.data
  },

  async createAdminEnvVariable(envVar: { key: string; value: string; description?: string }): Promise<any> {
    const response = await api.post(`${API_BASE}/config`, envVar)
    return response.data
  },

  async updateAdminEnvVariable(key: string, value: string): Promise<any> {
    const response = await api.put(`${API_BASE}/config/${key}`, { value })
    return response.data
  },

  async deleteAdminEnvVariable(key: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/config/${key}`)
    return response.data
  },

  // Provider Management
  async getProviders(): Promise<Provider[]> {
    const response = await api.get(`${API_BASE}/providers`)
    return response.data?.data || response.data
  },

  async createProvider(input: CreateProviderInput): Promise<Provider> {
    const response = await api.post(`${API_BASE}/providers`, input)
    return response.data?.data || response.data
  },

  async updateProvider(id: string, input: UpdateProviderInput): Promise<Provider> {
    const response = await api.put(`${API_BASE}/providers/${encodeURIComponent(id)}`, input)
    return response.data?.data || response.data
  },

  async deleteProvider(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/providers/${encodeURIComponent(id)}`)
    return response.data
  },

  // Model Management
  async getModels(params: { organizationId: string; provider?: string; type?: string }): Promise<Model[]> {
    const response = await api.get(`${API_BASE}/models`, { params })
    return response.data?.data || response.data
  },

  async getModelById(id: string, organizationId: string): Promise<Model> {
    const response = await api.get(`${API_BASE}/models/${encodeURIComponent(id)}`, { params: { organizationId } })
    return response.data?.data || response.data
  },

  async createModel(input: CreateModelInput): Promise<Model> {
    const response = await api.post(`${API_BASE}/models`, input)
    return response.data?.data || response.data
  },

  async updateModel(id: string, input: UpdateModelInput): Promise<Model> {
    const response = await api.put(`${API_BASE}/models/${encodeURIComponent(id)}`, input)
    return response.data?.data || response.data
  },

  async deleteModel(id: string): Promise<{ message: string }> {
    const response = await api.delete(`${API_BASE}/models/${encodeURIComponent(id)}`)
    return response.data
  },

  async setModelForAllOrganizations(input: { model: string; providerId: string; type: ModelType }): Promise<{ message: string; count: number }> {
    const response = await api.post(`${API_BASE}/models/org`, input)
    return response.data
  }
} 