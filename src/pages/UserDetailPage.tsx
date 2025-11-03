import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/services/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, DollarSign, MessageCircle } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import type { User, UserChat } from "../types/admin";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<UserChat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  useEffect(() => {
    if (id) {
      fetchUserDetails(id);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchUserChats(id, pagination.page, pagination.limit);
    }
  }, [id, pagination.page, pagination.limit]);

  const fetchUserDetails = async (userId: string) => {
    try {
      setIsLoading(true);
      const userData = await adminApi.getUser(userId);
      setUser(userData);
    } catch (error) {
      console.error("Failed to fetch user details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserChats = async (userId: string, page: number, limit: number) => {
    try {
      setIsLoadingChats(true);
      const response = await adminApi.getUserChats(userId, page, limit);
      setChats(response.chats);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch user chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <div className="text-center">
          <p className="text-gray-500">User not found</p>
          <Button
            variant="outline"
            onClick={() => navigate("/admin/users")}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Users
          </Button>
        </div>
      </div>
    );
  }

  const totalCost = chats.reduce((sum, chat) => sum + chat.totalCost, 0);
  const totalMessages = chats.reduce((sum, chat) => sum + chat.numberOfMessages, 0);
  const totalChats = chats.length;

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            onClick={() => navigate("/admin/users")}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              {user.name || user.email}
            </h1>
            <p className="text-gray-600 mt-1">{user.email}</p>
            {user.organization && (
              <p className="text-gray-500 text-sm">
                {user.organization.name} • @{user.organization.emailDomain}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Badge variant={user.role === "superadmin" ? "success" : "default"}>
            {user.role}
          </Badge>
          <Badge variant={user.verified ? "success" : "default"}>
            {user.verified ? "Verified" : "Unverified"}
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Chats</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalChats}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Messages</CardTitle>
            <MessageCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMessages}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>User Chats</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingChats ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : chats.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No chats found for this user
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Messages</TableHead>
                  <TableHead>AI Messages</TableHead>
                  <TableHead>User Messages</TableHead>
                  <TableHead>Input Cost</TableHead>
                  <TableHead>Output Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Updated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {chats.map((chat) => (
                  <TableRow key={chat.chatId}>
                    <TableCell className="font-medium">
                      {chat.title || <span className="text-gray-400 italic">Untitled</span>}
                    </TableCell>
                    <TableCell>{chat.numberOfMessages}</TableCell>
                    <TableCell>{chat.numberOfAIMessages}</TableCell>
                    <TableCell>{chat.numberOfUserMessages}</TableCell>
                    <TableCell>{formatCurrency(chat.inputTokenCost)}</TableCell>
                    <TableCell>{formatCurrency(chat.outputTokenCost)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(chat.totalCost)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(chat.createdAt)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatDate(chat.updatedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {!isLoadingChats && chats.length > 0 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-gray-700">
                Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                {pagination.total} chats
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
    </div>
  );
}

