import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '@/store'
import LoginPage from '@/components/auth/LoginPage'
import AdminLayout from '@/components/layout/AdminLayout'
import AdminDashboard from '@/pages/AdminDashboard'
import OrganizationsPage from '@/pages/OrganizationsPage'
import UsersPage from '@/pages/UsersPage'
import UserDetailPage from '@/pages/UserDetailPage'
import TokenUsagePage from '@/pages/TokenUsagePage'
import ConnectorsPage from '@/pages/ConnectorsPage'
import ToolsPage from '@/pages/ToolsPage'
import PromptsPage from '@/pages/PromptsPage'
import PromptEditor from '@/pages/PromptEditor'
import ToolEditor from '@/pages/ToolEditor'
import LogsPage from '@/pages/LogsPage'
import AdminProvidersPage from '@/pages/AdminProvidersPage'
import AdminModelsPage from '@/pages/AdminModelsPage'
import ServiceLoginPage from '@/pages/ServiceLoginPage'
import ServiceDashboard from '@/pages/ServiceDashboard'
import ServiceLayout from '@/components/layout/ServiceLayout'
import ServiceEnvVariablesPage from '@/pages/ServiceEnvVariablesPage'
import ServiceAnalyticsPage from '@/pages/ServiceAnalyticsPage'
import ServiceOrganizationsPage from '@/pages/ServiceOrganizationsPage'
import ServiceOrganizationDetailsPage from '@/pages/ServiceOrganizationDetailsPage'
import ServiceApiKeysPage from '@/pages/ServiceApiKeysPage'
import ServiceUsersPage from '@/pages/ServiceUsersPage'
import ServicePromptsPage from '@/pages/ServicePromptsPage'
import ServiceAgentsPage from '@/pages/ServiceAgentsPage'
import ServiceWorkflowBuilder from '@/pages/ServiceWorkflowBuilder'
import ServicePromptEditor from '@/pages/ServicePromptEditor'
import ServiceToolsPage from '@/pages/ServiceToolsPage'
import ServiceToolEditor from '@/pages/ServiceToolEditor'
import { ROUTES } from '@/lib/constants'
import './App.css'
import { Toaster } from 'sonner'
import { AuthProvider, ProtectedRoute } from './components/auth/AuthContext'
import { ServiceAuthProvider } from '@/contexts/ServiceAuthContext'
import { ServiceProtectedRoute } from '@/components/auth/ServiceProtectedRoute'
import AgentsPage from './pages/AgentsPage'
import WorkflowBuilder from './pages/WorkflowBuilder'
import OrganizationConfigPage from '@/pages/OrganizationConfigPage'
import OrganizationDetailsPage from '@/pages/OrganizationDetailsPage'
import AdminEnvPage from '@/pages/AdminEnvPage'

// App component with authentication logic
const AppContent = () => {
  // const { isAuthenticated, isLoading } = useAuth()

  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  //     </div>
  //   )
  // }

  return (
    <Router>
      <AuthProvider>
        <ServiceAuthProvider>
          <Toaster richColors position="top-right" style={{ zIndex: 9999 }} />

          <Routes>
          <Route
            path={ROUTES.LOGIN}
            element={<LoginPage />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={['superadmin']}>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="organizations/:id" element={<OrganizationDetailsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="users/:id" element={<UserDetailPage />} />
            <Route path="token-usage" element={<TokenUsagePage />} />
            <Route path="connectors" element={<ConnectorsPage />} />
            <Route path="providers" element={<AdminProvidersPage />} />
            <Route path="models" element={<AdminModelsPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="tools/editor/:toolKey" element={<ToolEditor />} />
            <Route path="prompts/editor/:identifier" element={<PromptEditor />} />
            <Route path="prompts" element={<PromptsPage />} />
            <Route path="logs" element={<LogsPage />} />
            <Route path="env" element={<AdminEnvPage />} />
            <Route path='agents' element={<AgentsPage />} />
            <Route path='workflows/new' element={<WorkflowBuilder />} />
            <Route path='workflows/:id' element={<WorkflowBuilder />} />
          </Route>
          <Route
            path={ROUTES.HOME}
            element={<Navigate to="/admin" replace />}
          />


          {/* Admin Routes */}
          {/* <Route
            path={ROUTES.ADMIN}
            element={
              // <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              // </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.ORGANIZATIONS}
            element={
              // <ProtectedRoute>
                <AdminLayout>
                  <OrganizationsPage />
                </AdminLayout>
              // </ProtectedRoute>
            }
          />
          

          <Route
          path={ROUTES.HOME}
          element={
            // <ProtectedRoute>
                <AdminLayout>
                  <AdminDashboard />
                </AdminLayout>
              // </ProtectedRoute>
          }
          /> */}

          <Route path={ROUTES.SERVICE_LOGIN} element={<ServiceLoginPage />} />
          <Route 
            path="/service"
            element={
              <ServiceProtectedRoute>
                <ServiceLayout />
              </ServiceProtectedRoute>
            }
          >
            {/* <Route path="dashboard" element={<ServiceDashboard />} /> */}
            <Route path="env-variables" element={<ServiceEnvVariablesPage />} />
            <Route path="analytics" element={<ServiceAnalyticsPage />} />
            <Route path="organizations" element={<ServiceOrganizationsPage />} />
            <Route path="organizations/:id" element={<ServiceOrganizationDetailsPage />} />
            <Route path="api-keys" element={<ServiceApiKeysPage />} />
            <Route path="users" element={<ServiceUsersPage />} />
            <Route path="prompts" element={<ServicePromptsPage />} />
            <Route path="prompts/editor/:identifier" element={<ServicePromptEditor />} />
            <Route path="tools" element={<ServiceToolsPage />} />
            <Route path="tools/editor/:toolKey" element={<ServiceToolEditor />} />
            <Route path="agents" element={<ServiceAgentsPage />} />
            <Route path="workflows/new" element={<ServiceWorkflowBuilder />} />
            <Route path="workflows/:id" element={<ServiceWorkflowBuilder />} />
          </Route>
          
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />

          </Routes>
        </ServiceAuthProvider>
      </AuthProvider>
    </Router>
  )
}

// Main App component with Redux Provider
function App() {
  return (
    <Provider store={store}>
      <AppContent />
    </Provider>
  )
}

export default App
