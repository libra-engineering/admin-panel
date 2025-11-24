import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import { adminApi } from "../services/adminApi";
import type {
  ConnectorStats,
  Connector,
  ConnectorsResponse,
} from "../types/admin";
import { Button } from "@/components/ui/button";
import { RefreshCcw, Trash } from "lucide-react";
import { toast } from "sonner";

export default function ConnectorsPage() {
  const [connectorStats, setConnectorStats] = useState<ConnectorStats | null>(
    null
  );
  const [connectors, setConnectors] = useState<Connector[]>([]);
  const [connectorsResponse, setConnectorsResponse] =
    useState<ConnectorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncingConnectorId, setSyncingConnectorId] = useState<string | null>(null);
  const [deletingConnectorId, setDeletingConnectorId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsData, connectorsData] = await Promise.all([
        adminApi.getConnectorStats(),
        adminApi.getConnectors(),
      ]);
      setConnectorStats(statsData);
      setConnectorsResponse(connectorsData);
      setConnectors(connectorsData.connectors); // Extract connectors array from response
    } catch (error) {
      console.error("Failed to fetch connector data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSyncConnector = async (connectorId: string) => {
    try {
      setSyncingConnectorId(connectorId);
      await adminApi.syncConnector(connectorId);
      await fetchData();
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
      await fetchData();
      toast.success("Connector deleted successfully!");
    } catch (error) {
      console.error("Failed to delete connector:", error);
      toast.error("Failed to delete connector. Please try again.");
    } finally {
      setDeletingConnectorId(null);
    }
  };

  const getStatusColor = (status: string) => {
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

  const renderSyncProgress = (connector: Connector) => {
    const isDb = connector.type === "postgres" || connector.type === "mysql";
    const isAnalyzing = isDb && connector.status === "syncStarted";
    const hasFailed = connector.status === "syncFailed";

    if (isAnalyzing) {
      return (
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-xs text-gray-600">Analyzing database...</span>
        </div>
      );
    }

    if (hasFailed) {
      return <span className="text-xs text-red-600">Sync failed</span>;
    }

    if (
      connector.totalData !== undefined &&
      connector.syncedData !== undefined &&
      connector.totalData > 0
    ) {
      const percentage = Math.min(
        100,
        Math.round(
          (connector.syncedData / Math.max(1, connector.totalData)) * 100
        )
      );

      return (
        <div className="w-48">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-600">
              {connector.syncedData} of {connector.totalData} items synced
            </span>
            <span className="text-xs font-medium text-gray-700">
              {percentage}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-in-out"
              style={{
                width: `${percentage}%`,
              }}
            ></div>
          </div>
        </div>
      );
    }

    return (
      <span className="text-xs text-gray-500">No sync data available</span>
    );
  };


  const formatConnectorType = (type: string) => {
    return type
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "Never";
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading connector statistics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Connectors</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-blue-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total Connectors
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {connectorStats?.totalConnectors.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <svg
                    className="w-5 h-5 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Active Connectors
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {connectorStats?.activeConnectors.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Connectors Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Connectors</CardTitle>
            {connectorsResponse && (
              <div className="text-sm text-gray-500">
                Showing {connectorsResponse.connectors.length} of{" "}
                {connectorsResponse.pagination.total} connectors
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Last Synced</TableHead>
                <TableHead>Actions </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {connectors.map((connector) => (
                <TableRow key={connector.id}>
                  <TableCell>
                    <div className="font-medium text-gray-900">
                      {connector.id}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <div className="font-medium text-gray-900">
                        {connector.name && connector.name.length > 30 ? (
                          <span title={connector.name}>
                            {connector.name.substring(0, 30)}&hellip;
                          </span>
                        ) : (
                          connector.name
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium text-gray-900">
                      {formatConnectorType(connector.type)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      {renderSyncProgress(connector)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {connector.organizationName || "Unknown"}
                      </div>
                      <div className="text-xs text-gray-500">
                        {connector.organizationDomain ||
                          connector.organizationId}
                      </div>
                    </div>
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
                      {formatDate(connector.lastSynced)}
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
                        <RefreshCcw
                              className={`h-3 w-3 mr-1  ${
                                syncingConnectorId === connector.id
                                  ? "animate-spin"
                                  : ""
                              }`}
                            />
                            <span className="text-xs text-gray-600">Sync</span>
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
        </CardContent>
      </Card>

      {/* Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* <Card>
          <CardHeader>
            <CardTitle>Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {connectorStats?.connectorStats.reduce((acc, stat) => {
                const status = stat.status
                if (!acc[status]) acc[status] = 0
                acc[status] += stat._count.id
                return acc
              }, {} as Record<string, number>).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Badge variant={getStatusColor(status) as any} className="mr-2">
                      {status}
                    </Badge>
                    <span className="text-sm text-gray-600 capitalize">
                      {status.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                  </div>
                  <span className="text-lg font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}

        <Card>
          <CardHeader>
            <CardTitle>Performance Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Rate</span>
                <span className="text-lg font-semibold text-green-600">
                  {connectorStats ? 
                    ((connectorStats.activeConnectors / connectorStats.totalConnectors) * 100).toFixed(1) : 0
                  }%
                </span>
              </div> */}
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Inactive Connectors
                </span>
                <span className="text-lg font-semibold text-yellow-600">
                  {connectorStats
                    ? connectorStats.totalConnectors -
                      connectorStats.activeConnectors
                    : 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Failed Syncs</span>
                <span className="text-lg font-semibold text-red-600">
                  {connectorStats?.connectorStats
                    .filter((stat) => stat.status === "syncFailed")
                    .reduce((sum, stat) => sum + stat._count.id, 0) || 0}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
