import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Select } from '../components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table'
import { adminApi } from '../services/adminApi'
import type { 
  Organization,
  TokenUsageOverview,
  TokenUsageOrganization,
  TokenUsageOrganizationDetail,
  TokenUsageUser,
  TokenUsageUserDetail,
  TokenUsagePurpose,
  TokenUsageModel,
  TokenUsageDailyBreakdown,
  OrganizationUser
} from '../types/admin'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'

type TabType = 'overview' | 'organizations' | 'users' | 'purposes' | 'models'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export default function TokenUsagePage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [loading, setLoading] = useState(true)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  
  const [period, setPeriod] = useState(30)
  const [selectedOrganization, setSelectedOrganization] = useState<string>('all')
  const [selectedUser, setSelectedUser] = useState<string>('all')
  const [selectedPurpose, setSelectedPurpose] = useState<string>('all')
  
  const [overview, setOverview] = useState<TokenUsageOverview | null>(null)
  
  const [orgsData, setOrgsData] = useState<TokenUsageOrganization[]>([])
  const [orgsSortBy, setOrgsSortBy] = useState('totalCost')
  const [orgsSortOrder, setOrgsSortOrder] = useState<'asc' | 'desc'>('desc')
  const [orgsLimit, setOrgsLimit] = useState(20)
  const [orgsOffset, setOrgsOffset] = useState(0)
  const [orgsPagination, setOrgsPagination] = useState({ total: 0, limit: 20, offset: 0 })
  const [selectedOrgDetail, setSelectedOrgDetail] = useState<string | null>(null)
  const [orgDetail, setOrgDetail] = useState<TokenUsageOrganizationDetail | null>(null)
  
  const [usersData, setUsersData] = useState<TokenUsageUser[]>([])
  const [usersSortBy, setUsersSortBy] = useState('totalCost')
  const [usersSortOrder, setUsersSortOrder] = useState<'asc' | 'desc'>('desc')
  const [usersLimit, setUsersLimit] = useState(50)
  const [usersOffset, setUsersOffset] = useState(0)
  const [usersPagination, setUsersPagination] = useState({ total: 0, limit: 50, offset: 0 })
  const [selectedUserDetail, setSelectedUserDetail] = useState<string | null>(null)
  const [userDetail, setUserDetail] = useState<TokenUsageUserDetail | null>(null)
  
  const [purposesData, setPurposesData] = useState<TokenUsagePurpose[]>([])
  const [purposesSortBy, setPurposesSortBy] = useState('totalCost')
  const [purposesSortOrder, setPurposesSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const [modelsData, setModelsData] = useState<TokenUsageModel[]>([])
  const [modelsSortBy, setModelsSortBy] = useState('totalCost')
  const [modelsSortOrder, setModelsSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const [dailyData, setDailyData] = useState<TokenUsageDailyBreakdown | null>(null)
  
  const [availablePurposes, setAvailablePurposes] = useState<string[]>([])
  
  const [organizationUsers, setOrganizationUsers] = useState<OrganizationUser[]>([])

  useEffect(() => {
    fetchOrganizations()
    fetchAvailablePurposes()
  }, [])
  
  useEffect(() => {
    if (selectedOrganization !== 'all') {
      fetchOrganizationUsers(selectedOrganization)
    } else {
      setOrganizationUsers([])
      if (selectedUser !== 'all') {
        setSelectedUser('all')
      }
    }
  }, [selectedOrganization])

  useEffect(() => {
    fetchDataForTab()
  }, [activeTab, period, selectedOrganization, selectedUser, selectedPurpose, orgsSortBy, orgsSortOrder, orgsOffset, usersSortBy, usersSortOrder, usersOffset, purposesSortBy, purposesSortOrder, modelsSortBy, modelsSortOrder])

  useEffect(() => {
    if (selectedOrgDetail) {
      fetchOrgDetail()
    }
  }, [selectedOrgDetail, period, selectedPurpose])

  useEffect(() => {
    if (selectedUserDetail) {
      fetchUserDetail()
    }
  }, [selectedUserDetail, period])

  const fetchOrganizations = async () => {
    try {
      const data = await adminApi.getOrganizations()
      setOrganizations(data)
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    }
  }

  const fetchAvailablePurposes = async () => {
    try {
      const data = await adminApi.getAvailablePurposes()
      setAvailablePurposes(data.purposes)
    } catch (error) {
      console.error('Failed to fetch available purposes:', error)
    }
  }

  const fetchOrganizationUsers = async (organizationId: string) => {
    try {
      const data = await adminApi.getOrganizationUsers(organizationId, {
        includeStats: false,
        sortBy: 'name',
        sortOrder: 'asc'
      })
      setOrganizationUsers(data.users)
    } catch (error) {
      console.error('Failed to fetch organization users:', error)
      setOrganizationUsers([])
    }
  }

  const fetchDataForTab = async () => {
    setLoading(true)
    try {
      switch (activeTab) {
        case 'overview':
          await fetchOverview()
          await fetchDailyBreakdown()
          break
        case 'organizations':
          await fetchOrganizationsData()
          break
        case 'users':
          await fetchUsersData()
          break
        case 'purposes':
          await fetchPurposesData()
          break
        case 'models':
          await fetchModelsData()
          break
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchOverview = async () => {
    const params: any = { period }
    if (selectedOrganization !== 'all') params.organizationId = selectedOrganization
    if (selectedUser !== 'all') params.userId = selectedUser
    if (selectedPurpose !== 'all') params.purpose = selectedPurpose
    
    const data = await adminApi.getTokenUsageOverview(params)
    setOverview(data)
  }

  const fetchDailyBreakdown = async () => {
    const params: any = { period }
    if (selectedOrganization !== 'all') params.organizationId = selectedOrganization
    if (selectedUser !== 'all') params.userId = selectedUser
    if (selectedPurpose !== 'all') params.purpose = selectedPurpose
    
    const data = await adminApi.getTokenUsageDaily(params)
    setDailyData(data)
  }

  const fetchOrganizationsData = async () => {
    const params: any = {
      period,
      sortBy: orgsSortBy,
      sortOrder: orgsSortOrder,
      limit: orgsLimit,
      offset: orgsOffset
    }
    if (selectedPurpose !== 'all') params.purpose = selectedPurpose
    
    const data = await adminApi.getTokenUsageOrganizations(params)
    setOrgsData(data.organizations)
    setOrgsPagination({
      total: data.pagination.total,
      limit: data.pagination.limit ?? 20,
      offset: data.pagination.offset
    })
  }

  const fetchUsersData = async () => {
    const params: any = {
      period,
      sortBy: usersSortBy,
      sortOrder: usersSortOrder,
      limit: usersLimit,
      offset: usersOffset
    }
    if (selectedOrganization !== 'all') params.organizationId = selectedOrganization
    if (selectedPurpose !== 'all') params.purpose = selectedPurpose
    
    const data = await adminApi.getTokenUsageUsers(params)
    setUsersData(data.users)
    setUsersPagination({
      total: data.pagination.total,
      limit: data.pagination.limit ?? 50,
      offset: data.pagination.offset
    })
  }

  const fetchPurposesData = async () => {
    const params: any = {
      period,
      sortBy: purposesSortBy,
      sortOrder: purposesSortOrder
    }
    if (selectedOrganization !== 'all') params.organizationId = selectedOrganization
    if (selectedUser !== 'all') params.userId = selectedUser
    
    const data = await adminApi.getTokenUsagePurposes(params)
    setPurposesData(data.purposes)
  }

  const fetchModelsData = async () => {
    const params: any = {
      period,
      sortBy: modelsSortBy,
      sortOrder: modelsSortOrder
    }
    if (selectedOrganization !== 'all') params.organizationId = selectedOrganization
    if (selectedUser !== 'all') params.userId = selectedUser
    if (selectedPurpose !== 'all') params.purpose = selectedPurpose
    
    const data = await adminApi.getTokenUsageModels(params)
    setModelsData(data.models)
  }

  const fetchOrgDetail = async () => {
    if (!selectedOrgDetail) return
    try {
      const params: any = { period, includeUsers: true, includeDaily: true }
      if (selectedPurpose !== 'all') params.purpose = selectedPurpose
      const data = await adminApi.getTokenUsageOrganizationDetail(selectedOrgDetail, params)
      setOrgDetail(data)
    } catch (error) {
      console.error('Failed to fetch organization detail:', error)
    }
  }

  const fetchUserDetail = async () => {
    if (!selectedUserDetail) return
    try {
      const data = await adminApi.getTokenUsageUserDetail(selectedUserDetail, {
        period,
        includePurposes: true,
        includeDaily: true,
        includeModels: true
      })
      setUserDetail(data)
    } catch (error) {
      console.error('Failed to fetch user detail:', error)
    }
  }

  const chartData = (dailyData?.dailyBreakdown || [])
    .map(day => {
      if (!day || !day.date) return null
      const date = new Date(day.date)
      if (isNaN(date.getTime())) return null
      
      const inputTokens = Number(day.inputTokens)
      const outputTokens = Number(day.outputTokens)
      
      return {
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        inputTokens: isFinite(inputTokens) ? inputTokens : 0,
        outputTokens: isFinite(outputTokens) ? outputTokens : 0,
        totalTokens: isFinite(Number(day.totalTokens)) ? Number(day.totalTokens) : 0,
        inputCost: isFinite(Number(day.inputCost)) ? Number(day.inputCost) : 0,
        outputCost: isFinite(Number(day.outputCost)) ? Number(day.outputCost) : 0,
        totalCost: isFinite(Number(day.totalCost)) ? Number(day.totalCost) : 0,
        requestCount: isFinite(Number(day.requestCount)) ? Number(day.requestCount) : 0,
        timestamp: day.date
      }
    })
    .filter((day): day is NonNullable<typeof day> => {
      if (day === null) return false
      return (
        typeof day.inputTokens === 'number' && isFinite(day.inputTokens) &&
        typeof day.outputTokens === 'number' && isFinite(day.outputTokens) &&
        day.date !== undefined && day.date !== null
      )
    })

  if (loading && !overview && !orgsData.length && !usersData.length && !purposesData.length && !modelsData.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading token usage statistics...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Token Analytics</h1>
        <div className="flex items-center space-x-4">
          <Select
            options={[
              { value: '7', label: 'Last 7 days' },
              { value: '30', label: 'Last 30 days' },
              { value: '90', label: 'Last 90 days' },
              { value: '365', label: 'Last year' }
            ]}
            value={String(period)}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="w-48"
          />
        </div>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {(['overview', 'organizations', 'users', 'purposes', 'models'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab)
                setSelectedOrgDetail(null)
                setSelectedUserDetail(null)
              }}
              className={`
                py-4 px-1 border-b-2 font-medium text-sm capitalize
                ${activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {(activeTab === 'overview' || activeTab === 'organizations' || activeTab === 'users' || activeTab === 'purposes' || activeTab === 'models') && (
        <div className="flex items-center space-x-4">
          {(activeTab === 'overview' || activeTab === 'users' || activeTab === 'models') && (
            <Select
              label="Organization"
              options={[
                { value: 'all', label: 'All Organizations' },
                ...organizations.map(org => ({ value: org.id, label: org.name }))
              ]}
              value={selectedOrganization}
              onChange={(e) => setSelectedOrganization(e.target.value)}
              className="w-64"
            />
          )}
          {(activeTab === 'overview' || activeTab === 'purposes' || activeTab === 'models') && (
            <Select
              label="User"
              options={[
                { value: 'all', label: selectedOrganization === 'all' ? 'All Users' : 'All Users in Organization' },
                ...organizationUsers.map(user => ({
                  value: user.id,
                  label: user.name || user.email
                }))
              ]}
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-64"
              disabled={selectedOrganization === 'all'}
            />
          )}
          {(activeTab === 'overview' || activeTab === 'organizations' || activeTab === 'users' || activeTab === 'models' || activeTab === 'purposes') && (
            <Select
              label="Purpose"
              options={[
                { value: 'all', label: 'All Purposes' },
                ...availablePurposes.map(purpose => ({
                  value: purpose,
                  label: purpose.charAt(0).toUpperCase() + purpose.slice(1)
                }))
              ]}
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
              className="w-48"
            />
          )}
        </div>
      )}

      {activeTab === 'overview' && overview && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Tokens</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {overview.summary.totalTokens.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Cost</p>
                    <p className="text-2xl font-semibold text-green-600">
                      ${overview.summary.totalCost.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Avg Cost/Day</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      ${overview.summary.avgCostPerDay.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total Requests</p>
                    <p className="text-2xl font-semibold text-gray-900">
                      {overview.summary.totalRequests.toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Token Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Input Tokens</span>
                    <span className="text-lg font-semibold">
                      {overview.summary.inputTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Output Tokens</span>
                    <span className="text-lg font-semibold">
                      {overview.summary.outputTokens.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Tokens/Request</span>
                    <span className="text-lg font-semibold">
                      {overview.averages.avgTotalTokens.toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Input Cost</span>
                    <span className="text-lg font-semibold text-blue-600">
                      ${overview.summary.inputCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Output Cost</span>
                    <span className="text-lg font-semibold text-green-600">
                      ${overview.summary.outputCost.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg Cost/Request</span>
                    <span className="text-lg font-semibold">
                      ${overview.averages.avgTotalCost.toFixed(4)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {dailyData && chartData && chartData.length >= 2 && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Daily Token Usage</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 12 }} 
                          interval="preserveStartEnd"
                        />
                        <YAxis 
                          tick={{ fontSize: 12 }} 
                          tickFormatter={(value) => {
                            if (typeof value === 'number' && !isNaN(value)) return value.toLocaleString()
                            return '0'
                          }}
                        />
                        <Tooltip 
                          formatter={(value: any) => {
                            const numValue = typeof value === 'number' && !isNaN(value) ? value : Number(value) || 0
                            return [numValue.toLocaleString(), 'Tokens']
                          }} 
                        />
                        <Line 
                          type="monotone" 
                          dataKey="inputTokens" 
                          stroke="#3b82f6" 
                          strokeWidth={2}
                          name="Input Tokens"
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="outputTokens" 
                          stroke="#10b981" 
                          strokeWidth={2}
                          name="Output Tokens"
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="totalTokens" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          strokeDasharray="5 5"
                          name="Total Tokens"
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Daily Cost</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" tick={{ fontSize: 12 }} interval="preserveStartEnd" />
                        <YAxis tick={{ fontSize: 12 }} tickFormatter={(value) => `$${value.toFixed(2)}`} />
                        <Tooltip formatter={(value: number) => [`$${value.toFixed(2)}`, 'Cost']} />
                        <Line type="monotone" dataKey="totalCost" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} />
                        <Legend />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {activeTab === 'organizations' && (
        <>
          {selectedOrgDetail && orgDetail ? (
            <OrganizationDetailView
              orgDetail={orgDetail}
              onBack={() => setSelectedOrgDetail(null)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Select
                    label="Sort By"
                    options={[
                      { value: 'totalCost', label: 'Total Cost' },
                      { value: 'totalTokens', label: 'Total Tokens' },
                      { value: 'organizationName', label: 'Name' }
                    ]}
                    value={orgsSortBy}
                    onChange={(e) => setOrgsSortBy(e.target.value)}
                    className="w-48"
                  />
                  <Select
                    label="Order"
                    options={[
                      { value: 'desc', label: 'Descending' },
                      { value: 'asc', label: 'Ascending' }
                    ]}
                    value={orgsSortOrder}
                    onChange={(e) => setOrgsSortOrder(e.target.value as 'asc' | 'desc')}
                    className="w-40"
                  />
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Organizations</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Organization</TableHead>
                        <TableHead className="text-right">Input Tokens</TableHead>
                        <TableHead className="text-right">Output Tokens</TableHead>
                        <TableHead className="text-right">Total Tokens</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">Avg Cost/Day</TableHead>
                        <TableHead className="text-right">Requests</TableHead>
                        <TableHead className="text-right">Users</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {orgsData.map((org) => (
                        <TableRow 
                          key={org.organizationId}
                          onClick={() => setSelectedOrgDetail(org.organizationId)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{org.organizationName}</div>
                              <div className="text-sm text-gray-500">{org.organizationDomain}</div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{org.inputTokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{org.outputTokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{org.totalTokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            ${org.totalCost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">${org.avgCostPerDay.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{org.requestCount.toLocaleString()}</TableCell>
                          <TableCell className="text-right">{org.userCount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {orgsPagination.total > (orgsPagination.limit || 20) && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-700">
                        Showing {orgsOffset + 1} to {Math.min(orgsOffset + (orgsPagination.limit || 20), orgsPagination.total)} of {orgsPagination.total}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setOrgsOffset(Math.max(0, orgsOffset - (orgsPagination.limit || 20)))}
                          disabled={orgsOffset === 0}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setOrgsOffset(orgsOffset + (orgsPagination.limit || 20))}
                          disabled={orgsOffset + (orgsPagination.limit || 20) >= orgsPagination.total}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {activeTab === 'users' && (
        <>
          {selectedUserDetail && userDetail ? (
            <UserDetailView
              userDetail={userDetail}
              onBack={() => setSelectedUserDetail(null)}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Select
                    label="Sort By"
                    options={[
                      { value: 'totalCost', label: 'Total Cost' },
                      { value: 'totalTokens', label: 'Total Tokens' },
                      { value: 'userName', label: 'Name' }
                    ]}
                    value={usersSortBy}
                    onChange={(e) => setUsersSortBy(e.target.value)}
                    className="w-48"
                  />
                  <Select
                    label="Order"
                    options={[
                      { value: 'desc', label: 'Descending' },
                      { value: 'asc', label: 'Ascending' }
                    ]}
                    value={usersSortOrder}
                    onChange={(e) => setUsersSortOrder(e.target.value as 'asc' | 'desc')}
                    className="w-40"
                  />
                </div>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Organization</TableHead>
                        <TableHead className="text-right">Total Tokens</TableHead>
                        <TableHead className="text-right">Total Cost</TableHead>
                        <TableHead className="text-right">Avg Cost/Day</TableHead>
                        <TableHead className="text-right">Requests</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {usersData.map((user) => (
                        <TableRow
                          key={user.userId}
                          onClick={() => setSelectedUserDetail(user.userId)}
                        >
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900">{user.userName || user.userEmail}</div>
                              <div className="text-sm text-gray-500">{user.userEmail}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{user.organizationName}</div>
                          </TableCell>
                          <TableCell className="text-right">{user.totalTokens.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-green-600 font-medium">
                            ${user.totalCost.toFixed(2)}
                          </TableCell>
                          <TableCell className="text-right">${user.avgCostPerDay.toFixed(2)}</TableCell>
                          <TableCell className="text-right">{user.requestCount.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {usersPagination.total > (usersPagination.limit || 50) && (
                    <div className="flex items-center justify-between mt-4">
                      <div className="text-sm text-gray-700">
                        Showing {usersOffset + 1} to {Math.min(usersOffset + (usersPagination.limit || 50), usersPagination.total)} of {usersPagination.total}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setUsersOffset(Math.max(0, usersOffset - (usersPagination.limit || 50)))}
                          disabled={usersOffset === 0}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setUsersOffset(usersOffset + (usersPagination.limit || 50))}
                          disabled={usersOffset + (usersPagination.limit || 50) >= usersPagination.total}
                          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {activeTab === 'purposes' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select
                label="Sort By"
                options={[
                  { value: 'totalCost', label: 'Total Cost' },
                  { value: 'totalTokens', label: 'Total Tokens' },
                  { value: 'purpose', label: 'Purpose' }
                ]}
                value={purposesSortBy}
                onChange={(e) => setPurposesSortBy(e.target.value)}
                className="w-48"
              />
              <Select
                label="Order"
                options={[
                  { value: 'desc', label: 'Descending' },
                  { value: 'asc', label: 'Ascending' }
                ]}
                value={purposesSortOrder}
                onChange={(e) => setPurposesSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-40"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Purpose Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Purpose</TableHead>
                      <TableHead className="text-right">Total Tokens</TableHead>
                      <TableHead className="text-right">Total Cost</TableHead>
                      <TableHead className="text-right">Requests</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {purposesData.map((purpose) => (
                      <TableRow key={purpose.purpose}>
                        <TableCell className="font-medium">{purpose.purpose || 'Unspecified'}</TableCell>
                        <TableCell className="text-right">{purpose.totalTokens.toLocaleString()}</TableCell>
                        <TableCell className="text-right text-green-600 font-medium">
                          ${purpose.totalCost.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right">{purpose.requestCount.toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={purposesData.map(p => ({ name: p.purpose || 'Unspecified', value: p.totalCost }))}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${((percent ?? 0) * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {purposesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {activeTab === 'models' && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select
                label="Sort By"
                options={[
                  { value: 'totalCost', label: 'Total Cost' },
                  { value: 'totalTokens', label: 'Total Tokens' },
                  { value: 'model', label: 'Model' }
                ]}
                value={modelsSortBy}
                onChange={(e) => setModelsSortBy(e.target.value)}
                className="w-48"
              />
              <Select
                label="Order"
                options={[
                  { value: 'desc', label: 'Descending' },
                  { value: 'asc', label: 'Ascending' }
                ]}
                value={modelsSortOrder}
                onChange={(e) => setModelsSortOrder(e.target.value as 'asc' | 'desc')}
                className="w-40"
              />
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Model Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Model</TableHead>
                    <TableHead>Provider</TableHead>
                    <TableHead className="text-right">Total Tokens</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Avg Cost/Day</TableHead>
                    <TableHead className="text-right">Requests</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {modelsData.map((model) => (
                    <TableRow key={`${model.provider}-${model.model}`}>
                      <TableCell className="font-medium">{model.model}</TableCell>
                      <TableCell>{model.provider}</TableCell>
                      <TableCell className="text-right">{model.totalTokens.toLocaleString()}</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        ${model.totalCost.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">${model.avgCostPerDay.toFixed(2)}</TableCell>
                      <TableCell className="text-right">{model.requestCount.toLocaleString()}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}

function OrganizationDetailView({ 
  orgDetail, 
  onBack 
}: { 
  orgDetail: TokenUsageOrganizationDetail
  onBack: () => void 
}) {
  const chartData = orgDetail.dailyBreakdown
    ?.map(day => ({
      date: new Date(day.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalTokens: day._sum?.totalTokens ?? 0,
      totalCost: day._sum?.totalCost ?? 0,
      requestCount: day._count?.id ?? 0
    }))
    ?.filter(day => day.date && !isNaN(new Date(day.date).getTime())) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-blue-600 hover:text-blue-800 mb-2">
            ← Back to Organizations
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{orgDetail.organization.name}</h2>
          <p className="text-gray-500">{orgDetail.organization.emailDomain}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Total Tokens</p>
            <p className="text-2xl font-semibold text-gray-900">
              {orgDetail.summary.totalTokens.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Total Cost</p>
            <p className="text-2xl font-semibold text-green-600">
              ${orgDetail.summary.totalCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Avg Cost/Day</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${orgDetail.summary.avgCostPerDay.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Requests</p>
            <p className="text-2xl font-semibold text-gray-900">
              {orgDetail.summary.requestCount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="totalTokens" stroke="#3b82f6" strokeWidth={2} name="Tokens" />
                  <Line yAxisId="right" type="monotone" dataKey="totalCost" stroke="#10b981" strokeWidth={2} name="Cost ($)" />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {orgDetail.users && orgDetail.users.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Total Tokens</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orgDetail.users.map((user) => (
                  <TableRow key={user.userId}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.userName || user.userEmail}</div>
                        <div className="text-sm text-gray-500">{user.userEmail}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{user.totalTokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      ${user.totalCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{user.requestCount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function UserDetailView({ 
  userDetail, 
  onBack 
}: { 
  userDetail: TokenUsageUserDetail
  onBack: () => void 
}) {
  const chartData = userDetail.dailyBreakdown
    ?.map(day => ({
      date: new Date(day.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      totalTokens: day.totalTokens ?? 0,
      totalCost: day.totalCost ?? 0,
      requestCount: day.requestCount ?? 0,
      timestamp: day.timestamp
    }))
    ?.filter(day => day.date && day.timestamp && !isNaN(new Date(day.timestamp).getTime())) || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={onBack} className="text-blue-600 hover:text-blue-800 mb-2">
            ← Back to Users
          </button>
          <h2 className="text-2xl font-bold text-gray-900">{userDetail.user.userName || userDetail.user.userEmail}</h2>
          <p className="text-gray-500">{userDetail.user.userEmail} • {userDetail.user.organization.name}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Total Tokens</p>
            <p className="text-2xl font-semibold text-gray-900">
              {userDetail.summary.totalTokens.toLocaleString()}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Total Cost</p>
            <p className="text-2xl font-semibold text-green-600">
              ${userDetail.summary.totalCost.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Avg Cost/Day</p>
            <p className="text-2xl font-semibold text-gray-900">
              ${userDetail.summary.avgCostPerDay.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-gray-500">Requests</p>
            <p className="text-2xl font-semibold text-gray-900">
              {userDetail.summary.requestCount.toLocaleString()}
            </p>
          </CardContent>
        </Card>
      </div>

      {chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Daily Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v.toFixed(0)}`} />
                  <Tooltip />
                  <Line yAxisId="left" type="monotone" dataKey="totalTokens" stroke="#3b82f6" strokeWidth={2} name="Tokens" />
                  <Line yAxisId="right" type="monotone" dataKey="totalCost" stroke="#10b981" strokeWidth={2} name="Cost ($)" />
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {userDetail.purposes && userDetail.purposes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage by Purpose</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Purpose</TableHead>
                  <TableHead className="text-right">Total Tokens</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDetail.purposes.map((purpose) => (
                  <TableRow key={purpose.purpose}>
                    <TableCell className="font-medium">{purpose.purpose || 'Unspecified'}</TableCell>
                    <TableCell className="text-right">{purpose.totalTokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      ${purpose.totalCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{purpose.requestCount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {userDetail.models && userDetail.models.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Usage by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Total Tokens</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userDetail.models.map((model) => (
                  <TableRow key={`${model.provider}-${model.model}`}>
                    <TableCell className="font-medium">{model.model}</TableCell>
                    <TableCell>{model.provider}</TableCell>
                    <TableCell className="text-right">{model.totalTokens.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-green-600 font-medium">
                      ${model.totalCost.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">{model.requestCount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
