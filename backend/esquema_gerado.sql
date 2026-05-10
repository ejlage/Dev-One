-- CreateTable
CREATE TABLE "aluno" (
    "idaluno" SERIAL NOT NULL,
    "utilizadoriduser" INTEGER NOT NULL,
    "encarregadoiduser" INTEGER,

    CONSTRAINT "aluno_pkey" PRIMARY KEY ("idaluno")
);

-- CreateTable
CREATE TABLE "alunoaula" (
    "idalunoaula" SERIAL NOT NULL,
    "alunoidaluno" INTEGER NOT NULL,
    "aulaidaula" INTEGER NOT NULL,

    CONSTRAINT "alunoaula_pkey" PRIMARY KEY ("idalunoaula")
);

-- CreateTable
CREATE TABLE "alunogrupo" (
    "idalunogrupo" SERIAL NOT NULL,
    "alunoidaluno" INTEGER NOT NULL,
    "grupoidgrupo" INTEGER NOT NULL,

    CONSTRAINT "alunogrupo_pkey" PRIMARY KEY ("idalunogrupo")
);

-- CreateTable
CREATE TABLE "anuncio" (
    "idanuncio" SERIAL NOT NULL,
    "valor" DOUBLE PRECISION,
    "dataanuncio" DATE NOT NULL,
    "datainicio" DATE,
    "datafim" DATE,
    "quantidade" INTEGER NOT NULL,
    "figurinoidfigurino" INTEGER NOT NULL,
    "estadoidestado" INTEGER NOT NULL,
    "direcaoutilizadoriduser" INTEGER,
    "encarregadoeducacaoutilizadoriduser" INTEGER,
    "professorutilizadoriduser" INTEGER,
    "tipotransacao" TEXT NOT NULL DEFAULT 'ALUGUER',

    CONSTRAINT "anuncio_pkey" PRIMARY KEY ("idanuncio")
);

-- CreateTable
CREATE TABLE "aula" (
    "idaula" SERIAL NOT NULL,
    "pedidodeaulaidpedidoaula" INTEGER NOT NULL,
    "salaidsala" INTEGER NOT NULL,
    "estadoaulaidestadoaula" INTEGER NOT NULL,

    CONSTRAINT "aula_pkey" PRIMARY KEY ("idaula")
);

-- CreateTable
CREATE TABLE "cor" (
    "idcor" SERIAL NOT NULL,
    "nomecor" VARCHAR(255) NOT NULL,

    CONSTRAINT "cor_pkey" PRIMARY KEY ("idcor")
);

-- CreateTable
CREATE TABLE "direcao" (
    "utilizadoriduser" INTEGER NOT NULL,

    CONSTRAINT "direcao_pkey" PRIMARY KEY ("utilizadoriduser")
);

-- CreateTable
CREATE TABLE "encarregadoeducacao" (
    "utilizadoriduser" INTEGER NOT NULL,

    CONSTRAINT "encarregadoeducacao_pkey" PRIMARY KEY ("utilizadoriduser")
);

-- CreateTable
CREATE TABLE "estado" (
    "idestado" SERIAL NOT NULL,
    "tipoestado" VARCHAR(255) NOT NULL,

    CONSTRAINT "estado_pkey" PRIMARY KEY ("idestado")
);

-- CreateTable
CREATE TABLE "estadoaula" (
    "idestadoaula" SERIAL NOT NULL,
    "nomeestadoaula" VARCHAR(255) NOT NULL,

    CONSTRAINT "estadoaula_pkey" PRIMARY KEY ("idestadoaula")
);

-- CreateTable
CREATE TABLE "estadosala" (
    "idestadosala" SERIAL NOT NULL,
    "nomeestadosala" VARCHAR(255) NOT NULL,

    CONSTRAINT "estadosala_pkey" PRIMARY KEY ("idestadosala")
);

-- CreateTable
CREATE TABLE "estadouso" (
    "idestado" SERIAL NOT NULL,
    "estadouso" VARCHAR(255) NOT NULL,

    CONSTRAINT "estadouso_pkey" PRIMARY KEY ("idestado")
);

-- CreateTable
CREATE TABLE "figurino" (
    "idfigurino" SERIAL NOT NULL,
    "quantidadedisponivel" INTEGER NOT NULL,
    "quantidadetotal" INTEGER NOT NULL,
    "modelofigurinoidmodelo" INTEGER NOT NULL,
    "generoidgenero" INTEGER NOT NULL,
    "tamanhoidtamanho" INTEGER NOT NULL,
    "coridcor" INTEGER NOT NULL,
    "estadousoidestado" INTEGER NOT NULL,
    "encarregadoeducacaoutilizadoriduser" INTEGER,
    "direcaoutilizadoriduser" INTEGER,
    "professorutilizadoriduser" INTEGER,
    "itemfigurinoiditem" INTEGER,

    CONSTRAINT "figurino_pkey" PRIMARY KEY ("idfigurino")
);

-- CreateTable
CREATE TABLE "genero" (
    "idgenero" SERIAL NOT NULL,
    "nomegenero" VARCHAR(255) NOT NULL,

    CONSTRAINT "genero_pkey" PRIMARY KEY ("idgenero")
);

-- CreateTable
CREATE TABLE "grupo" (
    "idgrupo" SERIAL NOT NULL,
    "nomegrupo" VARCHAR(255) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ABERTA',
    "descricao" VARCHAR(1000),
    "modalidade" VARCHAR(100),
    "nivel" VARCHAR(50),
    "faixaEtaria" VARCHAR(50),
    "professorId" INTEGER,
    "estudioId" INTEGER,
    "diasSemana" VARCHAR(50),
    "horaInicio" VARCHAR(5),
    "horaFim" VARCHAR(5),
    "duracao" INTEGER,
    "lotacaoMaxima" INTEGER,
    "dataInicio" VARCHAR(20),
    "dataFim" VARCHAR(20),
    "cor" VARCHAR(20),
    "requisitos" VARCHAR(500),

    CONSTRAINT "grupo_pkey" PRIMARY KEY ("idgrupo")
);

-- CreateTable
CREATE TABLE "itemfigurino" (
    "iditem" SERIAL NOT NULL,
    "localizacao" VARCHAR(255) NOT NULL,

    CONSTRAINT "itemfigurino_pkey" PRIMARY KEY ("iditem")
);

-- CreateTable
CREATE TABLE "modalidade" (
    "idmodalidade" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,

    CONSTRAINT "modalidade_pkey" PRIMARY KEY ("idmodalidade")
);

-- CreateTable
CREATE TABLE "modalidadeprofessor" (
    "idmodalidadeprofessor" SERIAL NOT NULL,
    "modalidadeidmodalidade" INTEGER NOT NULL,
    "professorutilizadoriduser" INTEGER NOT NULL,

    CONSTRAINT "modalidadeprofessor_pkey" PRIMARY KEY ("idmodalidadeprofessor")
);

-- CreateTable
CREATE TABLE "modelofigurino" (
    "idmodelo" SERIAL NOT NULL,
    "nomemodelo" VARCHAR(255) NOT NULL,
    "descricao" VARCHAR(255) NOT NULL,
    "fotografia" TEXT NOT NULL,
    "tipofigurinoidtipofigurino" INTEGER NOT NULL,

    CONSTRAINT "modelofigurino_pkey" PRIMARY KEY ("idmodelo")
);

-- CreateTable
CREATE TABLE "pedidodeaula" (
    "idpedidoaula" SERIAL NOT NULL,
    "data" DATE NOT NULL,
    "horainicio" TIME(6) NOT NULL,
    "duracaoaula" TIME(6) NOT NULL,
    "maxparticipantes" INTEGER NOT NULL,
    "datapedido" DATE NOT NULL,
    "privacidade" BOOLEAN NOT NULL,
    "disponibilidade_mensal_id" INTEGER,
    "alunoutilizadoriduser" INTEGER,
    "grupoidgrupo" INTEGER NOT NULL,
    "estadoidestado" INTEGER NOT NULL,
    "salaidsala" INTEGER NOT NULL,
    "encarregadoeducacaoutilizadoriduser" INTEGER NOT NULL,
    "novadata" DATE,
    "novaDataLimite" TIMESTAMP(3),
    "sugestaoestado" TEXT,

    CONSTRAINT "pedidodeaula_pkey" PRIMARY KEY ("idpedidoaula")
);

-- CreateTable
CREATE TABLE "professor" (
    "utilizadoriduser" INTEGER NOT NULL,

    CONSTRAINT "professor_pkey" PRIMARY KEY ("utilizadoriduser")
);

-- CreateTable
CREATE TABLE "sala" (
    "idsala" SERIAL NOT NULL,
    "nomesala" VARCHAR(255) NOT NULL,
    "capacidade" INTEGER NOT NULL,
    "estadosalaidestadosala" INTEGER NOT NULL,
    "tiposalaidtiposala" INTEGER NOT NULL,

    CONSTRAINT "sala_pkey" PRIMARY KEY ("idsala")
);

-- CreateTable
CREATE TABLE "tamanho" (
    "idtamanho" SERIAL NOT NULL,
    "nometamanho" VARCHAR(255) NOT NULL,

    CONSTRAINT "tamanho_pkey" PRIMARY KEY ("idtamanho")
);

-- CreateTable
CREATE TABLE "tipofigurino" (
    "idtipofigurino" SERIAL NOT NULL,
    "tipofigurino" VARCHAR(255) NOT NULL,

    CONSTRAINT "tipofigurino_pkey" PRIMARY KEY ("idtipofigurino")
);

-- CreateTable
CREATE TABLE "tiposala" (
    "idtiposala" SERIAL NOT NULL,
    "nometiposala" VARCHAR(255) NOT NULL,

    CONSTRAINT "tiposala_pkey" PRIMARY KEY ("idtiposala")
);

-- CreateTable
CREATE TABLE "transacaofigurino" (
    "idtransacao" SERIAL NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "datatransacao" DATE NOT NULL,
    "anuncioidanuncio" INTEGER NOT NULL,
    "estadoidestado" INTEGER NOT NULL,
    "itemfigurinoiditem" INTEGER,
    "direcaoutilizadoriduser" INTEGER,
    "encarregadoeducacaoutilizadoriduser" INTEGER,
    "professorutilizadoriduser" INTEGER,

    CONSTRAINT "transacaofigurino_pkey" PRIMARY KEY ("idtransacao")
);

-- CreateTable
CREATE TABLE "utilizador" (
    "iduser" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telemovel" VARCHAR(20),
    "password" VARCHAR(255) NOT NULL,
    "estado" BOOLEAN NOT NULL DEFAULT true,
    "role" TEXT NOT NULL DEFAULT 'utilizador',

    CONSTRAINT "utilizador_pkey" PRIMARY KEY ("iduser")
);

-- CreateTable
CREATE TABLE "notificacao" (
    "idnotificacao" SERIAL NOT NULL,
    "mensagem" VARCHAR(500) NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "lida" BOOLEAN NOT NULL DEFAULT false,
    "dataleitura" TIMESTAMP(3),
    "datanotificacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "utilizadoriduser" INTEGER NOT NULL,

    CONSTRAINT "notificacao_pkey" PRIMARY KEY ("idnotificacao")
);

-- CreateTable
CREATE TABLE "disponibilidade_mensal" (
    "iddisponibilidade_mensal" SERIAL NOT NULL,
    "professorutilizadoriduser" INTEGER NOT NULL,
    "modalidadesprofessoridmodalidadeprofessor" INTEGER NOT NULL,
    "data" DATE NOT NULL,
    "horainicio" TIME(6) NOT NULL,
    "horafim" TIME(6) NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "salaid" INTEGER,
    "minutos_ocupados" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "disponibilidade_mensal_pkey" PRIMARY KEY ("iddisponibilidade_mensal")
);

-- CreateTable
CREATE TABLE "contacto" (
    "idcontacto" SERIAL NOT NULL,
    "nome" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "telemovel" VARCHAR(20) NOT NULL,
    "modalidade" VARCHAR(100),
    "faixaetaria" VARCHAR(50),
    "mensagem" TEXT,
    "datacriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contacto_pkey" PRIMARY KEY ("idcontacto")
);

-- CreateTable
CREATE TABLE "evento" (
    "idevento" SERIAL NOT NULL,
    "titulo" VARCHAR(255) NOT NULL,
    "descricao" TEXT,
    "dataevento" DATE NOT NULL,
    "datafim" DATE,
    "localizacao" VARCHAR(255),
    "imagem" VARCHAR(500),
    "linkbilhetes" VARCHAR(500),
    "publicado" BOOLEAN NOT NULL DEFAULT false,
    "destaque" BOOLEAN NOT NULL DEFAULT false,
    "datacriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "direcaoutilizadoriduser" INTEGER,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("idevento")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilizador_email_key" ON "utilizador"("email");

-- AddForeignKey
ALTER TABLE "aluno" ADD CONSTRAINT "fkaluno173503" FOREIGN KEY ("utilizadoriduser") REFERENCES "utilizador"("iduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aluno" ADD CONSTRAINT "fkalunoencarregado" FOREIGN KEY ("encarregadoiduser") REFERENCES "encarregadoeducacao"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alunoaula" ADD CONSTRAINT "fkalunoaula389701" FOREIGN KEY ("alunoidaluno") REFERENCES "aluno"("idaluno") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alunoaula" ADD CONSTRAINT "fkalunoaula983232" FOREIGN KEY ("aulaidaula") REFERENCES "aula"("idaula") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alunogrupo" ADD CONSTRAINT "fkalunogrupo704827" FOREIGN KEY ("grupoidgrupo") REFERENCES "grupo"("idgrupo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "alunogrupo" ADD CONSTRAINT "fkalunogrupo764623" FOREIGN KEY ("alunoidaluno") REFERENCES "aluno"("idaluno") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "anuncio" ADD CONSTRAINT "fkanuncio206012" FOREIGN KEY ("figurinoidfigurino") REFERENCES "figurino"("idfigurino") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "anuncio" ADD CONSTRAINT "fkanuncio342590" FOREIGN KEY ("encarregadoeducacaoutilizadoriduser") REFERENCES "encarregadoeducacao"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "anuncio" ADD CONSTRAINT "fkanuncio57402" FOREIGN KEY ("estadoidestado") REFERENCES "estado"("idestado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "anuncio" ADD CONSTRAINT "fkanuncio631724" FOREIGN KEY ("direcaoutilizadoriduser") REFERENCES "direcao"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "anuncio" ADD CONSTRAINT "fkanuncio953604" FOREIGN KEY ("professorutilizadoriduser") REFERENCES "professor"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "fkaula258513" FOREIGN KEY ("pedidodeaulaidpedidoaula") REFERENCES "pedidodeaula"("idpedidoaula") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "fkaula394641" FOREIGN KEY ("estadoaulaidestadoaula") REFERENCES "estadoaula"("idestadoaula") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "aula" ADD CONSTRAINT "fkaula645131" FOREIGN KEY ("salaidsala") REFERENCES "sala"("idsala") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "direcao" ADD CONSTRAINT "fkdirecao999505" FOREIGN KEY ("utilizadoriduser") REFERENCES "utilizador"("iduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "encarregadoeducacao" ADD CONSTRAINT "fkencarregad867539" FOREIGN KEY ("utilizadoriduser") REFERENCES "utilizador"("iduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "figurino" ADD CONSTRAINT "fkfigurino733126" FOREIGN KEY ("estadousoidestado") REFERENCES "estadouso"("idestado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "figurino" ADD CONSTRAINT "fkfigurino742941" FOREIGN KEY ("tamanhoidtamanho") REFERENCES "tamanho"("idtamanho") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "figurino" ADD CONSTRAINT "fkfigurino753753" FOREIGN KEY ("professorutilizadoriduser") REFERENCES "professor"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "figurino" ADD CONSTRAINT "fkfigurino779940" FOREIGN KEY ("coridcor") REFERENCES "cor"("idcor") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "figurino" ADD CONSTRAINT "fkfigurino823907" FOREIGN KEY ("generoidgenero") REFERENCES "genero"("idgenero") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "figurino" ADD CONSTRAINT "fkfigurino831575" FOREIGN KEY ("direcaoutilizadoriduser") REFERENCES "direcao"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "figurino" ADD CONSTRAINT "fkfigurino857260" FOREIGN KEY ("encarregadoeducacaoutilizadoriduser") REFERENCES "encarregadoeducacao"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "figurino" ADD CONSTRAINT "fkfigurino865766" FOREIGN KEY ("modelofigurinoidmodelo") REFERENCES "modelofigurino"("idmodelo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "figurino" ADD CONSTRAINT "fkfigurino940616" FOREIGN KEY ("itemfigurinoiditem") REFERENCES "itemfigurino"("iditem") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "modalidadeprofessor" ADD CONSTRAINT "fkmodalidade141851" FOREIGN KEY ("modalidadeidmodalidade") REFERENCES "modalidade"("idmodalidade") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "modalidadeprofessor" ADD CONSTRAINT "fkmodalidade804039" FOREIGN KEY ("professorutilizadoriduser") REFERENCES "professor"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "modelofigurino" ADD CONSTRAINT "fkmodelofigu271262" FOREIGN KEY ("tipofigurinoidtipofigurino") REFERENCES "tipofigurino"("idtipofigurino") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedidodeaula" ADD CONSTRAINT "fkpedidodeau208002" FOREIGN KEY ("encarregadoeducacaoutilizadoriduser") REFERENCES "encarregadoeducacao"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedidodeaula" ADD CONSTRAINT "pedidodeaula_disponibilidade_mensal_id_fkey" FOREIGN KEY ("disponibilidade_mensal_id") REFERENCES "disponibilidade_mensal"("iddisponibilidade_mensal") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedidodeaula" ADD CONSTRAINT "fkpedidodeau681324" FOREIGN KEY ("salaidsala") REFERENCES "sala"("idsala") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedidodeaula" ADD CONSTRAINT "fkpedidodeau808009" FOREIGN KEY ("estadoidestado") REFERENCES "estado"("idestado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "pedidodeaula" ADD CONSTRAINT "fkpedidodeau991761" FOREIGN KEY ("grupoidgrupo") REFERENCES "grupo"("idgrupo") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "professor" ADD CONSTRAINT "fkprofessor908326" FOREIGN KEY ("utilizadoriduser") REFERENCES "utilizador"("iduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sala" ADD CONSTRAINT "fksala356279" FOREIGN KEY ("tiposalaidtiposala") REFERENCES "tiposala"("idtiposala") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "sala" ADD CONSTRAINT "fksala483672" FOREIGN KEY ("estadosalaidestadosala") REFERENCES "estadosala"("idestadosala") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacaofigurino" ADD CONSTRAINT "fktransacaof244520" FOREIGN KEY ("anuncioidanuncio") REFERENCES "anuncio"("idanuncio") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacaofigurino" ADD CONSTRAINT "fktransacaof401607" FOREIGN KEY ("itemfigurinoiditem") REFERENCES "itemfigurino"("iditem") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacaofigurino" ADD CONSTRAINT "fktransacaof510648" FOREIGN KEY ("direcaoutilizadoriduser") REFERENCES "direcao"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacaofigurino" ADD CONSTRAINT "fktransacaofencarregado" FOREIGN KEY ("encarregadoeducacaoutilizadoriduser") REFERENCES "encarregadoeducacao"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacaofigurino" ADD CONSTRAINT "fktransacaofprofessor" FOREIGN KEY ("professorutilizadoriduser") REFERENCES "professor"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "transacaofigurino" ADD CONSTRAINT "fktransacaof915028" FOREIGN KEY ("estadoidestado") REFERENCES "estado"("idestado") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "notificacao" ADD CONSTRAINT "notificacao_utilizadoriduser_fkey" FOREIGN KEY ("utilizadoriduser") REFERENCES "utilizador"("iduser") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidade_mensal" ADD CONSTRAINT "disponibilidade_mensal_professorutilizadoriduser_fkey" FOREIGN KEY ("professorutilizadoriduser") REFERENCES "professor"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "disponibilidade_mensal" ADD CONSTRAINT "disponibilidade_mensal_modalidadesprofessoridmodalidadepro_fkey" FOREIGN KEY ("modalidadesprofessoridmodalidadeprofessor") REFERENCES "modalidadeprofessor"("idmodalidadeprofessor") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "disponibilidade_mensal" ADD CONSTRAINT "disponibilidade_mensal_salaid_fkey" FOREIGN KEY ("salaid") REFERENCES "sala"("idsala") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_direcaoutilizadoriduser_fkey" FOREIGN KEY ("direcaoutilizadoriduser") REFERENCES "direcao"("utilizadoriduser") ON DELETE NO ACTION ON UPDATE NO ACTION;
