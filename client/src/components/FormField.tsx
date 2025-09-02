import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Reusable form field component with consistent styling
 * Provides a standardized input field with label for forms throughout the app
 * 
 * @param {Object} props - Component props
 */
interface FormFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  maxLength?: number;
  step?: string;
  min?: string;
  "data-testid"?: string;
}

export default function FormField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required = false,
  disabled = false,
  maxLength,
  step,
  min,
  "data-testid": testId,
}: FormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase().replace(' ', '-')} className="text-sm font-medium">
        {label}
        {required && <span className="text-destructive ml-1">*</span>}
      </Label>
      <Input
        id={label.toLowerCase().replace(' ', '-')}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        maxLength={maxLength}
        step={step}
        min={min}
        className="w-full"
        data-testid={testId}
      />
    </div>
  );
}
