import { scoreLeadWithGroq } from './groq.js';
import { verifyEmail, verifyPhone } from './verify.js';

export const MIN_SCORE = 70;

export async function enrichLead(supabase, lead) {
  const emailCheck = await verifyEmail(lead.email);

  const analysis = await scoreLeadWithGroq(lead).catch(() => null);
  const phoneCheck = verifyPhone(lead.phone);

  if (analysis && analysis.score < MIN_SCORE) {
    const { error } = await supabase.from('leads').delete().eq('id', lead.id);
    if (error) throw error;
    return { id: lead.id, deleted: true, score: analysis.score };
  }

  const update = {
    updated_at: new Date().toISOString(),
    email_valid: emailCheck.valid,
    email_domain_has_mx: emailCheck.domainHasMx,
    phone_valid: phoneCheck.valid,
  };

  if (analysis) {
    update.score = analysis.score;
    update.hot_signals = analysis.hot_signals;
    update.outreach_message = analysis.outreach_message;
  }

  const { data, error } = await supabase
    .from('leads')
    .update(update)
    .eq('id', lead.id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
