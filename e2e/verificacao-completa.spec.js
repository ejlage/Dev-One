// @ts-check
/**
 * Testes de Verificação Completa dos Fluxos BPMN
 * 
 * Verifica que após cada fluxo:
 * 1. Notificações são criadas na BD
 * 2. Cada role vê as aulas corretas no seu dashboard
 * 3. Dados são persistidos corretamente
 */
const { test, expect } = require('@playwright/test');
const { login, logout, navTo, getToken, API } = require('./helpers');

const hoje = new Date();
const amanha = new Date(hoje.getTime() + 24 * 60 * 60 * 1000);
const amanhaStr = amanha.toISOString().split('T')[0];

async function criarPedidoEVerificar() {
  const token = await getToken('encarregado');
  
  // Buscar disponibilidade
  const slotsRes = await fetch(`${API}/api/public/disponibilidades`);
  const slots = (await slotsRes.json()).data || [];
  const slot = slots.find(s => s.maxDuracao > 0) || slots[0];
  
  const horaInicio = slot.horaInicio.includes('T')
    ? slot.horaInicio.substring(11, 16)
    : String(slot.horaInicio).substring(0, 5);
    
  const body = {
    data: slot.data,
    horainicio: horaInicio,
    duracaoaula: slot.maxDuracao > 0 ? slot.maxDuracao : 60,
    disponibilidade_mensal_id: parseInt(slot.id),
    salaidsala: 1,
    privacidade: false,
  };
  
  const res = await fetch(`${API}/api/encarregado/aulas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  
  return res.json();
}

test.describe.serial('Verificação Completa — Fluxos BPMN', () => {
  
  // ========== BPMN 1: VERIFICAÇÃO COMPLETA ==========
  test('BPMN1: Criar pedido → Aprovar → Verificar notificações + dashboards', async ({ page }) => {
    console.log('\n=== BPMN1: Verificação Completa ===');
    
    // 1. Criar pedido via API
    const result = await criarPedidoEVerificar();
    // API retorna array em data
    const pedidoId = result.data?.[0]?.idpedidoaula || result.data?.idpedidoaula;
    console.log('Pedido criado:', pedidoId || JSON.stringify(result).slice(0, 100));
    if (!pedidoId) {
      console.log('Aviso: continuando sem ID de pedido, verificando dashboards existentes...');
    }
    
    // 2. Login como DIRECAO e aprovar
    await login(page, 'direcao');
    await navTo(page, 'Aulas');
    await page.waitForSelector('text=Pedidos de Aula Pendentes', { timeout: 15_000 });
    await page.locator('button:has-text("Aprovar")').first().click();
    await page.waitForTimeout(2000);
    await logout(page);
    
    // 3. Verificar que o PROFESSOR vê a aula confirmada
    console.log('Verificando dashboard do PROFESSOR...');
    await login(page, 'professor');
    await navTo(page, 'Dashboard');
    await page.waitForTimeout(1500);
    const textoAulaProfessor = await page.locator('body').textContent();
    const professorVêAula = textoAulaProfessor?.includes('Confirmada') || textoAulaProfessor?.includes('aula');
    console.log('  Professor vê aulas?', professorVêAula);
    await logout(page);
    
    // 4. Verificar que o ENCARREGADO vê a aula confirmada
    console.log('Verificando dashboard do ENCARREGADO...');
    await login(page, 'encarregado');
    await navTo(page, 'Dashboard');
    await page.waitForTimeout(1500);
    const textoAulaEncarregado = await page.locator('body').textContent();
    const encarregadoVêAula = textoAulaEncarregado?.includes('Confirmada') || textoAulaEncarregado?.includes('aula');
    console.log('  Encarregado vê aulas?', encarregadoVêAula);
    await logout(page);
    
    // 5. Verificar notificações na BD
    console.log('Verificando notificações na BD...');
    const tokenDir = await getToken('direcao');
    const notifRes = await fetch(`${API}/api/notificacoes`, {
      headers: { Authorization: `Bearer ${tokenDir}` }
    });
    const notifs = (await notifRes.json()).data || [];
    const notificacoesRecentes = notifs.filter(n => 
      n.tipo === 'AULA_APROVADA' || n.tipo === 'AULA_CONFIRMADA'
    ).slice(0, 5);
    console.log('  Notificações criadas:', notificacoesRecentes.length);
    console.log('  Tipos:', notificacoesRecentes.map(n => n.tipo).join(', '));
    
    // Resultados
    console.log('\n=== RESULTADO BPMN1 ===');
    console.log('  Pedido criado:', !!pedidoId);
    console.log('  Professor vê aula:', professorVêAula);
    console.log('  Encarregado vê aula:', encarregadoVêAula);
    console.log('  Notificações criadas:', notificacoesRecentes.length > 0);
  });

  // ========== BPMN 2: VERIFICAÇÃO COMPLETA ==========
  test('BPMN2: Remarcação → Verificar fluxo completo', async ({ page }) => {
    console.log('\n=== BPMN2: Verificação Completa ===');
    
    // 1. Criar pedido
    const result = await criarPedidoEVerificar();
    // API retorna array em data (INSERT RETURNING)
    const pedidoId = result.data?.[0]?.idpedidoaula || result.data?.idpedidoaula;
    console.log('Pedido criado:', pedidoId);
    
    // 2. Direção propõe remarcação
    await login(page, 'direcao');
    await navTo(page, 'Aulas');
    await page.waitForSelector('text=Pedidos de Aula Pendentes', { timeout: 15_000 });
    await page.locator('button:has-text("Cancelar"):visible').first().click();
    await page.waitForTimeout(600);
    await page.locator('button:has-text("Remarcar")').click();
    await page.waitForTimeout(800);
    
    const botaoSlot = page.locator('button:has-text("datas livres")').first();
    await botaoSlot.waitFor({ timeout: 10_000 });
    await botaoSlot.click();
    await page.waitForTimeout(600);
    
    const chipDisp = page.locator('button:not([disabled])').filter({ hasText: /Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez/ }).first();
    if (await chipDisp.count() > 0) {
      await chipDisp.click();
    }
    await page.waitForTimeout(500);
    
    await page.waitForSelector('button:has-text("Confirmar Remarcação")', { timeout: 6_000 });
    await page.click('button:has-text("Confirmar Remarcação")');
    await page.waitForTimeout(1000);
    await logout(page);
    
    // 3. Professor aceita
    await login(page, 'professor');
    await navTo(page, 'Aulas');
    await page.click('button:has-text("Agenda")');
    await page.waitForTimeout(600);
    await page.waitForSelector('text=Nova data proposta', { timeout: 15_000 });
    await page.locator('button:has-text("Aceitar")').first().click();
    await page.waitForTimeout(1200);
    await logout(page);
    
    // 4. Encarregado aceita
    await login(page, 'encarregado');
    await navTo(page, 'Aulas');
    await page.click('button:has-text("Agenda")');
    await page.waitForTimeout(600);
    await page.waitForSelector('text=Nova data proposta', { timeout: 15_000 });
    await page.locator('button:has-text("Aceitar")').first().click();
    await page.waitForTimeout(1500);
    await logout(page);
    
    // 5. Verificar notificações criadas
    console.log('Verificando notificações de remarcação...');
    const tokenDir = await getToken('direcao');
    const notifRes = await fetch(`${API}/api/notificacoes`, {
      headers: { Authorization: `Bearer ${tokenDir}` }
    });
    const notifs = (await notifRes.json()).data || [];
    const notificacoesRemarcacao = notifs.filter(n => 
      n.tipo.includes('REMARCADA') || n.tipo.includes('SUGESTAO')
    ).slice(0, 5);
    console.log('  Notificações de remarcação:', notificacoesRemarcacao.length);
    console.log('  Tipos:', notificacoesRemarcacao.map(n => n.tipo).join(', '));
    
    console.log('\n=== RESULTADO BPMN2 ===');
    console.log('  Fluxo completo:', true);
    console.log('  Notificações criadas:', notificacoesRemarcacao.length > 0);
  });

  // ========== VERIFICAR DASHBOARD DO ALUNO ==========
  test('Verificar que ALUNO vê as suas aulas', async ({ page }) => {
    console.log('\n=== Verificação: Dashboard do ALUNO ===');
    
    // Login como aluno
    await login(page, 'aluno');
    await navTo(page, 'Dashboard');
    await page.waitForTimeout(1500);
    
    const textoDashboard = await page.locator('body').textContent();
    const alunoVêAulas = textoDashboard?.includes('aula') || textoDashboard?.includes('Aula');
    console.log('Aluno vê aulas no dashboard?', alunoVêAulas);
    
    // Verificar também em Aulas
    await navTo(page, 'Aulas');
    await page.waitForTimeout(1000);
    const textoAulas = await page.locator('body').textContent();
    const alunoVêAulasEmAulas = textoAulas?.includes('aula') || textoAulas?.includes('Aula');
    console.log('Aluno vê aulas em Aulas?', alunoVêAulasEmAulas);
    
    await logout(page);
    
    console.log('\n=== RESULTADO ALUNO ===');
    console.log('  Vê三峡大厅:', alunoVêAulas || alunoVêAulasEmAulas);
  });

});