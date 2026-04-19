import * as figurinoService from '../services/figurino.service.js';
//T17
export const getCatalogo = async (request, reply) => {
  try {
    const dados = await figurinoService.listarTodosFigurinos();
    
    // No Fastify usamos .code() e .send()
    return reply.code(200).send(dados);
    
  } catch (error) {
    return reply.code(500).send({ 
      message: "Erro ao carregar catálogo", 
      error: error.message 
    });
  }
};
//T18
export const getFigurinoById = async (request, reply) => {
  try {
    const { id } = request.params;
    const figurino = await figurinoService.buscarFigurinoPorId(id);

    if (!figurino) {
      return reply.code(404).send({ message: "Figurino não encontrado" });
    }

    return reply.code(200).send(figurino);
  } catch (error) {
    return reply.code(500).send({ message: "Erro ao buscar detalhes", error: error.message });
  }

};

//T19
export const createFigurino = async (request, reply) => {
  try {
    const novoFigurino = await figurinoService.criarFigurino(request.body);
    return reply.code(201).send({ 
      message: "Figurino criado com sucesso!", 
      data: novoFigurino 
    });
  } catch (error) {
    return reply.code(500).send({ 
      message: "Erro ao criar figurino", 
      error: error.message 
    });
  }
};