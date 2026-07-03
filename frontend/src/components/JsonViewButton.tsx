import React, { useState } from 'react';

interface JsonViewButtonProps {
  data: any;
  role?: string;
  title?: string;
}

const JsonViewButton: React.FC<JsonViewButtonProps> = ({ data, role, title }) => {
  const [show, setShow] = useState(false);

  if (role !== 'administrativo' && role !== 'director') return null;

  return (
    <>
      <button
        className="btn btn-sm"
        onClick={() => setShow(true)}
        title="Ver JSON"
        style={{ background: 'rgba(109,40,217,0.08)', color: '#6d28d9', border: '1px solid rgba(109,40,217,0.2)', borderRadius: 8 }}
      >
        <i className="bi bi-braces"></i>
      </button>
      {show && (
        <div
          className="modal d-block"
          tabIndex={-1}
          style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setShow(false); }}
        >
          <div className="modal-dialog modal-lg modal-dialog-scrollable" style={{ margin: '3rem auto 1rem' }}>
            <div className="modal-content app-modal-content">
              <div className="modal-header app-modal-header">
                <h5 className="modal-title fw-bold">
                  <i className="bi bi-braces me-2"></i>
                  {title || 'Datos en JSON'}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShow(false)} />
              </div>
              <div className="modal-body p-0">
                <pre className="m-0 p-4" style={{ fontSize: '0.8rem', maxHeight: '70vh', overflow: 'auto', background: '#1e1e2e', color: '#cdd6f4', borderRadius: 0 }}>
                  <code>{JSON.stringify(data, null, 2)}</code>
                </pre>
              </div>
              <div className="modal-footer app-modal-footer">
                <button
                  className="btn btn-outline-secondary px-4"
                  onClick={() => { navigator.clipboard.writeText(JSON.stringify(data, null, 2)); }}
                  style={{ borderRadius: 12, fontWeight: 600 }}
                >
                  <i className="bi bi-clipboard me-1"></i> Copiar
                </button>
                <button
                  className="btn btn-primary px-4"
                  onClick={() => setShow(false)}
                  style={{ borderRadius: 12, fontWeight: 600 }}
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default JsonViewButton;
