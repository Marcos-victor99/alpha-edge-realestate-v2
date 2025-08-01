import { toast as sonnerToast } from "sonner";

// Interface compatível com o antigo sistema de toast
interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success';
  duration?: number;
}

// Hook para compatibilidade com o sistema anterior
export function useToast() {
  const toast = ({
    title,
    description,
    variant = 'default',
    duration = 4000,
    ...props
  }: ToastOptions) => {
    const message = title ? `${title}${description ? `: ${description}` : ''}` : description || '';
    
    switch (variant) {
      case 'destructive':
        return sonnerToast.error(message, { duration, ...props });
      case 'success':
        return sonnerToast.success(message, { duration, ...props });
      default:
        return sonnerToast(message, { duration, ...props });
    }
  };

  return {
    toast,
    dismiss: sonnerToast.dismiss,
  };
}

// Export direto do toast para compatibilidade
export const toast = (options: ToastOptions) => {
  const message = options.title 
    ? `${options.title}${options.description ? `: ${options.description}` : ''}` 
    : options.description || '';
    
  switch (options.variant) {
    case 'destructive':
      return sonnerToast.error(message, { duration: options.duration || 4000 });
    case 'success':
      return sonnerToast.success(message, { duration: options.duration || 4000 });
    default:
      return sonnerToast(message, { duration: options.duration || 4000 });
  }
};