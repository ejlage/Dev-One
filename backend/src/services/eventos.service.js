let eventos = [];

export const getAllEventos = async () => {
  return eventos;
};

export const getEventoById = async (id) => {
  return eventos.find(e => e.id === parseInt(id));
};

export const createEvento = async (data) => {
  const { titulo, descricao, dataevento, localizacao, publicado } = data;
  const novoEvento = {
    id: eventos.length + 1,
    titulo,
    descricao,
    dataevento,
    localizacao,
    publicado: false,
    createdAt: new Date()
  };
  eventos.push(novoEvento);
  return novoEvento;
};

export const updateEvento = async (id, data) => {
  const index = eventos.findIndex(e => e.id === parseInt(id));
  if (index === -1) {
    throw new Error("Evento não encontrado");
  }
  eventos[index] = { ...eventos[index], ...data };
  return eventos[index];
};

export const deleteEvento = async (id) => {
  const index = eventos.findIndex(e => e.id === parseInt(id));
  if (index === -1) {
    throw new Error("Evento não encontrado");
  }
  eventos.splice(index, 1);
  return { message: "Evento eliminado com sucesso" };
};

export const publishEvento = async (id) => {
  const index = eventos.findIndex(e => e.id === parseInt(id));
  if (index === -1) {
    throw new Error("Evento não encontrado");
  }
  eventos[index].publicado = true;
  return eventos[index];
};