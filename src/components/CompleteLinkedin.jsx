import { useEffect, useState } from 'react';
import { apiUrl } from '../lib/apiUrl';

function searchUrl(lead) {
  const query = [lead.name, lead.company].filter(Boolean).join(' ');
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
}

export default function CompleteLinkedin({ onBack }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(apiUrl('/api/leads?missing_linkedin=1'));
      const data = await res.json();
      setLeads(data.leads || []);
    } catch {
      setError('Falha ao carregar leads');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave(id) {
    const url = (drafts[id] || '').trim();
    if (!url) return;
    setSavingId(id);
    try {
      const res = await fetch(apiUrl('/api/leads'), {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, linkedin_url: url }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao salvar');
      setLeads(prev => prev.filter(l => l.id !== id));
      setDrafts(prev => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch (err) {
      window.alert(err.message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Completar links do LinkedIn</h2>
          <p className="text-gray-600 mt-2">
            {loading ? 'Carregando...' : `${leads.length} lead(s) sem link de LinkedIn cadastrado.`}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
        >
          ← Voltar
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        Não temos como buscar isso automaticamente (não fazemos scraping/bot no LinkedIn). Clique em
        "🔍 Buscar no LinkedIn" pra abrir a busca já com o nome preenchido, copie a URL do perfil certo e cole no
        campo ao lado — o lead some da lista assim que salvar.
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">{error}</div>
      )}

      {!loading && leads.length === 0 && !error && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center text-green-800">
          ✅ Todos os leads já têm link de LinkedIn.
        </div>
      )}

      <div className="space-y-3">
        {leads.map(lead => (
          <div key={lead.id} className="bg-white rounded-lg shadow-sm p-4 flex flex-wrap items-center gap-3">
            <div className="min-w-48 flex-1">
              <p className="font-semibold text-gray-900">{lead.name}</p>
              <p className="text-xs text-gray-500">{lead.title || '—'} {lead.company ? `· ${lead.company}` : ''}</p>
            </div>
            <a
              href={searchUrl(lead)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-lg whitespace-nowrap"
            >
              🔍 Buscar no LinkedIn
            </a>
            <input
              type="text"
              placeholder="Cole a URL do perfil aqui..."
              value={drafts[lead.id] || ''}
              onChange={(e) => setDrafts(prev => ({ ...prev, [lead.id]: e.target.value }))}
              className="flex-1 min-w-64 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <button
              onClick={() => handleSave(lead.id)}
              disabled={!drafts[lead.id]?.trim() || savingId === lead.id}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
            >
              {savingId === lead.id ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
