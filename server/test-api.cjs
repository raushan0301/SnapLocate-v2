const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const app = express();
const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.get('/test-lf', async (req, res) => {
  let query = supabaseAdmin
    .from('lost_found')
    .select('*')
    .order('created_at', { ascending: false });

  const { data, error } = await query;
  
  const ids = (data || []).map(i => i.id)
  const reporterIds = [...new Set((data || []).map(i => i.reporter_id).filter(Boolean))]

  let claimCounts = {}
  let reportersMap = {}

  if (ids.length > 0) {
    const { data: cc } = await supabaseAdmin
      .from('lost_found_claims').select('item_id, status').in('item_id', ids)
    ;(cc || []).forEach(c => {
      if (!claimCounts[c.item_id]) claimCounts[c.item_id] = { total: 0, pending: 0 }
      claimCounts[c.item_id].total++
      if (c.status === 'pending') claimCounts[c.item_id].pending++
    })
  }

  if (reporterIds.length > 0) {
    const { data: users } = await supabaseAdmin
      .from('users').select('id, full_name, avatar_url').in('id', reporterIds)
    ;(users || []).forEach(u => reportersMap[u.id] = u)
  }

  const enriched = (data || []).map(i => ({ 
    ...i, 
    reporter: reportersMap[i.reporter_id] || null,
    claim_counts: claimCounts[i.id] || { total: 0, pending: 0 } 
  }))
  
  res.json({ success: true, data: enriched });
});

app.listen(9999, () => console.log('ready'));
