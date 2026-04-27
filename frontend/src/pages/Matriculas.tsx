import React, { useEffect, useState } from 'react';
import { matriculasService, alumnosService, cursosService } from '../api/services';
import Modal from '../components/Modal';

interface Matricula {
  id?: string;
  alumno_id?: string;
  curso_id?: string;
  fecha_matricula?: string;
  estado?: string;
}

const Matriculas: React.FC = () => {
  const [matriculas, setMatriculas] = useState<any[]>([]);
  const [alumnos, setAlumnos] = useState<any[]>([]);
  const [cursos, setCursos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Matricula>({
    alumno_id: '',
    curso_id: '',
    fecha_matricula: new Date().toISOString().split('T')[0],
    estado: 'activa'
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [matResponse, almResponse, curResponse] = await Promise.all([
        matriculasService.getAll(),
        alumnosService.getAll(),
        cursosService.getAll()
      ]);
      setMatriculas(matResponse.data?.datos || []);
      setAlumnos(almResponse.data?.datos || []);
      setCursos(curResponse.data?.datos || []);
      setError('');
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleOpenModal = (matricula?: any) => {
    if (matricula) {
      setEditingId(matricula.id);
      setFormData({
        id: matricula.id,
        alumno_id: matricula.alumno_id,
        curso_id: matricula.curso_id,
        fecha_matricula: matricula.fecha_matricula,
        estado: matricula.estado || 'activa'
      });
    } else {
      setEditingId(null);
      setFormData({
        alumno_id: '',
        curso_id: '',
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
      setError('');
      if (editingId) {
        await matriculasService.update(editingId, formData);
        setSuccess('Matrícula actualizada correctamente');
      } else {
        await matriculasService.create(formData);
        setSuccess('Matrícula registrada correctamente');
      }
      handleCloseModal();
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Save error:', err);
      setError(err.response?.data?.mensaje || 'Error al guardar matrícula');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta matrícula?')) return;

    try {
      await matriculasService.delete(id);
      setSuccess('Matrícula eliminada correctamente');
      fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.response?.data?.mensaje || 'Error al eliminar matrícula');
    }
  };

  const getAlumnoNombre = (id: string) => {
    const alumno = alumnos.find(a => a.id === id);
    return alumno ? `${alumno.primer_nombre} ${alumno.apellido_paterno}` : '-';
  };

  const getCursoNombre = (id: string) => {
    const curso = cursos.find(c => c.id === id);
    return curso ? curso.nombre : '-';
  };

  return (
    <div className="container-fluid p-4">
      <h1 className="mb-4">
        <i className="bi bi-clipboard-check me-2"></i>
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
              <button className="btn btn-sm btn-light" onClick={() => handleOpenModal()}>
                <i className="bi bi-plus-circle me-2"></i>
                Nueva Matrícula
              </button>
            </div>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>Alumno</th>
                    <th>Curso</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {matriculas.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-muted">
                        No hay matrículas registradas
                      </td>
                    </tr>
                  ) : (
                    matriculas.map((matricula) => (
                      <tr key={matricula.id}>
                        <td>{getAlumnoNombre(matricula.alumno_id)}</td>
                        <td>{getCursoNombre(matricula.curso_id)}</td>
                        <td>{matricula.fecha_matricula || '-'}</td>
                        <td>
                          <span className={`badge ${matricula.estado === 'activa' ? 'bg-success' : 'bg-danger'}`}>
                            {matricula.estado}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-primary me-2" onClick={() => handleOpenModal(matricula)} title="Editar">
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(matricula.id)} title="Eliminar">
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <Modal
        show={showModal}
        title={editingId ? 'Editar Matrícula' : 'Nueva Matrícula'}
        onClose={handleCloseModal}
        onSave={handleSave}
        saveButtonText={editingId ? 'Actualizar' : 'Registrar'}
      >
        <form>
          <div className="mb-3">
            <label htmlFor="alumno_id" className="form-label">
              Alumno *
            </label>
            <select
              className="form-select"
              id="alumno_id"
              name="alumno_id"
              value={formData.alumno_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccionar alumno</option>
              {alumnos.map((alumno) => (
                <option key={alumno.id} value={alumno.id}>
                  {alumno.primer_nombre} {alumno.apellido_paterno} ({alumno.numero_matricula})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="curso_id" className="form-label">
              Curso *
            </label>
            <select
              className="form-select"
              id="curso_id"
              name="curso_id"
              value={formData.curso_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccionar curso</option>
              {cursos.map((curso) => (
                <option key={curso.id} value={curso.id}>
                  {curso.nombre} ({curso.grado})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="fecha_matricula" className="form-label">
              Fecha de Matrícula
            </label>
            <input
              type="date"
              className="form-control"
              id="fecha_matricula"
              name="fecha_matricula"
              value={formData.fecha_matricula}
              onChange={handleInputChange}
            />
          </div>
          <div className="mb-3">
            <label htmlFor="estado" className="form-label">
              Estado
            </label>
            <select
              className="form-select"
              id="estado"
              name="estado"
              value={formData.estado}
              onChange={handleInputChange}
            >
              <option value="activa">Activa</option>
              <option value="cancelada">Cancelada</option>
              <option value="suspendida">Suspendida</option>
            </select>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Matriculas;
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
