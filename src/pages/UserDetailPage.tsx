import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminApi } from "@/services/adminApi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageSquare, DollarSign, MessageCircle, CreditCard } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../components/ui/table";
import type { User, UserChat, ServiceUsage } from "../types/admin";

type TabType = "chats" | "service-usage";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [user, setUser] = useState<User | null>(null);
  const [chats, setChats] = useState<UserChat[]>([]);
  const [serviceUsage, setServiceUsage] = useState<ServiceUsage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingChats, setIsLoadingChats] = useState(true);
  const [isLoadingServiceUsage, setIsLoadingServiceUsage] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("chats");
  const [chatsDaysFilter, setChatsDaysFilter] = useState<string>("all");
  const [serviceUsageDaysFilter, setServiceUsageDaysFilter] = useState<string>("all");
  
  const [chatsPagination, setChatsPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });

  const [serviceUsagePagination, setServiceUsagePagination] = useState({
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
    if (id && activeTab === "chats") {
      fetchUserChats(id, chatsPagination.page, chatsPagination.limit, chatsDaysFilter);
    }
  }, [id, chatsPagination.page, chatsPagination.limit, activeTab, chatsDaysFilter]);

  useEffect(() => {
    if (id && activeTab === "service-usage") {
      fetchUserServiceUsage(id, serviceUsagePagination.page, serviceUsagePagination.limit, serviceUsageDaysFilter);
    }
  }, [id, serviceUsagePagination.page, serviceUsagePagination.limit, activeTab, serviceUsageDaysFilter]);

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

  const fetchUserChats = async (userId: string, page: number, limit: number, daysFilter: string) => {
    try {
      setIsLoadingChats(true);
      const days = daysFilter === "all" ? undefined : parseInt(daysFilter);
      const response = await adminApi.getUserChats(userId, page, limit, days);
      setChats(response.chats);
      setChatsPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch user chats:", error);
    } finally {
      setIsLoadingChats(false);
    }
  };

  const fetchUserServiceUsage = async (userId: string, page: number, limit: number, daysFilter: string) => {
    try {
      setIsLoadingServiceUsage(true);
      const days = daysFilter === "all" ? undefined : parseInt(daysFilter);
      const response = await adminApi.getUserServiceUsage(userId, page, limit, days);
      setServiceUsage(response.serviceUsage);
      setServiceUsagePagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch user service usage:", error);
    } finally {
      setIsLoadingServiceUsage(false);
    }
  };

  const handleChatsPageChange = (newPage: number) => {
    setChatsPagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleServiceUsagePageChange = (newPage: number) => {
    setServiceUsagePagination((prev) => ({ ...prev, page: newPage }));
  };

  const handleChatsDaysFilterChange = (value: string) => {
    setChatsDaysFilter(value);
    setChatsPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleServiceUsageDaysFilterChange = (value: string) => {
    setServiceUsageDaysFilter(value);
    setServiceUsagePagination((prev) => ({ ...prev, page: 1 }));
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
  const totalChats = chatsPagination.total;
  const totalCredits = serviceUsage.reduce((sum, usage) => sum + usage.creditsUsed, 0);

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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Chat Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalCost)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Credits</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCredits}</div>
          </CardContent>
        </Card>
      </div>

      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab("chats")}
            className={`${
              activeTab === "chats"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Chats
          </button>
          <button
            onClick={() => setActiveTab("service-usage")}
            className={`${
              activeTab === "service-usage"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Service Usage
          </button>
        </nav>
      </div>

      {activeTab === "chats" && (
        <Card>
          <CardHeader>
            <CardTitle>User Chats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Filter chats by time period
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Time Period:</label>
                <select
                  value={chatsDaysFilter}
                  onChange={(e) => handleChatsDaysFilterChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="1">Last 24 Hours</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>
              </div>
            </div>
            
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
                  Showing {((chatsPagination.page - 1) * chatsPagination.limit) + 1} to{' '}
                  {Math.min(chatsPagination.page * chatsPagination.limit, chatsPagination.total)} of{' '}
                  {chatsPagination.total} chats
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChatsPageChange(chatsPagination.page - 1)}
                    disabled={chatsPagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {chatsPagination.page} of {chatsPagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleChatsPageChange(chatsPagination.page + 1)}
                    disabled={chatsPagination.page >= chatsPagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === "service-usage" && (
        <Card>
          <CardHeader>
            <CardTitle>Service Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-gray-600">
                Filter service usage by time period
              </div>
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Time Period:</label>
                <select
                  value={serviceUsageDaysFilter}
                  onChange={(e) => handleServiceUsageDaysFilterChange(e.target.value)}
                  className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Time</option>
                  <option value="1">Last 24 Hours</option>
                  <option value="7">Last 7 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="90">Last 90 Days</option>
                </select>
              </div>
            </div>
            
            {isLoadingServiceUsage ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : serviceUsage.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No service usage found for this user
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Purpose</TableHead>
                    <TableHead>Credits Used</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceUsage.map((usage) => (
                    <TableRow key={usage.id}>
                      <TableCell className="font-medium">
                        {usage.purpose}
                      </TableCell>
                      <TableCell>{usage.creditsUsed}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(usage.timestamp)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {!isLoadingServiceUsage && serviceUsage.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-gray-700">
                  Showing {((serviceUsagePagination.page - 1) * serviceUsagePagination.limit) + 1} to{' '}
                  {Math.min(serviceUsagePagination.page * serviceUsagePagination.limit, serviceUsagePagination.total)} of{' '}
                  {serviceUsagePagination.total} records
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleServiceUsagePageChange(serviceUsagePagination.page - 1)}
                    disabled={serviceUsagePagination.page <= 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-gray-700">
                    Page {serviceUsagePagination.page} of {serviceUsagePagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleServiceUsagePageChange(serviceUsagePagination.page + 1)}
                    disabled={serviceUsagePagination.page >= serviceUsagePagination.pages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
