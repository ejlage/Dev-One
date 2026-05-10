import { useState, useEffect } from 'react';
import { Calendar, MapPin, Plus, Pencil, Trash2, Eye, EyeOff, Star, StarOff } from 'lucide-react';
import api from '../services/api';

interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  data: string;
  local: string;
  imagem: string;
  linkBilhetes: string;
  publicado: boolean;
  destaque: boolean;
}

const emptyForm = {
  titulo: '',
  descricao: '',
  data: '',
  local: '',
  imagem: '',
  linkBilhetes: '',
  destaque: false,
  publicado: true,
};

export function GestaoEventos() {
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const fetchEventos = async () => {
    setLoading(true);
    try {
      const res = await api.getEventosAdmin();
      if (res.success && res.data) setEventos(res.data as Evento[]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEventos(); }, []);

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (e: Evento) => {
    setEditingId(e.id);
    setForm({
      titulo: e.titulo,
      descricao: e.descricao,
      data: e.data,
      local: e.local,
      imagem: e.imagem,
      linkBilhetes: e.linkBilhetes,
      destaque: e.destaque,
      publicado: e.publicado,
    });
    setShowForm(true);
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!form.titulo || !form.data) return;
    const today = new Date().toISOString().split('T')[0];
    if (!editingId && form.data < today) {
      setErro('A data do evento não pode ser no passado');
      return;
    }
    setErro(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await api.updateEvento(parseInt(editingId), form);
      } else {
        await api.createEvento(form);
      }
      setShowForm(false);
      await fetchEventos();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminar este evento?')) return;
    await api.deleteEvento(parseInt(id));
    await fetchEventos();
  };

  const handleTogglePublish = async (e: Evento) => {
    setErro(null);
    setPublishingId(e.id);
    try {
      if (!e.publicado) {
        await api.publishEvento(parseInt(e.id));
      } else {
        await api.updateEvento(parseInt(e.id), { publicado: false });
      }
      await fetchEventos();
    } catch (err: any) {
      setErro(`Erro ao ${e.publicado ? 'despublicar' : 'publicar'}: ${err.message}`);
    } finally {
      setPublishingId(null);
    }
  };

  const handleToggleDestaque = async (e: Evento) => {
    await api.updateEvento(parseInt(e.id), { destaque: !e.destaque });
    await fetchEventos();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl text-[#0a1a17]">Gestão de Eventos</h1>
          <p className="text-[#4d7068] mt-1">{eventos.length} evento{eventos.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#0d6b5e] text-white px-5 py-2.5 rounded-xl hover:bg-[#065147] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Evento
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#0d6b5e]/10">
              <h2 className="text-xl text-[#0a1a17]">
                {editingId ? 'Editar Evento' : 'Novo Evento'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-[#4d7068] mb-1">Título *</label>
                <input
                  type="text"
                  required
                  value={form.titulo}
                  onChange={e => setForm({ ...form, titulo: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  placeholder="Nome do evento"
                />
              </div>
              <div>
                <label className="block text-sm text-[#4d7068] mb-1">Data *</label>
                <input
                  type="date"
                  required
                  min={editingId ? undefined : new Date().toISOString().split('T')[0]}
                  value={form.data}
                  onChange={e => setForm({ ...form, data: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                />
              </div>
              <div>
                <label className="block text-sm text-[#4d7068] mb-1">Local</label>
                <input
                  type="text"
                  value={form.local}
                  onChange={e => setForm({ ...form, local: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  placeholder="Ex: Teatro Municipal"
                />
              </div>
              <div>
                <label className="block text-sm text-[#4d7068] mb-1">Descrição</label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm({ ...form, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17] resize-none"
                  placeholder="Descrição do evento..."
                />
              </div>
              <div>
                <label className="block text-sm text-[#4d7068] mb-1">URL da Imagem</label>
                <input
                  type="url"
                  value={form.imagem}
                  onChange={e => setForm({ ...form, imagem: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  placeholder="https://..."
                />
              </div>
              <div>
                <label className="block text-sm text-[#4d7068] mb-1">Link de Bilhetes</label>
                <input
                  type="url"
                  value={form.linkBilhetes}
                  onChange={e => setForm({ ...form, linkBilhetes: e.target.value })}
                  className="w-full px-4 py-2.5 border border-[#0d6b5e]/20 rounded-lg bg-[#f4f9f8] focus:outline-none focus:border-[#0d6b5e] text-[#0a1a17]"
                  placeholder="https://..."
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.destaque}
                  onChange={e => setForm({ ...form, destaque: e.target.checked })}
                  className="w-4 h-4 accent-[#0d6b5e]"
                />
                <span className="text-sm text-[#0a1a17]">Marcar como destaque</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.publicado}
                  onChange={e => setForm({ ...form, publicado: e.target.checked })}
                  className="w-4 h-4 accent-[#0d6b5e]"
                />
                <span className="text-sm text-[#0a1a17]">
                  Publicar imediatamente
                  <span className="ml-1 text-[#4d7068]">(visível a todos)</span>
                </span>
              </label>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-[#0d6b5e] text-white py-2.5 rounded-xl hover:bg-[#065147] transition-colors disabled:opacity-50"
                >
                  {submitting ? 'A guardar...' : editingId ? 'Guardar Alterações' : 'Criar Evento'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 border border-[#0d6b5e]/20 text-[#4d7068] py-2.5 rounded-xl hover:bg-[#f4f9f8] transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Erro banner */}
      {erro && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 flex items-center justify-between">
          <span>{erro}</span>
          <button onClick={() => setErro(null)} className="ml-4 text-red-400 hover:text-red-600 font-bold">✕</button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-16 text-[#4d7068]">A carregar...</div>
      ) : eventos.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-[#0d6b5e]/10">
          <Calendar className="w-12 h-12 text-[#0d6b5e]/30 mx-auto mb-3" />
          <p className="text-[#4d7068]">Nenhum evento criado.</p>
          <button onClick={openNew} className="mt-4 text-[#0d6b5e] hover:underline text-sm">
            Criar o primeiro evento
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {eventos.map(e => (
            <div
              key={e.id}
              className="bg-white rounded-xl border border-[#0d6b5e]/10 p-5 flex items-center gap-4"
            >
              {e.imagem ? (
                <img src={e.imagem} alt={e.titulo} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              ) : (
                <div className="w-16 h-16 rounded-lg bg-[#f4f9f8] flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-[#0d6b5e]/40" />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[#0a1a17] font-medium truncate">{e.titulo}</h3>
                  {e.destaque && (
                    <span className="text-xs bg-[#c9a84c]/15 text-[#8a6a00] px-2 py-0.5 rounded-full">
                      Destaque
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    e.publicado
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {e.publicado ? 'Publicado' : 'Rascunho'}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-1 text-sm text-[#4d7068]">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {e.data ? new Date(e.data + 'T00:00:00').toLocaleDateString('pt-PT') : '—'}
                  </span>
                  {e.local && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                      {e.local}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleToggleDestaque(e)}
                  title={e.destaque ? 'Remover destaque' : 'Marcar destaque'}
                  className="p-2 rounded-lg hover:bg-[#f4f9f8] text-[#c9a84c] transition-colors"
                >
                  {e.destaque ? <Star className="w-4 h-4 fill-current" /> : <StarOff className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => handleTogglePublish(e)}
                  title={e.publicado ? 'Despublicar' : 'Publicar'}
                  disabled={publishingId === e.id}
                  className="p-2 rounded-lg hover:bg-[#f4f9f8] text-[#0d6b5e] transition-colors disabled:opacity-40"
                >
                  {publishingId === e.id
                    ? <span className="w-4 h-4 block border-2 border-[#0d6b5e] border-t-transparent rounded-full animate-spin" />
                    : e.publicado ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />
                  }
                </button>
                <button
                  onClick={() => openEdit(e)}
                  className="p-2 rounded-lg hover:bg-[#f4f9f8] text-[#0d6b5e] transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(e.id)}
                  className="p-2 rounded-lg hover:bg-red-50 text-red-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
