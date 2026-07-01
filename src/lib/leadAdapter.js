function isFirstDegreeInText(rawText) {
  if (!rawText) return false;
  return /[•·]\s*1º/.test(rawText.slice(0, 150));
}

export function normalizeDbLead(row) {
  return {
    id: row.id,
    name: row.name,
    title: row.title || '—',
    company: row.company || '—',
    country: row.country || '—',
    city: row.city || null,
    companyType: row.company_type,
    score: row.score ?? null,
    avatar: null,
    linkedin: row.linkedin_url,
    website: row.website,
    email: row.email,
    emailValid: row.email_valid,
    emailDomainHasMx: row.email_domain_has_mx,
    phone: row.phone,
    phoneValid: row.phone_valid,
    hotSignals: row.hot_signals && row.hot_signals.length ? row.hot_signals : [],
    outreachMessage: row.outreach_message,
    status: row.status,
    titleHistory: row.title_history || [],
    source: row.source || null,
    freeMessageChannel: row.source === 'linkedin_connections' || isFirstDegreeInText(row.raw_text),
  };
}
