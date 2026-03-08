# digital-twin-openrouter-emotion-engine

Twin pack for OpenRouter emotion engine digital twin recordings. This package provides pre-recorded cassettes that can be used with `digital-twin-router` for testing, replay, and verification of emotion analysis API interactions.

## Structure

```
.
├── cassettes/               # Cassette files (.cassette or .json)
│   ├── get-emotion-config.cassette
│   └── post-emotion-analysis.cassette
├── manifest.json            # Pack descriptor
├── index.js                 # Exports a TwinStore instance
├── README.md                # This file
└── package.json             # Node package metadata
```

## How It Works

The `index.js` exports a `TwinStore` instance configured to read cassettes from the `cassettes/` directory. The `digital-twin-router` can load this pack by pointing to this directory via the `twinPack` configuration.

### Twin Pack Manifest

The `manifest.json` describes the pack:

```json
{
  "packType": "twin-pack",
  "name": "...",
  "version": "...",
  "cassettes": ["path/to/cassette1.cassette", ...],
  "index": "index.js"
}
```

### Index Export

The `index.js` must export one of:
- A `TwinStore` instance (recommended) - provides `list()`, `read()`, etc.
- Pack metadata object with at least `cassettes` array and `storePath`

This pack exports a `TwinStore`:

```javascript
const store = require('digital-twin-openrouter-emotion-engine');
// store.list() returns cassette IDs
// store.read('get-emotion-config') loads that cassette
```

## Usage with digital-twin-router

To use this pack with the router:

```bash
# Set the twinPack path to this directory
export DTWIN_TWIN_PACK="/home/derrick/.openclaw/workspace/projects/peanut-gallery/digital-twin-openrouter-emotion-engine"

# The router will load the pack and use its store for replay
openclaw gateway start  # or your router startup
```

Or in code:

```javascript
const router = new DigitalTwinRouter({
  twinPack: '/path/to/digital-twin-openrouter-emotion-engine'
});
```

## Recording New Cassettes

To add new cassettes to the pack:

1. **Record using TwinEngine**:

```javascript
const { TwinEngine, TwinStore } = require('digital-twin-core');

// Point store at the cassettes directory
const store = new TwinStore({
  storeDir: './cassettes',
  createIfMissing: true
});

const engine = new TwinEngine({ store });

// Create a new cassette
await engine.create('my-new-endpoint', {
  description: 'Description of this interaction',
  tags: ['tag1', 'tag2']
});

// Record the interaction
await engine.record(
  { method: 'GET', url: 'https://api.example.com/endpoint' },
  { status: 200, body: { result: 'ok' } }
);

// Cassette is automatically saved as cassettes/my-new-endpoint.cassette
```

2. **Sanitize sensitive data**:

Before committing, redact any API keys, tokens, or PII:

```javascript
const { redactCassette } = require('digital-twin-core');

const cassette = await store.read('my-new-endpoint');
const safeCassette = redactCassette(cassette);
await store.write('my-new-endpoint', safeCassette, true);
```

Or use the provided patterns and redact before writing:

```javascript
// The engine.redactCassette() method can also be used
```

3. **Update manifest.json**:

Add the new cassette filename to the `cassettes` array in `manifest.json`.

4. **Commit**:

```bash
git add cassettes/*.cassette manifest.json
git commit -m "Add cassette: my-new-endpoint"
```

## Testing

Run the test suite:

```bash
npm test
```

This will:
- Load the pack's store
- Validate each cassette against the schema
- Verify interactions can be matched
- Report any issues

## Cassette Schema

Cassettes follow version 1.0:

```json
{
  "version": "1.0",
  "meta": {
    "name": "string",
    "description": "string",
    "created": "ISO date",
    "updated": "ISO date",
    "tags": [],
    "metadata": {}
  },
  "interactions": [
    {
      "id": "unique-id",
      "interactionId": "sha256$hash-of-normalized-request",
      "request": {
        "method": "GET",
        "url": "https://...",
        "protocol": "https:",
        "headers": {},
        "body": "object|null"
      },
      "response": {
        "status": 200,
        "headers": {},
        "body": "object|string"
      },
      "timestamp": "ISO",
      "durationMs": 123
    }
  ]
}
```

## Notes

- Cassette filenames become cassette IDs (without extension)
- Keep cassettes small and focused (one endpoint per cassette is a good pattern)
- Redact all sensitive data - never commit real API keys
- Use consistent naming: `verb-resource-name.cassette`

## License

MIT
