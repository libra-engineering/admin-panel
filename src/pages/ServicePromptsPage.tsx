import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { serviceApi } from "../services/serviceApi";
import { toast } from "sonner";

// Service prompt type based on the actual API response
interface ServicePrompt {
  id: number;
  identifier: string;
  name: string;
  prompt: string; // Note: API returns 'prompt' not 'template'
  description?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function ServicePromptsPage() {
  const navigate = useNavigate();
  const [prompts, setPrompts] = useState<ServicePrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await serviceApi.getPrompts() as ServicePrompt[];
      setPrompts(response);
    } catch (error) {
      console.error("Failed to fetch prompts:", error);
      setError("Failed to load prompts");
    } finally {
      setLoading(false);
    }
  };

  const handleBulkCreateClick = () => {
    fileInputRef.current?.click();
  };

  const handleCsvSelected: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await serviceApi.bulkImportPrompts(file);
      const totals = res?.totals;
      const created = totals?.created ?? 0;
      const updated = totals?.updated ?? 0;
      const skipped = totals?.skipped ?? 0;
      const invalid = totals?.invalid ?? 0;
      toast.success(`Prompts: ${created} created, ${updated} updated, ${skipped} skipped, ${invalid} invalid`);
      await fetchPrompts();
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Bulk import prompts failed';
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExportCsv = async () => {
    try {
      const response = await serviceApi.exportPromptsCsv();
      const blob = new Blob([response], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'prompts-export.csv';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Prompts exported successfully');
    } catch (err: any) {
      const msg = err?.message || 'Export failed';
      toast.error(msg);
    }
  };

  // Filter and search logic
  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) => {
      const matchesSearch =
        searchQuery === "" ||
        prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prompt.identifier.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (prompt.description &&
          prompt.description.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesActive =
        activeFilter === "all" ||
        (activeFilter === "active" && (prompt.isActive ?? true)) ||
        (activeFilter === "inactive" && !(prompt.isActive ?? true));

      return matchesSearch && matchesActive;
    });
  }, [prompts, searchQuery, activeFilter]);

  const handleCreate = () => {
    navigate('/service/prompts/editor/new');
  };

  const handleEdit = (prompt: ServicePrompt) => {
    navigate(`/service/prompts/editor/${prompt.identifier}`);
  };

  const handleDelete = async (prompt: ServicePrompt) => {
    if (!confirm(`Are you sure you want to delete "${prompt.name}"?`)) return;
    
    try {
      await serviceApi.deletePrompt(prompt.id.toString());
      toast.success('Prompt deleted successfully');
      await fetchPrompts();
    } catch (error: any) {
      console.error("Failed to delete prompt:", error);
      toast.error(error?.message || 'Failed to delete prompt');
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Prompt Management</h1>
        <div className="flex items-center space-x-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={handleCsvSelected}
          />
          <Button
            onClick={handleExportCsv}
            variant="outline"
          >
            Export CSV
          </Button>
          <Button
            onClick={handleBulkCreateClick}
            variant="outline"
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Import Prompts (CSV)'}
          </Button>
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Create Prompt
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="">
            <label className="block text-start text-sm font-medium text-gray-700 mb-2">
              Search Prompts
            </label>
            <Input
              type="text"
              placeholder="Search by name, identifier, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm text-start font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <Select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full"
              options={[
                { value: "all", label: "All Prompts" },
                { value: "active", label: "Active Only" },
                { value: "inactive", label: "Inactive Only" },
              ]}
            />
          </div>
        </div>

        {/* Results Summary */}
        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <span>
            Showing {filteredPrompts.length} of {prompts.length} prompts
          </span>
          {(searchQuery || activeFilter !== "all") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setActiveFilter("all");
              }}
              className="text-blue-600 hover:text-blue-700"
            >
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <Card className="shadow-sm border-0 ring-1 ring-gray-200">
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading prompts...</p>
          </CardContent>
        </Card>
      )}

      {/* Prompts Table */}
      {!loading && (
        <Card className="shadow-sm border-0 ring-1 ring-gray-200">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Prompt
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Identifier
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {filteredPrompts.map((prompt, index) => (
                    <tr 
                      key={prompt.id} 
                      className={`transition-colors duration-150 hover:bg-gray-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm text-start font-medium text-gray-900">
                            {prompt.name}
                          </div>
                          {prompt.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {prompt.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-start">
                        <code className="text-sm bg-gray-100 text-gray-800 px-2 py-1 rounded font-mono">
                          {prompt.identifier}
                        </code>
                      </td>
                      <td className="px-6 py-4 text-start">
                        <Badge
                          variant={(prompt.isActive ?? true) ? "success" : "warning"}
                          className="text-xs"
                        >
                          {(prompt.isActive ?? true) ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <span>{prompt.prompt.length.toLocaleString()}</span>
                          <span className="text-gray-400">chars</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-start text-sm text-gray-600">
                        <div className="flex flex-col">
                          <span>{new Date(prompt.updatedAt).toLocaleDateString()}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleEdit(prompt)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 text-xs"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(prompt)}
                            className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300 px-3 py-1.5 text-xs"
                          >
                            Delete
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
      )}

      {/* Empty State */}
      {!loading && filteredPrompts.length === 0 && (
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
              No prompts found
            </h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || activeFilter !== "all"
                ? "Try adjusting your search or filters to find what you're looking for."
                : "Get started by creating your first prompt."}
            </p>
            <Button
              onClick={handleCreate}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Create Your First Prompt
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 