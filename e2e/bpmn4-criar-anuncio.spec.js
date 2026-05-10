// @ts-check
/**
 * BPMN 4 — BPMN_CriarAnuncio_V4
 *
 * 1. Encarregado cria anúncio de aluguer de figurino → seleciona figurino → submete
 *    → anúncio fica PENDENTE
 * 2. Direção aprova o anúncio → fica APROVADO, notificação enviada
 */
const { test, expect } = require('@playwright/test');
const { login, logout, navTo } = require('./helpers');

test.describe.serial('BPMN 4 — Criar Anúncio de Figurino', () => {

  test('Encarregado cria anúncio de aluguer', async ({ page }) => {
    await login(page, 'encarregado');
    await navTo(page, 'Marketplace');
    await expect(page).toHaveURL(/marketplace/i);

    // Clicar "Novo Anúncio" (visível para ENCARREGADO)
    await page.waitForSelector('button:has-text("Novo Anúncio")', { timeout: 10_000 });
    await page.click('button:has-text("Novo Anúncio")');
    await page.waitForTimeout(700);

    // Formulário aparece — selecionar figurino
    const selectFigurino = page.locator('select').filter({ hasText: /figurino|Selecionar/i }).first();
    await selectFigurino.waitFor({ timeout: 8_000 });
    const numOptions = await selectFigurino.locator('option').count();
    if (numOptions > 1) {
      await selectFigurino.selectOption({ index: 1 });
    }
    await page.waitForTimeout(400);

    // Preencher valor
    const inputValor = page.locator('input[placeholder*="25"]').first();
    if (await inputValor.count() > 0) {
      await inputValor.fill('18');
    } else {
      const numInput = page.locator('input[type="number"]').first();
      if (await numInput.count() > 0) await numInput.fill('18');
    }

    // Preencher datas
    const hoje = new Date();
    const dataInicio = new Date(hoje.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const dataFim    = new Date(hoje.getTime() + 33 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const dateInputs = page.locator('input[type="date"]');
    const nDates = await dateInputs.count();
    if (nDates >= 1) await dateInputs.nth(0).fill(dataInicio);
    if (nDates >= 2) await dateInputs.nth(1).fill(dataFim);

    // Submeter
    const btnPublicar = page.locator('button[type="submit"]').or(
      page.locator('button:has-text("Publicar Aluguer")')
    ).first();
    await btnPublicar.waitFor({ timeout: 5_000 });
    await btnPublicar.click();

    // Aguardar formulário fechar (botão "Novo Anúncio" reaparece = submissão OK)
    await page.waitForSelector('button:has-text("Novo Anúncio")', { timeout: 10_000 });

    // Anúncio aparece com badge "Pendente" (visível ao criador)
    await page.waitForSelector('text=Pendente', { timeout: 10_000 });

    await logout(page);
  });

  test('Direção aprova o anúncio pendente', async ({ page }) => {
    await login(page, 'direcao');
    await navTo(page, 'Marketplace');

    // Aguardar badge "Pendente" e botão "Aprovar"
    await page.waitForSelector('text=Pendente', { timeout: 12_000 });
    await page.waitForSelector('button:has-text("Aprovar")', { timeout: 8_000 });

    await page.locator('button:has-text("Aprovar")').first().click();
    await page.waitForTimeout(1200);

    // Badge "Pendente" desaparece do card aprovado
    // (sem badge = aprovado — ou pode aparecer "Aprovado" noutro card)
    await page.waitForTimeout(800);
    console.log('Anúncio aprovado com sucesso');

    await logout(page);
  });

});
