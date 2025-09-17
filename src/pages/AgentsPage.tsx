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
import { X } from "lucide-react"


type TabId = "agents" | "workflows"

export default function AgentsPage() {
    const [activeTab, setActiveTab] = useState<TabId>("agents")
    const [pageModal, setPageModal] = useState<AgentModalType>(null)

    // Shared search query for both tabs
    const [query, setQuery] = useState<string>("")
    const [isAgentSearching, setIsAgentSearching] = useState<boolean>(false)
    const [isWfSearching, setIsWfSearching] = useState<boolean>(false)

    const [agentSelectedCategory, setAgentSelectedCategory] = useState<string>('All')
    const [wfSelectedCategory, setWfSelectedCategory] = useState<string>('All')

    const activeSelectedCategory = activeTab === 'agents' ? agentSelectedCategory : wfSelectedCategory

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

            {/* Shared Search Bar */}
            <div className="mb-2 flex justify-center">
                <div className="w-full max-w-xl">
                    <div className="flex items-center gap-2 border border-gray-300 rounded-md px-3 py-2 bg-background/50 hover:border-main/50 ">
                        {activeSelectedCategory !== 'All' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border-2 border-[#ff6839]/50 text-xs text-foreground/80 bg-foreground/5">
                                <span className="truncate max-w-[140px]" title={activeSelectedCategory}>
                                    <span className="text-main text-gray-700">
                                    {activeSelectedCategory}
                                    </span>
                                </span>
                                <button
                                    onClick={() => (activeTab === 'agents' ? setAgentSelectedCategory('All') : setWfSelectedCategory('All'))}
                                    aria-label="Clear category filter"
                                    className="hover:text-foreground transition-colors cursor-pointer"
                                >
                                    <X size={12} />
                                </button>
                            </span>
                        )}
                        <input
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder={activeTab === 'agents' ? "Search agent templates..." : "Search workflow templates..."}
                            className="w-full bg-transparent outline-none text-sm font-semibold"
                        />
                        {(activeTab === 'agents' ? isAgentSearching : isWfSearching) && (
                            <div className="w-4 h-4 border-2 border-t-main border-border rounded-full animate-spin" />
                        )}
                    </div>
                </div>
            </div>

            {activeTab === "agents" ? (
                <AgentsTab
                    query={query}
                    onSearchingChange={setIsAgentSearching}
                    selectedCategory={agentSelectedCategory}
                    onSelectedCategoryChange={setAgentSelectedCategory}
                />
            ) : (
                <WorkflowsTab
                    query={query}
                    onSearchingChange={setIsWfSearching}
                    selectedCategory={wfSelectedCategory}
                    onSelectedCategoryChange={setWfSelectedCategory}
                />
            )}

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

function AgentsTab({ query, onSearchingChange, selectedCategory, onSelectedCategoryChange }: { query: string; onSearchingChange: (v: boolean) => void; selectedCategory: string; onSelectedCategoryChange: (v: string) => void }) {
    const [items, setItems] = useState<AgentLibraryItem[]>([])
    const [baseItems, setBaseItems] = useState<AgentLibraryItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const [activeModal, setActiveModal] = useState<AgentModalType>(null)
    const [selectedAgent, setSelectedAgent] = useState<AgentLibraryItem | null>(null)

    useEffect(() => {
        void fetchItems()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const q = (query || '').trim()
        if (!q) {
            // No query: show base list, optionally filtered by category
            setItems(() => {
                const src = baseItems
                if (selectedCategory === 'All') return src
                if (selectedCategory === 'Other') {
                    return src.filter(t => {
                        const cat = (t.category || 'Uncategorized') as string
                        return !topCategories.includes(cat)
                    })
                }
                return src.filter(t => (t.category || 'Uncategorized') === selectedCategory)
            })
            return
        }
        let cancelled = false
        const timer = setTimeout(async () => {
            try {
                onSearchingChange(true)
                const results = await libraryApi.searchAgentTemplates(q, {
                    category: selectedCategory === 'All' || selectedCategory === 'Other' ? undefined : selectedCategory,
                })
                if (cancelled) return
                let next = results
                if (selectedCategory === 'Other') {
                    next = results.filter(t => {
                        const cat = (t.category || 'Uncategorized') as string
                        return !topCategories.includes(cat)
                    })
                } else if (selectedCategory !== 'All') {
                    next = results.filter(t => (t.category || 'Uncategorized') === selectedCategory)
                }
                setItems(next)
            } catch (e: any) {
                console.error(e)
                if (!cancelled) setError(e?.response?.data?.error || 'Failed to search agents')
            } finally {
                if (!cancelled) onSearchingChange(false)
            }
        }, 300)
        return () => {
            cancelled = true
            clearTimeout(timer)
            onSearchingChange(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, selectedCategory, baseItems])

    const fetchItems = async () => {
        try {
            setLoading(true)
            setError(null)
            const list = await libraryApi.listAgentTemplates()
            setBaseItems(list)
            setItems(list)
        } catch (e: any) {
            console.error(e)
            setError(e?.response?.data?.error || "Failed to load agents")
        } finally {
            setLoading(false)
        }
    }

    const allCategories = useMemo(() => {
        const cats = new Set<string>()
        baseItems.forEach(x => cats.add(x.category || 'Uncategorized'))
        return ['All', ...Array.from(cats).sort()]
    }, [baseItems])
    const baseCategories = useMemo(() => allCategories.filter(c => c !== 'All'), [allCategories])
    const topCategories = useMemo(() => baseCategories.slice(0, 4), [baseCategories])
    const hasOtherCategory = useMemo(() => baseCategories.length > 4, [baseCategories])
    const uiCategories = useMemo(() => ['All', ...topCategories, ...(hasOtherCategory ? ['Other'] : [])], [topCategories, hasOtherCategory])

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
        setBaseItems(prev => [created, ...prev])
        setItems(prev => [created, ...prev])
        closeModal()
    }
    const handleUpdated = (updated: AgentLibraryItem) => {
        setBaseItems(prev => prev.map(x => (x.id === updated.id ? updated : x)))
        setItems(prev => prev.map(x => (x.id === updated.id ? updated : x)))
        closeModal()
    }
    const handleDeleted = (id: string) => {
        setBaseItems(prev => prev.filter(x => x.id !== id))
        setItems(prev => prev.filter(x => x.id !== id))
        closeModal()
    }

    return (
        <div className="space-y-6">
            <div className="mb-2 flex justify-center">
                <div className="flex items-center gap-2 flex-wrap justify-center max-w-3xl">
                    {uiCategories.map((cat: string) => (
                        <button
                            key={cat}
                            onClick={() => onSelectedCategoryChange(cat)}
                            className={`${
                                selectedCategory === cat
                                ? 'bg-foreground/10 text-foreground border-[#ff6839] border-2'
                                : 'bg-transparent  border-border text-gray-600 border-gray-300 hover:bg-muted'
                            } px-3 py-1.5 rounded-2xl font-semibold border text-xs cursor-pointer transition-colors`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

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

function WorkflowsTab({ query, onSearchingChange, selectedCategory, onSelectedCategoryChange }: { query: string; onSearchingChange: (v: boolean) => void; selectedCategory: string; onSelectedCategoryChange: (v: string) => void }) {
    const [items, setItems] = useState<WorkflowLibraryItem[]>([])
    const [baseItems, setBaseItems] = useState<WorkflowLibraryItem[]>([])
    const [loading, setLoading] = useState<boolean>(true)
    const [error, setError] = useState<string | null>(null)

    const navigate = useNavigate()

    useEffect(() => {
        void fetchItems()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    useEffect(() => {
        const q = (query || '').trim()
        if (!q) {
            setItems(() => {
                const src = baseItems
                if (selectedCategory === 'All') return src
                if (selectedCategory === 'Other') {
                    return src.filter(t => {
                        const cat = (t.category || 'Uncategorized') as string
                        return !wfTopCategories.includes(cat)
                    })
                }
                return src.filter(t => (t.category || 'Uncategorized') === selectedCategory)
            })
            return
        }
        let cancelled = false
        const timer = setTimeout(async () => {
            try {
                onSearchingChange(true)
                const results = await libraryApi.searchWorkflowTemplates(q, {
                    category: selectedCategory === 'All' || selectedCategory === 'Other' ? undefined : selectedCategory,
                })
                if (cancelled) return
                let next = results
                if (selectedCategory === 'Other') {
                    next = results.filter(t => {
                        const cat = (t.category || 'Uncategorized') as string
                        return !wfTopCategories.includes(cat)
                    })
                } else if (selectedCategory !== 'All') {
                    next = results.filter(t => (t.category || 'Uncategorized') === selectedCategory)
                }
                setItems(next)
            } catch (e: any) {
                console.error(e)
                if (!cancelled) setError(e?.response?.data?.error || 'Failed to search workflows')
            } finally {
                if (!cancelled) onSearchingChange(false)
            }
        }, 300)
        return () => {
            cancelled = true
            clearTimeout(timer)
            onSearchingChange(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, selectedCategory, baseItems])

    const fetchItems = async () => {
        try {
            setLoading(true)
            setError(null)
            const list = await libraryApi.listWorkflowTemplates()
            setBaseItems(list)
            setItems(list)
        } catch (e: any) {
            console.error(e)
            setError(e?.response?.data?.error || "Failed to load workflows")
        } finally {
            setLoading(false)
        }
    }

    const wfAllCategories = useMemo(() => {
        const cats = new Set<string>()
        baseItems.forEach(x => cats.add(x.category || 'Uncategorized'))
        return ['All', ...Array.from(cats).sort()]
    }, [baseItems])
    const wfBaseCategories = useMemo(() => wfAllCategories.filter(c => c !== 'All'), [wfAllCategories])
    const wfTopCategories = useMemo(() => wfBaseCategories.slice(0, 4), [wfBaseCategories])
    const wfHasOtherCategory = useMemo(() => wfBaseCategories.length > 4, [wfBaseCategories])
    const wfUiCategories = useMemo(() => ['All', ...wfTopCategories, ...(wfHasOtherCategory ? ['Other'] : [])], [wfTopCategories, wfHasOtherCategory])

    const onDelete = async (item: WorkflowLibraryItem) => {
        if (!confirm(`Delete workflow template "${item.name}"?`)) return
        try {
            await libraryApi.deleteWorkflowTemplate(item.id)
            setBaseItems((prev) => prev.filter((x) => x.id !== item.id))
            setItems((prev) => prev.filter((x) => x.id !== item.id))
        } catch (e: any) {
            console.error(e)
            setError(e?.response?.data?.error || "Failed to delete workflow")
        }
    }

    const toggleEnabled = async (item: WorkflowLibraryItem) => {
        try {
            const updated = await libraryApi.updateWorkflowTemplate(item.id, { enabled: !item.enabled })
            setBaseItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
            setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))
        } catch (e: any) {
            console.error(e)
            setError(e?.response?.data?.error || "Failed to update workflow")
        }
    }

    return (
        <div className="space-y-6">
            {/* Category Chips */}
            <div className="mb-2 flex justify-center">
                <div className="flex items-center gap-2 flex-wrap justify-center max-w-3xl">
                    {wfUiCategories.map((cat: string) => (
                        <button
                            key={cat}
                            onClick={() => onSelectedCategoryChange(cat)}
                            className={`${
                                selectedCategory === cat
                                ? 'bg-foreground/10 text-foreground border-[#ff6839] border-2'
                                : 'bg-transparent  border-border text-gray-600 border-gray-300 hover:bg-muted'
                            } px-3 py-1.5 rounded-2xl font-semibold border text-xs cursor-pointer transition-colors`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

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
