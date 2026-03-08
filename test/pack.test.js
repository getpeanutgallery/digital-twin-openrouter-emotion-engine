const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const fsp = fs.promises;

// Import the twin pack store
const store = require('../index.js');
const { cassette: cassetteLib } = require('digital-twin-core');

describe('digital-twin-openrouter-emotion-engine twin pack', () => {
  test('manifest.json exists and is valid', async () => {
    const manifestPath = path.join(__dirname, '..', 'manifest.json');
    const manifestContent = await fsp.readFile(manifestPath, 'utf-8');
    const manifest = JSON.parse(manifestContent);

    assert.ok(manifest.packType === 'twin-pack', 'packType should be twin-pack');
    assert.ok(manifest.name, 'manifest should have name');
    assert.ok(Array.isArray(manifest.cassettes), 'manifest should have cassettes array');
    assert.ok(manifest.cassettes.length > 0, 'should have at least one cassette');
    assert.ok(manifest.defaultCassetteId, 'manifest should have defaultCassetteId');
  });

  test('store can list cassettes', async () => {
    const cassetteIds = await store.list();
    assert.ok(Array.isArray(cassetteIds), 'list() should return an array');
    assert.strictEqual(cassetteIds.length, 1, `Expected exactly 1 cassette, got ${cassetteIds.length}`);
  });

  test('store can read each cassette', async () => {
    const cassetteIds = await store.list();

    for (const id of cassetteIds) {
      const cassette = await store.read(id);
      assert.ok(cassette, `Cassette ${id} should be readable`);
      assert.ok(cassette.version, `Cassette ${id} should have version`);
      assert.ok(cassette.meta, `Cassette ${id} should have meta`);
      assert.ok(Array.isArray(cassette.interactions), `Cassette ${id} should have interactions array`);
    }
  });

  test('all cassettes validate against schema', async () => {
    const cassetteIds = await store.list();
    const errors = [];

    for (const id of cassetteIds) {
      const cassette = await store.read(id);
      const { valid, errors: validationErrors } = cassetteLib.validate(cassette);

      if (!valid) {
        errors.push(`Cassette "${id}" validation failed: ${JSON.stringify(validationErrors)}`);
      }
    }

    if (errors.length > 0) {
      console.log('Validation errors:', errors);
    }
    assert.strictEqual(errors.length, 0, 'All cassettes should pass validation');
  });

  test('each interaction has valid request and response', async () => {
    const cassetteIds = await store.list();

    for (const id of cassetteIds) {
      const cassette = await store.read(id);

      for (const interaction of cassette.interactions) {
        assert.ok(interaction.id, `Interaction should have id in cassette ${id}`);
        assert.ok(interaction.interactionId, `Interaction should have interactionId in cassette ${id}`);
        assert.ok(interaction.request, `Interaction should have request in cassette ${id}`);
        assert.ok(interaction.response, `Interaction should have response in cassette ${id}`);

        const { request, response } = interaction;

        // Request checks
        assert.ok(request.method, `Request should have method in ${id}`);
        assert.ok(request.url, `Request should have url in ${id}`);
        assert.ok(request.headers, `Request should have headers in ${id}`);

        // Response checks
        assert.ok(typeof response.status === 'number', `Response should have numeric status in ${id}`);
        assert.ok(response.status >= 100 && response.status < 600, `Status should be valid HTTP code in ${id}`);
        assert.ok(response.headers, `Response should have headers in ${id}`);
      }
    }
  });

  test('can find interaction by hash', async () => {
    const cassetteIds = await store.list();
    let foundAny = false;

    for (const id of cassetteIds) {
      const cassette = await store.read(id);
      if (cassette.interactions.length > 0) {
        const firstInteraction = cassette.interactions[0];
        const hash = firstInteraction.interactionId;

        const matches = cassetteLib.findByHash(cassette, hash);
        assert.ok(matches.length >= 1, `Should find interaction by hash in cassette ${id}`);
        assert.strictEqual(matches[0].id, firstInteraction.id, 'Found interaction should match');
        foundAny = true;
      }
    }

    assert.ok(foundAny, 'At least one cassette should have interactions to test');
  });

  test('all interactions have stable hashes', async () => {
    const cassetteIds = await store.list();

    for (const id of cassetteIds) {
      const cassette = await store.read(id);

      for (const interaction of cassette.interactions) {
        assert.ok(
          interaction.interactionId.startsWith('sha256$'),
          `interactionId should be a SHA256 hash in cassette ${id}`
        );
      }
    }
  });
});
