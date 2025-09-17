import React, { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { Badge } from '../components/ui/badge'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Select } from '../components/ui/select'
import { adminApi } from '../services/adminApi'
import type { User, Organization, UserFilters } from '../types/admin'

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<UserFilters>({
    page: 1,
    limit: 50
  })
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    total: 0,
    pages: 0
  })
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    fetchUsers()
  }, [filters])

  const fetchOrganizations = async () => {
    try {
      const data = await adminApi.getOrganizations()
      setOrganizations(data)
    } catch (error) {
      console.error('Failed to fetch organizations:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await adminApi.getUsers(filters)
      setUsers((response as any).users)
      setPagination(response.pagination)
    } catch (error) {
      console.error('Failed to fetch users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setSelectedUser(user)
    setShowEditModal(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return
    
    try {
      await adminApi.deleteUser(id)
      await fetchUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
    }
  }

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }))
  }

  const handleFilterChange = (key: keyof UserFilters, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading users...</div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Users</h1>
        <div className="text-sm text-gray-500">
          Total: {pagination.total.toLocaleString()}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-left">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search users..."
              value={filters.search || ''}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
            <Select
              options={[
                { value: '', label: 'All Roles' },
                { value: 'user', label: 'User' },
                { value: 'admin', label: 'Admin' },
                { value: 'superadmin', label: 'Super Admin' }
              ]}
              value={filters.role || ''}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            />
            <Select
              options={[
                { value: '', label: 'All Organizations' },
                ...organizations.map(org => ({
                  value: org.id,
                  label: org.name
                }))
              ]}
              value={filters.organizationId || ''}
              onChange={(e) => handleFilterChange('organizationId', e.target.value)}
            />
            <Select
              options={[
                { value: '50', label: '50 per page' },
                { value: '100', label: '100 per page' },
                { value: '200', label: '200 per page' }
              ]}
              value={String(filters.limit || 50)}
              onChange={(e) => handleFilterChange('limit', Number(e.target.value))}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='text-left'>All Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Organization</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center">
                      {user.avatar && (
                        <img
                          src={user.avatar}
                          alt={user.name || user.email}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                      )}
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.name || 'No name'}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">
                      {user.organization?.name || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === 'superadmin' ? 'error' :
                        user.role === 'admin' ? 'warning' : 'default'
                      }
                    >
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Badge variant={user.verified ? 'success' : 'warning'}>
                        {user.verified ? 'Verified' : 'Unverified'}
                      </Badge>
                      {user.onboardingComplete && (
                        <Badge variant="info">Onboarded</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600">
                      <div>Chats: {user._count?.chats || 0}</div>
                      <div>Connectors: {user._count?.connectors || 0}</div>
                      <div>Files: {user.filesProcessed}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(user)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/admin/users/${user.id}`, '_blank')}
                      >
                        View
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(user.id)}
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

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} results
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {showEditModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          organizations={organizations}
          onClose={() => {
            setShowEditModal(false)
            setSelectedUser(null)
          }}
          onSave={async (updatedUser) => {
            try {
              await adminApi.updateUser(selectedUser.id, updatedUser)
              await fetchUsers()
              setShowEditModal(false)
              setSelectedUser(null)
            } catch (error) {
              console.error('Failed to update user:', error)
            }
          }}
        />
      )}
    </div>
  )
}

interface EditUserModalProps {
  user: User
  organizations: Organization[]
  onClose: () => void
  onSave: (data: Partial<User>) => void
}

function EditUserModal({ user, organizations, onClose, onSave }: EditUserModalProps) {
  const [formData, setFormData] = useState({
    name: user.name || '',
    email: user.email,
    role: user.role,
    verified: user.verified,
    onboardingComplete: user.onboardingComplete
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg p-6 w-full max-w-md">
    <h2 className="text-xl font-semibold mb-4">Edit User</h2>
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
          Name
        </label>
        <Input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
          Email
        </label>
        <Input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
          Role
        </label>
        <Select
          options={[
            { value: 'user', label: 'User' },
            { value: 'admin', label: 'Admin' },
            { value: 'superadmin', label: 'Super Admin' }
          ]}
          value={formData.role}
          onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
        />
      </div>
      <div className="flex items-center space-x-4">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.verified}
            onChange={(e) => setFormData({ ...formData, verified: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Verified</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.onboardingComplete}
            onChange={(e) => setFormData({ ...formData, onboardingComplete: e.target.checked })}
            className="mr-2"
          />
          <span className="text-sm">Onboarding Complete</span>
        </label>
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit">
          Save Changes
        </Button>
      </div>
    </form>
  </div>
</div>
  )
} 