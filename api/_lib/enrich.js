import { scoreLeadWithGroq } from './groq.js';
import { verifyEmail, verifyPhone } from './verify.js';

export async function enrichLead(supabase, lead) {
  const [analysis, emailCheck] = await Promise.all([
    scoreLeadWithGroq(lead).catch(() => null),
    verifyEmail(lead.email),
  ]);
  const phoneCheck = verifyPhone(lead.phone);

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
