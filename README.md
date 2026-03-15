# digital-twin-openrouter-emotion-engine

Twin pack for OpenRouter emotion-engine recordings. This repo owns the OpenRouter replay cassette used for bounded offline verification of OpenRouter transport behavior.

## Current canonical pack state

- Default cassette id: `cod-test-golden-20260309-082851`
- Cassette path: `cassettes/cod-test-golden-20260309-082851.json`
- Manifest entrypoint: `manifest.json`
- Runtime entrypoint: `index.js`

## Structure

```
.
├── cassettes/
│   └── cod-test-golden-20260309-082851.json  # Default cassette declared by manifest.json
├── manifest.json                              # Pack descriptor with defaultCassetteId
├── index.js                                   # Exports a TwinStore instance
├── README.md                                  # This file
└── package.json                               # Node package metadata
```

## How It Works

The `index.js` exports a `TwinStore` instance configured to read cassettes from the pack root directory. The `digital-twin-router` can load this pack by pointing to this directory via the `twinPack` configuration.

### Twin Pack Manifest

The `manifest.json` is the source of truth for the default cassette:

```json
{
  "packType": "twin-pack",
  "name": "digital-twin-openrouter-emotion-engine",
  "version": "1.0.0",
  "description": "Twin pack for OpenRouter emotion engine digital twin recordings. Provides pre-recorded cassettes for testing and replay.",
  "routerCompatibility": ">=1.0.0",
  "defaultCassetteId": "cod-test-golden-20260309-082851",
  "cassettes": ["cassettes/cod-test-golden-20260309-082851.json"],
  "index": "index.js",
  "created": "2025-03-08T00:00:00.000Z",
  "tags": ["openrouter", "emotion", "ai", "testing"]
}
```

### Index Export

```javascript
const store = require('digital-twin-openrouter-emotion-engine');
// store.list() returns cassette IDs
// store.read('cod-test-golden-20260309-082851') loads the default cassette
```

## Usage with digital-twin-router

The router will automatically read `manifest.json` to determine the default cassette. You can override with `DIGITAL_TWIN_CASSETTE`.

```bash
export DIGITAL_TWIN_PACK="/path/to/digital-twin-openrouter-emotion-engine"
export DIGITAL_TWIN_CASSETTE="cod-test-golden-20260309-082851"   # optional; otherwise manifest default is used
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

## Recording / refreshing cassettes

1) Record interactions with `digital-twin-core` (`TwinEngine` + `TwinStore`).
2) Sanitize secrets/PII before committing (use redaction helpers).
3) If you add or rotate the canonical replay cassette, update `manifest.json`, this README, and the pack tests together so the documented default cassette stays aligned with the shipped pack.
4) Keep package publishing bounded to the actual pack artifacts (`cassettes/`, `manifest.json`, `index.js`, docs/license) rather than workspace metadata.

## Testing

```bash
npm test
```

## License

MIT
