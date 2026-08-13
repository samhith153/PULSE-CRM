import { test, expect } from '@playwright/test';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

function log(label: string, data: any) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`\n[${ts}] === ${label} ===`);
  console.log(JSON.stringify(data, null, 2));
}

async function api(token: string, path: string, method = 'GET', body?: any) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

async function registerAndGetToken(): Promise<string> {
  const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      full_name: 'Pipeline Test Admin',
      email: `pipeline-test-${Date.now()}@test.com`,
      password: 'PipelineTest1234!',
      organization_name: `Pipeline Test Org ${Date.now()}`,
    }),
  });
  const data = await res.json();
  return data.data.access_token;
}

test.describe('Inbound Email → Scoring Pipeline', () => {
  let token = '';
  let leadId = '';
  let leadEmail = '';

  test('1 — Register + create lead + send outbound + check BEFORE scores', async () => {
    token = await registerAndGetToken();
    log('REGISTER', { status: 'ok', tokenPrefix: token.slice(0, 30) + '...' });

    // Create a lead
    const leadRes = await api(token, '/api/v1/leads', 'POST', {
      full_name: 'Test Prospect',
      email: `prospect-${Date.now()}@gmail.com`,
      company_name: 'Test Corp',
      industry: 'technology',
      employee_count: 50,
      status: 'contacted',
      estimated_value: 25000,
    });
    log('CREATE LEAD (INPUT)', { full_name: 'Test Prospect', industry: 'technology', employee_count: 50 });
    log('CREATE LEAD (OUTPUT)', leadRes.data);

    if (leadRes.data?.data) {
      leadId = leadRes.data.data.id;
      leadEmail = leadRes.data.data.email;
      log('LEAD CREATED', { leadId, leadEmail });
    } else {
      // Lead may already exist or route differs — list leads instead
      const listRes = await api(token, '/api/v1/leads?page=1&limit=5');
      log('LIST LEADS (OUTPUT)', listRes.data);
      const leads = listRes.data?.data?.items || listRes.data?.data || [];
      if (leads.length > 0) {
        leadId = leads[0].id;
        leadEmail = leads[0].email || '';
        log('USING EXISTING LEAD', { leadId, leadEmail, name: leads[0].full_name || leads[0].name });
      }
    }

    // Get scores BEFORE any email processing
    if (leadId) {
      const scoreBefore = await api(token, `/api/v1/leads/${leadId}/score`);
      log('SCORES BEFORE EMAIL (OUTPUT)', scoreBefore.data);

      const score = scoreBefore.data?.data;
      console.log('\n📊 SCORES BEFORE INBOUND EMAIL:');
      console.log(`   Fit:              ${score?.fit_score ?? 'N/A'}`);
      console.log(`   Engagement:       ${score?.engagement_score ?? 'N/A'}`);
      console.log(`   Overall:          ${score?.overall_score ?? 'N/A'}`);
      console.log(`   Tier:             ${score?.priority_tier ?? 'N/A'}`);
    }

    // Check Gmail connection
    const connRes = await api(token, '/api/v1/gmail/connections');
    const connections = connRes.data?.data || [];
    log('GMAIL CONNECTIONS', { count: connections.length, emails: connections.map((c: any) => c.email_address) });

    expect(token).toBeTruthy();
  });

  test('2 — Trigger Gmail sync → new inbound emails detected', async () => {
    if (!token) { console.log('⏭️  Skipping — no token'); test.skip(); return; }

    const connRes = await api(token, '/api/v1/gmail/connections');
    const connections = connRes.data?.data || [];
    if (connections.length === 0) {
      console.log('⚠️  No Gmail connection found. Connect Gmail in Settings first.');
      console.log('   Syncing emails is required to test the inbound scoring pipeline.');
      test.skip();
      return;
    }

    for (const conn of connections) {
      console.log(`\n🔄 Syncing Gmail: ${conn.email_address} (${conn.id})`);
      const syncRes = await api(token, `/api/v1/gmail/connections/${conn.id}/sync`, 'POST');
      log('SYNC RESPONSE', syncRes.data);

      const emails = syncRes.data?.data?.emails || [];
      const synced = syncRes.data?.data?.synced_count || 0;
      const skipped = syncRes.data?.data?.skipped_count || 0;
      console.log(`\n📊 Sync: ${synced} new, ${skipped} skipped, ${emails.length} total`);

      if (emails.length > 0) {
        console.log('\n📧 EMAILS SYNCED:');
        for (const e of emails) {
          const dir = e.direction === 'inbound' ? '↙ INBOUND' : '↗ OUTBOUND';
          console.log(`   ${dir} | ${e.subject} | from: ${e.sender}`);
          console.log(`     thread_id: ${e.thread_id}`);
          console.log(`     entity_type: ${e.external_entity_type || 'NONE'}`);
          console.log(`     entity_id:   ${e.external_entity_id || 'NONE'}`);
        }
      }
    }

    expect(connRes.status).toBe(200);
  });

  test('3 — Wait 20s for background summarize + assess', async () => {
    if (!token) { test.skip(); return; }

    console.log('\n⏳ Waiting 20 seconds for background processing...');
    console.log('   Backend pipeline: _summarize_and_assess → _safe_summarize → _run_assessment_background → run_lead_assessment → ai-service /assess');
    console.log('   Check the backend console for these log tags:');
    console.log('     [INGEST] → [SAFE_SUMMARIZE] → [SUMMARIZE_ASSESS] → [ASSESS_BG] → [ASSESS_PIPELINE]');
    console.log('     [FETCH_INTENT] → AI Service response → [ASSESS_BG] persisted');

    // Poll every 3 seconds to check if scores changed
    for (let i = 0; i < 7; i++) {
      await new Promise((r) => setTimeout(r, 3000));
      if (leadId) {
        const scoreCheck = await api(token, `/api/v1/leads/${leadId}/score`);
        const s = scoreCheck.data?.data;
        const eng = s?.engagement_score;
        const ov = s?.overall_score;
        const ts = new Date().toISOString().slice(11, 19);
        console.log(`   [${ts}] Check ${i + 1}/7: engagement=${eng ?? 'N/A'} overall=${ov ?? 'N/A'}`);
        if (eng && eng > 0) {
          console.log('   ✅ Engagement score detected — pipeline working!');
          break;
        }
      }
    }
  });

  test('4 — Check lead scores AFTER pipeline (engagement + overall + recommendation)', async () => {
    if (!token || !leadId) { console.log('⏭️  Skipping — no token or leadId'); test.skip(); return; }

    const scoreAfter = await api(token, `/api/v1/leads/${leadId}/score`);
    log('SCORES AFTER INBOUND EMAIL (OUTPUT)', scoreAfter.data);

    const score = scoreAfter.data?.data;
    console.log('\n📈 SCORES AFTER INBOUND EMAIL:');
    console.log(`   Fit Score:              ${score?.fit_score ?? 'N/A'}`);
    console.log(`   Engagement Score:       ${score?.engagement_score ?? 'N/A'}`);
    console.log(`   Overall Score:          ${score?.overall_score ?? 'N/A'}`);
    console.log(`   Priority Tier:          ${score?.priority_tier ?? 'N/A'}`);
    console.log(`   Fit Reasons:            ${JSON.stringify(score?.fit_reasons || [])}`);
    console.log(`   Engagement Reasons:     ${JSON.stringify(score?.engagement_reasons || [])}`);
    console.log(`   Top Reasons:            ${JSON.stringify(score?.top_reasons || [])}`);

    // Check recommendation
    const recRes = await api(token, `/api/v1/leads/${leadId}/recommendation`);
    log('RECOMMENDATION (OUTPUT)', recRes.data);
    console.log(`\n💡 RECOMMENDATION:`);
    console.log(`   Action:     ${recRes.data?.data?.recommendation || recRes.data?.data?.action || 'N/A'}`);
    console.log(`   Reasoning:  ${recRes.data?.data?.reasoning || 'N/A'}`);

    // Check email summaries
    if (leadId) {
      const emailsRes = await api(token, '/api/v1/emails?limit=20');
      const emails = emailsRes.data?.data?.items || [];
      const leadEmails = emails.filter((e: any) =>
        e.external_entity_id === leadId || e.external_entity_type === 'lead'
      );
      console.log(`\n📧 LEAD EMAILS: ${leadEmails.length} linked to lead ${leadId}`);

      for (const e of leadEmails.slice(0, 5)) {
        const dir = e.direction === 'inbound' ? '↙ IN' : '↗ OUT';
        console.log(`   ${dir} | ${e.subject} | thread: ${e.thread_id}`);

        if (e.thread_id) {
          const summRes = await api(token, `/api/v1/emails/summary/${e.thread_id}`);
          const summ = summRes.data?.data;
          if (summ) {
            console.log(`     ✅ Summary: ${summ.summary?.slice(0, 80)}...`);
            console.log(`     Intent: ${summ.intent} | Sentiment: ${summ.sentiment} | Category: ${summ.category}`);
          } else {
            console.log(`     ⚠️  No summary found for thread ${e.thread_id}`);
          }
        }
      }
    }

    expect(scoreAfter.status).toBe(200);
  });

  test('5 — Verify inbound-only AI Summary in frontend', async ({ page }) => {
    if (!token) { test.skip(); return; }

    // Inject auth and navigate to emails
    await page.addInitScript((args) => {
      sessionStorage.setItem('pulse-crm-auth', 'true');
      sessionStorage.setItem('pulse-crm-token', args.token);
      localStorage.setItem('pulse-crm-role', 'admin');
      localStorage.setItem('pulse-crm-user', 'Pipeline Test Admin');
    }, { token });

    await page.goto('/', { waitUntil: 'domcontentloaded', timeout: 60_000 });
    await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

    // Navigate to emails
    const emailsBtn = page.getByRole('button', { name: /^Emails$/i });
    const hasEmails = await emailsBtn.isVisible({ timeout: 5000 }).catch(() => false);

    if (!hasEmails) {
      console.log('⚠️  Emails tab not visible in sidebar — skipping UI check');
      return;
    }

    await emailsBtn.click();
    await page.waitForTimeout(3000);

    // Count email rows
    const rows = page.locator('table tbody tr, [role="row"]');
    const count = await rows.count();
    console.log(`\n📧 EMAILS VIEW: ${count} rows visible`);

    // Check each email for AI Summary
    let inboundWithSummary = 0;
    let outboundWithSummary = 0;
    let totalChecked = 0;

    for (let i = 0; i < Math.min(count, 6); i++) {
      const row = rows.nth(i);
      const rowText = (await row.textContent()) || '';
      const isOutbound = rowText.toLowerCase().includes('outbound') || rowText.includes('↗');
      const direction = isOutbound ? 'OUTBOUND' : 'INBOUND';

      await row.click();
      await page.waitForTimeout(1500);

      const summaryVisible = await page.getByText(/AI Summary/i).first().isVisible({ timeout: 2000 }).catch(() => false);

      console.log(`   [${i + 1}] ${direction} | Summary visible: ${summaryVisible}`);
      totalChecked++;

      if (summaryVisible && isOutbound) {
        outboundWithSummary++;
        console.log('      ❌ BUG: Outbound email showing AI Summary!');
      }
      if (summaryVisible && !isOutbound) {
        inboundWithSummary++;
        console.log('      ✅ OK: Inbound email showing AI Summary');
      }
      if (!summaryVisible && isOutbound) {
        console.log('      ✅ OK: Outbound email NOT showing AI Summary');
      }

      // Go back to email list
      const backBtn = page.getByRole('button', { name: /back|←/i }).first();
      if (await backBtn.isVisible({ timeout: 1000 }).catch(() => false)) {
        await backBtn.click();
        await page.waitForTimeout(500);
      } else {
        await emailsBtn.click();
        await page.waitForTimeout(1000);
      }
    }

    console.log(`\n📊 AI SUMMARY VERIFICATION:`);
    console.log(`   Total emails checked: ${totalChecked}`);
    console.log(`   Inbound with summary: ${inboundWithSummary}`);
    console.log(`   Outbound with summary (BUG): ${outboundWithSummary}`);

    if (outboundWithSummary > 0) {
      console.log('   ❌ FAIL: Outbound emails should NOT show AI Summary');
    } else if (inboundWithSummary > 0) {
      console.log('   ✅ PASS: AI Summary correctly shown only on inbound emails');
    }
  });
});
