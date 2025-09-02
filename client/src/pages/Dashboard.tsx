import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import DataTable from "@/components/DataTable";
import FormField from "@/components/FormField";
import { ChartLine, Plus, BarChart3, LogOut, TrendingUp, TrendingDown } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

/**
 * Dashboard page component - main interface after login
 * Displays operations management interface with forms, tables, and statistics
 * Implements the complete design from the HTML reference
 */
export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form state for creating new operations
  const [operationType, setOperationType] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");

  // Filters for operations table
  const [filters, setFilters] = useState({
    type: "all-types",
    currency: "all-currencies", 
    search: "",
    page: 1,
    limit: 10,
  });

  /**
   * Fetch operations with current filters using React Query
   * Automatically refetches when filters change
   */
  const { data: operationsData, isLoading: operationsLoading } = useQuery({
    queryKey: ['/api/operations', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value.toString());
      });
      
      const response = await fetch(`/api/operations?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch operations');
      }
      
      return response.json();
    },
  });

  /**
   * Fetch operation statistics for dashboard cards
   */
  const { data: stats } = useQuery({
    queryKey: ['/api/operations/stats'],
    queryFn: async () => {
      const response = await fetch('/api/operations/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }
      
      return response.json();
    },
  });

  /**
   * Mutation for creating new operations
   * Handles form submission with proper validation and error handling
   */
  const createOperationMutation = useMutation({
    mutationFn: async (operationData: { type: string; amount: string; currency: string }) => {
      const response = await apiRequest('POST', '/api/operations', operationData);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch operations data
      queryClient.invalidateQueries({ queryKey: ['/api/operations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/operations/stats'] });
      
      // Reset form
      setOperationType("");
      setAmount("");
      setCurrency("");
      
      // Show success notification
      toast({
        title: "Success!",
        description: "Operation created successfully.",
      });
    },
    onError: (error: any) => {
      console.error('Create operation error:', error);
      toast({
        title: "Error",
        description: "Failed to create operation. Please try again.",
        variant: "destructive",
      });
    },
  });

  /**
   * Handle operation form submission
   * Validates form data before sending to API
   */
  const handleCreateOperation = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    if (!operationType || !amount || !currency) {
      toast({
        title: "Validation Error",
        description: "Please fill in all fields.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(amount) <= 0) {
      toast({
        title: "Validation Error",
        description: "Amount must be greater than 0.",
        variant: "destructive",
      });
      return;
    }

    if (currency.length < 3 || currency.length > 10) {
      toast({
        title: "Validation Error",
        description: "Currency must be between 3 and 10 characters.",
        variant: "destructive",
      });
      return;
    }

    // Submit form data
    createOperationMutation.mutate({
      type: operationType,
      amount,
      currency: currency.toUpperCase(),
    });
  };

  /**
   * Handle filter updates
   * Updates filters state which triggers automatic refetch
   */
  const updateFilter = (key: string, value: string | number) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      ...(key !== 'page' ? { page: 1 } : {}), // Reset to page 1 when changing filters
    }));
  };

  /**
   * Handle logout with confirmation
   */
  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  /**
   * Format currency amounts for display
   */
  const formatCurrency = (amount: string, currency: string) => {
    const num = parseFloat(amount);
    return `${currency} ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  /**
   * Get operation type badge styling
   */
  const getOperationBadge = (type: string) => {
    const isBuy = type === 'BUY';
    return {
      className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        isBuy ? 'bg-accent/10 text-accent' : 'bg-destructive/10 text-destructive'
      }`,
      icon: isBuy ? TrendingUp : TrendingDown,
    };
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Header */}
      <header className="bg-card border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo and Title */}
            <div className="flex items-center">
              <div className="bg-primary w-8 h-8 rounded-md flex items-center justify-center mr-3">
                <ChartLine className="text-primary-foreground text-sm" />
              </div>
              <h1 className="text-xl font-semibold text-foreground">Operations Dashboard</h1>
            </div>

            {/* User Menu */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-foreground" data-testid="text-user-email">
                  {user?.email}
                </p>
                <p className="text-xs text-muted-foreground" data-testid="text-user-role">
                  {user?.role === 'admin' ? 'Administrator' : 'User'}
                </p>
              </div>
              <Button
                variant="secondary"
                onClick={handleLogout}
                data-testid="button-logout"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Create Operation Form and Stats */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Create Operation Form */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plus className="text-primary mr-2 h-5 w-5" />
                  Create Operation
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateOperation} className="space-y-4">
                  {/* Operation Type Selection */}
                  <div className="space-y-2">
                    <Label htmlFor="operation-type">Operation Type</Label>
                    <Select value={operationType} onValueChange={setOperationType}>
                      <SelectTrigger data-testid="select-operation-type">
                        <SelectValue placeholder="Select type..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="BUY">Buy</SelectItem>
                        <SelectItem value="SELL">Sell</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Amount Input */}
                  <FormField
                    label="Amount"
                    value={amount}
                    onChange={setAmount}
                    type="number"
                    placeholder="0.00"
                    step="0.01"
                    min="0.01"
                    required
                    data-testid="input-amount"
                  />

                  {/* Currency Input */}
                  <FormField
                    label="Currency"
                    value={currency}
                    onChange={setCurrency}
                    placeholder="e.g., USD, EUR, BTC"
                    maxLength={10}
                    required
                    data-testid="input-currency"
                  />

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={createOperationMutation.isPending}
                    data-testid="button-create-operation"
                  >
                    {createOperationMutation.isPending ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Operation
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="text-accent mr-2 h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Operations</span>
                    <span className="font-semibold text-foreground" data-testid="text-stats-total">
                      {stats?.total || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Buy Operations</span>
                    <span className="font-semibold text-accent" data-testid="text-stats-buys">
                      {stats?.buys || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Sell Operations</span>
                    <span className="font-semibold text-destructive" data-testid="text-stats-sells">
                      {stats?.sells || 0}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Operations Table */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ChartLine className="text-primary mr-2 h-5 w-5" />
                  Operations History
                </CardTitle>
                
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                  <div>
                    <Label htmlFor="filter-type" className="text-sm text-muted-foreground">
                      Filter by Type
                    </Label>
                    <Select value={filters.type} onValueChange={(value) => updateFilter('type', value)}>
                      <SelectTrigger data-testid="select-filter-type">
                        <SelectValue placeholder="All Types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-types">All Types</SelectItem>
                        <SelectItem value="BUY">Buy Only</SelectItem>
                        <SelectItem value="SELL">Sell Only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="filter-currency" className="text-sm text-muted-foreground">
                      Filter by Currency
                    </Label>
                    <Select value={filters.currency} onValueChange={(value) => updateFilter('currency', value)}>
                      <SelectTrigger data-testid="select-filter-currency">
                        <SelectValue placeholder="All Currencies" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-currencies">All Currencies</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="BTC">BTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="search" className="text-sm text-muted-foreground">
                      Search
                    </Label>
                    <Input
                      id="search"
                      placeholder="Search operations..."
                      value={filters.search}
                      onChange={(e) => updateFilter('search', e.target.value)}
                      data-testid="input-search"
                    />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {/* Data Table Component */}
                <DataTable
                  data={operationsData?.operations || []}
                  total={operationsData?.total || 0}
                  page={filters.page}
                  limit={filters.limit}
                  isLoading={operationsLoading}
                  onPageChange={(page) => updateFilter('page', page)}
                  formatCurrency={formatCurrency}
                  getOperationBadge={getOperationBadge}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
