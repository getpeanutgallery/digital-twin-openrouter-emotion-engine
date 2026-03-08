/**
 * Twin Pack Index
 *
 * This module exports a TwinStore configured to access the cassettes
 * in this pack. The digital-twin-router can load this pack via the
 * twinPack path and use the store directly for replay operations.
 *
 * Export: TwinStore instance pointed at ./cassettes directory
 *
 * Alternative: Could export pack metadata, but store is more practical.
 */

const { TwinStore } = require('digital-twin-core');
const path = require('path');

// Create a store pointing to the cassettes directory within this pack
const store = new TwinStore({
  storeDir: path.join(__dirname, 'cassettes'),
  createIfMissing: false
});

module.exports = store;
