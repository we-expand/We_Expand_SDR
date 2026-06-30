import { getSupabaseAdmin } from './_lib/supabase.js';

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ leads: data });
    return;
  }

  if (req.method === 'DELETE') {
    const { id, ids } = req.body || {};
    const targetIds = Array.isArray(ids) ? ids : id ? [id] : [];

    if (targetIds.length === 0) {
      res.status(400).json({ error: 'Campo "id" ou "ids" é obrigatório' });
      return;
    }

    const { error } = await supabase.from('leads').delete().in('id', targetIds);

    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.status(200).json({ ok: true, deleted: targetIds.length });
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
}
