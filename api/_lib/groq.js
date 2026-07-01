export async function scoreLeadWithGroq(lead) {
  let prompt = `Lead: ${lead.name}, ${lead.title || 'cargo desconhecido'} na ${lead.company || 'empresa desconhecida'}, ${lead.city ? lead.city + ', ' : ''}${lead.country || 'país desconhecido'}.`;
  if (lead.raw_text) {
    prompt += `\n\nTexto original colado sobre esse lead/empresa:\n${lead.raw_text.slice(0, 4000)}\n\nUse esse texto para identificar sinais reais de contratação em TI, vagas abertas, menção a IA/automação ou transformação digital, se houver.`;
  }

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Você é um SDR especialista em qualificação de leads B2B para uma empresa de desenvolvimento de software e consultoria em IA. ' +
            'ICP (perfil de cliente ideal): decisor de tecnologia (CTO, Head de Produto, Head de Tecnologia, Gerente de TI/Produto) em PMEs (pequenas e médias empresas) que provavelmente não têm capacidade interna de IA e precisariam terceirizar. ' +
            'Dê score mais alto quando o cargo bate exatamente com o ICP (CTO/Head Tech/Head Produto/Gerência TI), a empresa parece ser PME (não multinacional/big tech, sem sinal de time de IA próprio), e o setor da empresa sugere demanda real por automação/IA (ex: imobiliária, varejo, serviços, saúde, logística). ' +
            'Dê score mais baixo para cargos não-técnicos, empresas claramente grandes/big tech (que têm time interno robusto) ou perfis genéricos sem ligação clara a tecnologia. ' +
            'Se receber um texto colado (posts, "sobre a empresa", descrição de vaga etc.), procure ativamente por sinais explícitos de contratação (ex: "estamos contratando", "vaga aberta", "hiring", posts sobre expansão de equipe de tecnologia) e cite isso nos hot_signals quando encontrar. ' +
            'Responda SOMENTE em JSON: {"score": numero inteiro de 0 a 100, "hot_signals": [3 a 5 strings curtas explicando por que o lead é promissor, citando especificamente cargo/empresa/setor quando relevante], "outreach_message": uma mensagem de primeiro contato curta (2-3 frases), profissional e personalizada, em português, mencionando como podemos ajudar a empresa dele com IA/automação}.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);

  return {
    score: parsed.score,
    hot_signals: parsed.hot_signals || [],
    outreach_message: parsed.outreach_message || null,
  };
}

export async function extractLeadsFromText(rawText) {
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content:
            'Você extrai dados estruturados de texto colado de páginas do LinkedIn (pode ser um único perfil ou uma lista de resultados de busca com várias pessoas). Para cada pessoa identificada, extraia: nome completo, cargo atual, empresa atual, cidade (se houver), país (se houver), e-mail (se houver, geralmente do painel "Informações de contato"), telefone (se houver) e a URL do perfil do LinkedIn (linkedin_url) se ela aparecer em algum lugar do texto colado (ex: "linkedin.com/in/..."). Ignore conexões em comum, anúncios, menus e qualquer texto que não seja informação de uma pessoa. Se não conseguir identificar nenhuma pessoa, retorne uma lista vazia. Responda SOMENTE em JSON no formato: {"leads": [{"name": string, "title": string ou null, "company": string ou null, "city": string ou null, "country": string ou null, "email": string ou null, "phone": string ou null, "linkedin_url": string ou null}]}.',
        },
        { role: 'user', content: rawText.slice(0, 12000) },
      ],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    throw new Error(`Groq API error: ${response.status}`);
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return (parsed.leads || []).filter(l => l.name);
}
