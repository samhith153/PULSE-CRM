import {
  registerTestOrg,
  seedAllTestData,
  waitForBackend,
  cleanupSeedData,
} from './helpers/api-seed';

async function globalSetup() {
  console.log('[Global Setup] Waiting for backend to be ready...');
  await waitForBackend(90000);
  console.log('[Global Setup] Backend is ready.');

  await cleanupSeedData();

  console.log('[Global Setup] Registering test organization...');
  const { token } = await registerTestOrg();
  console.log('[Global Setup] Test org registered successfully.');

  console.log('[Global Setup] Seeding test data...');
  const seedData = await seedAllTestData(token);
  console.log(`[Global Setup] Seeded: ${seedData.companyIds.length} companies, ${seedData.contactIds.length} contacts, ${seedData.leadIds.length} leads, ${seedData.dealIds.length} deals`);

  process.env.E2E_TEST_TOKEN = token;

  console.log('[Global Setup] Complete.');
}

export default globalSetup;
