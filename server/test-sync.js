import { syncMoodle } from './lib/moodle.js'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY)

// get first user id
supabaseAdmin.from('users').select('id').limit(1).then(async ({data}) => {
  if (data[0]) {
    console.log("Syncing for", data[0].id)
    await syncMoodle(data[0].id)
    console.log("Done")
  }
})
