import { forwardRef, InputHTMLAttributes } from 'react';

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  required?: boolean;
}

export const FloatingLabelInput = forwardRef<HTMLInputElement, FloatingLabelInputProps>(
  ({ label, error, required, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        <div className="relative">
          <input
            ref={ref}
            className={`
              peer w-full px-4 pt-6 pb-2 text-base border rounded-lg outline-none transition-all
              placeholder-transparent
              ${error ? 'border-red-500' : 'border-gray-300'}
              focus:border-gray-900
              ${className}
            `}
            placeholder=" "
            {...props}
          />
          <label
            className={`
              absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-base
              transition-all pointer-events-none
              peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-base
              peer-focus:top-2 peer-focus:translate-y-0 peer-focus:text-xs
              peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:translate-y-0 peer-[:not(:placeholder-shown)]:text-xs
            `}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        </div>
        {error && (
          <div className="text-red-500 text-sm mt-2 ml-2" data-testid="text-error">
            {error}
          </div>
        )}
      </div>
    );
  }
);

FloatingLabelInput.displayName = 'FloatingLabelInput';
