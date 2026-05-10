// @ts-check
/**
 * BPMN 3 — AluguerFigurino_BPMN_V2
 *
 * Fluxo completo:
 *   1. Encarregado/Professor seleciona anúncio de aluguer → Solicitar Aluguer → preenche datas → Confirmar
 *   2. Direção recebe pedido de reserva → Aprovar
 *   3. Reserva aceite, notificação enviada
 *
 * Pré-condição: existe pelo menos um anúncio de ALUGUER com status APROVADO.
 * Se não existir, cria-se e aprova-se via API antes do teste.
 */
const { test, expect } = require('@playwright/test');
const { login, logout, navTo, waitForToast, getToken, API } = require('./helpers');

async function garantirAnuncioAluguer() {
  const token = await getToken('direcao');

  // Ver anúncios existentes
  const res = await fetch(`${API}/api/anuncios`, { headers: { Authorization: `Bearer ${token}` } });
  const data = (await res.json()).data || [];
  // Must have stock > 0 — pre-existing anuncios may be esgotado (0 unidades)
  const aluguerAprovado = data.find(a => a.tipoTransacao === 'ALUGUER' && a.status === 'APROVADO' && a.quantidade > 0);
  if (aluguerAprovado) return aluguerAprovado;

  // Buscar um figurino existente
  const figRes = await fetch(`${API}/api/figurinos`, { headers: { Authorization: `Bearer ${token}` } });
  const figs = (await figRes.json()).data || [];
  if (!figs.length) throw new Error('Sem figurinos disponíveis');
  const figurinoId = figs[0].id || figs[0].idfigurino;

  // Buscar estado pendente
  const estadoRes = await fetch(`${API}/api/anuncios`, { headers: { Authorization: `Bearer ${token}` } });
  // Criar anúncio de aluguer com os campos reais do schema
  const criarRes = await fetch(`${API}/api/anuncios`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      figurinoidfigurino: parseInt(figurinoId),
      tipotransacao: 'ALUGUER',
      valor: 15,
      dataanuncio: new Date().toISOString().split('T')[0],
      datainicio: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
      datafim: new Date(Date.now() + 32 * 86400000).toISOString().split('T')[0],
      quantidade: 1,
      estadoidestado: 21,
      direcaoutilizadoriduser: 23,
      encarregadoeducacaoutilizadoriduser: 26,
      professorutilizadoriduser: 24,
    }),
  });
  const novoAnuncio = await criarRes.json();
  const anuncioId = novoAnuncio.data?.id;
  if (!anuncioId) return null;

  // Aprovar o anúncio via avaliar endpoint
  await fetch(`${API}/api/anuncios/${anuncioId}/avaliar`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ decisao: 'aprovar' }),
  });

  return { id: String(anuncioId) };
}

test.describe.serial('BPMN 3 — Aluguer de Figurino', () => {

  test('Encarregado solicita aluguer de figurino', async ({ page }) => {
    await garantirAnuncioAluguer().catch(e => console.warn('Setup:', e.message));

    await login(page, 'encarregado');
    await navTo(page, 'Marketplace');
    await expect(page).toHaveURL(/marketplace/i);

    // Aguardar cards de anúncios carregarem
    await page.waitForSelector('text=Solicitar Aluguer', { timeout: 12_000 });

    // Clicar "Solicitar Aluguer" no primeiro anúncio de aluguer disponível
    const botaoSolicitar = page.locator('button:has-text("Solicitar Aluguer")').first();
    await botaoSolicitar.scrollIntoViewIfNeeded();
    await botaoSolicitar.click();
    await page.waitForTimeout(500);

    // Preencher datas do formulário inline
    const hoje = new Date();
    const dataInicio = new Date(hoje.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dataFim    = new Date(hoje.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const inputInicio = page.locator('input[type="date"]').first();
    await inputInicio.fill(dataInicio);
    const inputFim = page.locator('input[type="date"]').nth(1);
    await inputFim.fill(dataFim);

    // Confirmar reserva
    await page.click('button:has-text("Confirmar")');
    await page.waitForTimeout(1000);

    await logout(page);
  });

  test('Direção aprova a reserva de figurino', async ({ page }) => {
    await login(page, 'direcao');
    await navTo(page, 'Marketplace');

    // Clicar "Ver Reservas" para ver reservas pendentes
    await page.waitForSelector('button:has-text("Ver Reservas")', { timeout: 10_000 });
    await page.click('button:has-text("Ver Reservas")');
    await page.waitForTimeout(600);

    // Aguardar lista de reservas
    await page.waitForSelector('text=Aprovação de Reservas', { timeout: 8_000 });

    // Clicar Aprovar na primeira reserva PENDENTE
    const botaoAprovar = page.locator('button:has-text("Aprovar")').first();
    await botaoAprovar.waitFor({ timeout: 8_000 });
    await botaoAprovar.click();

    // Estado muda para Aprovada
    await page.waitForSelector('text=Aprovada', { timeout: 8_000 });

    await logout(page);
  });
});
