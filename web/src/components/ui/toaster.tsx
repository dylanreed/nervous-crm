import { useToast } from './use-toast';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            'flex items-start gap-3 rounded-lg border p-4 shadow-lg bg-background',
            toast.variant === 'destructive' && 'border-destructive bg-destructive/10'
          )}
        >
          <div className="flex-1">
            {toast.title && (
              <p className={cn('text-sm font-semibold', toast.variant === 'destructive' && 'text-destructive')}>
                {toast.title}
              </p>
            )}
            {toast.description && (
              <p className="text-sm text-muted-foreground">{toast.description}</p>
            )}
          </div>
          <button
            onClick={() => dismiss(toast.id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
