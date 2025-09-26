import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { serviceApi } from "../services/serviceApi";
import { BotIcon, MenuIcon, MoveLeft } from "lucide-react";
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

interface EditorState {
  content: string;
  isDirty: boolean;
  lastSaved: Date | null;
}

interface CreationState {
  identifier: string;
  name: string;
  description: string;
  isActive: boolean;
  isDirty: boolean;
}

export default function ServicePromptEditor() {
  const { identifier } = useParams<{ identifier: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Core state
  const [prompts, setPrompts] = useState<ServicePrompt[]>([]);
  const [currentPrompt, setCurrentPrompt] = useState<ServicePrompt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Creation mode state
  const isCreationMode = identifier === 'new';
  const [creationState, setCreationState] = useState<CreationState>({
    identifier: '',
    name: '',
    description: '',
    isActive: true,
    isDirty: false,
  });
  
  // Name editing state
  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState('');
  
  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    content: "",
    isDirty: false,
    lastSaved: null,
  });
  const [saving, setSaving] = useState(false);
  
  // UI state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [lineNumbers, setLineNumbers] = useState(true);

  useEffect(() => {
    if (!isCreationMode) {
      fetchPrompts();
    } else {
      setLoading(false);
    }
  }, [isCreationMode]);

  useEffect(() => {
    if (!identifier) return;
    
    if (isCreationMode) {
      // Creation mode - setup for new prompt
      setCurrentPrompt(null);
      setEditorState({
        content: "",
        isDirty: false,
        lastSaved: null,
      });
      setLoading(false);
      setCreationState({
        identifier: '',
        name: '',
        description: '',
        isActive: true,
        isDirty: false,
      });
    } else if (prompts.length > 0) {
      // Edit mode - find existing prompt
      const prompt = prompts.find(p => p.identifier === identifier);
      if (prompt) {
        setCurrentPrompt(prompt);
        setEditorState({
          content: prompt.prompt || "",
          isDirty: false,
          lastSaved: new Date(prompt.updatedAt),
        });
        setEditingName(prompt.name); // Initialize name editing state
      }
    }
  }, [identifier, prompts, isCreationMode]);

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

  const filteredPrompts = useMemo(() => {
    return prompts.filter((prompt) =>
      searchQuery === "" ||
      prompt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.identifier.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [prompts, searchQuery]);

  const handlePromptSelect = (prompt: ServicePrompt) => {
    if (editorState.isDirty) {
      const confirmLeave = confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmLeave) return;
    }
    
    navigate(`/service/prompts/editor/${prompt.identifier}`);
  };

  const handleEditorChange = (value: string) => {
    setEditorState(prev => ({
      ...prev,
      content: value,
      isDirty: isCreationMode ? value !== "" : value !== (currentPrompt?.prompt || ""),
    }));
  };

  const handleCreationFieldChange = (field: keyof CreationState, value: any) => {
    setCreationState(prev => ({
      ...prev,
      [field]: value,
      isDirty: true,
    }));
  };

  const handleNameSave = async () => {
    if (!currentPrompt || !editingName.trim() || editingName === currentPrompt.name) {
      setIsEditingName(false);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      
      await serviceApi.updatePrompt(currentPrompt.id.toString(), {
        name: editingName.trim(),
      });
      
      // Refresh prompts to get updated name
      await fetchPrompts();
      setIsEditingName(false);
      toast.success("Prompt name updated successfully");
    } catch (error: any) {
      console.error("Failed to update prompt name:", error);
      setError(error.response?.data?.error || "Failed to update prompt name");
      toast.error("Failed to update prompt name");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (isCreationMode) {
      // Handle prompt creation
      if (!creationState.identifier || !creationState.name || !editorState.content) {
        setError("Please fill in all required fields (identifier, name, and template)");
        toast.error("Please fill in all required fields");
        return;
      }

      try {
        setSaving(true);
        setError(null);
        
        const createData = {
          identifier: creationState.identifier,
          name: creationState.name,
          description: creationState.description || undefined,
          template: editorState.content, // Send as 'template' but API might store as 'prompt'
          isActive: creationState.isActive,
        };
        
        await serviceApi.createPrompt(createData);
        toast.success("Prompt created successfully");
        
        // Navigate to the new prompt's edit page
        navigate(`/service/prompts/editor/${creationState.identifier}`);
      } catch (error: any) {
        console.error("Failed to create prompt:", error);
        setError(error.response?.data?.error || "Failed to create prompt");
        toast.error("Failed to create prompt");
      } finally {
        setSaving(false);
      }
    } else {
      // Handle prompt update
      if (!currentPrompt || !editorState.isDirty) return;

      try {
        setSaving(true);
        setError(null);
        
        await serviceApi.updatePrompt(currentPrompt.id.toString(), {
          template: editorState.content, // Send as 'template'
        });
        
        setEditorState(prev => ({
          ...prev,
          isDirty: false,
          lastSaved: new Date(),
        }));
        
        toast.success("Prompt updated successfully");
        
        // Refresh the current prompt
        await fetchPrompts();
      } catch (error: any) {
        console.error("Failed to save prompt:", error);
        setError(error.response?.data?.error || "Failed to save prompt");
        toast.error("Failed to save prompt");
      } finally {
        setSaving(false);
      }
    }
  };

  const renderLineNumbers = (content: string) => {
    const lines = content.split('\n');
    const maxLineNumber = lines.length;
    const padding = maxLineNumber.toString().length;
    
    return lines.map((_, index) => (
      <div 
        key={index} 
        className="text-gray-400 text-sm font-mono select-none pr-3 text-right border-r border-gray-200"
        style={{ 
          minWidth: `${Math.max(padding * 8 + 16, 40)}px`,
          lineHeight: '1.5rem'
        }}
      >
        {String(index + 1).padStart(padding, ' ')}
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading prompts...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        sidebarCollapsed ? 'w-16' : 'w-80'
      }`}>
        {!sidebarCollapsed && (
          <div className="h-full flex flex-col">
            {/* Sidebar Header */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Prompts</h2>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setSidebarCollapsed(true)}
                >
                  <MoveLeft />
                </Button>
              </div>
              <Input
                placeholder="Search prompts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>
            
            {/* Prompts List */}
            <div className="flex-1 overflow-y-auto space-y-2 p-2">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  onClick={() => handlePromptSelect(prompt)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                    prompt.identifier === identifier 
                      ? 'bg-blue-100 border-blue-300 shadow-sm' 
                      : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="font-medium text-sm text-start text-gray-900">{prompt.name}</div>
                  <div className="text-xs text-gray-500 mt-1 font-mono text-start px-2 py-1 rounded">
                    {prompt.identifier}
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <div className="text-xs text-gray-400">
                      {new Date(prompt.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {prompt.prompt.length.toLocaleString()} chars
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {sidebarCollapsed && (
          <div className="pr-4 py-4">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSidebarCollapsed(false)}
            >
              <MenuIcon />
            </Button>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isCreationMode ? (
                <div>
                  <h1 className="text-2xl text-start font-bold ">Create New Prompt</h1>
                  <p className="text-start text-gray-600">Fill in the details below </p>
                </div>
              ) : currentPrompt ? (
                <div>
                  {isEditingName ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleNameSave();
                          }
                          if (e.key === 'Escape') {
                            setIsEditingName(false);
                            setEditingName(currentPrompt.name);
                          }
                        }}
                        onBlur={handleNameSave}
                        className="text-2xl font-bold border-none shadow-none p-0 h-auto focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleNameSave}
                        disabled={saving}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setIsEditingName(false);
                          setEditingName(currentPrompt.name);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <h1 
                      className="text-2xl text-start font-bold cursor-pointer hover:text-gray-600 transition-colors"
                      onClick={() => setIsEditingName(true)}
                      title="Click to edit prompt name"
                    >
                      {currentPrompt.name}
                    </h1>
                  )}
                  <p className="text-start text-gray-600">{currentPrompt.identifier}</p>
                </div>
              ) : null}
            </div>
            <div className="flex items-center space-x-3">
              {(editorState.isDirty || creationState.isDirty) && (
                <Badge variant="error">Unsaved changes</Badge>
              )}
              {editorState.lastSaved && !isCreationMode && (
                <span className="text-sm text-gray-500">
                  Last saved: {editorState.lastSaved.toLocaleTimeString()}
                </span>
              )}
              <Button
                onClick={handleSave}
                disabled={
                  saving || 
                  (!isCreationMode && !editorState.isDirty) ||
                  (isCreationMode && (!creationState.identifier || !creationState.name || !editorState.content))
                }
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? 
                  (isCreationMode ? "Creating..." : "Saving...") : 
                  isCreationMode ? "Create Prompt" : "Save"}
              </Button>
            </div>
          </div>
        </div>

        {/* Creation Form (only in creation mode) */}
        {isCreationMode && (
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Identifier *
                  </label>
                  <Input
                    value={creationState.identifier}
                    onChange={(e) => handleCreationFieldChange('identifier', e.target.value)}
                    placeholder="unique-prompt-identifier"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <Input
                    value={creationState.name}
                    onChange={(e) => handleCreationFieldChange('name', e.target.value)}
                    placeholder="Prompt display name"
                    className="w-full"
                  />
                </div>
               
              </div>
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Editor Toolbar */}
          <div className="border-b border-gray-200 px-4 py-2 text-sm flex items-center justify-between bg-gray-100">
            <div className="flex items-center space-x-4">
              <span className="text-gray-600">
                {editorState.content?.split('\n').length || 0} lines
              </span>
              <span className="text-gray-600">
                {editorState.content?.length || 0} characters
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <label className="flex items-center space-x-1">
                <input
                  type="checkbox"
                  checked={lineNumbers}
                  onChange={(e) => setLineNumbers(e.target.checked)}
                />
                <span>Line numbers</span>
              </label>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-hidden">
            <div className="h-full flex bg-white shadow-inner">
              {lineNumbers && (
                <div className="bg-gray-50 border-r border-gray-200 px-2 py-4 min-w-[50px] flex flex-col">
                  {renderLineNumbers(editorState.content || "")}
                </div>
              )}
              <div className="flex-1 relative">
                <textarea
                  value={editorState.content || ""}
                  onChange={(e) => handleEditorChange(e.target.value)}
                  className="w-full h-full p-4 border-none outline-none resize-none font-mono text-sm bg-white text-gray-900 focus:bg-gray-50 transition-colors duration-200"
                  style={{ 
                    lineHeight: '1.5rem',
                    tabSize: 2
                  }}
                  spellCheck={false}
                  placeholder="Enter your prompt template here...\n\nTip: Use {{variable}} for template variables"
                />
                {/* Subtle grid overlay for better visual alignment */}
                <div className="absolute inset-0 pointer-events-none opacity-5">
                  <div className="h-full bg-gradient-to-b from-gray-200 via-transparent to-transparent bg-[length:100%_1.5rem]"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="fixed top-4 right-4 bg-red-50 border border-red-200 rounded-md p-4 shadow-lg z-50">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={() => setError(null)}
                className="text-red-400 hover:text-red-600"
              >
                ×
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 