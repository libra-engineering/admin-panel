import  { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { Badge } from '../components/ui/badge'
import { adminApi } from '../services/adminApi'
import { getToolIcon } from '../lib/icons'
import type {  OrganizationToolPrompts } from '../types/admin'
import { useRef } from 'react'
import { toast } from 'sonner'

export default function ToolsPage() {
  const navigate = useNavigate()
  const [toolPrompts, setToolPrompts] = useState<OrganizationToolPrompts>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedConnector, setSelectedConnector] = useState<string>('all')
  const [selectedToolType, setSelectedToolType] = useState<string>('all')

  useEffect(() => {
    fetchToolPrompts()
  }, [])

  const fetchToolPrompts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await adminApi.getToolPrompts()
      setToolPrompts(response.toolPrompts)
    } catch (error) {
      console.error('Failed to fetch tool prompts:', error)
      setError('Failed to load tool prompts')
    } finally {
      setLoading(false)
    }
  }

  // Parse tool connector keys and create structured data
  const parsedToolPrompts = useMemo(() => {
    return Object.entries(toolPrompts).map(([key, toolPrompt]) => {
      const [toolName, connectorType] = key.split(':')
      return {
        toolName,
        connectorType,
        toolPrompt,
        key
      }
    })
  }, [toolPrompts])

  // Get unique connectors and tool types for filters
  const availableConnectors = useMemo(() => {
    const connectors = [...new Set(parsedToolPrompts.map(item => item.connectorType))]
    return connectors.sort()
  }, [parsedToolPrompts])

  const availableToolTypes = useMemo(() => {
    const toolTypes = [...new Set(parsedToolPrompts.map(item => item.toolName))]
    return toolTypes.sort()
  }, [parsedToolPrompts])

  // Filter and search logic
  const filteredToolPrompts = useMemo(() => {
    return parsedToolPrompts.filter(item => {
      const matchesSearch = searchQuery === '' || 
        item.toolName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.connectorType.toLowerCase().includes(searchQuery.toLowerCase()) 
      
      const matchesConnector = selectedConnector === 'all' || item.connectorType === selectedConnector
      const matchesToolType = selectedToolType === 'all' || item.toolName === selectedToolType
      
      return matchesSearch && matchesConnector && matchesToolType
    })
  }, [parsedToolPrompts, searchQuery, selectedConnector, selectedToolType])

  const getToolDisplayName = (toolName: string): string => {
    return toolName.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getConnectorDisplayName = (connectorType: string): string => {
    const displayNames: { [key: string]: string } = {
      slack: 'Slack',
      googleGmail: 'Gmail',
      outlook: 'Outlook',
      discord: 'Discord',
      teams: 'Microsoft Teams',
      telegram: 'Telegram',
      whatsapp: 'WhatsApp',
      email: 'Email',
    }
    const formattedName = connectorType.charAt(0).toUpperCase() + connectorType.slice(1)
    return displayNames[connectorType] || formattedName
  }

  const handleCreate = () => {
    navigate('/admin/tools/editor/new')
  }

  const handleEdit = (toolName: string, connectorType: string) => {
    navigate(`/admin/tools/editor/${toolName}:${connectorType}`)
  }

  const handleBulkCreateClick = () => {
    fileInputRef.current?.click()
  }

  const handleCsvSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const res = await adminApi.bulkCreateToolPromptsFromCsv(file)
      const totals = res?.totals
      const created = totals?.created ?? 0
      const skipped = totals?.skipped ?? 0
      const invalid = totals?.invalid ?? 0
      toast.success(`Tool prompts added: ${created} created, ${skipped} skipped, ${invalid} invalid`)
      await fetchToolPrompts()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Bulk create tools failed'
      toast.error(msg)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading tool prompts...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Tool Prompts Management</h1>
        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvSelected}
          />
          <Button
            onClick={handleBulkCreateClick}
            variant="outline"
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Bulk Create (CSV)'}
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Tool Prompt
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Controls */}
      <div className="">
        <div className="">
          

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="block text-start text-sm font-medium text-gray-700 mb-2">
              Search Tools
            </label>
            <Input
              type="text"
              placeholder="Search by tool or connector..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
            </div>
            <div>
              <label className="block text-sm text-start font-medium text-gray-700 mb-2">
                Filter by Connector
              </label>
              <Select
                value={selectedConnector}
                onChange={(e) => setSelectedConnector(e.target.value)}
                className="w-full"
                options={[
                  { value: 'all', label: 'All Connectors' },
                  ...availableConnectors.map(connector => ({
                    value: connector,
                    label: getConnectorDisplayName(connector)
                  }))
                ]}
              />
            </div>
           
          </div>

          {/* Results Summary */}
          <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
            <span>
              Showing {filteredToolPrompts.length} of {parsedToolPrompts.length} tool prompts
            </span>
            {(searchQuery || selectedConnector !== 'all' || selectedToolType !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedConnector('all')
                  setSelectedToolType('all')
                }}
                className="text-blue-600 hover:text-blue-700"
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Tools Table */}
      <Card className="shadow-sm border-0 ring-1 ring-gray-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tool
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Connector
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Version
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {filteredToolPrompts.map(({ toolName, connectorType, toolPrompt, key }, index) => (
                  <tr 
                    key={key}
                    className={`transition-colors duration-150 hover:bg-gray-50 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center">
                          {getToolIcon(connectorType)}
                        </div>
                        <div className="text-sm text-start font-medium text-gray-900">
                          {getToolDisplayName(toolName)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-start text-sm text-gray-700">
                      {getConnectorDisplayName(connectorType)}
                    </td>
                    <td className="px-6 py-4 text-start">
                      <Badge
                        variant={toolPrompt.isCustom ? 'success' : 'warning'}
                        className="text-xs"
                      >
                        {toolPrompt.isCustom ? 'Custom' : 'Default'}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center space-x-1">
                        <span>{toolPrompt.promptTemplate.length.toLocaleString()}</span>
                        <span className="text-gray-400">chars</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-start text-sm text-gray-700">
                      v{toolPrompt.version}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleEdit(toolName, connectorType)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs"
                        >
                          Edit
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredToolPrompts.length === 0 && (
        <Card className="border-2 border-dashed border-gray-300">
          <CardContent className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tool prompts found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedConnector !== 'all' || selectedToolType !== 'all'
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Get started by creating your first tool prompt."}
            </p>
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Tool Prompt
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 