import React, { useEffect, useMemo, useState, useRef, useImperativeHandle } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { serviceApi } from "../services/serviceApi";
import type { WorkflowLibraryItem } from "../services/libraryApi";
import { useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import { toast } from "sonner";
import ServiceAgentModalManager, { type ServiceAgent, type ServiceAgentModalType } from "../components/agents/ServiceAgentModalManager";

type TabId = "agents" | "workflows";

export default function ServiceAgentsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("agents");
  const [pageModal, setPageModal] = useState<ServiceAgentModalType>(null);

  // Shared search query for both tabs
  const [query, setQuery] = useState<string>("");
  const [isAgentSearching, setIsAgentSearching] = useState<boolean>(false);
  const [isWfSearching, setIsWfSearching] = useState<boolean>(false);

  const [agentSelectedCategory, setAgentSelectedCategory] = useState<string>('All');
  const [wfSelectedCategory, setWfSelectedCategory] = useState<string>('All');

  const activeSelectedCategory = activeTab === 'agents' ? agentSelectedCategory : wfSelectedCategory;

  const agentsTabRef = useRef<{ refreshData: () => void }>(null);
  const workflowsTabRef = useRef<{ refreshData: () => void }>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Agents & Workflows</h1>
        {
          activeTab === 'agents' ?
          <Button onClick={() => setPageModal('bulkImport')}>Bulk CSV Import</Button>
        : <Button onClick={() => setPageModal('bulkImportWF')}>Bulk CSV Import</Button>
        }
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
          ref={agentsTabRef}
          query={query}
          onSearchingChange={setIsAgentSearching}
          selectedCategory={agentSelectedCategory}
          onSelectedCategoryChange={setAgentSelectedCategory}
        />
      ) : (
        <WorkflowsTab
          ref={workflowsTabRef}
          query={query}
          onSearchingChange={setIsWfSearching}
          selectedCategory={wfSelectedCategory}
          onSelectedCategoryChange={setWfSelectedCategory}
        />
      )}

      <ServiceAgentModalManager
        activeModal={pageModal}
        selectedAgent={null}
        onClose={() => setPageModal(null)}
        onAgentCreated={() => setPageModal(null)}
        onAgentUpdated={() => setPageModal(null)}
        onAgentDeleted={() => setPageModal(null)}
        onBulkImportSuccess={() => agentsTabRef.current?.refreshData()}
        onBulkImportWFSuccess={() => workflowsTabRef.current?.refreshData()}
      />
    </div>
  );
}



const AgentsTab = React.forwardRef<{ refreshData: () => void }, { query: string; onSearchingChange: (v: boolean) => void; selectedCategory: string; onSelectedCategoryChange: (v: string) => void }>(function AgentsTab({ query, onSearchingChange, selectedCategory, onSelectedCategoryChange }, ref) {
  const [items, setItems] = useState<ServiceAgent[]>([]);
  const [baseItems, setBaseItems] = useState<ServiceAgent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void fetchItems();
  }, []);

  useEffect(() => {
    const q = (query || '').trim();
    if (!q) {
      // No query: show base list, optionally filtered by category
      setItems(() => {
        const src = baseItems;
        if (selectedCategory === 'All') return src;
        if (selectedCategory === 'Other') {
          return src.filter(t => {
            const cat = (t.category || 'Uncategorized') as string;
            return !topCategories.includes(cat);
          });
        }
        return src.filter(t => (t.category || 'Uncategorized') === selectedCategory);
      });
      return;
    }
    // For service API, we'll do local filtering instead of search API for now
    onSearchingChange(true);
    setTimeout(() => {
      const filtered = baseItems.filter(item => 
        item.name.toLowerCase().includes(q.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(q.toLowerCase()))
      );
      
      let next = filtered;
      if (selectedCategory === 'Other') {
        next = filtered.filter(t => {
          const cat = (t.category || 'Uncategorized') as string;
          return !topCategories.includes(cat);
        });
      } else if (selectedCategory !== 'All') {
        next = filtered.filter(t => (t.category || 'Uncategorized') === selectedCategory);
      }
      setItems(next);
      onSearchingChange(false);
    }, 300);
  }, [query, selectedCategory, baseItems]);

  const [activeModal, setActiveModal] = useState<ServiceAgentModalType>(null);
  const [selectedAgent, setSelectedAgent] = useState<ServiceAgent | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await serviceApi.getAgents() as ServiceAgent[];
      setBaseItems(list);
      setItems(list);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to load agents");
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshData: fetchItems
  }));

  const allCategories = useMemo(() => {
    const cats = new Set<string>();
    baseItems.forEach(x => cats.add(x.category || 'Uncategorized'));
    return ['All', ...Array.from(cats).sort()];
  }, [baseItems]);
  const baseCategories = useMemo(() => allCategories.filter(c => c !== 'All'), [allCategories]);
  const topCategories = useMemo(() => baseCategories.slice(0, 4), [baseCategories]);
  const hasOtherCategory = useMemo(() => baseCategories.length > 4, [baseCategories]);
  const uiCategories = useMemo(() => ['All', ...topCategories, ...(hasOtherCategory ? ['Other'] : [])], [topCategories, hasOtherCategory]);

  const openCreate = () => {
    setSelectedAgent(null);
    setActiveModal('create');
  };

  const openEdit = (agent: ServiceAgent) => {
    setSelectedAgent(agent);
    setActiveModal('edit');
  };

  const openDelete = (agent: ServiceAgent) => {
    setSelectedAgent(agent);
    setActiveModal('delete');
  };

  const closeModal = () => {
    setActiveModal(null);
    setSelectedAgent(null);
  };

  const handleCreated = (created: ServiceAgent) => {
    setBaseItems(prev => [created, ...prev]);
    setItems(prev => [created, ...prev]);
    closeModal();
  };

  const handleUpdated = (updated: ServiceAgent) => {
    setBaseItems(prev => prev.map(x => (x.id === updated.id ? updated : x)));
    setItems(prev => prev.map(x => (x.id === updated.id ? updated : x)));
    closeModal();
  };

  const handleDeleted = (id: string) => {
    setBaseItems(prev => prev.filter(x => x.id.toString() !== id));
    setItems(prev => prev.filter(x => x.id.toString() !== id));
    closeModal();
  };

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
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading agents...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-gray-600 text-center">No agents found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {items.map((item: ServiceAgent) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="text-sm text-left font-medium text-gray-900">{item.name}</div>
                      </td>
                      <td className="px-6 py-3 text-left text-sm text-gray-700">
                        {item.description || '-'}
                      </td>
                      <td className="px-6 py-3 text-left text-sm text-gray-700">
                        {item.category || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {new Date(item.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(item)}>
                            Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => openDelete(item)}>
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

      <ServiceAgentModalManager
        activeModal={activeModal}
        selectedAgent={selectedAgent}
        onClose={closeModal}
        onAgentCreated={handleCreated}
        onAgentUpdated={handleUpdated}
        onAgentDeleted={handleDeleted}
      />
    </div>
  );
});

const WorkflowsTab = React.forwardRef<{ refreshData: () => void }, { query: string; onSearchingChange: (v: boolean) => void; selectedCategory: string; onSelectedCategoryChange: (v: string) => void }>(function WorkflowsTab({ query, onSearchingChange, selectedCategory, onSelectedCategoryChange }, ref) {
  const [items, setItems] = useState<WorkflowLibraryItem[]>([]);
  const [baseItems, setBaseItems] = useState<WorkflowLibraryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const navigate = useNavigate();

  useEffect(() => {
    void fetchItems();
  }, []);

  useEffect(() => {
    const q = (query || '').trim();
    if (!q) {
      setItems(() => {
        const src = baseItems;
        if (selectedCategory === 'All') return src;
        if (selectedCategory === 'Other') {
          return src.filter(t => {
            const cat = (t.category || 'Uncategorized') as string;
            return !wfTopCategories.includes(cat);
          });
        }
        return src.filter(t => (t.category || 'Uncategorized') === selectedCategory);
      });
      return;
    }
    // For service API, we'll do local filtering
    onSearchingChange(true);
    setTimeout(() => {
      const filtered = baseItems.filter(item => 
        item.name.toLowerCase().includes(q.toLowerCase())
      );
      
      let next = filtered;
      if (selectedCategory === 'Other') {
        next = filtered.filter(t => {
          const cat = (t.category || 'Uncategorized') as string;
          return !wfTopCategories.includes(cat);
        });
      } else if (selectedCategory !== 'All') {
        next = filtered.filter(t => (t.category || 'Uncategorized') === selectedCategory);
      }
      setItems(next);
      onSearchingChange(false);
    }, 300);
  }, [query, selectedCategory, baseItems]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const list = await serviceApi.getWorkflows();
      setBaseItems(list as WorkflowLibraryItem[]);
      setItems(list as WorkflowLibraryItem[]);
    } catch (e: any) {
      console.error(e);
      setError(e?.response?.data?.error || "Failed to load workflows");
    } finally {
      setLoading(false);
    }
  };

  useImperativeHandle(ref, () => ({
    refreshData: fetchItems
  }));

  const wfAllCategories = useMemo(() => {
    const cats = new Set<string>();
    baseItems.forEach(x => cats.add(x.category || 'Uncategorized'));
    return ['All', ...Array.from(cats).sort()];
  }, [baseItems]);
  const wfBaseCategories = useMemo(() => wfAllCategories.filter(c => c !== 'All'), [wfAllCategories]);
  const wfTopCategories = useMemo(() => wfBaseCategories.slice(0, 4), [wfBaseCategories]);
  const wfHasOtherCategory = useMemo(() => wfBaseCategories.length > 4, [wfBaseCategories]);
  const wfUiCategories = useMemo(() => ['All', ...wfTopCategories, ...(wfHasOtherCategory ? ['Other'] : [])], [wfTopCategories, wfHasOtherCategory]);

  const onDelete = async (item: WorkflowLibraryItem) => {
    if (!confirm(`Delete workflow template "${item.name}"?`)) return;
    try {
      await serviceApi.deleteWorkflow(item.id);
      toast.success('Workflow deleted successfully');
      await fetchItems();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to delete workflow");
    }
  };

  const toggleEnabled = async (item: WorkflowLibraryItem) => {
    try {
      await serviceApi.updateWorkflow(item.id, { enabled: !item.enabled });
      toast.success('Workflow updated successfully');
      await fetchItems();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.response?.data?.error || "Failed to update workflow");
    }
  };

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
        <Button onClick={() => navigate('/service/workflows/new')}>Create Workflow</Button>
      </div>

      {error && (
        <div className="text-sm text-red-600">{error}</div>
      )}

      <Card className="shadow-sm border-0 ring-1 ring-gray-200">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading workflows...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="p-6 text-gray-600 text-center">No workflows found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
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
                      <td className="px-6 py-3 text-sm text-gray-700">
                        {new Date(item.updatedAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/service/workflows/${item.id}`)}>
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
  );
}); 