import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Provider } from 'react-redux'
import { store } from '@/store'
import LoginPage from '@/components/auth/LoginPage'
import AdminLayout from '@/components/layout/AdminLayout'
import AdminDashboard from '@/pages/AdminDashboard'
import OrganizationsPage from '@/pages/OrganizationsPage'
import UsersPage from '@/pages/UsersPage'
import TokenUsagePage from '@/pages/TokenUsagePage'
import ConnectorsPage from '@/pages/ConnectorsPage'
import ToolsPage from '@/pages/ToolsPage'
import PromptsPage from '@/pages/PromptsPage'
import PromptEditor from '@/pages/PromptEditor'
import LogsPage from '@/pages/LogsPage'
import { ROUTES } from '@/lib/constants'
import './App.css'
import { Toaster } from 'sonner'
import { AuthProvider, ProtectedRoute } from './components/auth/AuthContext'
import AgentsPage from './pages/AgentsPage'
import WorkflowBuilder from './pages/WorkflowBuilder'

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
        <Toaster richColors position="top-right" style={{ zIndex: 9999 }} />

        <Routes>
          <Route
            path={ROUTES.LOGIN}
            element={<LoginPage />}
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="organizations" element={<OrganizationsPage />} />
            <Route path="users" element={<UsersPage />} />
            <Route path="token-usage" element={<TokenUsagePage />} />
            <Route path="connectors" element={<ConnectorsPage />} />
            <Route path="tools" element={<ToolsPage />} />
            <Route path="prompts/editor/:identifier" element={<PromptEditor />} />
            <Route path="prompts" element={<PromptsPage />} />
            <Route path="logs" element={<LogsPage />} />
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
          <Route path="*" element={<Navigate to={ROUTES.HOME} replace />} />

        </Routes>
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
