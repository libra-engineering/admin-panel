import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { serviceApi } from '@/services/serviceApi';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Server, 
  Settings, 
  Activity, 
  RefreshCw, 
  AlertCircle,
  CheckCircle,
  FileText,
  Power
} from 'lucide-react';

interface ServiceStatus {
  status: 'healthy' | 'unhealthy' | 'unknown';
  uptime: string;
  version: string;
  lastUpdated: string;
}

export default function ServiceDashboard() {
  const [serviceStatus, setServiceStatus] = useState<ServiceStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchServiceStatus();
  }, []);

  const fetchServiceStatus = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const status = await serviceApi.getServiceStatus() as ServiceStatus;
      setServiceStatus(status);
    } catch (error) {
      console.error('Failed to fetch service status:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch service status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestartService = async () => {
    try {
      await serviceApi.restartService();
      // Refresh status after restart
      setTimeout(fetchServiceStatus, 2000);
    } catch (error) {
      console.error('Failed to restart service:', error);
      setError(error instanceof Error ? error.message : 'Failed to restart service');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Activity className="h-6 w-6 mr-2" />
            Service Dashboard
          </h1>
          <p className="text-gray-600 mt-1">Monitor and manage your service API status</p>
        </div>
        <Button
          onClick={fetchServiceStatus}
          variant="outline"
          size="sm"
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Service Status Card */}
      <Card>
        <div className="p-6">
          <h2 className="text-lg font-medium text-gray-900 flex items-center mb-4">
            <Server className="h-5 w-5 mr-2" />
            Service Status
          </h2>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : serviceStatus ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center">
                <div className="flex items-center mr-3">
                  {serviceStatus.status === 'healthy' ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <Badge 
                    variant={serviceStatus.status === 'healthy' ? 'success' : 'error'}
                    className="mt-1"
                  >
                    {serviceStatus.status}
                  </Badge>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Uptime</p>
                <p className="text-lg font-semibold text-gray-900">{serviceStatus.uptime}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-gray-500">Version</p>
                <p className="text-lg font-semibold text-gray-900">{serviceStatus.version}</p>
              </div>
            </div>
          ) : (
            <p className="text-gray-500">Unable to fetch service status</p>
          )}
        </div>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <Settings className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Environment Variables</h3>
                <p className="text-sm text-gray-500">Manage service configuration variables</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/service/env-variables">
                <Button variant="outline" className="w-full">
                  Manage Variables
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-500">View usage metrics and performance</p>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/service/analytics">
                <Button variant="outline" className="w-full">
                  View Analytics
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <div className="p-6">
            <div className="flex items-center">
              <Power className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Service Control</h3>
                <p className="text-sm text-gray-500">Restart or manage service operations</p>
              </div>
            </div>
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleRestartService}
              >
                Restart Service
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
} 