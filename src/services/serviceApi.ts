import { SERVICE_API_URL } from "@/lib/constants";

class ServiceApiClient {
  private baseURL = `${SERVICE_API_URL}/api`;

  private getAuthHeader(): string | null {
    const token = localStorage.getItem('service_jwt_token');
    return token ? `Bearer ${token}` : null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const authHeader = this.getAuthHeader();
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { Authorization: authHeader }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Authentication endpoints
  async login(email: string, password: string) {
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  // Users management
  async createAdminUser(userData: { email: string; password: string; name?: string; role?: string }) {
    return this.request('/admin/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  // Environment Variables management
  async getEnvVariables() {
    return this.request('/admin/env-variables');
  }

  async createEnvVariable(envVar: { key: string; value: string; description?: string }) {
    return this.request('/admin/env-variables', {
      method: 'POST',
      body: JSON.stringify(envVar),
    });
  }

  async updateEnvVariable(id: string, envVar: { key?: string; value?: string; description?: string }) {
    return this.request(`/admin/env-variables/${id}`, {
      method: 'PUT',
      body: JSON.stringify(envVar),
    });
  }

  async deleteEnvVariable(id: string) {
    return this.request(`/admin/env-variables/${id}`, {
      method: 'DELETE',
    });
  }

  // Analytics endpoints
  async getAnalyticsOverview() {
    return this.request('/admin/analytics/overview');
  }

  async getAnalyticsUsage() {
    return this.request('/admin/analytics/usage');
  }

  // Organizations management
  async getOrganizations() {
    return this.request('/admin/organizations');
  }

  async getOrganizationById(id: string) {
    return this.request(`/admin/organizations/${id}`);
  }

  async createOrganization(orgData: { name: string; domain: string; seats: number }) {
    return this.request('/admin/organizations', {
      method: 'POST',
      body: JSON.stringify(orgData),
    });
  }

  async updateOrganization(id: string, orgData: { name: string; domain: string; seats: number }) {
    return this.request(`/admin/organizations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(orgData),
    });
  }

  // API Keys management
  async getApiKeys() {
    return this.request('/admin/api-keys');
  }

  async toggleApiKey(id: string, disabled: boolean) {
    return this.request(`/admin/api-keys/${id}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ disabled: !disabled }),
    });
  }

  async createApiKey(orgId: number) {
    return this.request('/admin/api-keys', {
      method: 'POST',
      body: JSON.stringify({ orgId }),
    });
  }

  // Service management endpoints (existing)
  async getServiceStatus() {
    return this.request('/admin/status');
  }

  async getServiceConfig() {
    return this.request('/admin/config');
  }

  async updateServiceConfig(config: any) {
    return this.request('/admin/config', {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getServiceLogs() {
    return this.request('/admin/logs');
  }

  async restartService() {
    return this.request('/admin/restart', {
      method: 'POST',
    });
  }

  // Prompts management
  async getPrompts() {
    return this.request('/admin/prompts');
  }

  async getPrompt(id: string) {
    return this.request(`/admin/prompts/${id}`);
  }

  async createPrompt(promptData: { identifier: string; name: string; description?: string; template: string; variables?: Record<string, any>; isActive?: boolean }) {
    return this.request('/admin/prompts', {
      method: 'POST',
      body: JSON.stringify(promptData),
    });
  }

  async updatePrompt(id: string, promptData: { name?: string; description?: string; template?: string; variables?: Record<string, any>; isActive?: boolean }) {
    return this.request(`/admin/prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(promptData),
    });
  }

  async deletePrompt(id: string) {
    return this.request(`/admin/prompts/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkImportPrompts(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const authHeader = this.getAuthHeader();
    const response = await fetch(`${this.baseURL}/admin/prompts/bulk-import`, {
      method: 'POST',
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async exportPromptsCsv(): Promise<string> {
    const authHeader = this.getAuthHeader();
    const response = await fetch(`${this.baseURL}/admin/prompts/export`, {
      method: 'GET',
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.text();
  }

  // Agents management
  async getAgents() {
    return this.request('/admin/agents');
  }

  async getAgent(id: string) {
    return this.request(`/admin/agents/${id}`);
  }

  async createAgent(agentData: { name: string; description?: string; customInstructions?: string; tools?: string[]; category?: string }) {
    return this.request('/admin/agents', {
      method: 'POST',
      body: JSON.stringify(agentData),
    });
  }

  async updateAgent(id: string, agentData: { name?: string; description?: string; customInstructions?: string; tools?: string[]; category?: string }) {
    return this.request(`/admin/agents/${id}`, {
      method: 'PUT',
      body: JSON.stringify(agentData),
    });
  }

  async deleteAgent(id: string) {
    return this.request(`/admin/agents/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkImportAgents(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const authHeader = this.getAuthHeader();
    const response = await fetch(`${this.baseURL}/admin/library/bulk-import`, {
      method: 'POST',
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Workflows management
  async getWorkflows() {
    return this.request('/admin/workflows');
  }

  async getWorkflow(id: string) {
    return this.request(`/admin/workflows/${id}`);
  }

  async createWorkflow(workflowData: { name: string; nodes?: unknown[]; edges?: unknown[]; workflowType?: 'polling' | 'webhook'; toolPreference?: 'all' | string; webhookEventName?: string; webhookConnectorType?: string; enabled?: boolean; category?: string }) {
    return this.request('/admin/workflows', {
      method: 'POST',
      body: JSON.stringify(workflowData),
    });
  }

  async updateWorkflow(id: string, workflowData: { name?: string; nodes?: unknown[]; edges?: unknown[]; workflowType?: 'polling' | 'webhook'; toolPreference?: 'all' | string; webhookEventName?: string; webhookConnectorType?: string; enabled?: boolean; category?: string }) {
    return this.request(`/admin/workflows/${id}`, {
      method: 'PUT',
      body: JSON.stringify(workflowData),
    });
  }

  async deleteWorkflow(id: string) {
    return this.request(`/admin/workflows/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkImportWorkflows(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const authHeader = this.getAuthHeader();
    const response = await fetch(`${this.baseURL}/admin/library/bulk-import`, {
      method: 'POST',
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
      body: formData,
    });
  }

  // Tool Prompts management
  async getToolPrompts() {
    return this.request('/admin/tool-prompts');
  }

  async getToolPrompt(toolName: string, connectorType: string) {
    return this.request(`/admin/tool-prompts/${toolName}/${connectorType}`);
  }

  async getToolPromptById(id: string) {
    return this.request(`/admin/tool-prompts/${id}`);
  }

  async createToolPrompt(connectorType: string, data: { toolName: string; template: string; description?: string }) {
    return this.request('/admin/tool-prompts', {
      method: 'POST',
      body: JSON.stringify({ ...data, connectorType }),
    });
  }

  async updateToolPrompt(toolName: string, connectorType: string, data: { template: string }) {
    return this.request(`/admin/tool-prompts/${toolName}/${connectorType}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateToolPromptById(id: string, data: { template: string }) {
    return this.request(`/admin/tool-prompts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteToolPrompt(id: string) {
    return this.request(`/admin/tool-prompts/${id}`, {
      method: 'DELETE',
    });
  }

  async bulkCreateToolPromptsFromCsv(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    
    const authHeader = this.getAuthHeader();
    const response = await fetch(`${this.baseURL}/admin/tool-prompts/bulk-import`, {
      method: 'POST',
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async exportToolPromptsCsv(): Promise<string> {
    const authHeader = this.getAuthHeader();
    const response = await fetch(`${this.baseURL}/admin/tool-prompts/export`, {
      method: 'GET',
      headers: {
        ...(authHeader && { Authorization: authHeader }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }

    return response.text();
  }

  async getConnectorsMetadata() {
    return this.request('/admin/connectors/metadata');
  }
}

export const serviceApi = new ServiceApiClient(); 