Processos  de Negócio 

1.	Atores e Permissões (RBAC)
•	Dependência Aluno-Encarregado: Um utilizador com a role ALUNO está obrigatoriamente vinculado a um ENCARREGADO. O Aluno tem permissão de "Apenas Leitura" na agenda.
•	Centralização de Identidades: A criação de qualquer conta de utilizador (Aluno, Encarregado ou Professor) é da exclusiva responsabilidade da Direção.
•	Privacidade de Dados: Um Encarregado apenas pode visualizar as agendas e dados de faturação dos Alunos que estão sob sua responsabilidade direta.
2.	Gestão de Aulas e Coaching
•	Restrição de Duração: Uma aula de coaching não pode ter menos de 30 minutos nem mais de 120 minutos.
•	Validação de Conflitos (Regra de Ouro): O sistema deve impedir o agendamento se o Estúdio (sala) ou o Professor já estiverem ocupados no slot horário selecionado.
•	Hierarquia de Decisão: Um pedido de aula nasce como PENDENTE. Só passa a CONFIRMADA após a validação manual da Direção.
•	Garantia de Serviço: Uma aula só é considerada para faturação após o Professor confirmar a sua realização no sistema.
•	Criar uma regra de negócio – nova – out of the box 
o	Adiar aula: professor adia uma aula – e passa para – remarcar aula. 
o	Sistema de Créditos e Pack de Horas
o	Sistema de Substituição e Alerta de Ausência
3.	Gestão de Figurinos 
•	Moderação de Vendas: Qualquer item colocado no marketplace por um Encarregado pode necessitar de uma validação rápida da Direção para garantir que é material adequado à escola.
•	Reserva de Inventário: Um figurino da escola marcado como ALUGADO ou EM MANUTENÇÃO deve ficar indisponível para novas reservas no sistema.
4.	Gestão de Eventos 
•	Redireccionamento Externo: O sistema atua como montra. A regra de negócio dita que a venda final de bilhetes de espetáculos é delegada à plataforma “Ticketline”.



 
"Requisitos Funcionais"
ID RF	Descrição do Requisito	Regra de Negócio (RN)	Caso de Uso (UC)
RF 01	O sistema deve permitir à Direção criar contas para Encarregados, Alunos e Professores.	RN 01 - Centralização de Identidades	UC 01.01
RF 02	O sistema deve validar a autenticação de utilizadores via Email e Password (JWT).	RN 01 - RBAC	UC 01.02
RF 03	O sistema deve restringir o perfil Aluno a permissões de "Apenas Leitura" na agenda.	RN 01 - Dependência Aluno-Encarregado	UC 01.05 / UC 02.01
RF 04	O sistema deve garantir que o Encarregado apenas aceda aos dados dos Alunos vinculados.	RN 01 - Privacidade de Dados	UC 01.05 / UC 02.01
RF 05	O sistema deve validar que as aulas de coaching duram entre 30 e 120 minutos.	RN 02 - Restrição de Duração	UC 03.01
RF 06	O sistema deve impedir agendamentos com conflito de Sala ou Professor no mesmo horário.	RN 02 - Validação de Conflitos	UC 03.01
RF 07	O sistema deve manter novos pedidos em estado "Pendente" até aprovação da Direção.	RN 02 - Hierarquia de Decisão	UC 03.02 / UC 04.01
RF 08	O sistema deve processar a faturação apenas após a confirmação de aula pelo Professor.	RN 02 - Garantia de Serviço	UC 04.02 / UC 04.03
RF 09	O sistema deve permitir à Direção moderar itens colocados no marketplace.	RN 03 - Moderação de Vendas	UC 05 (Figurinos)
RF 10	O sistema deve bloquear reservas de figurinos em estado Alugado ou Manutenção.	RN 03 - Reserva de Inventário	UC 05 (Figurinos)
RF 11	O sistema deve disponibilizar links externos para a venda de bilhetes na Ticketline.	RN 04 - Redireccionamento Externo	UC 06 (Eventos)
