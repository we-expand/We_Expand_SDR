import { parseCsv, mapApolloRecord } from './_lib/csv.js';
import { getSupabaseAdmin } from './_lib/supabase.js';
import { enrichLead } from './_lib/enrich.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { csv } = req.body || {};
  if (!csv || typeof csv !== 'string') {
    res.status(400).json({ error: 'Campo "csv" (texto) é obrigatório' });
    return;
  }

  let records;
  try {
    records = parseCsv(csv).map(mapApolloRecord).filter(r => r.name);
  } catch (err) {
    res.status(400).json({ error: 'Falha ao interpretar o CSV: ' + err.message });
    return;
  }

  if (records.length === 0) {
    res.status(400).json({ error: 'Nenhum lead com nome encontrado no CSV' });
    return;
  }

  const supabase = getSupabaseAdmin();
  const results = { inserted: 0, updated: 0, failed: 0, rejected: 0, leads: [] };

  for (const record of records) {
    const { data: before } = await supabase
      .from('leads')
      .select('id')
      .eq('name_normalized', record.name.trim().toLowerCase().replace(/\s+/g, ' '))
      .maybeSingle();

    const { data, error } = await supabase.rpc('upsert_lead', {
      p_name: record.name,
      p_title: record.title,
      p_company: record.company,
      p_country: record.country,
      p_city: record.city,
      p_linkedin_url: record.linkedin_url,
      p_website: record.website,
      p_email: record.email,
      p_phone: record.phone,
      p_source: 'apollo_csv',
    });

    if (error) {
      results.failed++;
      continue;
    }

    let enriched;
    try {
      enriched = await enrichLead(supabase, data);
    } catch {
      enriched = data;
    }

    if (enriched?.deleted) {
      results.rejected++;
    } else {
      if (before) results.updated++;
      else results.inserted++;
      results.leads.push(enriched);
    }
  }

  res.status(200).json(results);
}
