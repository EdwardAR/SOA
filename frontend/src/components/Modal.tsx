import React from 'react';

interface ModalProps {
  show: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onSave?: () => void;
  saveButtonText?: string;
  saveButtonColor?: string;
}

const Modal: React.FC<ModalProps> = ({
  show,
  title,
  children,
  onClose,
  onSave,
  saveButtonText = 'Guardar',
  saveButtonColor = 'primary',
}) => {
  if (!show) return null;

  return (
    <div
      className="modal d-block"
      tabIndex={-1}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    >
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header bg-primary text-white">
            <h5 className="modal-title">{title}</h5>
            <button
              type="button"
              className="btn-close btn-close-white"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">{children}</div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>
            {onSave && (
              <button
                type="button"
                className={`btn btn-${saveButtonColor}`}
                onClick={onSave}
              >
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
