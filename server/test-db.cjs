require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function run() {
  let { data, error } = await supabaseAdmin.from('lost_found').select('*');
  console.log(JSON.stringify(data, null, 2));
}
run();
