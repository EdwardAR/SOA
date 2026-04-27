import React, { useEffect, useState } from 'react';
import { matriculasService } from '../api/services';
import Modal from '../components/Modal';

interface Matricula {
  id?: number;
  alumno_id: number;
  curso_id: number;
  fecha_matricula: string;
  estado: string;
}

const Matriculas: React.FC = () => {
  const [matriculas, setMatriculas] = useState<Matricula[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Matricula>({
    alumno_id: 0,
    curso_id: 0,
    fecha_matricula: new Date().toISOString().split('T')[0],
    estado: 'activa'
  });

  useEffect(() => {
    fetchMatriculas();
  }, []);

  const fetchMatriculas = async () => {
    try {
      setLoading(true);
      const response = await matriculasService.getAll();
      setMatriculas(response.data?.datos || []);
      setError('');
    } catch (err: any) {
      setError('Error al cargar matrículas');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (matricula?: Matricula) => {
    if (matricula) {
      setEditingId(matricula.id || null);
      setFormData(matricula);
    } else {
      setEditingId(null);
      setFormData({
        alumno_id: 0,
        curso_id: 0,
        fecha_matricula: new Date().toISOString().split('T')[0],
        estado: 'activa'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingId(null);
  };

  const handleSave = async () => {
    if (!formData.alumno_id || !formData.curso_id) {
      setError('Por favor selecciona alumno y curso');
      return;
    }

    try {
      if (editingId) {
        await matriculasService.update(editingId, formData);
        setSuccess('Matrícula actualizada correctamente');
      } else {
        await matriculasService.create(formData);
        setSuccess('Matrícula registrada correctamente');
      }
      handleCloseModal();
      fetchMatriculas();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al guardar matrícula');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('¿Estás seguro de eliminar esta matrícula?')) return;

    try {
      await matriculasService.delete(id);
      setSuccess('Matrícula eliminada correctamente');
      fetchMatriculas();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError('Error al eliminar matrícula');
      console.error(err);
      setTimeout(() => setError(''), 3000);
    }
  };

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-bookmark me-2"></i>
        Gestión de Matrículas
      </h1>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button type="button" className="btn-close" onClick={() => setError('')}></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button type="button" className="btn-close" onClick={() => setSuccess('')}></button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card">
          <div className="card-header bg-info text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Listado de Matrículas ({matriculas.length})</h5>
              <button 
                className="btn btn-sm btn-light"
                onClick={() => handleOpenModal()}
              >
                <i className="bi bi-plus-circle me-2"></i>
                Nueva Matrícula
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              {matriculas.length === 0 ? (
                <div className="alert alert-info">No hay matrículas registradas</div>
              ) : (
                <table className="table table-hover">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Alumno ID</th>
                      <th>Curso ID</th>
                      <th>Fecha de Matrícula</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matriculas.map((matricula) => (
                      <tr key={matricula.id}>
                        <td>{matricula.id}</td>
                        <td>{matricula.alumno_id}</td>
                        <td>{matricula.curso_id}</td>
                        <td>{new Date(matricula.fecha_matricula).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge bg-${matricula.estado === 'activa' ? 'success' : 'danger'}`}>
                            {matricula.estado}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleOpenModal(matricula)}
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(matricula.id!)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      <Modal
        show={showModal}
        title={editingId ? 'Editar Matrícula' : 'Nueva Matrícula'}
        onClose={handleCloseModal}
        onSave={handleSave}
      >
        <div className="mb-3">
          <label className="form-label">Alumno ID *</label>
          <input
            type="number"
            className="form-control"
            value={formData.alumno_id}
            onChange={(e) => setFormData({ ...formData, alumno_id: parseInt(e.target.value) })}
            placeholder="ID del alumno"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Curso ID *</label>
          <input
            type="number"
            className="form-control"
            value={formData.curso_id}
            onChange={(e) => setFormData({ ...formData, curso_id: parseInt(e.target.value) })}
            placeholder="ID del curso"
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Fecha de Matrícula</label>
          <input
            type="date"
            className="form-control"
            value={formData.fecha_matricula}
            onChange={(e) => setFormData({ ...formData, fecha_matricula: e.target.value })}
          />
        </div>
        <div className="mb-3">
          <label className="form-label">Estado</label>
          <select
            className="form-control"
            value={formData.estado}
            onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
          >
            <option value="activa">Activa</option>
            <option value="cancelada">Cancelada</option>
            <option value="suspendida">Suspendida</option>
          </select>
        </div>
      </Modal>
    </div>
  );
};

export default Matriculas;
