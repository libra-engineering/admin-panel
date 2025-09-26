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
  BulkImportPromptsCsvResponse
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

  async getConnectors(): Promise<ConnectorsResponse> {
    const response = await api.get(`${API_BASE}/connectors`)
    return response.data
  },

  async getTokenUsageStats(period: number = 30, organizationId?: string): Promise<TokenUsageStats> {
    const params: Record<string, any> = { period }
    if (organizationId) params.organizationId = organizationId
    const response = await api.get(`${API_BASE}/token-usage/stats`, { params })
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
    const response = await api.post(`${API_BASE}/tools/org/${encodeURIComponent(connectorType)}`, data)
    return response.data
  },

  async bulkCreateToolPromptsFromCsv(file: File): Promise<BulkToolPromptsCsvResponse> {
    const form = new FormData()
    form.append('file', file)
    const response = await api.post(`${API_BASE}/tools/bulk-create`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
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
    const response = await api.post(`${API_BASE}/prompts/bulk-create`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
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
  }
} 