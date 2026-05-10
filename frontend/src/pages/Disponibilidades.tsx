import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import {
  ArrowLeft, Clock, Calendar, Plus, Trash2, Edit, Check, X
} from 'lucide-react';
import { toast } from 'sonner';
import { Toaster } from '../components/ui/sonner';

interface Disponibilidade {
  iddisponibilidade_mensal: number;
  professorutilizadoriduser: number;
  modalidadesprofessoridmodalidadeprofessor: number;
  diadasemana: number;
  horainicio: string;
  horafim: string;
  ativo: boolean;
  modalidadeidmodalidade?: number;
  modalidade_nome?: string;
}

interface Modalidade {
  idmodalidadeprofessor: number;
  idmodalidade: number;
  modalidade_nome: string;
}

const DIAS_SEMANA = [
  { num: 1, label: 'Segunda-feira', short: 'Seg' },
  { num: 2, label: 'Terça-feira', short: 'Ter' },
  { num: 3, label: 'Quarta-feira', short: 'Qua' },
  { num: 4, label: 'Quinta-feira', short: 'Qui' },
  { num: 5, label: 'Sexta-feira', short: 'Sex' },
  { num: 6, label: 'Sábado', short: 'Sáb' },
];

const HORARIOS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00'
];

export function Disponibilidades() {
  const { user } = useAuth();
  const [disponibilidades, setDisponibilidades] = useState<Disponibilidade[]>([]);
  const [modalidades, setModalidades] = useState<Modalidade[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    modalidadesprofessoridmodalidadeprofessor: '',
    diadasemana: '',
    horainicio: '',
    horafim: ''
  });

  useEffect(() => {
    if (user?.role === 'PROFESSOR') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      console.log('Fetching professor data...');
      const modRes = await api.getProfessorModalidades();
      console.log('Modalidades response:', modRes);
      if (modRes.success) {
        setModalidades(modRes.data);
      }
      
      const dispRes = await api.getProfessorDisponibilidades();
      console.log('Disponibilidades response:', dispRes);
      if (dispRes.success) setDisponibilidades(dispRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.modalidadesprofessoridmodalidadeprofessor || !formData.diadasemana || 
        !formData.horainicio || !formData.horafim) {
      toast.error('Preencha todos os campos');
      return;
    }

    try {
      const data = {
        modalidadesprofessoridmodalidadeprofessor: parseInt(formData.modalidadesprofessoridmodalidadeprofessor),
        diadasemana: parseInt(formData.diadasemana),
        horainicio: formData.horainicio,
        horafim: formData.horafim
      };

      let result;
      if (editId) {
        result = await api.updateProfessorDisponibilidade(editId, data);
      } else {
        result = await api.createProfessorDisponibilidade(data);
      }

      if (result.success) {
        toast.success(editId ? 'Disponibilidade atualizada' : 'Disponibilidade criada');
        setShowForm(false);
        setEditId(null);
        setFormData({ modalidadesprofessoridmodalidadeprofessor: '', diadasemana: '', horainicio: '', horafim: '' });
        fetchData();
      }
    } catch (error) {
      toast.error('Erro ao guardar disponibilidade');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem a certeza que deseja eliminar?')) return;
    
    try {
      const result = await api.deleteProfessorDisponibilidade(id);
      if (result.success) {
        toast.success('Disponibilidade eliminada');
        fetchData();
      }
    } catch (error) {
      toast.error('Erro ao eliminar');
    }
  };

  const handleEdit = (disp: Disponibilidade) => {
    setFormData({
      modalidadesprofessoridmodalidadeprofessor: disp.modalidadesprofessoridmodalidadeprofessor.toString(),
      diadasemana: disp.diadasemana.toString(),
      horainicio: disp.horainicio,
      horafim: disp.horafim
    });
    setEditId(disp.iddisponibilidade_mensal);
    setShowForm(true);
  };

  const getDiaLabel = (num: number) => {
    return DIAS_SEMANA.find(d => d.num === num)?.label || num.toString();
  };

  if (!user || user.role !== 'PROFESSOR') {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#f4f9f8]">
      <Toaster position="top-right" />

      <div className="bg-[#0a1a17] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="mb-4 flex items-center gap-2 text-sm text-white/50">
            <Link to="/dashboard" className="hover:text-[#c9a84c] flex items-center gap-1 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Dashboard
            </Link>
            <span>/</span>
            <span className="text-white/80">Minhas Disponibilidades</span>
          </div>

          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl text-white mb-1">Minhas Disponibilidades</h1>
              <p className="text-white/50 text-sm">
                Defina os seus horários disponíveis para aulas
              </p>
            </div>
            <button
              onClick={() => { setShowForm(!showForm); if (!showForm) { setEditId(null); setFormData({ modalidadesprofessoridmodalidadeprofessor: '', diadasemana: '', horainicio: '', horafim: '' }); }}}
              className="flex items-center gap-2 bg-[#c9a84c] text-[#0a1a17] px-5 py-2.5 rounded-lg hover:bg-[#e8c97a] transition-colors"
              style={{ fontWeight: 600 }}
            >
              <Plus className="w-5 h-5" /> Nova Disponibilidade
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-[#4d7068]">A carregar...</div>
        ) : (
          <>
            {showForm && (
              <div className="bg-white rounded-2xl shadow-sm border border-[#0d6b5e]/10 p-6 mb-6">
                <h2 className="text-xl text-[#0a1a17] mb-4" style={{ fontWeight: 600 }}>
                  {editId ? 'Editar Disponibilidade' : 'Nova Disponibilidade'}
                </h2>
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-[#4d7068] mb-1">Modalidade *</label>
                    <select
                      value={formData.modalidadesprofessoridmodalidadeprofessor}
                      onChange={e => setFormData({ ...formData, modalidadesprofessoridmodalidadeprofessor: e.target.value })}
                      className="w-full px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-[#0a1a17] focus:outline-none focus:border-[#0d6b5e]"
                      required
                    >
                      <option value="">Selecionar modalidade...</option>
                      {modalidades.map(m => (
                        <option key={m.idmodalidadeprofessor} value={m.idmodalidadeprofessor}>
                          {m.modalidade_nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-[#4d7068] mb-1">Dia da Semana *</label>
                    <select
                      value={formData.diadasemana}
                      onChange={e => setFormData({ ...formData, diadasemana: e.target.value })}
                      className="w-full px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-[#0a1a17] focus:outline-none focus:border-[#0d6b5e]"
                      required
                    >
                      <option value="">Selecionar dia...</option>
                      {DIAS_SEMANA.map(d => (
                        <option key={d.num} value={d.num}>{d.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-[#4d7068] mb-1">Hora de Início *</label>
                    <select
                      value={formData.horainicio}
                      onChange={e => setFormData({ ...formData, horainicio: e.target.value })}
                      className="w-full px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-[#0a1a17] focus:outline-none focus:border-[#0d6b5e]"
                      required
                    >
                      <option value="">Selecionar hora...</option>
                      {HORARIOS.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm text-[#4d7068] mb-1">Hora de Fim *</label>
                    <select
                      value={formData.horafim}
                      onChange={e => setFormData({ ...formData, horafim: e.target.value })}
                      className="w-full px-3 py-2 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] text-[#0a1a17] focus:outline-none focus:border-[#0d6b5e]"
                      required
                    >
                      <option value="">Selecionar hora...</option>
                      {HORARIOS.filter(h => h > formData.horainicio).map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div className="md:col-span-2 flex gap-3">
                    <button
                      type="submit"
                      className="flex items-center gap-2 bg-[#0d6b5e] text-white px-5 py-2.5 rounded-lg hover:bg-[#065147] transition-colors"
                      style={{ fontWeight: 600 }}
                    >
                      <Check className="w-4 h-4" /> Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => { setShowForm(false); setEditId(null); }}
                      className="flex items-center gap-2 bg-gray-100 text-[#4d7068] px-5 py-2.5 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" /> Cancelar
                    </button>
                  </div>
                </form>
              </div>
            )}

            {disponibilidades.length === 0 && !showForm ? (
              <div className="bg-white p-12 rounded-2xl shadow-sm text-center border border-[#0d6b5e]/5">
                <Calendar className="w-16 h-16 text-[#0d6b5e]/20 mx-auto mb-4" />
                <p className="text-[#4d7068] mb-1">Nenhuma disponibilidade definida</p>
                <p className="text-sm text-[#4d7068]/60">Defina os seus horários disponíveis para receber aulas</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {disponibilidades.map(disp => (
                  <div
                    key={disp.iddisponibilidade_mensal}
                    className={`bg-white rounded-2xl shadow-sm border p-6 ${
                      disp.ativo ? 'border-[#0d6b5e]/10' : 'border-red-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-[#0d6b5e]" />
                        <span className="text-lg text-[#0a1a17]" style={{ fontWeight: 600 }}>
                          {getDiaLabel(disp.diadasemana)}
                        </span>
                      </div>
                      {!disp.ativo && (
                        <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                          Inativo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                      <Clock className="w-4 h-4 text-[#0d6b5e]" />
                      <span className="text-[#4d7068]">
                        {disp.horainicio} - {disp.horafim}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-sm bg-[#f4f9f8] text-[#0d6b5e] px-2 py-1 rounded-full">
                        {disp.modalidade_nome}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(disp)}
                        className="flex items-center gap-1 text-sm text-[#0d6b5e] hover:underline"
                      >
                        <Edit className="w-4 h-4" /> Editar
                      </button>
                      <button
                        onClick={() => handleDelete(disp.iddisponibilidade_mensal)}
                        className="flex items-center gap-1 text-sm text-red-600 hover:underline"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}