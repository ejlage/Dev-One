const { test, expect } = require('@playwright/test');
const { login, logout, navTo, getToken, criarPedidoPendente, dbScalar, findSlot, futureTime, API, approvePedidoApi, rejectPedidoApi } = require('./helpers');

test.describe.serial('BPMN 1 — Pedido de Aula', () => {

  test('Happy path: Encarregado creates pedido → Direção approves via UI → aula CONFIRMADA in DB', async ({ page }) => {
    /* Given: Encarregado has access to the system */
    /* When: Encarregado creates a pedido via API */
    const result = await criarPedidoPendente();
    const pedidoId = result.pedidoId || result.data?.idpedidoaula || result.data?.id;
    console.log(`Pedido criado: ID=${pedidoId}`);

    expect(pedidoId).toBeTruthy();

    /* Then: Verify pedido is PENDENTE in DB */
    let estado = dbScalar(`SELECT tipoestado FROM estado e JOIN pedidodeaula pa ON pa.estadoidestado = e.idestado WHERE pa.idpedidoaula = ${pedidoId}`);
    console.log(`Estado inicial: ${estado}`);
    expect(estado).toBe('Pendente');

    /* When: Direção logs in and approves via UI */
    await login(page, 'direcao');
    await navTo(page, 'Aulas');
    await expect(page).toHaveURL(/aulas/);
    await page.waitForSelector('text=Pedidos de Aula Pendentes', { timeout: 15_000 });

    /* Find and click the Aprovar button (card does NOT show pedido ID, so just use first Aprovar) */
    await page.locator('button:has-text("Aprovar")').first().waitFor({ timeout: 8_000 });
    await page.locator('button:has-text("Aprovar")').first().click();

    await page.waitForSelector('text=Confirmar Aprovação', { timeout: 5_000 });
    await page.click('button:has-text("Confirmar Aprovação")');
    await page.waitForTimeout(2000);

    /* Then: Verify pedido is CONFIRMADO in DB */
    estado = dbScalar(`SELECT tipoestado FROM estado e JOIN pedidodeaula pa ON pa.estadoidestado = e.idestado WHERE pa.idpedidoaula = ${pedidoId}`);
    console.log(`Estado após aprovação: ${estado}`);
    expect(estado).toBe('Confirmado');

    /* And: Verify aula record exists */
    const aulaExists = dbScalar(`SELECT COUNT(*) FROM aula WHERE pedidodeaulaidpedidoaula = ${pedidoId}`);
    console.log(`Aula criada: ${aulaExists > 0 ? 'SIM' : 'NÃO'}`);
    expect(Number(aulaExists)).toBeGreaterThan(0);

    await logout(page);
    console.log(`Resultado: Pedido ${pedidoId} CONFIRMADO com aula criada`);
  });

  test('Rejection: Encarregado creates pedido → Direção rejects with motivo → estado REJEITADO in DB', async ({ page }) => {
    /* Given: Encarregado creates a pedido */
    const result = await criarPedidoPendente();
    const pedidoId = result.pedidoId || result.data?.idpedidoaula || result.data?.id;
    console.log(`Pedido criado: ID=${pedidoId}`);

    expect(pedidoId).toBeTruthy();

    /* Then: Verify pedido is PENDENTE */
    let estado = dbScalar(`SELECT tipoestado FROM estado e JOIN pedidodeaula pa ON pa.estadoidestado = e.idestado WHERE pa.idpedidoaula = ${pedidoId}`);
    expect(estado).toBe('Pendente');

    /* When: Direção logs in and rejects via UI */
    await login(page, 'direcao');
    await navTo(page, 'Aulas');
    await expect(page).toHaveURL(/aulas/);
    await page.waitForSelector('text=Pedidos de Aula Pendentes', { timeout: 15_000 });

    /* Step 1: Click "Cancelar" button in the card → opens DirecaoModals */
    await page.locator('button:has-text("Cancelar")').first().waitFor({ timeout: 8_000 });
    await page.locator('button:has-text("Cancelar")').first().click();

    /* Step 2: Wait for DirecaoModals to open — look for the "Remarcar" card which is unique */
    await page.waitForSelector('text=Selecione uma opção para esta aula', { timeout: 5_000 });

    /* Step 3: Click the "Cancelar" card inside the modal (identified by its sub-text) */
    await page.locator('button:has-text("Rejeitar definitivamente esta marcação")').click();

    /* Step 4: Wait for the reject modal to appear */
    await page.waitForSelector('text=Rejeitar Aula', { timeout: 5_000 });

    /* Fill motivo in textarea (no name attr — use placeholder) */
    await page.fill('textarea[placeholder="Motivo da rejeição..."]', 'Horário indisponível');
    await page.click('button:has-text("Confirmar Rejeição")');
    await page.waitForTimeout(2000);

    /* Then: Verify pedido is REJEITADO in DB */
    estado = dbScalar(`SELECT tipoestado FROM estado e JOIN pedidodeaula pa ON pa.estadoidestado = e.idestado WHERE pa.idpedidoaula = ${pedidoId}`);
    console.log(`Estado após rejeição: ${estado}`);
    expect(estado).toBe('Rejeitado');

    /* And: Verify sugestaoestado is null */
    const sugestao = dbScalar(`SELECT sugestaoestado FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    console.log(`Sugestão estado: ${sugestao || 'null'}`);
    expect(sugestao).toBe('');

    await logout(page);
    console.log(`Resultado: Pedido ${pedidoId} REJEITADO`);
  });

  test('Past date validation: Submit with data passada → 400 error', async () => {
    /* Given: Encarregado has a valid token */
    const token = await getToken('encarregado');

    /* When: Submitting a pedido with past date */
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const pastDate = yesterday.toISOString().split('T')[0];

    const body = {
      data: pastDate,
      horainicio: '10:00',
      duracaoaula: 60,
      disponibilidade_mensal_id: 1,
      salaidsala: 1,
      privacidade: false,
    };

    const res = await fetch(`${API}/api/encarregado/aulas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    /* Then: Expect 400 error */
    console.log(`Status: ${res.status}`);
    expect(res.status).toBe(400);

    const json = await res.json();
    console.log(`Erro: ${json.error || JSON.stringify(json)}`);
    expect(json.error).toBeTruthy();

    console.log('Resultado: Validação de data passada funciona corretamente');
  });

  test('Missing field validation: Submit without data → 400 error', async () => {
    /* Given: Encarregado has a valid token */
    const token = await getToken('encarregado');

    /* When: Submitting a pedido without data field */
    const body = {
      horainicio: '10:00',
      duracaoaula: 60,
      disponibilidade_mensal_id: 1,
      salaidsala: 1,
      privacidade: false,
    };

    const res = await fetch(`${API}/api/encarregado/aulas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    /* Then: Expect 400 error */
    console.log(`Status: ${res.status}`);
    expect(res.status).toBe(400);

    const json = await res.json();
    console.log(`Erro: ${json.error || JSON.stringify(json)}`);
    expect(json.error).toBeTruthy();

    console.log('Resultado: Validação de campo obrigatório funciona corretamente');
  });

  test('Same-slot conflict: Submit twice to same slot → second fails with "reservado" error', async () => {
    /* Given: Encarregado has a valid token and finds a slot */
    const token = await getToken('encarregado');
    const slot = await findSlot();
    expect(slot).toBeTruthy();

    /* Use slot's horaInicio + 1h to avoid midnight wrap (backend time overlap bug) */
    const [sh, sm] = (slot.horaInicio || '10:00').split(':').map(Number);
    const startHour = (sh + 1) % 24;

    const body = {
      data: slot.data,
      horainicio: `${String(startHour).padStart(2, '0')}:${String(sm).padStart(2, '0')}`,
      duracaoaula: slot.maxDuracao > 0 ? Math.min(slot.maxDuracao, 60) : 60,
      disponibilidade_mensal_id: parseInt(slot.id),
      salaidsala: 1,
      privacidade: false,
    };

    /* When: First pedido is submitted successfully */
    const res1 = await fetch(`${API}/api/encarregado/aulas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    const json1 = await res1.json();
    console.log(`Primeiro pedido status: ${res1.status}`);
    expect(res1.status).toBe(201);

    const pedidoId1 = json1.data?.idpedidoaula || json1.data?.id;
    console.log(`Primeiro pedido ID: ${pedidoId1}`);

    /* When: Second pedido with same slot is submitted */
    const res2 = await fetch(`${API}/api/encarregado/aulas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });

    /* Then: Expect error with "reservado" */
    console.log(`Segundo pedido status: ${res2.status}`);
    const json2 = await res2.json();
    console.log(`Erro: ${json2.error || JSON.stringify(json2)}`);

    expect(res2.status).toBe(400);
    const errorMessage = (json2.error || '').toLowerCase();
    expect(errorMessage).toContain('reservado');

    console.log('Resultado: Conflito de slot funciona corretamente');
  });

  test('Encarregado visualizes PENDENTE status on UI', async ({ page }) => {
    /* Given: A pedido PENDENTE exists */
    const result = await criarPedidoPendente();
    const pedidoId = result.pedidoId || result.data?.idpedidoaula || result.data?.id;
    console.log(`Pedido criado: ID=${pedidoId}`);

    /* When: Encarregado logs in and navigates to Aulas */
    await login(page, 'encarregado');
    await navTo(page, 'Aulas');
    await expect(page).toHaveURL(/aulas/);

    /* Switch to "Agenda de Aulas" tab to see existing pedidos (default tab is "Marcar Aulas") */
    await page.click('button:has-text("Agenda de Aulas")');
    await page.waitForTimeout(1000);

    /* Then: Verify "Pendente" badge is visible (UI displays as "Pendente" not "PENDENTE") */
    const pendenteVisible = await page.locator('text=Pendente').count();
    console.log(`Status Pendente visível: ${pendenteVisible > 0 ? 'SIM' : 'NÃO'}`);
    expect(pendenteVisible).toBeGreaterThan(0);

    await logout(page);
    /* Cleanup: approve the pedido via API so it doesn't interfere with subsequent tests */
    if (pedidoId) {
      await approvePedidoApi(pedidoId);
      console.log(`Cleanup: Pedido ${pedidoId} approved via API`);
    }
    console.log('Resultado: Encarregado visualiza status Pendente');
  });

  test('Direção visualizes PENDENTE on pending list UI', async ({ page }) => {
    /* Given: A pedido PENDENTE exists */
    const result = await criarPedidoPendente();
    const pedidoId = result.pedidoId || result.data?.idpedidoaula || result.data?.id;
    console.log(`Pedido criado: ID=${pedidoId}`);

    /* When: Direção logs in and navigates to Aulas */
    await login(page, 'direcao');
    await navTo(page, 'Aulas');
    await expect(page).toHaveURL(/aulas/);

    /* Then: Verify pending list shows the pedido */
    await page.waitForSelector('text=Pedidos de Aula Pendentes', { timeout: 15_000 });
    /* Card does NOT display pedido ID — verify by checking for the Pendente badge */
    await page.locator('text=Pendente').first().waitFor({ timeout: 8_000 });
    console.log(`Pedido Pendente visível na lista da Direção`);

    await logout(page);
    /* Cleanup: approve the pedido via API so it doesn't interfere with subsequent tests */
    if (pedidoId) {
      await approvePedidoApi(pedidoId);
      console.log(`Cleanup: Pedido ${pedidoId} approved via API`);
    }
    console.log('Resultado: Direção visualiza pedido Pendente na lista');
  });

  test('BD verification: after approve, pedido estado=CONFIRMADO and aula record exists', async () => {
    /* Given: A pedido PENDENTE exists */
    const result = await criarPedidoPendente();
    const pedidoId = result.pedidoId || result.data?.idpedidoaula || result.data?.id;
    console.log(`Pedido criado: ID=${pedidoId}`);

    /* When: Approve via API */
    const apiResult = await approvePedidoApi(pedidoId);
    console.log(`Approve API result: ${JSON.stringify(apiResult)}`);

    /* Then: Verify DB state */
    const estado = dbScalar(`SELECT tipoestado FROM estado e JOIN pedidodeaula pa ON pa.estadoidestado = e.idestado WHERE pa.idpedidoaula = ${pedidoId}`);
    console.log(`Estado no DB: ${estado}`);
    expect(estado).toBe('Confirmado');

    const aulaCount = dbScalar(`SELECT COUNT(*) FROM aula WHERE pedidodeaulaidpedidoaula = ${pedidoId}`);
    console.log(`Registos na tabela aula: ${aulaCount}`);
    expect(Number(aulaCount)).toBe(1);

    console.log('Resultado: BD verifica CONFIRMADO e aula criada');
  });

  test('BD verification: after reject, pedido estado=REJEITADO and sugestaoestado=null', async () => {
    /* Given: A pedido PENDENTE exists */
    const result = await criarPedidoPendente();
    const pedidoId = result.pedidoId || result.data?.idpedidoaula || result.data?.id;
    console.log(`Pedido criado: ID=${pedidoId}`);

    /* When: Reject via API */
    const apiResult = await rejectPedidoApi(pedidoId, 'Teste de rejeição');
    console.log(`Reject API result: ${JSON.stringify(apiResult)}`);

    /* Then: Verify DB state */
    const estado = dbScalar(`SELECT tipoestado FROM estado e JOIN pedidodeaula pa ON pa.estadoidestado = e.idestado WHERE pa.idpedidoaula = ${pedidoId}`);
    console.log(`Estado no DB: ${estado}`);
    expect(estado).toBe('Rejeitado');

    const sugestao = dbScalar(`SELECT sugestaoestado FROM pedidodeaula WHERE idpedidoaula = ${pedidoId}`);
    console.log(`Sugestão estado no DB: "${sugestao}"`);
    expect(sugestao).toBe('');

    console.log('Resultado: BD verifica REJEITADO e sugestaoestado=null');
  });

});
