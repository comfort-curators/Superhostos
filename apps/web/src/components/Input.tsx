import { cn } from '../lib/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label className="block text-sm font-medium text-[#1A1914]">{label}</label>}
      <input
        className={cn(
          'w-full rounded-lg border border-[#E8E0D8] bg-white px-3 py-2 text-[#1A1914] placeholder:text-[#8B7B6B]',
          'focus:outline-none focus:ring-2 focus:ring-[#8C6D3F]',
          error && 'border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
