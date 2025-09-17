import React from 'react'
import { Button } from '../ui/button'
import type { AgentLibraryItem } from '../../services/libraryApi'

interface AgentListProps {
  agents: AgentLibraryItem[]
  isLoading: boolean
  onCreateAgent: () => void
  onEditAgent: (agent: AgentLibraryItem) => void
  onDeleteAgent: (agent: AgentLibraryItem) => void
}

const AgentList: React.FC<AgentListProps> = ({ agents, isLoading, onCreateAgent, onEditAgent, onDeleteAgent }) => {

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

  if (isLoading) {
    return (
      <div className="p-6">Loading…</div>
    )
  }

  if (!agents || agents.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-foreground mb-2">No agents yet</h3>
        <p className="text-muted-foreground mb-6">Create your first agent template to get started.</p>
        <Button onClick={onCreateAgent}>Create Agent</Button>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Tools</th>
            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated</th>
            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {agents.map((agent) => (
            <tr key={agent.id} className="hover:bg-gray-50">
              <td className="px-6 py-3">
                <div className="text-sm font-medium text-left text-gray-900">{agent.name}</div>
                {agent.description && (
                  <div className="text-xs text-gray-500 text-left line-clamp-2">{agent.description}</div>
                )}
              </td>
              <td className="px-6 py-3 text-sm text-left text-gray-700">{
                agent.tools && agent.tools?.length > 3 ? formatToolName(agent.tools.slice(0,3).join(', ')) + '...' : '—'
                }</td>
              <td className="px-6 py-3 text-sm text-left text-gray-700">{new Date(agent.updatedAt).toLocaleString()}</td>
              <td className="px-6 py-3">
                <div className="flex items-center justify-end gap-2">
                  <Button size="sm" variant="outline" onClick={() => onEditAgent(agent)}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => onDeleteAgent(agent)}>Delete</Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AgentList 