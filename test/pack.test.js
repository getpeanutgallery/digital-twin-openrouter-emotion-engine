const { test, describe } = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const { execFileSync } = require('node:child_process');
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
    assert.ok(
      manifest.cassettes.includes(`cassettes/${manifest.defaultCassetteId}.json`),
      'defaultCassetteId should point at a listed cassette file'
    );

    for (const cassettePath of manifest.cassettes) {
      const absoluteCassettePath = path.join(__dirname, '..', cassettePath);
      assert.ok(fs.existsSync(absoluteCassettePath), `manifest cassette missing on disk: ${cassettePath}`);
    }
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

        // Response checks (OpenRouter cassette content is model-output oriented, not raw HTTP transport)
        assert.ok(typeof response.content === 'string' && response.content.length > 0, `Response should have content in ${id}`);
        assert.ok(response.usage && typeof response.usage.total === 'number', `Response should have usage totals in ${id}`);
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
          /^[a-f0-9]{64}$/i.test(interaction.interactionId),
          `interactionId should be a 64-char hex hash in cassette ${id}`
        );
      }
    }
  });

  test('npm pack --dry-run only ships pack artifacts', () => {
    const output = execFileSync('npm', ['pack', '--dry-run', '--json'], {
      cwd: path.join(__dirname, '..'),
      encoding: 'utf8'
    });

    const packResult = JSON.parse(output)[0];
    const packedPaths = packResult.files.map((file) => file.path);

    assert.ok(packedPaths.includes('cassettes/cod-test-golden-20260309-082851.json'), 'tarball should include cassette');
    assert.ok(!packedPaths.some((file) => file.startsWith('.beads/')), 'tarball should not include .beads metadata');
    assert.ok(!packedPaths.includes('AGENTS.md'), 'tarball should not include workspace orchestration docs');
  });
});
