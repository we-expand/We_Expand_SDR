import { getSupabaseAdmin } from './_lib/supabase.js';

export default async function handler(req, res) {
  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    const { q, titles, locations, cities, min_score } = req.query || {};

    let query = supabase.from('leads').select('*');

    if (q) {
      const safe = q.replace(/'/g, "''");
      query = query.or(`name.ilike.%${safe}%,title.ilike.%${safe}%,company.ilike.%${safe}%`);
    }

    if (titles) {
      const list = titles.split(',').map(t => t.trim()).filter(Boolean);
      if (list.length) {
        query = query.or(list.map(t => `title.ilike.%${t.replace(/'/g, "''")}%`).join(','));
      }
    }

    if (locations) {
      const list = locations.split(',').map(l => l.trim()).filter(Boolean);
      if (list.length) {
        query = query.or(list.map(l => `country.ilike.%${l.replace(/'/g, "''")}%`).join(','));
      }
    }

    if (cities) {
      const list = cities.split(',').map(c => c.trim()).filter(Boolean);
      if (list.length) {
        query = query.or(list.map(c => `city.ilike.%${c.replace(/'/g, "''")}%`).join(','));
      }
    }

    if (min_score) {
      query = query.gte('score', Number(min_score));
    }

    query = query
      .order('score', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    const { data, error } = await query;

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
