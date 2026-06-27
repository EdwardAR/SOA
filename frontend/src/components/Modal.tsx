import React, { useEffect } from 'react';

interface ModalProps {
  show: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave?: () => void;
  saveButtonText?: string;
  saveButtonColor?: string;
  error?: string;
  success?: string;
  size?: 'sm' | 'md' | 'lg';
}

const Modal: React.FC<ModalProps> = ({
  show,
  title,
  children,
  onClose,
  onSave,
  saveButtonText = 'Guardar',
  saveButtonColor = 'primary',
  error,
  success,
  size = 'md',
}) => {
  useEffect(() => {
    if (show) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [show]);

  if (!show) return null;

  const sizeClass = size === 'lg' ? 'modal-lg' : size === 'sm' ? 'modal-sm' : '';

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`modal-dialog modal-dialog-scrollable ${sizeClass}`}
        style={{ margin: '3rem auto 1rem' }}
      >
        <div className="modal-content app-modal-content">
          <div className="modal-header app-modal-header">
            <h5 className="modal-title fw-bold">
              <i className="bi bi-pencil-square me-2 opacity-75"></i>
              {title}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
              aria-label="Cerrar"
            />
          </div>

          <div className="modal-body px-4 py-3">
            {error && (
              <div className="alert alert-danger d-flex align-items-center gap-2 py-2 mb-3" role="alert">
                <i className="bi bi-x-circle-fill flex-shrink-0"></i>
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="alert alert-success d-flex align-items-center gap-2 py-2 mb-3" role="alert">
                <i className="bi bi-check-circle-fill flex-shrink-0"></i>
                <span>{success}</span>
              </div>
            )}
            {children}
          </div>

          <div className="modal-footer app-modal-footer">
            <button
              type="button"
              className="btn btn-outline-secondary px-4"
              onClick={onClose}
              style={{ borderRadius: 12, fontWeight: 600 }}
            >
              Cancelar
            </button>
            {onSave && (
              <button
                type="button"
                className={`btn btn-${saveButtonColor} px-4`}
                onClick={onSave}
                style={{ borderRadius: 12, fontWeight: 600 }}
              >
                <i className="bi bi-check2 me-1"></i>
                {saveButtonText}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
