import { toast } from "sonner";

export const showToast = {
  success: (message: string) => {
    toast.success(message);
  },
  
  error: (message: string) => {
    toast.error(message);
  },
  
  warning: (message: string) => {
    toast.warning(message);
  },
  
  info: (message: string) => {
    toast.info(message);
  },
  
  loading: (message: string) => {
    return toast.loading(message);
  },
  
  promise: <T>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return toast.promise(promise, {
      loading,
      success,
      error,
    });
  },
};

// For backward compatibility with existing useToast hook
export const useToast = () => {
  return {
    addToast: ({ type, title }: { type: 'success' | 'error' | 'warning' | 'info'; title: string }) => {
      showToast[type](title);
    },
  };
};