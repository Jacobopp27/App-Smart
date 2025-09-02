import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Toast notification component providing user feedback
 * Displays success, error, warning, and info messages
 * Automatically dismisses after timeout or manual close
 * 
 * This component extends the existing shadcn toast system
 * with custom styling and icons for better user experience
 */
export default function Toast() {
  const { toasts, dismiss } = useToast();

  /**
   * Get appropriate icon for toast variant
   * @param {string} variant - Toast variant type
   * @returns {JSX.Element} Icon component
   */
  const getToastIcon = (variant: string | null | undefined = "default") => {
    switch (variant) {
      case "destructive":
        return <XCircle className="h-5 w-5" />;
      case "success":
        return <CheckCircle className="h-5 w-5" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  /**
   * Get toast container styling based on variant
   * @param {string} variant - Toast variant type
   * @returns {string} CSS classes
   */
  const getToastStyling = (variant: string | null | undefined = "default") => {
    const baseClasses = "fixed top-4 right-4 z-50 max-w-sm rounded-lg shadow-lg border p-4 transition-all duration-300";
    
    switch (variant) {
      case "destructive":
        return `${baseClasses} bg-destructive border-destructive/20 text-destructive-foreground`;
      case "success":
        return `${baseClasses} bg-accent border-accent/20 text-accent-foreground`;
      case "warning":
        return `${baseClasses} bg-amber-500 border-amber-500/20 text-white`;
      default:
        return `${baseClasses} bg-card border-border text-foreground`;
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => {
        const Icon = getToastIcon(toast.variant);
        
        return (
          <div
            key={toast.id}
            className={getToastStyling(toast.variant)}
            data-testid={`toast-${toast.variant || 'default'}`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                {Icon}
              </div>
              <div className="flex-1">
                {toast.title && (
                  <p className="font-medium mb-1" data-testid="toast-title">
                    {toast.title}
                  </p>
                )}
                {toast.description && (
                  <p className="text-sm opacity-90" data-testid="toast-description">
                    {toast.description}
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="ml-3 h-6 w-6 p-0 hover:bg-white/20"
                onClick={() => dismiss(toast.id)}
                data-testid="button-close-toast"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
