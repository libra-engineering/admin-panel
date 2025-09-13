import React, { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card"
import { Button } from "../components/ui/button"
import { Input } from "../components/ui/input"
import { Select } from "../components/ui/select"
import type {
    AgentLibraryItem,
    CreateAgentLibraryRequest,
    UpdateAgentLibraryRequest,
    WorkflowLibraryItem,
    CreateWorkflowLibraryRequest,
    UpdateWorkflowLibraryRequest,
} from "../services/libraryApi"
import { libraryApi } from "../services/libraryApi"
import AgentList from "../components/agents/AgentList"
import AgentModalManager, { type AgentModalType } from "../components/agents/AgentModalManager"
import { useNavigate } from "react-router-dom"


type TabId = "agents" | "workflows"

export default function AgentsPage() {
    const [activeTab, setActiveTab] = useState<TabId>("agents")
    const [pageModal, setPageModal] = useState<AgentModalType>(null)

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-gray-900">Agents & Workflows

                </h1>
                <Button onClick={() => setPageModal('bulkImport')}>Bulk CSV Import</Button>
            </div>

            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                    <button
                        onClick={() => setActiveTab("agents")}
                        className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                            activeTab === "agents"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Agents
                    </button>
                    <button
                        onClick={() => setActiveTab("workflows")}
                        className={`whitespace-nowrap border-b-2 px-1 py-2 text-sm font-medium ${
                            activeTab === "workflows"
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                        }`}
                    >
                        Workflows
                    </button>
                </nav>
            </div>

            {activeTab === "agents" ? <AgentsTab /> : <WorkflowsTab />}

            <AgentModalManager
                activeModal={pageModal}
                selectedAgent={null}
                onClose={() => setPageModal(null)}
                onAgentCreated={() => setPageModal(null)}
                onAgentUpdated={() => setPageModal(null)}
                onAgentDeleted={() => setPageModal(null)}
            />
        </div>
    )
}

function AgentsTab() {
    const [items, setItems] = useState<AgentLibraryItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const [activeModal, setActiveModal] = useState<AgentModalType>(null)
    const [selectedAgent, setSelectedAgent] = useState<AgentLibraryItem | null>(null)

    useEffect(() => {
        void fetchItems()
    }, [])

    const fetchItems = async () => {
        try {
            setLoading(true)
            setError(null)
            const list = await libraryApi.listAgentTemplates()
            setItems(list)
        } catch (e: any) {
            console.error(e)
            setError(e?.response?.data?.error || "Failed to load agents")
        } finally {
            setLoading(false)
        }
    }

    const openCreate = () => {
        setSelectedAgent(null)
        setActiveModal('create')
    }
    const openEdit = (agent: AgentLibraryItem) => {
        setSelectedAgent(agent)
        setActiveModal('edit')
    }
    const openDelete = (agent: AgentLibraryItem) => {
        setSelectedAgent(agent)
        setActiveModal('delete')
    }
    const closeModal = () => {
        setActiveModal(null)
        setSelectedAgent(null)
    }

    const handleCreated = (created: AgentLibraryItem) => {
        setItems(prev => [created, ...prev])
        closeModal()
    }
    const handleUpdated = (updated: AgentLibraryItem) => {
        setItems(prev => prev.map(x => (x.id === updated.id ? updated : x)))
        closeModal()
    }
    const handleDeleted = (id: string) => {
        setItems(prev => prev.filter(x => x.id !== id))
        closeModal()
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Agent Templates</h2>
                <Button onClick={openCreate}>Create Agent</Button>
            </div>

            {error && <div className="text-sm text-red-600">{error}</div>}

            <Card className="shadow-sm border-0 ring-1 ring-gray-200">
                <CardContent className="p-0">
                    <AgentList
                        agents={items}
                        isLoading={loading}
                        onCreateAgent={openCreate}
                        onEditAgent={openEdit}
                        onDeleteAgent={openDelete}
                    />
                </CardContent>
            </Card>

            <AgentModalManager
                activeModal={activeModal}
                selectedAgent={selectedAgent}
                onClose={closeModal}
                onAgentCreated={handleCreated}
                onAgentUpdated={handleUpdated}
                onAgentDeleted={handleDeleted}
            />
        </div>
    )
}

function WorkflowsTab() {
    const [items, setItems] = useState<WorkflowLibraryItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const navigate = useNavigate()

    useEffect(() => {
        void fetchItems()
    }, [])

    const fetchItems = async () => {
        try {
            setLoading(true)
            setError(null)
            const list = await libraryApi.listWorkflowTemplates()
            setItems(list)
        } catch (e: any) {
            console.error(e)
            setError(e?.response?.data?.error || "Failed to load workflows")
        } finally {
            setLoading(false)
        }
    }

    const onDelete = async (item: WorkflowLibraryItem) => {
        if (!confirm(`Delete workflow template "${item.name}"?`)) return
        try {
            await libraryApi.deleteWorkflowTemplate(item.id)
            setItems((prev) => prev.filter((x) => x.id !== item.id))
        } catch (e: any) {
            console.error(e)
            setError(e?.response?.data?.error || "Failed to delete workflow")
        }
    }

    const toggleEnabled = async (item: WorkflowLibraryItem) => {
        try {
            const updated = await libraryApi.updateWorkflowTemplate(item.id, { enabled: !item.enabled })
            setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
        } catch (e: any) {
            console.error(e)
            setError(e?.response?.data?.error || "Failed to update workflow")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Workflow Templates</h2>
                <Button onClick={() => navigate('/admin/workflows/new')}>Create Workflow</Button>
            </div>

            {error && (
                <div className="text-sm text-red-600">{error}</div>
            )}

            <Card className="shadow-sm border-0 ring-1 ring-gray-200">
                <CardContent className="p-0">
                    {loading ? (
                        <div className="p-6">Loading…</div>
                    ) : items.length === 0 ? (
                        <div className="p-6 text-gray-600">No workflows found.</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                                        {/* <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Enabled</th> */}
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated</th>
                                        <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {items.map((item: WorkflowLibraryItem) => (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-3">
                                                <div className="text-sm text-left font-medium text-gray-900">{item.name}</div>
                                            </td>
                                            <td className="px-6 py-3 text-left text-sm text-gray-700 capitalize">{item.workflowType}</td>
                                            {/* <td className="px-6 py-3 text-sm text-gray-700">
                                                <label className="inline-flex items-center gap-2">
                                                    <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                        checked={!!item.enabled}
                                                        onChange={() => void toggleEnabled(item)}
                                                    />
                                                    <span className="text-sm">{item.enabled ? "On" : "Off"}</span>
                                                </label>
                                            </td> */}
                                            <td className="px-6 py-3 text-sm text-gray-700">
                                                {new Date(item.updatedAt).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-3">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button size="sm" variant="outline" onClick={() => navigate(`/admin/workflows/${item.id}`)}>
                                                        Edit
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => onDelete(item)}>
                                                        Delete
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
