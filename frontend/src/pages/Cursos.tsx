import React, { useEffect, useState } from 'react';
import { cursosService, profesoresService, alumnosService } from '../api/services';
import Modal from '../components/Modal';
import { generateStructuredCode } from '../utils/codeGenerators';
import { useSortableData } from '../utils/tableSort';
import { useAuth } from '../context/AuthContext';
import { can } from '../utils/permissions';
import { downloadHorarioPdf } from '../utils/downloads';
import { horariosService } from '../api/services';

interface Curso {
  id?: string;
  nombre: string;
  codigo?: string;
  grado?: string;
  capacidad?: number;
  profesor_id?: string;
  seccion?: string;
  salon?: string;
  dia_semana?: string;
  horario_inicio?: string;
  horario_fin?: string;
}

const Cursos: React.FC = () => {
  const [cursos, setCursos] = useState<any[]>([]);
  const [profesores, setProfesores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Curso>({
    nombre: '',
    codigo: '',
    grado: '',
    capacidad: 40,
    profesor_id: '',
    seccion: 'A',
    salon: '',
  });
  const { sortConfig, requestSort, sortedRows: cursosOrdenados } = useSortableData(cursos, 'nombre');
  const { user } = useAuth();
  const role = user?.tipo_usuario;
  const isAlumno = role?.toLowerCase() === 'alumno';
  const allowCreate = can(role, 'cursos', 'create');
  const allowEdit = can(role, 'cursos', 'edit');
  const allowDelete = can(role, 'cursos', 'delete');
  const canManageHorarios = role && ['director', 'administrativo'].includes(role.toLowerCase());

  useEffect(() => {
    if (isAlumno) fetchMiHorario();
    else fetchCursos();
    fetchProfesores();
  }, [isAlumno]);

  const [horariosGrado, setHorariosGrado] = useState<any[]>([]);
  const [gradoAlumno, setGradoAlumno] = useState('');
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmOnSave, setConfirmOnSave] = useState<(() => Promise<void>) | null>(null);

  const fetchMiHorario = async () => {
    try {
      const resp = await alumnosService.getMiHorario();
      const datos = resp.data?.datos || resp.data || {};
      const horarios = datos.horarios || [];
      setHorariosGrado(horarios);
      setGradoAlumno(datos.grado || '');
      setLoading(false);
    } catch (err: any) {
      console.error('Error cargando mi horario:', err);
      setError('Error al cargar mi horario');
      setLoading(false);
    }
  };

  const buildMatrix = (horarios: any[]) => {
    const days = ['Lunes','Martes','Miércoles','Jueves','Viernes'];
    // obtener slots uniques
    const slots = Array.from(new Set(horarios.map(h => `${h.hora_inicio}-${h.hora_fin}`))).sort();
    const matrix: any = {};
    for (const slot of slots) matrix[slot] = {};
    horarios.forEach(h => {
      const slot = `${h.hora_inicio}-${h.hora_fin}`;
      const dayIndex = (h.dia_semana || 1) - 1;
      const day = days[dayIndex] || `D${h.dia_semana}`;
      if (!matrix[slot]) matrix[slot] = {};
      matrix[slot][day] = { curso: h.curso, aula: h.aula };
    });
    return { days, slots, matrix };
  };

  const fetchCursos = async () => {
    try {
      const response = await cursosService.getAll();
      setCursos(response.data?.datos || []);
    } catch (err: any) {
      setError('Error al cargar cursos');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchProfesores = async () => {
    try {
      const response = await profesoresService.getAll();
      setProfesores(response.data?.datos || []);
    } catch (err) {
      console.error('Error cargando profesores para cursos:', err);
    }
  };

  const handleAutoGenerateCodigo = () => {
    setFormData((prev) => ({
      ...prev,
      codigo: generateStructuredCode({
        prefix: 'CUR',
        rows: cursos,
        field: 'codigo',
        padding: 4,
      }),
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'capacidad' ? parseInt(value) : value,
    }));
  };

  const handleOpenModal = (curso?: any) => {
    if (curso) {
      setFormData(curso);
      setEditingId(curso.id);
    } else {
      setFormData({
        nombre: '',
        codigo: '',
        grado: '',
        capacidad: 40,
        profesor_id: profesores[0]?.id || '',
        seccion: 'A',
        salon: '',
      });
      setEditingId(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFormData({
      nombre: '',
      codigo: '',
      grado: '',
      capacidad: 40,
        profesor_id: profesores[0]?.id || '',
        seccion: 'A',
        salon: '',
    });
    setEditingId(null);
  };

  const handleSave = async () => {
    try {
      setError('');
      if (editingId) {
        await cursosService.update(editingId, formData);
        setSuccess('Curso actualizado correctamente');
      } else {
        await cursosService.create(formData);
        setSuccess('Curso creado correctamente');
      }
      handleCloseModal();
      fetchCursos();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.mensaje || 'Error al guardar curso');
    }
  };

  const handleDelete = (id: string) => {
    setConfirmMessage('¿Estás seguro de que deseas eliminar este curso?');
    setConfirmOnSave(() => async () => {
      try {
       if (cursosService.delete) {
  await cursosService.delete(id);
}
        setSuccess('Curso eliminado correctamente');
        fetchCursos();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.response?.data?.mensaje || 'Error al eliminar curso');
      }
    });
    setConfirmModalOpen(true);
  };

  // Admin: gestionar horarios por grado
  const [showAdminHorarios, setShowAdminHorarios] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('1ro');
  const [adminHorarios, setAdminHorarios] = useState<any[]>([]);

  const fetchAdminHorarios = async (grado?: string) => {
    try {
      const resp = await horariosService.getByGrado(grado || selectedGrade);
      setAdminHorarios(resp.data?.datos || resp.data || []);
    } catch (err: any) {
      console.error('Error cargando horarios por grado', err);
    }
  };

  const handleCreateHorario = async (payload: any) => {
    try {
      await horariosService.create(payload);
      await fetchAdminHorarios(payload.grado);
    } catch (err: any) {
      console.error('Error creando horario', err);
    }
  };

  const handleDeleteHorario = (id: string) => {
    setConfirmMessage('¿Eliminar horario?');
    setConfirmOnSave(() => async () => {
      try {
        await horariosService.delete(id);
        fetchAdminHorarios();
      } catch (err: any) {
        console.error('Error eliminando horario', err);
      }
    });
    setConfirmModalOpen(true);
  };

  const handleDownloadHorarioPdf = () => {
    const fecha = new Date().toISOString().slice(0, 10);

    downloadHorarioPdf({
      title: 'Mi horario de cursos',
      filename: `horario-cursos-${fecha}.pdf`,
      grado: gradoAlumno,
      horarios: horariosGrado,
    });
  };

  return (
    <div className="page-shell container-fluid p-2 p-md-4">
      <div className="page-hero mb-4">
        <h1 className="page-hero-title">
          <i className={`bi ${isAlumno ? 'bi-calendar-week' : 'bi-book'} me-2`}></i>
          {isAlumno ? 'Mi Horario de Cursos' : 'Gestión de Cursos'}
        </h1>
        <p className="page-hero-subtitle">
          {isAlumno
            ? 'Consulta tus cursos matriculados, docentes, aulas y horarios'
            : 'Organiza y administra las materias académicas y asignación de aulas'}
        </p>
      </div>

      {error && (
        <div className="alert alert-danger alert-dismissible fade show" role="alert">
          {error}
          <button
            type="button"
            className="btn-close"
            onClick={() => setError('')}
          ></button>
        </div>
      )}

      {success && (
        <div className="alert alert-success alert-dismissible fade show" role="alert">
          {success}
          <button
            type="button"
            className="btn-close"
            onClick={() => setSuccess('')}
          ></button>
        </div>
      )}

      {loading ? (
        <div className="loading">
          <div className="spinner-border" role="status" />
        </div>
      ) : (
        <div className="card dashboard-card">
          <div className="card-header" style={{ background: 'rgba(102, 126, 234, 0.05)', borderBottom: '1px solid rgba(102, 126, 234, 0.1)', padding: '16px 20px' }}>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0 fw-bold">{isAlumno ? 'Horario de Cursos' : 'Listado de Cursos'} ({cursos.length})</h5>
              <div className="d-flex flex-wrap gap-2 justify-content-end">
              {isAlumno && (
                <button
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleDownloadHorarioPdf}
                  disabled={horariosGrado.length === 0}
                  title={horariosGrado.length === 0 ? 'No hay horario disponible para descargar' : 'Descargar mi horario en PDF'}
                >
                  <i className="bi bi-download"></i>
                  Descargar PDF
                </button>
              )}
              {canManageHorarios && (
                <button className="btn btn-sm btn-outline-secondary" onClick={() => { setShowAdminHorarios(!showAdminHorarios); if (!showAdminHorarios) fetchAdminHorarios(); }}>
                  <i className="bi bi-calendar2-week"></i> Gestionar Horarios
                </button>
              )}
              {allowCreate && (
              <button
                className="btn btn-sm btn-primary"
                onClick={() => handleOpenModal()}
              >
                <i className="bi bi-plus-circle"></i>
                Nuevo Curso
              </button>
              )}
              </div>
            </div>
          </div>
          <div className="card-body">
            {isAlumno && (
              <div className="mb-4">
                <h6 className="mb-3">Horario semanal</h6>
                {horariosGrado.length === 0 ? (
                  <div className="text-muted">No se encontró horario para tu grado.</div>
                ) : (
                  (() => {
                    const { days, slots, matrix } = buildMatrix(horariosGrado);
                    return (
                      <div className="table-responsive">
                        <table className="table table-bordered align-middle text-center">
                          <thead>
                            <tr>
                              <th style={{ width: '160px' }}>Hora</th>
                              {days.map((d) => (
                                <th key={d}>{d}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {slots.map((slot) => (
                              <tr key={slot}>
                                <td className="fw-semibold">{slot.replace('-', ' - ')}</td>
                                {days.map((d) => (
                                  <td key={`${slot}-${d}`}>
                                    {matrix[slot] && matrix[slot][d] ? (
                                      <div>
                                        {matrix[slot][d].curso}
                                        <div className="text-muted small">{matrix[slot][d].aula}</div>
                                      </div>
                                    ) : ('')}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()
                )}
              </div>
            )}
            {showAdminHorarios && canManageHorarios && (
              <div className="card mb-3">
                <div className="card-body">
                  <div className="d-flex align-items-center gap-2 mb-3">
                    <label className="mb-0">Grado:</label>
                    <select className="form-select form-select-sm w-auto" value={selectedGrade} onChange={(e) => setSelectedGrade(e.target.value)}>
                      <option value="1ro">1ro</option>
                      <option value="2do">2do</option>
                      <option value="3ro">3ro</option>
                      <option value="4to">4to</option>
                      <option value="5to">5to</option>
                    </select>
                    <button className="btn btn-sm btn-primary" onClick={() => fetchAdminHorarios()}>Cargar</button>
                  </div>

                  <div className="table-responsive mb-3">
                    <table className="table table-sm table-striped">
                      <thead>
                        <tr>
                          <th>Curso</th>
                          <th>Día</th>
                          <th>Inicio</th>
                          <th>Fin</th>
                          <th>Aula</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminHorarios.map(h => (
                          <tr key={h.id}>
                            <td>{h.curso}</td>
                            <td>{['Lun','Mar','Mie','Jue','Vie'][h.dia_semana - 1] || h.dia_semana}</td>
                            <td>{h.hora_inicio}</td>
                            <td>{h.hora_fin}</td>
                            <td>{h.aula}</td>
                            <td><button className="btn btn-sm btn-danger" onClick={() => handleDeleteHorario(h.id)}>Eliminar</button></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="row g-2">
                    <div className="col-auto">
                      <input id="newCurso" className="form-control form-control-sm" placeholder="Curso" />
                    </div>
                    <div className="col-auto">
                      <select id="newDia" className="form-select form-select-sm">
                        <option value="1">Lunes</option>
                        <option value="2">Martes</option>
                        <option value="3">Miércoles</option>
                        <option value="4">Jueves</option>
                        <option value="5">Viernes</option>
                      </select>
                    </div>
                    <div className="col-auto">
                      <input id="newInicio" className="form-control form-control-sm" placeholder="Inicio (HH:MM)" />
                    </div>
                    <div className="col-auto">
                      <input id="newFin" className="form-control form-control-sm" placeholder="Fin (HH:MM)" />
                    </div>
                    <div className="col-auto">
                      <input id="newAula" className="form-control form-control-sm" placeholder="Aula" />
                    </div>
                    <div className="col-auto">
                      <button className="btn btn-sm btn-success" onClick={() => {
                        const curso = (document.getElementById('newCurso') as HTMLInputElement).value;
                        const dia = parseInt((document.getElementById('newDia') as HTMLSelectElement).value, 10);
                        const inicio = (document.getElementById('newInicio') as HTMLInputElement).value;
                        const fin = (document.getElementById('newFin') as HTMLInputElement).value;
                        const aula = (document.getElementById('newAula') as HTMLInputElement).value;
                        if (!curso) {
                          setError('Ingrese el nombre del curso antes de crear el horario');
                          return;
                        }
                        handleCreateHorario({ grado: selectedGrade, curso, dia_semana: dia, hora_inicio: inicio, hora_fin: fin, aula });
                      }}>Crear</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('id')}>
                      ID {sortConfig.key === 'id' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('nombre')}>
                      Nombre {sortConfig.key === 'nombre' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('codigo')}>
                      Código {sortConfig.key === 'codigo' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('grado')}>
                      Grado {sortConfig.key === 'grado' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('profesor_nombre')}>
                      Profesor {sortConfig.key === 'profesor_nombre' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    <th role="button" style={{ cursor: 'pointer' }} onClick={() => requestSort('capacidad')}>
                      Capacidad {sortConfig.key === 'capacidad' ? (sortConfig.direction === 'asc' ? '▲' : '▼') : ''}
                    </th>
                    {!isAlumno && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {cursosOrdenados.length === 0 ? (
                    <tr>
                      <td colSpan={isAlumno ? 6 : 7} className="text-center py-4 text-muted">
                        No hay cursos registrados
                      </td>
                    </tr>
                  ) : (
                    cursosOrdenados.map((curso) => (
                      <tr key={curso.id}>
                        <td>
                          <small className="text-muted">{curso.id}</small>
                        </td>
                        <td>{curso.nombre}</td>
                        <td>
                          <span className="badge bg-info">{curso.codigo}</span>
                        </td>
                        <td>{curso.grado || '-'}</td>
                        <td>
                          <div className="fw-semibold">{curso.profesor_nombre || '-'}</div>
                          <small className="text-muted">{curso.profesor_numero_empleado || ''}</small>
                        </td>
                        <td>
                          <span className="badge bg-secondary">
                            {curso.capacidad}
                          </span>
                        </td>
                        {!isAlumno && (
                        <td>
                          {allowEdit && (
                          <button
                            className="btn btn-sm btn-primary me-2"
                            onClick={() => handleOpenModal(curso)}
                            title="Editar"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          )}
                          {allowDelete && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleDelete(curso.id)}
                            title="Eliminar"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                          )}
                        </td>
                        )}
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
        title={editingId ? 'Editar Curso' : 'Nuevo Curso'}
        onClose={handleCloseModal}
        onSave={handleSave}
        saveButtonText={editingId ? 'Actualizar' : 'Crear'}
      >
        <form>
          <div className="mb-3">
            <label htmlFor="nombre" className="form-label">
              Nombre del Curso *
            </label>
            <input
              type="text"
              className="form-control"
              id="nombre"
              name="nombre"
              value={formData.nombre}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="mb-3">
            <label htmlFor="codigo" className="form-label">
              Código
            </label>
            <div className="input-group">
              <input
                type="text"
                className="form-control"
                id="codigo"
                name="codigo"
                value={formData.codigo}
                onChange={handleInputChange}
                placeholder="CUR-2026-0001"
              />
              <button type="button" className="btn btn-outline-secondary" onClick={handleAutoGenerateCodigo}>
                Generar
              </button>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="grado" className="form-label">
              Grado
            </label>
            <select
              className="form-select"
              id="grado"
              name="grado"
              value={formData.grado}
              onChange={handleInputChange}
            >
              <option value="">Seleccionar grado</option>
              <option value="4to">4to Primaria</option>
              <option value="5to">5to Primaria</option>
              <option value="6to">6to Primaria</option>
              <option value="1ro-sec">1ro Secundaria</option>
              <option value="2do-sec">2do Secundaria</option>
              <option value="3ro-sec">3ro Secundaria</option>
            </select>
          </div>
          <div className="mb-3">
            <label htmlFor="profesor_id" className="form-label">
              Profesor responsable *
            </label>
            <select
              className="form-select"
              id="profesor_id"
              name="profesor_id"
              value={formData.profesor_id}
              onChange={handleInputChange}
              required
            >
              <option value="">Seleccionar profesor</option>
              {profesores.map((profesor) => (
                <option key={profesor.id} value={profesor.id}>
                  {profesor.primer_nombre} {profesor.apellido_paterno} ({profesor.numero_empleado || 'sin código'})
                </option>
              ))}
            </select>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="seccion" className="form-label">
                Sección
              </label>
              <input
                type="text"
                className="form-control"
                id="seccion"
                name="seccion"
                value={formData.seccion}
                onChange={handleInputChange}
                placeholder="A"
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="salon" className="form-label">
                Salón
              </label>
              <input
                type="text"
                className="form-control"
                id="salon"
                name="salon"
                value={formData.salon}
                onChange={handleInputChange}
                placeholder="A-101"
              />
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="capacidad" className="form-label">
              Capacidad
            </label>
            <input
              type="number"
              className="form-control"
              id="capacidad"
              name="capacidad"
              value={formData.capacidad}
              onChange={handleInputChange}
              min="1"
              max="100"
            />
          </div>
        </form>
      </Modal>

      <Modal
        show={confirmModalOpen}
        title={"Confirmar"}
        onClose={() => { setConfirmModalOpen(false); setConfirmOnSave(null); setConfirmMessage(''); }}
        onSave={async () => {
          if (confirmOnSave) await confirmOnSave();
          setConfirmModalOpen(false);
          setConfirmOnSave(null);
          setConfirmMessage('');
        }}
        saveButtonText={"Confirmar"}
        saveButtonColor={"danger"}
      >
        <p>{confirmMessage}</p>
      </Modal>
    </div>
  );
};

export default Cursos;
