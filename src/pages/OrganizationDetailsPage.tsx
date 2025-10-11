import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminApi } from '@/services/adminApi';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft,
  Edit,
  Save,
  X,
  Settings,
  Plug,
  Building2,
  RefreshCw,
  Trash
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import type { Organization, Connector, ConnectorsResponse } from '../types/admin';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import OrganizationConfigPage from './OrganizationConfigPage';
import { toast } from 'sonner';

interface EditOrgForm {
  name: string;
  emailDomain: string;
  verified: boolean;
  allowModelChange: boolean;
}

export default function OrganizationDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'info' | 'env' | 'connectors'>('info');
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editForm, setEditForm] = useState<EditOrgForm>({
    name: '',
    emailDomain: '',
    verified: false,
    allowModelChange: false
  });

  // Connectors state
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [loadingConnectors, setLoadingConnectors] = useState(false);
  const [syncingConnectorId, setSyncingConnectorId] = useState<string | null>(null);
  const [deletingConnectorId, setDeletingConnectorId] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchOrganizationDetails(id);
    }
  }, [id]);

  useEffect(() => {
    if (id && activeTab === 'connectors') {
      fetchConnectors(id);
    }
  }, [id, activeTab]);

  const fetchOrganizationDetails = async (orgId: string) => {
    try {
      setIsLoading(true);
      const orgDetails = await adminApi.getOrganization(orgId);
      setOrganization(orgDetails);
      setEditForm({
        name: orgDetails.name,
        emailDomain: orgDetails.emailDomain,
        verified: orgDetails.verified,
        allowModelChange: orgDetails.allowModelChange
      });
    } catch (error) {
      console.error('Failed to fetch organization details:', error);
      toast.error('Failed to fetch organization details');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConnectors = async (orgId: string) => {
    try {
      setLoadingConnectors(true);
      const response: ConnectorsResponse = await adminApi.getConnectors(orgId);
      setConnectors(response.connectors);
    } catch (error) {
      console.error('Failed to fetch connectors:', error);
      toast.error('Failed to fetch connectors');
    } finally {
      setLoadingConnectors(false);
    }
  };

  const handleEditOrganization = async () => {
    if (!editForm.name || !editForm.emailDomain || !organization) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsSubmitting(true);
      await adminApi.updateOrganization(organization.id, editForm);
      toast.success('Organization updated successfully!');
      setIsEditing(false);
      await fetchOrganizationDetails(organization.id);
    } catch (error) {
      console.error('Failed to update organization:', error);
      toast.error('Failed to update organization');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditFormChange = (field: keyof EditOrgForm, value: string | boolean) => {
    setEditForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSyncConnector = async (connectorId: string) => {
    try {
      setSyncingConnectorId(connectorId);
      await adminApi.syncConnector(connectorId);
      await fetchConnectors(id!);
      toast.success("Connector sync initiated successfully!");
    } catch (error) {
      console.error("Failed to sync connector:", error);
      toast.error("Failed to sync connector. Please try again.");
    } finally {
      setSyncingConnectorId(null);
    }
  };

  const handleDeleteConnector = async (connectorId: string) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this connector? This action cannot be undone."
    );
    if (!confirmed) return;

    try {
      setDeletingConnectorId(connectorId);
      await adminApi.deleteConnector(connectorId);
      await fetchConnectors(id!);
      toast.success("Connector deleted successfully!");
    } catch (error) {
      console.error("Failed to delete connector:", error);
      toast.error("Failed to delete connector. Please try again.");
    } finally {
      setDeletingConnectorId(null);
    }
  };

  const getStatusBadge = (active: boolean) => {
    return active ? 
      <Badge variant="success">Verified</Badge> : 
      <Badge variant="warning">Unverified</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const formatConnectorType = (type: string) => {
    return type
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const getConnectorStatusColor = (status: string) => {
    switch (status) {
      case "syncCompleted":
        return "success";
      case "syncStarted":
        return "warning";
      case "syncFailed":
        return "error";
      default:
        return "default";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/organizations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Organizations
          </Button>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">Organization not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate('/admin/organizations')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back 
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              {organization.name}
            </h1>
            <p className="text-gray-600 mt-1">@{organization.emailDomain}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          {getStatusBadge(organization.verified)}
          {!isEditing ? (
            <Button
              onClick={() => setIsEditing(true)}
              className="flex items-center"
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          ) : (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setEditForm({
                    name: organization.name,
                    emailDomain: organization.emailDomain,
                    verified: organization.verified,
                    allowModelChange: organization.allowModelChange
                  });
                }}
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={handleEditOrganization}
                disabled={isSubmitting}
                className="flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSubmitting ? 'Saving...' : 'Save'}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building2 className="h-4 w-4 mr-2" />
            Organization Info
          </button>
          <button
            onClick={() => setActiveTab('env')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'env'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 mr-2" />
            Env Config
          </button>
          <button
            onClick={() => setActiveTab('connectors')}
            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
              activeTab === 'connectors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Plug className="h-4 w-4 mr-2" />
            Connectors ({organization._count?.connectors || 0})
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organization Details */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Organization Information
              </h3>
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-left font-medium text-gray-700 mb-1">
                      Name *
                    </label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => handleEditFormChange('name', e.target.value)}
                      placeholder="Organization name"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-left font-medium text-gray-700 mb-1">
                      Email Domain *
                    </label>
                    <Input
                      value={editForm.emailDomain}
                      onChange={(e) => handleEditFormChange('emailDomain', e.target.value)}
                      placeholder="example.com"
                      className="w-full"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="verified"
                      type="checkbox"
                      checked={editForm.verified}
                      onChange={(e) => handleEditFormChange('verified', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="verified" className="text-sm font-medium text-gray-700">
                      Verified
                    </label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="allowModelChange"
                      type="checkbox"
                      checked={editForm.allowModelChange}
                      onChange={(e) => handleEditFormChange('allowModelChange', e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    <label htmlFor="allowModelChange" className="text-sm font-medium text-gray-700">
                      Allow Model Change
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Name</span>
                    <span className="text-sm text-gray-900 font-semibold">{organization.name}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Email Domain</span>
                    <span className="text-sm text-gray-900">@{organization.emailDomain}</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Verified</span>
                    <Badge variant={organization.verified ? "success" : "warning"}>
                      {organization.verified ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Allow Model Change</span>
                    <Badge variant={organization.allowModelChange ? "success" : "default"}>
                      {organization.allowModelChange ? "Yes" : "No"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-3 border-b border-gray-100">
                    <span className="text-sm font-medium text-gray-500">Created</span>
                    <span className="text-sm text-gray-900">{formatDate(organization.createdAt)}</span>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-sm font-medium text-gray-500">Last Updated</span>
                    <span className="text-sm text-gray-900">{formatDate(organization.updatedAt)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Statistics */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">
                Statistics
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Total Users</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {organization._count?.users || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-sm font-medium text-gray-500">Total Connectors</span>
                  <span className="text-2xl font-bold text-gray-900">
                    {organization._count?.connectors || 0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'env' && id && (
        <OrganizationConfigPage organizationId={id} />
      )}

      {activeTab === 'connectors' && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Connectors ({connectors.length})
              </h3>
              
            </div>

            {loadingConnectors ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : connectors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Plug className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No connectors found for this organization</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Last Synced</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connectors.map((connector) => (
                    <TableRow key={connector.id}>
                      <TableCell>
                        <div className="font-medium text-gray-900">
                          {connector.name && connector.name.length > 30 ? (
                            <span title={connector.name}>
                              {connector.name.substring(0, 30)}&hellip;
                            </span>
                          ) : (
                            connector.name
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm font-medium text-gray-900">
                          {formatConnectorType(connector.type)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getConnectorStatusColor(connector.status) as any}>
                          {connector.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {connector.userName || "Unknown"}
                          </div>
                          <div className="text-xs text-gray-500">
                            {connector.userEmail || "—"}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {connector.lastSynced 
                            ? formatDate(connector.lastSynced)
                            : "Never"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleSyncConnector(connector.id)}
                            disabled={syncingConnectorId === connector.id || deletingConnectorId === connector.id}
                            className="h-8 px-2 hover:bg-blue-50 hover:border-blue-300 transition-colors"
                            title="Sync connector"
                          >
                            <RefreshCw 
                              className={`h-4 w-4 text-blue-600 ${
                                syncingConnectorId === connector.id ? "animate-spin" : ""
                              }`} 
                            />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteConnector(connector.id)}
                            disabled={deletingConnectorId === connector.id || syncingConnectorId === connector.id}
                            className="h-8 px-2 hover:bg-red-50 hover:border-red-300 transition-colors"
                            title="Delete connector"
                          >
                            <Trash className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

