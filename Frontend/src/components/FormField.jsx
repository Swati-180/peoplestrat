import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";

/**
 * FormField Component
 * 
 * Provides consistent styling and visual feedback for form inputs.
 * 
 * @param {string} label - The label text
 * @param {boolean} required - Whether the field is required
 * @param {string} error - Error message to display
 * @param {string} success - Success message to display
 * @param {string} warning - Warning message to display
 * @param {boolean} touched - Whether the field has been interacted with
 * @param {React.ReactNode} children - The input element
 * @param {string} className - Additional container classes
 */
export function FormField({
  label,
  required,
  error,
  success,
  warning,
  touched,
  children,
  className,
}) {
  const hasError = touched && !!error;
  const hasSuccess = touched && !!success && !error;
  const hasWarning = touched && !!warning && !error && !success;

  return (
    <div className={cn("space-y-2 w-full", className)}>
      <div className="flex justify-between items-center">
        <Label className={cn("text-sm font-semibold", required && "after:content-['*'] after:ml-0.5 after:text-red-500")}>
          {label}
        </Label>
      </div>
      
      <div className="relative">
        {React.cloneElement(children, {
          className: cn(
            children.props.className,
            "pr-10",
            hasError && "border-red-500 focus-visible:ring-red-500",
            hasSuccess && "border-emerald-500 focus-visible:ring-emerald-500",
            hasWarning && "border-amber-500 focus-visible:ring-amber-500"
          ),
        })}
        
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
          {hasError && <XCircle className="h-4 w-4 text-red-500" />}
          {hasSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
          {hasWarning && <AlertCircle className="h-4 w-4 text-amber-500" />}
        </div>
      </div>

      {hasError && (
        <p className="text-[12px] font-medium text-red-500 mt-1 animate-in fade-in slide-in-from-top-1">
          {error}
        </p>
      )}
      
      {hasSuccess && !error && (
        <p className="text-[12px] font-medium text-emerald-600 mt-1 animate-in fade-in slide-in-from-top-1">
          {success}
        </p>
      )}

      {hasWarning && !error && !success && (
        <p className="text-[12px] font-medium text-amber-600 mt-1 animate-in fade-in slide-in-from-top-1">
          {warning}
        </p>
      )}
    </div>
  );
}
