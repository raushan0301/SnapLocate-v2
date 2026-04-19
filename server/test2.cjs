require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  let { data, error } = await supabaseAdmin.from('lost_found').select('*');
  console.log("Total items:", data.length);
  console.log(data.map(d => ({ id: d.id, title: d.title, category: d.category, status: d.status })));
}
run();
