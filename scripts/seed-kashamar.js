#!/usr/bin/env node
/**
 * Seeds the Kashamar portal admin account with a generated temporary password.
 * Prints the temporary password ONCE to stdout; stores only the scrypt hash.
 */

require('dotenv').config();
const { getPortalStore } = require('../src/portal/portalStore');
const { ensureKashamarSeeded } = require('../src/portal/auth');

async function main() {
  const store = getPortalStore();
  const result = await ensureKashamarSeeded(store);
  if (result.created) {
    console.log('================================================================');
    console.log('Created Kashamar portal account (mustChangePassword: true)');
    console.log('Username: kashamar');
    console.log(`Temporary Password: ${result.tempPassword}`);
    console.log('Save this password now — it will NOT be printed again.');
    console.log('================================================================');
  } else {
    console.log('Account "kashamar" already exists. No changes made.');
  }
}

main().catch((err) => {
  console.error('Failed to seed kashamar:', err);
  process.exit(1);
});
