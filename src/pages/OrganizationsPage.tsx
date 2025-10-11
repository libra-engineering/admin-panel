import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { adminApi } from "../services/adminApi";
import type { Organization } from "../types/admin";

export default function OrganizationsPage() {
  const navigate = useNavigate();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const data = await adminApi.getOrganizations();
      setOrganizations(data);
    } catch (error) {
      console.error("Failed to fetch organizations:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org);
    setShowEditModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this organization?")) return;

    try {
      await adminApi.deleteOrganization(id);
      await fetchOrganizations();
    } catch (error) {
      console.error("Failed to delete organization:", error);
    }
  };

  const filteredOrganizations = organizations.filter(
    (org) =>
      org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.emailDomain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
        <div className="flex items-center space-x-4">
          <Input
            placeholder="Search organizations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-64"
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-left">
            All Organizations ({filteredOrganizations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Connectors</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrganizations.map((org) => (
                <TableRow key={org.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium text-gray-900">
                        {org.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">@{org.emailDomain}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant={org.verified ? "success" : "warning"}>
                        {org.verified ? "Verified" : "Unverified"}
                      </Badge>
                      {org.allowModelChange && (
                        <Badge variant="info">Model Change Allowed</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-900">
                      {org._count?.users || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-900">
                      {org._count?.connectors || 0}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">
                      {new Date(org.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/organizations/${org.id}`)}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(org)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(org.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && selectedOrg && (
        <EditOrganizationModal
          organization={selectedOrg}
          onClose={() => {
            setShowEditModal(false);
            setSelectedOrg(null);
          }}
          onSave={async (updatedOrg) => {
            try {
              await adminApi.updateOrganization(selectedOrg.id, updatedOrg);
              await fetchOrganizations();
              setShowEditModal(false);
              setSelectedOrg(null);
            } catch (error) {
              console.error("Failed to update organization:", error);
            }
          }}
        />
      )}
    </div>
  );
}

interface EditOrganizationModalProps {
  organization: Organization;
  onClose: () => void;
  onSave: (data: Partial<Organization>) => void;
}

function EditOrganizationModal({
  organization,
  onClose,
  onSave,
}: EditOrganizationModalProps) {
  const [formData, setFormData] = useState({
    name: organization.name,
    emailDomain: organization.emailDomain,
    verified: organization.verified,
    allowModelChange: organization.allowModelChange,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Edit Organization</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-start font-medium text-gray-700 mb-1">
              Name *
            </label>
            <Input
              // label="Name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>
           <div>
            <label className="block text-sm text-start font-medium text-gray-700 mb-1">
              Domain *
            </label>
          <Input
            value={formData.emailDomain}
            onChange={(e) =>
              setFormData({ ...formData, emailDomain: e.target.value })
            }
            required
          />
          </div>
          <div className="flex items-center space-x-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.verified}
                onChange={(e) =>
                  setFormData({ ...formData, verified: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm">Verified</span>
            </label>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.allowModelChange}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    allowModelChange: e.target.checked,
                  })
                }
                className="mr-2"
              />
              <span className="text-sm">Allow Model Change</span>
            </label>
          </div>
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
