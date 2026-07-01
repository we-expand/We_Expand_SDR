import { getSupabaseAdmin } from './_lib/supabase.js';
import { extractLeadsFromText } from './_lib/groq.js';
import { enrichLead } from './_lib/enrich.js';
import { extractLinkedinUrl } from './_lib/csv.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { text } = req.body || {};
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Campo "text" é obrigatório' });
    return;
  }

  let extracted;
  try {
    extracted = await extractLeadsFromText(text);
  } catch (err) {
    res.status(502).json({ error: 'Falha ao interpretar o texto com a IA: ' + err.message });
    return;
  }

  if (extracted.length === 0) {
    res.status(400).json({ error: 'Nenhum lead identificado nesse texto' });
    return;
  }

  if (extracted.length === 1 && !extracted[0].linkedin_url) {
    extracted[0].linkedin_url = extractLinkedinUrl(text);
  }

  const supabase = getSupabaseAdmin();
  const results = { inserted: 0, updated: 0, failed: 0, rejected: 0, leads: [] };

  for (const lead of extracted) {
    const { data: before } = await supabase
      .from('leads')
      .select('id')
      .eq('name_normalized', lead.name.trim().toLowerCase().replace(/\s+/g, ' '))
      .maybeSingle();

    const { data, error } = await supabase.rpc('upsert_lead', {
      p_name: lead.name,
      p_title: lead.title,
      p_company: lead.company,
      p_country: lead.country,
      p_city: lead.city,
      p_linkedin_url: lead.linkedin_url || null,
      p_email: lead.email,
      p_phone: lead.phone,
      p_source: 'linkedin_paste',
      p_raw_text: text.slice(0, 5000),
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
