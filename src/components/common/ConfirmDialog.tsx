import { useTranslation } from 'react-i18next';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  variant = 'danger',
}: ConfirmDialogProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const variantStyles = {
    danger: 'bg-error text-white hover:bg-error/90',
    warning: 'bg-clay text-white hover:bg-clay/90',
    info: 'bg-terracotta text-white hover:bg-terracotta/90',
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-[60]"
      onClick={onClose}
    >
      <div
        className="bg-sand rounded-xl max-w-md w-full shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 pb-4">
          <h3 className="text-xl font-bold text-earth mb-2">{title}</h3>
          <p className="text-text-secondary leading-relaxed">{message}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-6 pt-4 border-t border-sepia/10">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-white border border-sepia/20 text-text-primary rounded-lg font-medium hover:bg-sand transition-colors"
          >
            {cancelText || t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition-colors ${variantStyles[variant]}`}
          >
            {confirmText || t('common.delete', 'Delete')}
          </button>
        </div>
      </div>
    </div>
  );
}
