# Funcionalidade de Marcação de Aulas - ENT'ARTES

## Visão Geral

A funcionalidade de marcação de aulas foi implementada seguindo as regras de negócio definidas, com um sistema completo de gestão de aulas que respeita as permissões de cada role (RBAC).

## Funcionalidades Implementadas

### 1. **Para Encarregados**
Os encarregados têm acesso completo à gestão de aulas dos seus educandos:

- ✅ **Criar Pedidos de Aulas**: Formulário completo com validações
- ✅ **Visualizar Aulas**: Ver todas as aulas dos seus alunos
- ✅ **Filtrar por Status**: Filtros para PENDENTE, CONFIRMADA, REALIZADA, etc.
- ✅ **Validações Automáticas**:
  - Duração entre 30-120 minutos (conforme regras de negócio)
  - Validação de conflitos de horário (professor e sala)
  - Data não pode ser no passado
  - Verificação de disponibilidade de estúdio

#### Como usar (Encarregado):
1. Faça login com uma conta de encarregado
2. Aceda à página "Aulas" no menu
3. Clique no botão "Nova Aula"
4. Preencha o formulário:
   - Selecione o aluno
   - Escolha o professor
   - Selecione o estúdio
   - Defina data e hora
   - Escolha a duração (30, 60, 90 ou 120 minutos)
   - Adicione observações (opcional)
5. Clique em "Solicitar Aula"
6. O pedido ficará com status PENDENTE até aprovação da direção

### 2. **Para Alunos**
Os alunos têm permissão de **apenas leitura** (conforme regras de negócio):

- ✅ **Visualização Especial**: Interface dedicada e amigável
- ✅ **Próximas Aulas**: Destaque para as próximas 3 aulas confirmadas
- ✅ **Estatísticas**: Resumo de aulas pendentes, confirmadas, realizadas
- ✅ **Calendário Visual**: Informação clara sobre datas e horários
- ✅ **Avisos**: Alertas para aulas "HOJE" e "AMANHÃ"

#### Como usar (Aluno):
1. Faça login com uma conta de aluno
2. Aceda à página "Aulas" no menu
3. Visualize:
   - Estatísticas rápidas (pendentes, confirmadas, realizadas)
   - Próximas aulas com destaque especial
   - Todas as suas aulas agendadas
4. Para solicitar novas aulas, contacte o seu encarregado

### 3. **Para Professores**
Os professores podem gerir as suas aulas:

- ✅ **Ver Aulas Agendadas**: Todas as aulas onde são o professor
- ✅ **Confirmar Realização**: Marcar aulas como realizadas
- ✅ **Remarcar Aulas**: Solicitar remarcação quando necessário
- ✅ **Filtros**: Ver aulas por status

#### Como usar (Professor):
1. Faça login com uma conta de professor
2. Aceda à página "Aulas"
3. Veja todas as suas aulas agendadas
4. Para aulas CONFIRMADAS:
   - Clique em "Confirmar" após a aula ser realizada
   - Ou clique em "Remarcar" se precisar de alterar
5. As aulas confirmadas como realizadas ficam disponíveis para faturação

### 4. **Para Direção**
A direção tem controlo total sobre todas as aulas:

- ✅ **Aprovar Pedidos**: Aprovar aulas PENDENTES
- ✅ **Rejeitar Pedidos**: Rejeitar com motivo
- ✅ **Remarcar**: Forçar remarcação
- ✅ **Visualização Completa**: Ver todas as aulas de todos os utilizadores
- ✅ **Gestão de Faturação**: Validar aulas para faturação

#### Como usar (Direção):
1. Faça login com uma conta de direção
2. Aceda à página "Aulas"
3. Veja todos os pedidos pendentes
4. Para cada pedido PENDENTE:
   - Clique em "Aprovar" para confirmar
   - Clique em "Rejeitar" e indique o motivo
   - Clique em "Remarcar" para solicitar nova data
5. Filtre aulas por status conforme necessário

## Regras de Negócio Implementadas

### ✅ RF 05 - Restrição de Duração
- Aulas devem ter entre 30 e 120 minutos
- Validação automática no formulário
- Opções pré-definidas: 30, 60, 90, 120 minutos

### ✅ RF 06 - Validação de Conflitos (Regra de Ouro)
O sistema valida automaticamente:
- **Conflito de Professor**: Verifica se o professor já tem aula no horário
- **Conflito de Sala**: Verifica se o estúdio já está ocupado
- Considera apenas aulas CONFIRMADAS e PENDENTES (não considera REJEITADAS)
- Mostra mensagens de erro específicas

### ✅ RF 07 - Hierarquia de Decisão
- Novos pedidos ficam como PENDENTE
- Apenas a direção pode aprovar (mudar para CONFIRMADA)
- Apenas a direção pode rejeitar (mudar para REJEITADA)

### ✅ RF 08 - Garantia de Serviço
- Professor confirma a realização (muda para REALIZADA)
- Apenas aulas REALIZADAS podem ser faturadas
- Sistema rastreia validação de faturação

### ✅ RF 03 - Dependência Aluno-Encarregado
- Alunos têm apenas leitura
- Interface especial e amigável para alunos
- Encarregados gerem as aulas dos seus educandos

### ✅ RF 04 - Privacidade de Dados
- Encarregados veem apenas aulas dos seus alunos
- Professores veem apenas as suas aulas
- Alunos veem apenas as suas próprias aulas
- Direção vê todas as aulas

## Componentes Criados

### 1. **NovaAulaForm.tsx**
Formulário completo para criação de pedidos de aulas:
- Validações em tempo real
- Cálculo automático de hora de término
- Verificação de conflitos
- Mensagens de erro claras
- Informações sobre regras de negócio

### 2. **AlunoAgendaView.tsx**
Interface especial para alunos:
- Cards de próximas aulas
- Estatísticas visuais
- Avisos de "HOJE" e "AMANHÃ"
- Informação sobre permissões
- Layout responsivo

### 3. **AulasStatistics.tsx**
Widget de estatísticas rápidas:
- Contagem por status
- Próximas aulas (7 dias)
- Visual colorido e intuitivo
- Pode ser usado em dashboards

## Validações Implementadas

### Validações de Formulário:
- ✅ Todos os campos obrigatórios preenchidos
- ✅ Duração entre 30-120 minutos
- ✅ Data não pode ser no passado
- ✅ Hora de início válida

### Validações de Conflito:
- ✅ Professor disponível no horário
- ✅ Estúdio disponível no horário
- ✅ Verificação de sobreposição de horários
- ✅ Considera horários parciais (início, meio, fim)

### Validações de Negócio:
- ✅ Encarregado só solicita para seus alunos
- ✅ Status PENDENTE ao criar
- ✅ Apenas direção aprova/rejeita
- ✅ Professor confirma realização

## Notificações (Toast)

O sistema usa notificações toast (biblioteca Sonner) para feedback:
- ✅ Sucesso ao criar pedido
- ✅ Avisos de conflito
- ✅ Erros de validação
- ✅ Confirmações de ações (aprovar, rejeitar, etc.)

## Testes Recomendados

### Teste 1: Criar Aula (Encarregado)
1. Login como encarregado (pedro.oliveira@email.pt)
2. Ir para Aulas > Nova Aula
3. Preencher formulário
4. Verificar validações
5. Criar pedido
6. Verificar status PENDENTE

### Teste 2: Validação de Conflitos
1. Criar aula para Prof. João Santos às 14:00
2. Tentar criar outra aula para o mesmo professor no mesmo horário
3. Verificar mensagem de erro

### Teste 3: Visualização de Aluno
1. Login como aluno (miguel.oliveira@email.pt)
2. Ir para Aulas
3. Verificar interface especial
4. Verificar estatísticas
5. Verificar próximas aulas

### Teste 4: Aprovação (Direção)
1. Login como direção (direcao@entartes.pt)
2. Ir para Aulas
3. Filtrar por PENDENTE
4. Aprovar um pedido
5. Verificar mudança para CONFIRMADA

### Teste 5: Confirmação (Professor)
1. Login como professor (joao.santos@entartes.pt)
2. Ir para Aulas
3. Ver aulas CONFIRMADAS
4. Confirmar realização
5. Verificar mudança para REALIZADA

## Melhorias Futuras Sugeridas

1. **Integração com Backend (Supabase)**
   - Persistência de dados
   - Notificações em tempo real
   - Sincronização multi-utilizador

2. **Calendário Visual**
   - Vista de calendário mensal
   - Drag & drop para remarcação
   - Visualização de disponibilidade

3. **Notificações Email/SMS**
   - Avisos de aprovação/rejeição
   - Lembretes de aulas
   - Confirmações automáticas

4. **Sistema de Créditos**
   - Pack de horas
   - Gestão de créditos
   - Faturação automática

5. **Relatórios**
   - Relatórios de frequência
   - Estatísticas de utilização
   - Análise de professores/estúdios

6. **Validação de Horário de Funcionamento**
   - Horários permitidos por estúdio
   - Dias de funcionamento
   - Feriados e férias

## Contas de Teste

Use estas contas para testar:

### Direção:
- Email: direcao@entartes.pt
- Password: (defina conforme seu sistema)

### Professor:
- Email: joao.santos@entartes.pt
- Password: (defina conforme seu sistema)

### Encarregado:
- Email: pedro.oliveira@email.pt
- Password: (defina conforme seu sistema)
- Educandos: Miguel Oliveira, Sofia Oliveira

### Aluno:
- Email: miguel.oliveira@email.pt
- Password: (defina conforme seu sistema)
- Encarregado: Pedro Oliveira

## Suporte

Para questões ou problemas, consulte:
- Regras de negócio: `/src/imports/regras-negocio.md`
- Tipos TypeScript: `/src/app/types/index.ts`
- Dados mock: `/src/app/data/mockData.ts`
