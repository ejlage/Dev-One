const { test, expect } = require('@playwright/test');
const { login, logout, navTo, getToken, criarPedidoPendente, dbScalar, API, approvePedidoApi, findSlot } = require('./helpers');

test.describe.serial('BPMN 2 — Remarcação de Aula', () => {

  test('Setup: criar pedido PENDENTE via API', async () => {
    const result = await criarPedidoPendente();
    console.log(`Pedido criado: pedidoId=${result.pedidoId}`);
    expect(result.success).toBeTruthy();
    expect(result.pedidoId).toBeTruthy();
    /* Cleanup: approve the pedido so it doesn't interfere with subsequent tests */
    if (result.pedidoId) {
      await approvePedidoApi(result.pedidoId);
      console.log(`Cleanup: Pedido ${result.pedidoId} approved via API`);
    }
  });

  test('Happy path: Direção remarca (UI) → Professor aceita (API) → EE aceita (API) → Aula remarcada', async ({ page }) => {
    /* Given: A PENDENTE pedido exists */
    const setup = await criarPedidoPendente();
    const pedidoId = setup.pedidoId;
    console.log(`Pedido PENDENTE: ID=${pedidoId}`);
    expect(pedidoId).toBeTruthy();

    /* When: Direção logs in and remarca via UI */
    await login(page, 'direcao');
    await navTo(page, 'Aulas');
    await expect(page).toHaveURL(/aulas/);
    await page.waitForSelector('text=Pedidos de Aula Pendentes', { timeout: 15_000 });

    const botaoCancelarAula = page.locator('button:has-text("Cancelar"):visible').first();
    await botaoCancelarAula.waitFor({ timeout: 8_000 });
    await botaoCancelarAula.click();
    await page.waitForTimeout(600);

    await page.waitForSelector('text=Escolher uma nova data disponível do professor', { timeout: 8_000 });
    await page.locator('button:has-text("Remarcar")').click();
    await page.waitForTimeout(800);

    const botaoSlot = page.locator('button:has-text("datas livres")').first();
    await botaoSlot.waitFor({ timeout: 10_000 });
    await botaoSlot.click();
    await page.waitForTimeout(600);

    await page.waitForSelector('text=Data disponível', { timeout: 6_000 });
    const chipDisp = page.locator('button:not([disabled])').filter({ hasText: /Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez/ }).first();
    if (await chipDisp.count() > 0) {
      await chipDisp.click();
    }
    await page.waitForTimeout(500);

    await page.waitForSelector('button:has-text("Confirmar Remarcação")', { timeout: 6_000 });
    await page.click('button:has-text("Confirmar Remarcação")');
    await page.waitForTimeout(1000);
    await logout(page);

    /* Then: Verify sugestaoestado = AGUARDA_PROFESSOR in DB */
    let sugestao = dbScalar(`SELECT sugestaoestado FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    console.log(`Estado sugestão após remarcação: ${sugestao}`);
    expect(sugestao).toBe('AGUARDA_PROFESSOR');

    /* When: Professor aceita via API */
    const professorToken = await getToken('professor');
    const resProf = await fetch(`${API}/api/aulas/${pedidoId}/responder-professor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${professorToken}` },
      body: JSON.stringify({ aceitar: true }),
    });
    const jsonProf = await resProf.json();
    console.log(`Professor respondeu: ${JSON.stringify(jsonProf)}`);
    expect(resProf.ok).toBeTruthy();

    /* Then: Verify sugestaoestado = AGUARDA_EE */
    sugestao = dbScalar(`SELECT sugestaoestado FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    console.log(`Estado sugestão após professor aceitar: ${sugestao}`);
    expect(sugestao).toBe('AGUARDA_EE');

    /* When: EE aceita via API */
    const eeToken = await getToken('encarregado');
    const resEE = await fetch(`${API}/api/aulas/${pedidoId}/responder-encarregado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${eeToken}` },
      body: JSON.stringify({ aceitar: true }),
    });
    const jsonEE = await resEE.json();
    console.log(`EE respondeu: ${JSON.stringify(jsonEE)}`);
    expect(resEE.ok).toBeTruthy();

    /* Then: Verify final state — sugestaoestado=null, data updated */
    sugestao = dbScalar(`SELECT sugestaoestado FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    console.log(`Estado sugestão final: "${sugestao}"`);
    expect(sugestao).toBe('');

    console.log(`Resultado: Aula ${pedidoId} remarcada com sucesso`);
  });

  test('Professor rejeita: Direção remarca (UI) → Professor rejeita (API) → Sugestão cancelada', async ({ page }) => {
    /* Given: A PENDENTE pedido exists */
    const setup = await criarPedidoPendente();
    const pedidoId = setup.pedidoId;
    console.log(`Aula CONFIRMADA: ID=${pedidoId}`);
    expect(pedidoId).toBeTruthy();

    /* When: Direção remarca via UI */
    await login(page, 'direcao');
    await navTo(page, 'Aulas');
    await page.waitForSelector('text=Pedidos de Aula Pendentes', { timeout: 15_000 });

    const botaoCancelarAula = page.locator('button:has-text("Cancelar"):visible').first();
    await botaoCancelarAula.waitFor({ timeout: 8_000 });
    await botaoCancelarAula.click();
    await page.waitForTimeout(600);

    await page.waitForSelector('text=Escolher uma nova data disponível do professor', { timeout: 8_000 });
    await page.locator('button:has-text("Remarcar")').click();
    await page.waitForTimeout(800);

    const botaoSlot = page.locator('button:has-text("datas livres")').first();
    await botaoSlot.waitFor({ timeout: 10_000 });
    await botaoSlot.click();
    await page.waitForTimeout(600);

    await page.waitForSelector('text=Data disponível', { timeout: 6_000 });
    const chipDisp = page.locator('button:not([disabled])').filter({ hasText: /Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez/ }).first();
    if (await chipDisp.count() > 0) {
      await chipDisp.click();
    }
    await page.waitForTimeout(500);

    await page.waitForSelector('button:has-text("Confirmar Remarcação")', { timeout: 6_000 });
    await page.click('button:has-text("Confirmar Remarcação")');
    await page.waitForTimeout(1000);
    await logout(page);

    /* Verify AGUARDA_PROFESSOR */
    let sugestao = dbScalar(`SELECT sugestaoestado FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    expect(sugestao).toBe('AGUARDA_PROFESSOR');

    /* When: Professor rejeita via API */
    const professorToken = await getToken('professor');
    const resProf = await fetch(`${API}/api/aulas/${pedidoId}/responder-professor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${professorToken}` },
      body: JSON.stringify({ aceitar: false }),
    });
    const jsonProf = await resProf.json();
    console.log(`Professor respondeu: ${JSON.stringify(jsonProf)}`);
    expect(resProf.ok).toBeTruthy();

    /* Then: Verify sugestaoestado=null, novadata=null (sugestão cancelada) */
    sugestao = dbScalar(`SELECT sugestaoestado FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    console.log(`Estado sugestão após professor rejeitar: "${sugestao}"`);
    expect(sugestao).toBe('');

    const novadata = dbScalar(`SELECT novadata FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    console.log(`Novadata após rejeição: "${novadata}"`);
    expect(novadata).toBe('');

    console.log(`Resultado: Sugestão de remarcação ${pedidoId} cancelada pelo professor`);
  });

  test('EE rejeita: Direção remarca (UI) → Professor aceita (API) → EE rejeita (API) → Aula CANCELADA', async ({ page }) => {
    /* Given: A PENDENTE pedido exists */
    const setup = await criarPedidoPendente();
    const pedidoId = setup.pedidoId;
    console.log(`Aula CONFIRMADA: ID=${pedidoId}`);
    expect(pedidoId).toBeTruthy();

    /* When: Direção remarca via UI */
    await login(page, 'direcao');
    await navTo(page, 'Aulas');
    await page.waitForSelector('text=Pedidos de Aula Pendentes', { timeout: 15_000 });

    const botaoCancelarAula = page.locator('button:has-text("Cancelar"):visible').first();
    await botaoCancelarAula.waitFor({ timeout: 8_000 });
    await botaoCancelarAula.click();
    await page.waitForTimeout(600);

    await page.waitForSelector('text=Escolher uma nova data disponível do professor', { timeout: 8_000 });
    await page.locator('button:has-text("Remarcar")').click();
    await page.waitForTimeout(800);

    const botaoSlot = page.locator('button:has-text("datas livres")').first();
    await botaoSlot.waitFor({ timeout: 10_000 });
    await botaoSlot.click();
    await page.waitForTimeout(600);

    await page.waitForSelector('text=Data disponível', { timeout: 6_000 });
    const chipDisp = page.locator('button:not([disabled])').filter({ hasText: /Jan|Fev|Mar|Abr|Mai|Jun|Jul|Ago|Set|Out|Nov|Dez/ }).first();
    if (await chipDisp.count() > 0) {
      await chipDisp.click();
    }
    await page.waitForTimeout(500);

    await page.waitForSelector('button:has-text("Confirmar Remarcação")', { timeout: 6_000 });
    await page.click('button:has-text("Confirmar Remarcação")');
    await page.waitForTimeout(1000);
    await logout(page);

    /* Professor aceita via API first */
    const professorToken = await getToken('professor');
    await fetch(`${API}/api/aulas/${pedidoId}/responder-professor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${professorToken}` },
      body: JSON.stringify({ aceitar: true }),
    });

    /* Verify AGUARDA_EE */
    let sugestao = dbScalar(`SELECT sugestaoestado FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    expect(sugestao).toBe('AGUARDA_EE');

    /* When: EE rejeita via API */
    const eeToken = await getToken('encarregado');
    const resEE = await fetch(`${API}/api/aulas/${pedidoId}/responder-encarregado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${eeToken}` },
      body: JSON.stringify({ aceitar: false }),
    });
    console.log(`EE rejeitou: ${resEE.status}`);
    expect(resEE.ok).toBeTruthy();

    /* Then: Verify aula CANCELADA */
    const estado = dbScalar(`SELECT tipoestado FROM estado e JOIN pedidodeaula pa ON pa.estadoidestado = e.idestado WHERE pa.idpedidoaula = ${pedidoId}`);
    console.log(`Estado final: ${estado}`);
    expect(estado).toBe('Cancelado');

    sugestao = dbScalar(`SELECT sugestaoestado FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    console.log(`Sugestão final: "${sugestao}"`);
    expect(sugestao).toBe('');

    console.log(`Resultado: Aula ${pedidoId} cancelada após EE rejeitar remarcação`);
  });

  test('BD verification: after happy path remarcação, data updated and sugestaoestado=null', async () => {
    /* Given: A PENDENTE pedido exists */
    const setup = await criarPedidoPendente();
    const pedidoId = setup.pedidoId;
    console.log(`Aula CONFIRMADA: ID=${pedidoId}`);

    /* Get a future disponibilidade slot for the new date */
    const novoSlot = await findSlot();
    expect(novoSlot).toBeTruthy();
    const novaData = novoSlot.data;
    const novaHora = (novoSlot.horaInicio || '10:00').slice(0, 5);
    console.log(`Nova data proposta: ${novaData} ${novaHora}`);

    /* When: Full happy path — Direção remarca (API) → Professor aceita (API) → EE aceita (API) */
    const direcaoToken = await getToken('direcao');
    const remarcarRes = await fetch(`${API}/api/aulas/${pedidoId}/remarcar`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${direcaoToken}` },
      body: JSON.stringify({ novadata: novaData, novaHora }),
    });
    const remarcarJson = await remarcarRes.json();
    console.log(`Remarcação API: ${remarcarRes.status} ${JSON.stringify(remarcarJson)}`);
    expect(remarcarRes.ok).toBeTruthy();

    const professorToken = await getToken('professor');
    await fetch(`${API}/api/aulas/${pedidoId}/responder-professor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${professorToken}` },
      body: JSON.stringify({ aceitar: true }),
    });

    const eeToken = await getToken('encarregado');
    await fetch(`${API}/api/aulas/${pedidoId}/responder-encarregado`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${eeToken}` },
      body: JSON.stringify({ aceitar: true }),
    });

    /* Then: Verify DB state — remarcação keeps PENDENTE, updates data */
    const estado = dbScalar(`SELECT tipoestado FROM estado e JOIN pedidodeaula pa ON pa.estadoidestado = e.idestado WHERE pa.idpedidoaula = ${pedidoId}`);
    console.log(`Estado final: ${estado}`);
    expect(estado).toBe('Pendente');

    const sugestao = dbScalar(`SELECT sugestaoestado FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    console.log(`Sugestão final: "${sugestao}"`);
    expect(sugestao).toBe('');

    const dataFinal = dbScalar(`SELECT data::text FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    console.log(`Data final: ${dataFinal}`);
    /* data should now be the novaData (not the original) */
    expect(dataFinal).toContain(novaData);

    /* And: novadata should be cleared */
    const novadataEnd = dbScalar(`SELECT novadata::text FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    console.log(`novadata final: "${novadataEnd}"`);
    expect(novadataEnd).toBe('');

    console.log(`Resultado: BD verifica remarcação bem-sucedida para pedido ${pedidoId}`);
  });

});
