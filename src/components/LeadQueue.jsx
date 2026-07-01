import { useState } from 'react';
import { normalizeDbLead } from '../lib/leadAdapter';
import { apiUrl } from '../lib/apiUrl';

function emailStatus(lead) {
  if (lead.emailValid === null || lead.emailValid === undefined) return null;
  if (lead.emailValid === false) return false;
  return lead.emailDomainHasMx !== false;
}

function ContactBadge({ status }) {
  if (status === null || status === undefined) return null;
  return status ? (
    <span className="text-green-600" title="Formato válido e domínio verificado">✅</span>
  ) : (
    <span className="text-amber-600" title="Formato inválido ou domínio sem servidor de e-mail">⚠️</span>
  );
}

export default function LeadQueue({ leads, criteria, onBack, onLeadUpdated, onLeadDeleted, onLeadsBulkDeleted }) {
  const [minScore, setMinScore] = useState(0);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const visibleLeads = leads.filter(lead => (lead.score ?? 0) >= minScore);
  const visibleIds = visibleLeads.map(l => l.id);
  const allVisibleSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(id));

  function toggleSelect(id) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds(prev => {
      if (allVisibleSelected) {
        const next = new Set(prev);
        visibleIds.forEach(id => next.delete(id));
        return next;
      }
      return new Set([...prev, ...visibleIds]);
    });
  }

  async function handleBulkDelete() {
    const ids = [...selectedIds];
    if (ids.length === 0) return;
    if (!window.confirm(`Excluir ${ids.length} lead(s) selecionado(s) definitivamente?`)) return;

    setBulkDeleting(true);
    try {
      const res = await fetch(apiUrl('/api/leads'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao excluir');
      onLeadsBulkDeleted?.(ids);
      setSelectedIds(new Set());
    } catch (err) {
      window.alert(err.message);
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Fila de leads quentes</h2>
          <p className="text-gray-600 mt-2">
            {visibleLeads.length} {visibleLeads.length === 1 ? 'lead encontrado' : 'leads encontrados'}
            {minScore > 0 && ` (de ${leads.length} no total)`}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
        >
          ← Voltar
        </button>
      </div>

      {/* Filtro de score mínimo */}
      {leads.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center gap-4">
          <label htmlFor="min-score" className="text-sm font-semibold text-gray-700 whitespace-nowrap">
            🎯 Score mínimo: {minScore}
          </label>
          <input
            id="min-score"
            type="range"
            min="0"
            max="100"
            step="10"
            value={minScore}
            onChange={(e) => setMinScore(Number(e.target.value))}
            className="flex-1"
          />
        </div>
      )}

      {/* Seleção em massa */}
      {visibleLeads.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={allVisibleSelected}
              onChange={toggleSelectAllVisible}
              className="w-4 h-4"
            />
            Selecionar todos os {visibleLeads.length} visíveis
          </label>
          <button
            onClick={handleBulkDelete}
            disabled={selectedIds.size === 0 || bulkDeleting}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {bulkDeleting ? 'Excluindo...' : `🗑️ Excluir selecionados (${selectedIds.size})`}
          </button>
        </div>
      )}

      {/* Leads */}
      {visibleLeads.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
          <p className="text-yellow-800 text-lg">😔 Nenhum lead encontrado com esses critérios.</p>
          <p className="text-yellow-700 text-sm mt-2">Tente ajustar os filtros.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {visibleLeads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onUpdated={onLeadUpdated}
              onDeleted={onLeadDeleted}
              selected={selectedIds.has(lead.id)}
              onToggleSelect={() => toggleSelect(lead.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function buildWhatsappUrl(phone, message) {
  const digits = (phone || '').replace(/\D/g, '');
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

function LeadCard({ lead, onUpdated, onDeleted, selected, onToggleSelect }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);
  const [copiedChannel, setCopiedChannel] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`Excluir "${lead.name}" definitivamente?`)) return;
    setDeleting(true);
    try {
      const res = await fetch(apiUrl('/api/leads'), {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: lead.id }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Falha ao excluir');
      onDeleted?.(lead.id);
    } catch (err) {
      setDeleting(false);
      window.alert(err.message);
    }
  }

  async function handleOutreach(channel) {
    const message = lead.outreachMessage || '';
    try {
      await navigator.clipboard.writeText(message);
      setCopiedChannel(channel);
      setTimeout(() => setCopiedChannel(null), 2000);
    } catch {
      // clipboard indisponível, segue só com o link
    }

    if (channel === 'email' && lead.email) {
      window.open(`mailto:${lead.email}?subject=${encodeURIComponent('Vamos conversar?')}&body=${encodeURIComponent(message)}`, '_blank');
    } else if (channel === 'linkedin' && lead.linkedin) {
      window.open(lead.linkedin, '_blank', 'noopener,noreferrer');
    } else if (channel === 'whatsapp' && lead.phone) {
      window.open(buildWhatsappUrl(lead.phone, message), '_blank', 'noopener,noreferrer');
    }
  }

  async function handleAnalyze() {
    setAnalyzing(true);
    setAnalyzeError(null);
    try {
      const res = await fetch(apiUrl('/api/score-leads'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [lead.id] }),
      });
      const data = await res.json();
      const result = data.leads?.[0];
      if (!res.ok || !result || result.error) {
        throw new Error(result?.error || data.error || 'Falha ao analisar');
      }
      onUpdated?.(normalizeDbLead(result));
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6 border-l-4 ${selected ? 'border-red-500 ring-2 ring-red-200' : 'border-blue-500'}`}>
      <div className="flex gap-6">
        {/* Seleção */}
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            checked={!!selected}
            onChange={onToggleSelect}
            className="w-5 h-5"
            title="Selecionar para exclusão em massa"
          />
        </div>
        {/* Avatar + info básica */}
        <div className="flex-shrink-0 flex flex-col items-center">
          {lead.avatar ? (
            <img
              src={lead.avatar}
              alt={lead.name}
              className="w-20 h-20 rounded-full object-cover border-2 border-blue-200"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-blue-100 border-2 border-blue-200 flex items-center justify-center text-2xl font-bold text-blue-600">
              {lead.name.split(' ').slice(0, 2).map(n => n[0]).join('')}
            </div>
          )}
          <div className="mt-2 text-center">
            <div className="text-3xl font-bold text-blue-600">{lead.score ?? '—'}</div>
            <p className="text-xs text-gray-500">score</p>
          </div>
        </div>

        {/* Dados do lead */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-xl font-bold text-gray-900">{lead.name}</h3>
              <p className="text-sm text-blue-600 font-semibold">{lead.title}</p>
              <p className="text-sm text-gray-600">{lead.company}</p>
              <p className="text-xs text-gray-500 mt-1">
                📍 {lead.city ? `${lead.city}, ` : ''}{lead.country}
              </p>

              {/* Contato */}
              {(lead.email || lead.phone) && (
                <div className="mt-3 space-y-1">
                  {lead.email && (
                    <p className="text-xs text-gray-700 flex items-center gap-1">
                      📧 {lead.email}
                      <ContactBadge status={emailStatus(lead)} />
                    </p>
                  )}
                  {lead.phone && (
                    <p className="text-xs text-gray-700 flex items-center gap-1">
                      📱 {lead.phone}
                      <ContactBadge status={lead.phoneValid === null || lead.phoneValid === undefined ? null : lead.phoneValid} />
                    </p>
                  )}
                </div>
              )}

              {/* Por que é quente */}
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                <p className="text-xs font-semibold text-green-800 mb-2">✅ Por que é quente:</p>
                {lead.hotSignals.length > 0 ? (
                  <ul className="text-xs text-green-700 space-y-1">
                    {lead.hotSignals.map((signal, i) => (
                      <li key={i}>• {signal}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-green-700 italic">Aguardando análise da IA</p>
                )}
              </div>

              {lead.score === null && (
                <div className="mt-3">
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-300 text-white text-sm font-semibold rounded transition-colors"
                  >
                    {analyzing ? '🤖 Analisando...' : '🤖 Analisar com IA'}
                  </button>
                  {analyzeError && (
                    <p className="text-xs text-red-600 mt-1">{analyzeError}</p>
                  )}
                </div>
              )}
            </div>

            {/* Links de perfil */}
            <div className="flex flex-col gap-2">
              {lead.linkedin && (
                <a
                  href={lead.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 font-semibold text-sm rounded transition-colors"
                >
                  🔗 LinkedIn
                </a>
              )}
              {lead.website && (
                <a
                  href={lead.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-sm rounded transition-colors"
                >
                  🌐 Website
                </a>
              )}
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-2 bg-red-50 hover:bg-red-100 disabled:opacity-60 text-red-700 font-semibold text-sm rounded transition-colors"
              >
                {deleting ? '...' : '🗑️ Excluir'}
              </button>
            </div>
          </div>

          {/* Mensagem pronta */}
          <div className="mt-6 border-t pt-4">
            <p className="text-xs font-semibold text-gray-700 mb-2">💬 Mensagem pronta:</p>
            <div className="bg-gray-50 p-3 rounded border border-gray-200 text-sm text-gray-700 italic">
              {lead.outreachMessage ? `"${lead.outreachMessage}"` : 'Aguardando geração de mensagem pela IA'}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleOutreach('email')}
                disabled={!lead.outreachMessage}
                title={lead.email ? 'Copia a mensagem e abre seu e-mail com o contato preenchido' : 'Sem e-mail cadastrado: só copia a mensagem'}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors text-sm"
              >
                {copiedChannel === 'email' ? '✅ Copiado!' : lead.email ? '📩 E-mail' : '📩 E-mail (só copia)'}
              </button>
              <button
                onClick={() => handleOutreach('linkedin')}
                disabled={!lead.linkedin && !lead.outreachMessage}
                title={lead.linkedin ? 'Copia a mensagem e abre o perfil do LinkedIn' : 'Sem LinkedIn cadastrado: só copia a mensagem'}
                className="flex-1 px-4 py-2 bg-blue-900 hover:bg-blue-950 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors text-sm"
              >
                {copiedChannel === 'linkedin' ? '✅ Copiado!' : lead.linkedin ? '🔗 LinkedIn' : '🔗 LinkedIn (só copia)'}
              </button>
              <button
                onClick={() => handleOutreach('whatsapp')}
                disabled={!lead.outreachMessage}
                title={lead.phone ? 'Copia a mensagem e abre o WhatsApp já no chat do contato' : 'Sem telefone cadastrado: só copia a mensagem'}
                className="flex-1 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors text-sm"
              >
                {copiedChannel === 'whatsapp' ? '✅ Copiado!' : lead.phone ? '💬 WhatsApp' : '💬 WhatsApp (só copia)'}
              </button>
              <button
                onClick={() => handleOutreach('instagram')}
                disabled={!lead.outreachMessage}
                className="flex-1 px-4 py-2 bg-pink-600 hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded transition-colors text-sm"
              >
                {copiedChannel === 'instagram' ? '✅ Copiado!' : '📷 Instagram'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
