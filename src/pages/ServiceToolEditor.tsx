import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Select } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { serviceApi } from "../services/serviceApi";
import type { OrganizationToolPrompts, ToolPrompt } from "../types/admin";
import { html as diffHtml } from 'diff2html/lib-esm/diff2html';
import 'diff2html/bundles/css/diff2html.min.css';
import { adminApi } from "@/services/adminApi";
import { toast } from "sonner";

interface EditorState {
  content: string;
  isDirty: boolean;
  lastSaved: Date | null;
}

interface CreationState {
  toolName: string;
  connectorType: string;
  description?: string;
  isDirty: boolean;
}

export default function ServiceToolEditor() {
  const { toolKey } = useParams<{ toolKey: string }>();
  const navigate = useNavigate();

  const isCreationMode = toolKey === "new";

  // Suggestions from org tool prompts
  const [allToolPrompts, setAllToolPrompts] = useState<OrganizationToolPrompts>({});

  // Current tool prompt (edit mode)
  const [current, setCurrent] = useState<ToolPrompt | null>(null);
  const [toolName, setToolName] = useState<string>("");
  const [connectorType, setConnectorType] = useState<string>("");
  const [availableConnectorTypes, setAvailableConnectorTypes] = useState<string[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editor state
  const [editorState, setEditorState] = useState<EditorState>({
    content: "",
    isDirty: false,
    lastSaved: null,
  });

  // Creation state
  const [creationState, setCreationState] = useState<CreationState>({
    toolName: "",
    connectorType: "",
    description: "",
    isDirty: false,
  });

  // Preview diff state
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [previewGenerating, setPreviewGenerating] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        // Fetch all tool prompts for suggestions
        const resp = await serviceApi.getToolPrompts();
        // setAllToolPrompts(resp.toolPrompts || {});

        const meta = await adminApi.getConnectorsMetadata();
        const coreTools = [{
          type: "core",
          tools: [],
          webhookEvents: [],
        }]
        const connectorTools: string[] = (meta.connectors || []).map((c: any) => c.type);
        setAvailableConnectorTypes([...connectorTools, ...coreTools.map((c: any) => c.type)]);
        if (!isCreationMode && toolKey) {
          const [tName, cType] = toolKey.split(":");
          setToolName(tName);
          setConnectorType(cType);
          const tp = await serviceApi.getToolPrompt(tName, cType) as any;
          // Transform the response to match expected ToolPrompt format
          const transformedTp: ToolPrompt = {
            promptTemplate: tp.template || tp.promptTemplate || "",
            version: tp.version || 1,
            isCustom: true,
            description: tp.description || "",
          };
          setCurrent(transformedTp);
          setEditorState({
            content: transformedTp.promptTemplate || "",
            isDirty: false,
            lastSaved: new Date(),
          });
        }
      } catch (e: any) {
        console.error("Failed to initialize tool editor:", e);
        toast.error(e?.response?.data?.error || "Failed to load tool prompt");
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [toolKey, isCreationMode]);

  const availableConnectors = useMemo(() => {
    const list = new Set<string>();
    Object.keys(allToolPrompts).forEach((key) => {
      const parts = key.split(":");
      if (parts.length === 2) list.add(parts[1]);
    });
    return Array.from(list).sort();
  }, [allToolPrompts]);

  const availableToolTypes = useMemo(() => {
    const list = new Set<string>();
    Object.keys(allToolPrompts).forEach((key) => {
      const parts = key.split(":");
      if (parts.length === 2) list.add(parts[0]);
    });
    return Array.from(list).sort();
  }, [allToolPrompts]);

  const getToolDisplayName = (name: string) => {
    return name
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const getConnectorDisplayName = (c: string) => {
    const display: Record<string, string> = {
      slack: "Slack",
      googleGmail: "Gmail",
      outlook: "Outlook",
      discord: "Discord",
      teams: "Microsoft Teams",
      telegram: "Telegram",
      whatsapp: "WhatsApp",
      email: "Email",
    };
    const formatted = c ? c.charAt(0).toUpperCase() + c.slice(1) : "";
    return display[c] || formatted;
  };

  // Build a unified diff between two strings, line-based
  const generateUnifiedDiff = (oldStr: string, newStr: string, fileName: string) => {
    const a = oldStr.split('\n');
    const b = newStr.split('\n');
    const n = a.length;
    const m = b.length;
    const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));

    for (let i = n - 1; i >= 0; i--) {
      for (let j = m - 1; j >= 0; j--) {
        if (a[i] === b[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
        else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
      }
    }

    const lines: string[] = [];
    let i = 0, j = 0;
    while (i < n && j < m) {
      if (a[i] === b[j]) {
        lines.push(' ' + a[i]);
        i++; j++;
      } else if (dp[i + 1][j] >= dp[i][j + 1]) {
        lines.push('-' + a[i]);
        i++;
      } else {
        lines.push('+' + b[j]);
        j++;
      }
    }
    while (i < n) { lines.push('-' + a[i]); i++; }
    while (j < m) { lines.push('+' + b[j]); j++; }

    const oldStart = n > 0 ? 1 : 0;
    const newStart = m > 0 ? 1 : 0;
    const header = `--- a/${fileName}\n+++ b/${fileName}\n@@ -${oldStart},${n} +${newStart},${m} @@\n`;
    return header + lines.join('\n') + '\n';
  };

  const openPreview = () => {
    try {
      setPreviewGenerating(true);
      setPreviewError(null);
      const before = isCreationMode ? '' : (current?.promptTemplate || '');
      const after = editorState.content || '';
      const inferredName = (toolName && connectorType)
        ? `${toolName}:${connectorType}`
        : (creationState.toolName && creationState.connectorType)
          ? `${creationState.toolName}:${creationState.connectorType}`
          : 'tool-prompt';
      const fileName = `${inferredName}.txt`;
      const unified = generateUnifiedDiff(before, after, fileName);
      const html = diffHtml(unified, {
        drawFileList: false,
        matching: 'lines',
        outputFormat: 'line-by-line',
      });
      setPreviewHtml(html);
      setIsPreviewOpen(true);
    } catch (e: any) {
      console.error('Failed to generate preview diff:', e);
      setPreviewError('Failed to generate preview');
    } finally {
      setPreviewGenerating(false);
    }
  };

  const handleEditorChange = (value: string) => {
    setEditorState((prev) => ({
      ...prev,
      content: value,
      isDirty: isCreationMode ? value !== "" : value !== (current?.promptTemplate || ""),
    }));
  };

  const handleCreationFieldChange = (field: keyof CreationState, value: any) => {
    setCreationState((prev) => ({
      ...prev,
      [field]: value,
      isDirty: true,
    }));
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      if (isCreationMode) {
        if (!creationState.toolName || !creationState.connectorType || !editorState.content) {
          toast.error("Please fill tool name, connector, and template");
          return;
        }
        await serviceApi.createToolPrompt(creationState.connectorType, {
          toolName: creationState.toolName,
          template: editorState.content,
          description: creationState.description || undefined,
        });
        navigate(`/service/tools/editor/${creationState.toolName}:${creationState.connectorType}`);
        return;
      }

      if (!toolName || !connectorType) return;
      await serviceApi.updateToolPrompt(toolName, connectorType, {
        template: editorState.content || "",
      });
      setEditorState((prev) => ({
        ...prev,
        isDirty: false,
        lastSaved: new Date(),
      }));
      // Refresh current prompt
      const tp = await serviceApi.getToolPrompt(toolName, connectorType) as any;
      // Transform the response to match expected ToolPrompt format
      const transformedTp: ToolPrompt = {
        promptTemplate: tp.template || tp.promptTemplate || "",
        version: tp.version || 1,
        isCustom: true,
        description: tp.description || "",
      };
      setCurrent(transformedTp);
    } catch (e: any) {
      console.error("Failed to save tool prompt:", e);
      toast.error(e?.response?.data?.error || "Failed to save tool prompt");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading tool prompt...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              {isCreationMode ? (
                <div>
                  <h1 className="text-2xl text-start font-bold">Create New Tool Prompt</h1>
                  <p className="text-start text-gray-600">Fill in the details below</p>
                </div>
              ) : current ? (
                <div>
                  <h1 className="text-2xl text-start font-bold">
                    {getToolDisplayName(toolName)}
                  </h1>
                  <p className="text-start text-gray-600">{getConnectorDisplayName(connectorType)}</p>
                  <div className="text-start mt-2 flex items-center space-x-2">
                    <Badge variant={current.isCustom ? "success" : "warning"}>
                      {current.isCustom ? "Custom" : "Default"}
                    </Badge>
                    <Badge variant="info">v{current.version}</Badge>
                  </div>
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
              {((editorState.isDirty) || (isCreationMode && (editorState.content !== ""))) ? (
                <Button
                  onClick={openPreview}
                  disabled={saving}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Preview
                </Button>
              ) : (
                <Button
                  onClick={handleSave}
                  disabled={
                    saving ||
                    (isCreationMode && (!creationState.toolName || !creationState.connectorType || !editorState.content)) ||
                    (!isCreationMode && !editorState.isDirty)
                  }
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saving ? (isCreationMode ? "Creating..." : "Saving...") : isCreationMode ? "Create Tool Prompt" : "Save"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Creation form  */}
        {isCreationMode && (
          <div className="bg-gray-50 border-b border-gray-200 p-4">
            <div className="max-w-4xl mx-start">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Connector *</label>
                  <Select
                    value={creationState.connectorType}
                    onChange={(e) => handleCreationFieldChange("connectorType", e.target.value)}
                    className="w-full"
                    options={[
                      { value: "", label: "Select connector" },
                      ...availableConnectorTypes.map((c: string) => ({ value: c, label: getConnectorDisplayName(c) })),
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tool Name *</label>
                  <Input
                    value={creationState.toolName}
                    onChange={(e) => handleCreationFieldChange("toolName", e.target.value)}
                    placeholder="e.g. summarize_email"
                    className="w-full"
                  />
                  {availableToolTypes.length > 0 && (
                    <div className="text-xs text-gray-500 mt-1">
                      Suggestions: {availableToolTypes.slice(0, 5).join(", ")}
                      {availableToolTypes.length > 5 ? "…" : ""}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                  <Input
                    value={creationState.description || ""}
                    onChange={(e) => handleCreationFieldChange("description", e.target.value)}
                    placeholder="Short description"
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Editor area */}
        <div className="flex-1 flex">
          <div className="flex-1 flex flex-col">
            {/* Toolbar */}
            <div className="border-b border-gray-200 px-4 py-2 text-sm flex items-center justify-between bg-gray-100">
              <div className="flex items-center space-x-4">
                <span className="text-gray-600">{(editorState.content || "").split("\n").length} lines</span>
                <span className="text-gray-600">{(editorState.content || "").length} characters</span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate("/service/tools")}
                >
                  Tools
                </Button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full flex bg-white shadow-inner">
                <div className="flex-1 relative">
                  <textarea
                    value={editorState.content || ""}
                    onChange={(e) => handleEditorChange(e.target.value)}
                    readOnly={!isCreationMode && !current}
                    className={`w-full h-full p-4 border-none outline-none resize-none font-mono text-sm bg-white text-gray-900 focus:bg-gray-50 transition-colors duration-200`}
                    style={{ lineHeight: "1.5rem", tabSize: 2 }}
                    spellCheck={false}
                    placeholder={isCreationMode ? "Enter your tool prompt template here..." : "Edit tool prompt template..."}
                  />
                  <div className="absolute inset-0 pointer-events-none opacity-5">
                    <div className="h-full bg-gradient-to-b from-gray-200 via-transparent to-transparent bg-[length:100%_1.5rem]"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsPreviewOpen(false)}></div>
          <div className="relative bg-white w-[90vw] max-w-5xl max-h-[80vh] rounded-lg shadow-lg flex flex-col">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Preview changes</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setIsPreviewOpen(false)}>×</button>
            </div>
            <div className="flex-1 overflow-auto">
              <style>{`
                .diff2html--wrapper .d2h-code-linenumber,
                .diff2html--wrapper .d2h-code-side-linenumber,
                .diff2html--wrapper .d2h-info {
                  position: static !important;
                  left: auto !important;
                  right: auto !important;
                  top: auto !important;
                  z-index: auto !important;
                }
              `}</style>
              {previewGenerating ? (
                <div className="p-6 text-gray-600">Generating preview...</div>
              ) : previewError ? (
                <div className="p-6 text-red-600">{previewError}</div>
              ) : (
                <div className="diff2html--wrapper" dangerouslySetInnerHTML={{ __html: previewHtml || '' }} />
              )}
            </div>
            <div className="p-4 border-t border-gray-200 flex items-center justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Back</Button>
              <Button
                onClick={async () => {
                  await handleSave();
                  setIsPreviewOpen(false);
                }}
                disabled={saving || (isCreationMode && (!creationState.toolName || !creationState.connectorType || !editorState.content))}
                className="bg-green-600 hover:bg-green-700"
              >
                {saving ? (isCreationMode ? 'Creating...' : 'Saving...') : (isCreationMode ? 'Create Tool Prompt' : 'Save')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 