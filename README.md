# digital-twin-openrouter-emotion-engine

Twin pack for OpenRouter emotion engine digital twin recordings. This package provides a pre-recorded cassette that can be used with `digital-twin-router` for testing, replay, and verification of emotion analysis API interactions.

## Structure

```
.
├── cassettes/
│   └── openrouter-emotion-engine.json  # Default cassette (single file with multiple interactions)
├── manifest.json                       # Pack descriptor with defaultCassetteId
├── index.js                            # Exports a TwinStore instance
├── README.md                           # This file
└── package.json                        # Node package metadata
```

## How It Works

The `index.js` exports a `TwinStore` instance configured to read cassettes from the pack root directory. The `digital-twin-router` can load this pack by pointing to this directory via the `twinPack` configuration.

### Twin Pack Manifest

The `manifest.json` describes the pack and specifies the default cassette:

```json
{
  "packType": "twin-pack",
  "name": "digital-twin-openrouter-emotion-engine",
  "version": "1.0.0",
  "description": "...",
  "routerCompatibility": ">=1.0.0",
  "defaultCassetteId": "openrouter-emotion-engine",
  "cassettes": ["openrouter-emotion-engine.json"],
  "index": "index.js",
  "created": "2025-03-08T00:00:00.000Z",
  "tags": ["openrouter", "emotion", "ai", "testing"]
}
```

### Index Export

The `index.js` exports a `TwinStore`:

```javascript
const store = require('digital-twin-openrouter-emotion-engine');
// store.list() returns cassette IDs
// store.read('openrouter-emotion-engine') loads the cassette
```

## Usage with digital-twin-router

The router will automatically read `manifest.json` to determine the default cassette. You can override with `DIGITAL_TWIN_CASSETTE` environment variable.

```bash
# Set the twinPack path to this package
export DIGITAL_TWIN_PACK="/path/to/digital-twin-openrouter-emotion-engine"
# Optional: override cassette
export DIGITAL_TWIN_CASSETTE="openrouter-emotion-engine"
# Set mode
export DIGITAL_TWIN_MODE="replay"
```

Or in code:

```javascript
const { createTwinTransport } = require('digital-twin-router');

const transport = createTwinTransport({
  twinPack: '/path/to/digital-twin-openrouter-emotion-engine',
  mode: 'replay',
  realTransport: myRealTransport
});
```

## Recording New Cassettes

To modify or add cassettes:

1. **Record using TwinEngine**:

```javascript
const { TwinEngine, TwinStore } = require('digital-twin-core');

// Point store at the cassettes directory
const store = new TwinStore({
  storeDir: './cassettes',
  createIfMissing: true
});

const engine = new TwinEngine({ store });

// Create or load the default cassette
await engine.create('openrouter-emotion-engine', {
  description: 'OpenRouter emotion engine interactions',
  tags: ['openrouter', 'emotion']
});

// Record interactions
await engine.record(request, response);

// The cassette is saved as openrouter-emotion-engine.json
```

2. **Sanitize sensitive data** before committing:

```javascript
const { redactCassette } = require('digital-twin-core');
const cassette = await store.read('openrouter-emotion-engine');
const safeCassette = redactCassette(cassette);
await store.write('openrouter-emotion-engine', safeCassette, true);
```

3. **Update manifest.json** if adding a new default cassette (change `defaultCassetteId` and `cassettes` array).

4. **Commit**:

```bash
git add cassettes/openrouter-emotion-engine.json manifest.json
git commit -m "Update cassette: openrouter-emotion-engine"
```

## Testing

Run the test suite:

```bash
npm test
```

This validates the cassette structure and interactions.

## Notes

- The default cassette contains multiple interactions in a single file.
- The router resolves the `twinPack`, detects `manifest.json`, and uses `defaultCassetteId`.
- You can override the cassette per-run with `DIGITAL_TWIN_CASSETTE`.
- The router also supports packs with a `cassettes/` subdirectory; in that case `storeDir` is automatically set to the `cassettes` folder.

## License

MIT
