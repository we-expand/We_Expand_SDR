import { parseCsv, mapApolloRecord, stripLinkedInConnectionsPreamble } from './_lib/csv.js';
import { getSupabaseAdmin } from './_lib/supabase.js';

const BATCH_SIZE = 150;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { csv, offset = 0 } = req.body || {};
  if (!csv || typeof csv !== 'string') {
    res.status(400).json({ error: 'Campo "csv" (texto) é obrigatório' });
    return;
  }

  let records;
  try {
    records = parseCsv(stripLinkedInConnectionsPreamble(csv))
      .map(mapApolloRecord)
      .filter(r => r.name);
  } catch (err) {
    res.status(400).json({ error: 'Falha ao interpretar o CSV: ' + err.message });
    return;
  }

  if (records.length === 0) {
    res.status(400).json({ error: 'Nenhuma conexão com nome encontrada no CSV' });
    return;
  }

  const supabase = getSupabaseAdmin();
  const batch = records.slice(offset, offset + BATCH_SIZE);
  let processed = 0;
  let failed = 0;

  for (const record of batch) {
    const { error } = await supabase.rpc('upsert_lead', {
      p_name: record.name,
      p_title: record.title,
      p_company: record.company,
      p_country: record.country,
      p_city: record.city,
      p_linkedin_url: record.linkedin_url,
      p_website: record.website,
      p_email: record.email,
      p_phone: record.phone,
      p_source: 'linkedin_connections',
    });

    if (error) failed++;
    else processed++;
  }

  const nextOffset = offset + batch.length;
  res.status(200).json({
    processed,
    failed,
    total: records.length,
    nextOffset,
    done: nextOffset >= records.length,
  });
}
