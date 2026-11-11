'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium, devices } = require('playwright');

const root = path.resolve(__dirname, '../published-game-capture');
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg', '.woff2': 'font/woff2' };

function serve(request, response) {
  const url = new URL(request.url, 'http://127.0.0.1');
  const file = path.resolve(root, '.' + decodeURIComponent(url.pathname));
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    response.writeHead(404).end();
    return;
  }
  response.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
  fs.createReadStream(file).pipe(response);
}

async function ready(page, url) {
  await page.goto(url);
  await page.waitForFunction(() => window.HARBOR?.mainCity && window.ROOKIE_JAY?.ready());
}

async function choose(page, id) {
  const name = { jay: 'Jay', rosa: 'Rosa', kaleb: 'Kaleb', gigi: 'Gigi', lingling: 'LingLing' }[id];
  await page.locator('#familySelect .family-card').filter({ hasText: name }).click();
  await page.waitForFunction(() => HARBOR.mainOpening.active() ||
    ROOKIE.state().intro.done && !HARBOR.profiles.isOpen());
  if (await page.locator('#btnSkipCs').isVisible()) await page.locator('#btnSkipCs').click();
  await page.waitForFunction(() => HARBOR.seamlessCampusV115.isOpen() &&
    !HARBOR.mainOpening.active() && !HARBOR.profiles.isOpen() &&
    HARBOR.seamlessCampusV115.storyQA().interiors.length === 8);
  await page.evaluate(() => HARBOR.speech.setSpeed(0));
}

async function story(page) {
  await page.locator('#v125HudMenu').click();
  await page.locator('#v125HudSettings').click();
  await page.locator('.menu-actions').getByRole('button', { name: 'Story', exact: true }).click();
  await page.locator('#hcStoryOverlay').waitFor();
}

async function finishSpeech(page) {
  for (let i = 0; i < 55; i++) {
    if (!await page.evaluate(() => HARBOR.speech.current())) return;
    await page.keyboard.press('Enter');
    await page.waitForTimeout(110);
  }
  throw new Error('Dialogue did not finish');
}

async function chooseDialogue(page, label) {
  const button = page.getByRole('button', { name: label }).first();
  for (let i = 0; i < 60; i++) {
    if (await button.isVisible()) return button.click();
    if (await page.evaluate(() => !!HARBOR.speech.current())) {
      await page.evaluate(() => {
        if (HARBOR.speech.advancePage()) return;
        document.querySelector('#dlgNext,#dlgContinue')?.click();
      });
    }
    await page.waitForTimeout(120);
  }
  const state = await page.evaluate(() => ({
    dialogue: HARBOR.speech.current()?.full, choices: document.querySelector('#dlgActions')?.innerText,
    activeCase: ROOKIE.state().camp, near: HARBOR.seamlessCampusV115.storyQA().near
  }));
  throw new Error('Missing dialogue choice ' + label + ' ' + JSON.stringify(state));
}

// Fixtures stage the cross-city journeys. World collision, movement, proximity,
// the Action button and the journal's ordinary controls handle the interactions.
async function approach(page, id) {
  const location = await page.evaluate(id => {
    const campus = HARBOR.seamlessCampusV115;
    const qa = campus.storyQA();
    const spot = qa.spots.find(s => s.nativeId === id);
    if (!spot) throw Error('No registered marker: ' + id);
    const room = qa.interiors.find(b => b.map === spot.storyRoom);
    if (spot.connectedArc && campus.test.blocked(spot.x, spot.y, 12, true, false, true)) {
      throw Error('Solid marker: ' + id);
    }
    for (const [dx, dy, key] of [[0, 70, 'w'], [70, 0, 'a'], [-70, 0, 'd'], [0, -70, 's']]) {
      const x = spot.x + dx, y = spot.y + dy;
      if (room && (x <= room.floor.x + 12 || x >= room.floor.x + room.floor.w - 12 ||
          y <= room.floor.y + 12 || y >= room.door.y - 2)) continue;
      const open = [1, .85, .7, .55, .4].every(n =>
        !campus.test.blocked(spot.x + dx * n, spot.y + dy * n, 12, false, false, true));
      if (open && campus.test.moveTo(x, y)) return { spot, key };
    }
    throw Error('No walk-up approach for ' + id + ' ' + JSON.stringify(spot));
  }, id);
  await page.keyboard.down(location.key);
  try {
    await page.waitForFunction(s => {
      const a = HARBOR.seamlessCampusV115;
      const p = a.test.position();
      return a.storyQA().near === s.id && Math.hypot(p.x - s.x, p.y - s.y) < 34;
    }, location.spot, { timeout: 3500 });
  } catch (error) {
    const diagnostic = await page.evaluate(s => {
      const a = HARBOR.seamlessCampusV115, q = a.storyQA(), p = a.test.position();
      return { p, near: q.near, closeSpots: q.spots.filter(v => Math.hypot(v.x - s.x, v.y - s.y) < 45)
        .map(v => ({ id: v.id, x: v.x, y: v.y })), blocked: a.test.roadCollisionDiagnostic(p.x, p.y) };
    }, location.spot);
    throw new Error('Could not walk to ' + id + ' ' + JSON.stringify({ location, diagnostic }), { cause: error });
  } finally {
    await page.keyboard.up(location.key);
  }
  return location.spot;
}

async function action(page, id) {
  const spot = await approach(page, id);
  await page.locator('#v115CampusInteract').click();
  return spot;
}

async function enterFromStreet(page, map) {
  const door = await page.evaluate(map => {
    const a = HARBOR.seamlessCampusV115;
    const b = a.storyQA().interiors.find(b => b.map === map);
    if (!b || b.locked || !a.test.moveTo(b.door.x, b.door.y + 36)) throw Error('No clear doorway: ' + map);
    return b.door;
  }, map);
  await page.keyboard.down('w');
  try {
    await page.waitForFunction(({ map, door }) => {
      const a = HARBOR.seamlessCampusV115;
      return a.storyRoom() === map && a.test.position().y < door.y - 22;
    }, { map, door }, { timeout: 5000 });
  } finally {
    await page.keyboard.up('w');
  }
}

async function seedActI(page, finalCaseOpen = true) {
  await page.evaluate(finalCaseOpen => {
    const save = JSON.parse(JSON.stringify(ROOKIE.state()));
    save.closed = true;
    save.rank = 'Detective';
    for (const id of ['m2', 'm3', 'm4']) save.camp[id].done = true;
    Object.assign(save.caper, { orientation: true, briefed: true, complete: true,
      clues: { fridge: true, cooler: true, intake: true, bag: true },
      witnesses: { rivera: true, torres: true, maya: true },
      reward: { badge: 'First Case Badge', notebook: 'Detective Notebook' } });
    save.evidence.m3key = true;
    Object.assign(save.camp.m5, { brief: true, done: !finalCaseOpen });
    HARBOR.importSave(save);
    HARBOR.speech.setSpeed(0);
  }, finalCaseOpen);
  await page.waitForFunction(() => HARBOR.seamlessCampusV115.storyQA().spots.some(s => s.nativeId === 'sergeant'));
}

async function talk(page, id, choice) {
  await action(page, id);
  if (choice) await chooseDialogue(page, choice);
  await finishSpeech(page);
}

async function checkEarlyCases(page) {
  await talk(page, 'caper:brooks', /What happened/);
  await talk(page, 'caper:fridge');
  await talk(page, 'caper:rivera', /What else happened/);
  await talk(page, 'caper:torres', /Can you help/);
  await talk(page, 'caper:maya');
  await talk(page, 'caper:cooler');
  await talk(page, 'caper:brooks', /Nobody stole/);
  if (await page.locator('#caperNotesClose').isVisible()) await page.locator('#caperNotesClose').click();
  assert(await page.evaluate(() => ROOKIE.state().closed && ROOKIE.state().caper.complete));
  console.log('Case 001 closed');

  await talk(page, 'sergeant');
  await talk(page, 'npc:omar', /Tell me exactly/);
  await talk(page, 'storeRear');
  await talk(page, 'storeShelf');
  await talk(page, 'storeCamera', /Read the truck/);
  await action(page, 'database');
  await page.locator('#dbQuery').fill('HBR-4417');
  await page.locator('#btnDbSearch').click();
  await page.locator('#btnDbClose').click();
  await talk(page, 'evshelf');
  await talk(page, 'sergeant', /Follow Voss/);
  await page.locator('#btnShiftNext').click();
  assert(await page.evaluate(() => ROOKIE.state().camp.m2.done));
  console.log('Case 002 closed');

  await talk(page, 'sergeant');
  await talk(page, 'npc:almeida', /Tell me about Emmett Hale/);
  for (const id of ['haleNote', 'halePhoto', 'haleKey']) await talk(page, id);
  await talk(page, 'npc:ana', /Ask if Emmett Hale/);
  await action(page, 'reception');
  await chooseDialogue(page, /Reception help/);
  await chooseDialogue(page, /You're not in trouble/);
  await finishSpeech(page);
  await talk(page, 'evshelf');
  await talk(page, 'sergeant', /witness in hiding/);
  await page.locator('#btnShiftNext').click();
  assert(await page.evaluate(() => ROOKIE.state().camp.m3.done));
  console.log('Case 003 closed');

  await talk(page, 'sergeant');
  await talk(page, 'npc:marco', /Ask what he found/);
  await talk(page, 'whCrates');
  await talk(page, 'whManifest');
  await talk(page, 'npc:reyes', /Listen calmly|Ask what his night rounds/);
  await talk(page, 'evshelf');
  await action(page, 'cells');
  await page.locator('#hcCells #cellTalk').click();
  await finishSpeech(page);
  if (await page.locator('#hcCells #cellClose').isVisible()) {
    await page.locator('#hcCells #cellClose').click();
  }
  await talk(page, 'sergeant', /Charge Ferris as an accomplice/);
  await page.locator('#btnShiftNext').click();
  assert(await page.evaluate(() => ROOKIE.state().camp.m4.done));
  console.log('Case 004 closed');
  await talk(page, 'sergeant');
}

async function finishCase005(page) {
  await talk(page, 'npc:tom', /Ask what he.s seen/);
  for (const id of ['harborLog', 'shedGoods', 'shedDesk', 'evshelf']) await talk(page, id);
  const preConclusion = await page.evaluate(() => structuredClone(ROOKIE.state()));
  await action(page, 'sergeant');
  await chooseDialogue(page, /Arrest Elias Voss/);
  await finishSpeech(page);
  const next = page.locator('#btnShiftNext');
  assert.equal(await next.innerText(), 'See the Campaign Summary');
  const position = () => page.evaluate(() => HARBOR.seamlessCampusV115.test.position());
  const before = await position();
  await page.keyboard.down('w');
  await page.waitForTimeout(220);
  await page.keyboard.up('w');
  assert.deepEqual(await position(), before, 'Shift Summary blocks walking');
  await next.click();
  const summary = page.locator('#endOverlay');
  await summary.waitFor();
  assert.match(await summary.innerText(), /THE GREAT SANDWICH CAPER/);
  assert.doesNotMatch(await summary.innerText(), /THE MISSING DRIVE/);
  await summary.getByRole('button', { name: /Continue Jay/ }).click();
  assert.equal(await page.evaluate(() => HARBOR.arc().index), 0);
  return preConclusion;
}

async function completeFinding(page, id, tryWrong) {
  const spot = await action(page, id);
  const overlay = page.locator('#hcStoryOverlay');
  await overlay.waitFor();
  const record = overlay.locator('#hcQRecord');
  if (await record.count()) {
    assert(await record.isDisabled(), 'Interview requires both questions');
    await overlay.locator('#hcQTimeline').click();
    assert(await record.isDisabled());
    await overlay.locator('#hcQCorroborate').click();
    await record.click();
  } else {
    const buttons = overlay.locator('[data-activity]');
    assert.equal(await buttons.count(), 2);
    const bad = overlay.getByRole('button', { name: /^(Everyone involved|Tell everyone|Make the plan without)/ });
    assert.equal(await bad.count(), 1);
    if (tryWrong) {
      const count = await page.evaluate(() => HARBOR.arc().steps.length);
      await bad.click();
      await overlay.getByRole('status').waitFor();
      assert.equal(await page.evaluate(() => HARBOR.arc().steps.length), count);
    }
    const good = buttons.filter({ hasNotText: /^(Everyone involved|Tell everyone|Make the plan without)/ });
    assert.equal(await good.count(), 1);
    await good.click();
  }
  await finishSpeech(page);
  await page.waitForFunction(id => !HARBOR.seamlessCampusV115.storyQA().spots.some(s => s.nativeId === id), id);
  return { id, map: spot.nativeMap, label: spot.label, x: Math.round(spot.x), y: Math.round(spot.y) };
}

async function verifyFamily(page, url) {
  const tested = [];
  await ready(page, url);
  for (const id of ['rosa', 'kaleb', 'gigi', 'lingling']) {
    if (tested.length) await page.locator('.v116-identity').click();
    await choose(page, id);
    const ids = await page.evaluate(() => HARBOR.seamlessCampusV115.storyQA().actors
      .filter(a => a.familyId).map(a => a.familyId));
    assert.equal(new Set(ids).size, 4);
    assert.equal(ids.length, 4);
    assert(!ids.includes(id));
    tested.push(id);
  }
  return tested;
}

async function verifyMobile(browser, url, preConclusion) {
  const context = await browser.newContext(devices['Pixel 7']);
  const page = await context.newPage();
  page.setDefaultTimeout(10000);
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  try {
    await ready(page, url);
    await choose(page, 'jay');
    await page.evaluate(save => HARBOR.importSave(save), preConclusion);
    await approach(page, 'sergeant');
    await page.locator('#v115CampusInteract').tap();
    const arrest = page.getByRole('button', { name: /Arrest Elias Voss/ });
    for (let i = 0; i < 30 && !await arrest.isVisible(); i++) {
      await page.locator('#v115CampusInteract').tap();
      await page.waitForTimeout(120);
    }
    await arrest.tap();
    const next = page.locator('#btnShiftNext');
    for (let i = 0; i < 45 && !await next.isVisible(); i++) {
      await page.locator('#v115CampusInteract').tap();
      await page.waitForTimeout(120);
    }
    await next.tap();
    const summary = page.locator('#endOverlay');
    assert.match(await summary.innerText(), /HARBOR RECKONING/);
    const card = summary.locator('.overlay-card');
    assert(await card.evaluate(el => el.clientHeight <= innerHeight && el.scrollHeight > el.clientHeight));
    await summary.getByRole('button', { name: /Continue Jay/ }).tap();
    assert.match(await page.locator('#hcStoryBody').innerText(), /The Cost of Command/);
    assert.deepEqual(errors, []);
  } finally {
    await context.close();
  }
}

async function run() {
  const server = http.createServer(serve);
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const url = 'http://127.0.0.1:' + server.address().port + '/index.html?pilotQA=1';
    const context = await browser.newContext({ viewport: { width: 1280, height: 850 } });
    const page = await context.newPage(), errors = [];
    page.setDefaultTimeout(10000);
    page.on('pageerror', e => errors.push(e.message));
    await ready(page, url);
    await choose(page, 'jay');
    await story(page);
    assert.equal(await page.locator('#hcBegin').count(), 0, 'Act II is locked on a fresh profile');
    await page.locator('#hcStoryClose').click();
    if (process.argv.includes('--from-intro')) await checkEarlyCases(page);
    else await seedActI(page);
    const preConclusion = await finishCase005(page);
    console.log('Case 005 closed and Campaign Summary opened');
    const chapterResults = [], entered = new Set();
    let finalDecision;
    for (let i = 0; i < 8; i++) {
      const overlay = page.locator('#hcStoryOverlay');
      if (i > 0) await overlay.locator('#hcBegin').click();
      assert.match(await overlay.innerText(), new RegExp(String(6 + i).padStart(3, '0') + ' ·'));
      assert.equal(await overlay.locator('[data-choice]').count(), 0);
      await overlay.locator('#hcStoryClose').click();
      const findings = [];
      for (let j = 0; j < 3; j++) {
        const id = 'arc:' + i + ':' + j;
        const marker = await page.evaluate(id => HARBOR.seamlessCampusV115.storyQA().spots.find(s => s.nativeId === id), id);
        assert(marker, 'Missing ' + id);
        if (marker.storyRoom && !entered.has(marker.storyRoom)) {
          await enterFromStreet(page, marker.storyRoom);
          entered.add(marker.storyRoom);
        }
        console.log('Checking', id, marker.nativeMap, marker.label);
        findings.push(await completeFinding(page, id, i === 0 && j === 0));
        if (i === 0 && j === 0) {
          await ready(page, url);
          await choose(page, 'jay');
          assert.deepEqual(await page.evaluate(() => HARBOR.arc().steps), [0]);
          await page.waitForFunction(() => HARBOR.seamlessCampusV115.storyQA().spots
            .filter(s => s.connectedArc).length === 2);
        }
      }
      assert.equal(await page.evaluate(() => HARBOR.arc().steps.length), 3);
      assert.equal(await overlay.locator('[data-choice]').count(), 2);
      if (i === 7) finalDecision = await page.evaluate(() => structuredClone(ROOKIE.state()));
      await overlay.locator('[data-choice="0"]').click();
      assert.equal(await page.evaluate(() => HARBOR.arc().index), i + 1);
      chapterResults.push({ chapter: 6 + i, findings, resolved: true });
    }
    assert.match(await page.locator('#hcStoryBody').innerText(), /Harbor Dawn · A City Returned/);
    assert(await page.evaluate(() => HARBOR.arc().done && HARBOR.arc().trust === 16 &&
      HARBOR.arc().journal.length === 32 && ROOKIE.state().camp.m5.done));
    await page.reload();
    await page.waitForFunction(() => window.HARBOR?.mainCity && window.ROOKIE_JAY?.ready());
    await choose(page, 'jay');
    await story(page);
    assert.match(await page.locator('#hcStoryBody').innerText(), /13 \/ 13 chapters completed/);
    await page.evaluate(save => HARBOR.importSave(save), finalDecision);
    await story(page);
    await page.locator('#hcStoryOverlay [data-choice="1"]').click();
    assert.match(await page.locator('#hcStoryBody').innerText(), /Harbor Dawn · Another Command/);
    assert.deepEqual(errors, []);
    await context.close();
    const familyContext = await browser.newContext();
    const family = await verifyFamily(await familyContext.newPage(), url);
    await familyContext.close();
    await verifyMobile(browser, url, preConclusion);
    console.log(JSON.stringify({ chapterResults, interiorsWalkedFromStreet: [...entered],
      endings: ['A City Returned', 'Another Command'], endingPersisted: true, family, mobileSummary: true }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
