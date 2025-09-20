import { useToast as useToastContext } from '../contexts/ToastContext';

export function useToast() {
  const { showToast, hideToast, hideAllToasts } = useToastContext();

  const showSuccess = (title: string, message?: string, duration?: number) => {
    showToast({
      type: 'success',
      title,
      message,
      duration,
    });
  };

  const showError = (title: string, message?: string, duration?: number) => {
    showToast({
      type: 'error',
      title,
      message,
      duration,
    });
  };

  const showWarning = (title: string, message?: string, duration?: number) => {
    showToast({
      type: 'warning',
      title,
      message,
      duration,
    });
  };

  const showInfo = (title: string, message?: string, duration?: number) => {
    showToast({
      type: 'info',
      title,
      message,
      duration,
    });
  };

  return {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    hideToast,
    hideAllToasts,
  };
}
