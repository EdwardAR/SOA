import React from 'react';

interface ConfirmModalProps {
  show: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  show,
  title = 'Confirmar acción',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!show) return null;

  const iconMap: Record<string, string> = {
    danger: 'bi-exclamation-triangle-fill text-danger',
    warning: 'bi-exclamation-circle-fill text-warning',
    primary: 'bi-question-circle-fill text-primary',
  };

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.55)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: 420 }}>
        <div className="modal-content confirm-modal-content">
          <div className="modal-body p-4 text-center">
            <i className={`bi ${iconMap[variant]} mb-3`} style={{ fontSize: '2.5rem' }}></i>
            <h5 className="fw-700 mb-2">{title}</h5>
            <p className="text-muted mb-4" style={{ fontSize: '0.95rem' }}>{message}</p>
            <div className="d-flex gap-2 justify-content-center">
              <button
                className="btn btn-outline-secondary px-4"
                onClick={onCancel}
                style={{ borderRadius: 12, fontWeight: 600 }}
              >
                {cancelText}
              </button>
              <button
                className={`btn btn-${variant} px-4`}
                onClick={onConfirm}
                style={{ borderRadius: 12, fontWeight: 600 }}
              >
                {confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
