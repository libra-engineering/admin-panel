import { useState } from 'react';
import { serviceApi } from '@/services/serviceApi';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { 
  Users, 
  UserPlus, 
  AlertCircle, 
  CheckCircle, 
  Eye, 
  EyeOff
} from 'lucide-react';

interface CreateUserForm {
  email: string;
  password: string;
  confirmPassword: string;
  name: string;
  role: string;
}

export default function ServiceUsersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [form, setForm] = useState<CreateUserForm>({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'admin'
  });

  const roleOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'super_admin', label: 'Super Admin' },
    { value: 'service_admin', label: 'Service Admin' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!form.email || !form.password || !form.name) {
      setError('Please fill in all required fields');
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setSuccess(null);

      await serviceApi.createAdminUser({
        email: form.email,
        password: form.password,
        name: form.name,
        role: form.role
      });

      setSuccess(`Admin user "${form.name}" created successfully!`);
      
      // Reset form
      setForm({
        email: '',
        password: '',
        confirmPassword: '',
        name: '',
        role: 'admin'
      });

    } catch (error) {
      console.error('Failed to create admin user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create admin user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof CreateUserForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear messages when user starts typing
    if (error) setError(null);
    if (success) setSuccess(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            User Management
          </h1>
          <p className="text-gray-600 mt-1">Create and manage admin users for the service</p>
        </div>
      </div>

     
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <div className="ml-3">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          </div>
        </div>
      )}

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

      {/* Create User Form */}
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center">
            <UserPlus className="h-5 w-5 mr-2" />
            Create New Admin User
          </h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name *
                </label>
                <Input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Enter full name"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="admin@example.com"
                  required
                  disabled={isLoading}
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password *
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder="Enter password (min 8 characters)"
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Password must be at least 8 characters long
                </p>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password *
                </label>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    placeholder="Confirm password"
                    required
                    disabled={isLoading}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-3 w-3" />
                    ) : (
                      <Eye className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Role */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role *
                </label>
                <Select
                  value={form.role}
                  onChange={(e) => handleInputChange('role', e.target.value)}
                  disabled={isLoading}
                  options={roleOptions}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Select the appropriate role for this admin user
                </p>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setForm({
                    email: '',
                    password: '',
                    confirmPassword: '',
                    name: '',
                    role: 'admin'
                  });
                  setError(null);
                  setSuccess(null);
                }}
                disabled={isLoading}
              >
                Reset Form
              </Button>
              <Button
                type="submit"
                disabled={isLoading || !form.email || !form.password || !form.name}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Create Admin User
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>

      
    </div>
  );
} 