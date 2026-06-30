import { getSupabaseAdmin } from './_lib/supabase.js';
import { enrichLead } from './_lib/enrich.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { ids } = req.body || {};
  if (!Array.isArray(ids) || ids.length === 0) {
    res.status(400).json({ error: 'Campo "ids" (array) é obrigatório' });
    return;
  }

  const supabase = getSupabaseAdmin();
  const { data: leads, error: fetchError } = await supabase.from('leads').select('*').in('id', ids);

  if (fetchError) {
    res.status(500).json({ error: fetchError.message });
    return;
  }

  const results = [];
  for (const lead of leads) {
    try {
      results.push(await enrichLead(supabase, lead));
    } catch (err) {
      results.push({ id: lead.id, error: err.message });
    }
  }

  res.status(200).json({ leads: results });
}
