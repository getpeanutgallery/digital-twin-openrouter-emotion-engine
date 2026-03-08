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

```javascript
const store = require('digital-twin-openrouter-emotion-engine');
// store.list() returns cassette IDs
// store.read('openrouter-emotion-engine') loads the cassette
```

## Usage with digital-twin-router

The router will automatically read `manifest.json` to determine the default cassette. You can override with `DIGITAL_TWIN_CASSETTE`.

```bash
export DIGITAL_TWIN_PACK="/path/to/digital-twin-openrouter-emotion-engine"
export DIGITAL_TWIN_CASSETTE="openrouter-emotion-engine"   # optional
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

1) Record interactions with `digital-twin-core` (`TwinEngine` + `TwinStore`).
2) Sanitize secrets/PII before committing (use redaction helpers).
3) Update `manifest.json` if you add/change the default cassette.

## Testing

```bash
npm test
```

## License

MIT
