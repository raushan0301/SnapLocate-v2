/**
 * SnapLocate Migration Runner
 * Usage: node migrate.mjs
 * Enter your Supabase DB password when prompted (Settings → Database → Connection string)
 */
import pg from 'pg'
import readline from 'readline'

const { Client } = pg
const PROJECT_REF = 'thdetmcwiigfxurjzqqk'

function ask(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()) }))
}

const MIGRATIONS = [
  {
    name: 'Add org_id to users',
    check: `SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='org_id'`,
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS org_id UUID DEFAULT 'a0000000-0000-0000-0000-000000000001';
          UPDATE users SET org_id = 'a0000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;`,
  },
  {
    name: 'Add new columns to lost_found',
    check: `SELECT column_name FROM information_schema.columns WHERE table_name='lost_found' AND column_name='category'`,
    sql: `ALTER TABLE lost_found
            ADD COLUMN IF NOT EXISTS org_id       UUID,
            ADD COLUMN IF NOT EXISTS category     TEXT DEFAULT 'other'
              CHECK (category IN ('electronics','keys','id_card','clothing','books','bag','wallet','jewellery','sports','other')),
            ADD COLUMN IF NOT EXISTS contact_info TEXT,
            ADD COLUMN IF NOT EXISTS resolved_at  TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS resolved_by  UUID REFERENCES users(id),
            ADD COLUMN IF NOT EXISTS expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '60 days');
          UPDATE lost_found SET org_id = 'a0000000-0000-0000-0000-000000000001' WHERE org_id IS NULL;`,
  },
  {
    name: 'Create lost_found_claims table',
    check: `SELECT table_name FROM information_schema.tables WHERE table_name='lost_found_claims'`,
    sql: `CREATE TABLE IF NOT EXISTS lost_found_claims (
            id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            item_id     UUID NOT NULL REFERENCES lost_found(id) ON DELETE CASCADE,
            claimer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            message     TEXT NOT NULL,
            proof_url   TEXT,
            status      TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
            admin_note  TEXT,
            created_at  TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(item_id, claimer_id)
          );
          CREATE INDEX IF NOT EXISTS idx_lf_claims_item    ON lost_found_claims(item_id);
          CREATE INDEX IF NOT EXISTS idx_lf_claims_claimer ON lost_found_claims(claimer_id);
          CREATE INDEX IF NOT EXISTS idx_lf_claims_status  ON lost_found_claims(status);`,
  },
  {
    name: 'Create lf_conversations table',
    check: `SELECT table_name FROM information_schema.tables WHERE table_name='lf_conversations'`,
    sql: `CREATE TABLE IF NOT EXISTS lf_conversations (
            id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            item_id         UUID NOT NULL REFERENCES lost_found(id) ON DELETE CASCADE,
            participant_a   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            participant_b   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            last_message_at TIMESTAMPTZ DEFAULT NOW(),
            created_at      TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(item_id, participant_a, participant_b)
          );
          CREATE INDEX IF NOT EXISTS idx_lf_conv_item ON lf_conversations(item_id);
          CREATE INDEX IF NOT EXISTS idx_lf_conv_pa   ON lf_conversations(participant_a);
          CREATE INDEX IF NOT EXISTS idx_lf_conv_pb   ON lf_conversations(participant_b);`,
  },
  {
    name: 'Create lf_messages table',
    check: `SELECT table_name FROM information_schema.tables WHERE table_name='lf_messages'`,
    sql: `CREATE TABLE IF NOT EXISTS lf_messages (
            id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conversation_id UUID NOT NULL REFERENCES lf_conversations(id) ON DELETE CASCADE,
            sender_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content         TEXT NOT NULL CHECK (char_length(content) <= 1000),
            is_read         BOOLEAN DEFAULT FALSE,
            created_at      TIMESTAMPTZ DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_lf_msg_conv   ON lf_messages(conversation_id);
          CREATE INDEX IF NOT EXISTS idx_lf_msg_sender ON lf_messages(sender_id);`,
  },
  {
    name: 'Enable Realtime on lf_messages',
    check: null,   // always run — safe to run multiple times
    sql: `ALTER PUBLICATION supabase_realtime ADD TABLE lf_messages;`,
  },
  {
    name: 'Indexes on lost_found',
    check: null,
    sql: `CREATE INDEX IF NOT EXISTS idx_lost_found_org      ON lost_found(org_id);
          CREATE INDEX IF NOT EXISTS idx_lost_found_status   ON lost_found(status);
          CREATE INDEX IF NOT EXISTS idx_lost_found_category ON lost_found(category);`,
  },
]

async function run() {
  console.log('\n🚀  SnapLocate Migration Runner\n')
  console.log('  Project: ', PROJECT_REF)
  console.log('  Host:     db.' + PROJECT_REF + '.supabase.co\n')

  const password = await ask('  Enter Supabase DB password (Settings → Database → Connection string): ')
  if (!password) { console.error('❌  No password provided.'); process.exit(1) }

  const client = new Client({
    host:     `db.${PROJECT_REF}.supabase.co`,
    port:     5432,
    database: 'postgres',
    user:     'postgres',
    password,
    ssl:      { rejectUnauthorized: false },
  })

  try {
    await client.connect()
    console.log('\n✅  Connected to database\n')

    let ran = 0, skipped = 0, failed = 0

    for (const migration of MIGRATIONS) {
      process.stdout.write(`  • ${migration.name}... `)
      try {
        // Check if already applied
        if (migration.check) {
          const { rows } = await client.query(migration.check)
          if (rows.length > 0) {
            console.log('already done ✓')
            skipped++
            continue
          }
        }
        await client.query(migration.sql)
        console.log('done ✅')
        ran++
      } catch (err) {
        // Some errors are harmless (e.g. publication already has table)
        if (err.message.includes('already exists') || err.message.includes('already a member')) {
          console.log('already done ✓')
          skipped++
        } else {
          console.log('FAILED ❌')
          console.error('    Error:', err.message)
          failed++
        }
      }
    }

    console.log(`\n─────────────────────────────────────────`)
    console.log(`  ✅ Ran: ${ran}   ✓ Skipped: ${skipped}   ❌ Failed: ${failed}`)
    console.log(`─────────────────────────────────────────\n`)

    if (failed === 0) {
      console.log('🎉  All migrations complete! Your database is ready.\n')
    } else {
      console.log('⚠️   Some migrations failed — check errors above.\n')
    }
  } catch (err) {
    console.error('\n❌  Connection failed:', err.message)
    console.error('    Make sure the password is correct (Project Settings → Database).\n')
    process.exit(1)
  } finally {
    await client.end()
  }
}

run()
