import { loadSeedData, destroyTestData, cleanupSeedData } from './helpers/api-seed';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

async function globalTeardown() {
  const token = process.env.E2E_TEST_TOKEN;
  if (!token) {
    console.log('[Global Teardown] No test token found, skipping cleanup.');
    return;
  }

  const seedData = await loadSeedData();
  if (seedData) {
    console.log('[Global Teardown] Cleaning up test data...');
    await destroyTestData(token, seedData);
    console.log('[Global Teardown] Test data cleaned up.');
  }

  await cleanupSeedData();
  console.log('[Global Teardown] Complete.');
}

export default globalTeardown;
