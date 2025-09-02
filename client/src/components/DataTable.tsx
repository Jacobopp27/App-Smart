import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, ArrowUpDown } from "lucide-react";

/**
 * Operation interface matching the backend Operation type
 */
interface Operation {
  id: string;
  type: string;
  amount: string;
  currency: string;
  createdAt: string;
}

/**
 * DataTable component props interface
 */
interface DataTableProps {
  data: Operation[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  onPageChange: (page: number) => void;
  formatCurrency: (amount: string, currency: string) => string;
  getOperationBadge: (type: string) => { className: string; icon: any };
}

/**
 * DataTable component for displaying operations with pagination
 * Features responsive design, loading states, and interactive pagination
 * Implements the table design from the HTML reference
 * 
 * @param {DataTableProps} props - Component props
 */
export default function DataTable({
  data,
  total,
  page,
  limit,
  isLoading,
  onPageChange,
  formatCurrency,
  getOperationBadge,
}: DataTableProps) {
  /**
   * Calculate pagination values
   */
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit + 1;
  const endIndex = Math.min(page * limit, total);

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date string
   */
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  /**
   * Truncate ID for display (show first 8 characters + ellipsis)
   * @param {string} id - Full UUID
   * @returns {string} Truncated ID
   */
  const truncateId = (id: string) => {
    return id.substring(0, 8) + '...';
  };

  /**
   * Generate pagination numbers to display
   * Shows current page, surrounding pages, and first/last pages
   */
  const getPaginationNumbers = () => {
    const numbers = [];
    const showEllipsis = totalPages > 7;

    if (!showEllipsis) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        numbers.push(i);
      }
    } else {
      // Show smart pagination with ellipsis
      if (page <= 4) {
        // Show first pages
        for (let i = 1; i <= 5; i++) {
          numbers.push(i);
        }
        numbers.push('...');
        numbers.push(totalPages);
      } else if (page >= totalPages - 3) {
        // Show last pages
        numbers.push(1);
        numbers.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) {
          numbers.push(i);
        }
      } else {
        // Show middle pages
        numbers.push(1);
        numbers.push('...');
        for (let i = page - 1; i <= page + 1; i++) {
          numbers.push(i);
        }
        numbers.push('...');
        numbers.push(totalPages);
      }
    }

    return numbers;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading operations...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Data Table */}
      <div className="overflow-x-auto">
        <table className="w-full" data-testid="table-operations">
          <thead className="bg-muted/20">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto font-medium text-xs uppercase hover:text-foreground"
                  data-testid="button-sort-id"
                >
                  ID
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto font-medium text-xs uppercase hover:text-foreground"
                  data-testid="button-sort-type"
                >
                  Type
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto font-medium text-xs uppercase hover:text-foreground"
                  data-testid="button-sort-amount"
                >
                  Amount
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Currency
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="p-0 h-auto font-medium text-xs uppercase hover:text-foreground"
                  data-testid="button-sort-date"
                >
                  Created At
                  <ArrowUpDown className="ml-1 h-3 w-3" />
                </Button>
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border">
            {data.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-muted-foreground">
                  <div className="text-center">
                    <p className="text-lg font-medium mb-2">No operations found</p>
                    <p className="text-sm">Create your first operation to get started.</p>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((operation) => {
                const badge = getOperationBadge(operation.type);
                const IconComponent = badge.icon;
                
                return (
                  <tr 
                    key={operation.id} 
                    className="hover:bg-muted/5 transition-colors cursor-pointer"
                    data-testid={`row-operation-${operation.id}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-muted-foreground">
                      <span data-testid={`text-id-${operation.id}`}>
                        {truncateId(operation.id)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={badge.className}>
                        <IconComponent className="h-3 w-3 mr-1" />
                        <span data-testid={`text-type-${operation.id}`}>{operation.type}</span>
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-foreground">
                      <span data-testid={`text-amount-${operation.id}`}>
                        {formatCurrency(operation.amount, operation.currency)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <span data-testid={`text-currency-${operation.id}`}>{operation.currency}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <span data-testid={`text-date-${operation.id}`}>
                        {formatDate(operation.createdAt)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 0 && (
        <div className="bg-muted/10 px-6 py-3 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing <span className="font-medium" data-testid="text-pagination-start">{startIndex}</span> to{' '}
              <span className="font-medium" data-testid="text-pagination-end">{endIndex}</span> of{' '}
              <span className="font-medium" data-testid="text-pagination-total">{total}</span> results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                data-testid="button-previous-page"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Previous
              </Button>
              
              {getPaginationNumbers().map((num, index) => (
                num === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 py-1 text-sm text-muted-foreground">
                    ...
                  </span>
                ) : (
                  <Button
                    key={num}
                    variant={num === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => onPageChange(num as number)}
                    data-testid={`button-page-${num}`}
                  >
                    {num}
                  </Button>
                )
              ))}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                data-testid="button-next-page"
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
