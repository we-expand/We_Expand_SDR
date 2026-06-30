import { useState } from 'react';

export default function ImportLeads({ onBack }) {
  const [mode, setMode] = useState('apollo'); // 'apollo' | 'linkedin'
  const [csv, setCsv] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleImport() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const endpoint = mode === 'apollo' ? '/api/import-apollo-csv' : '/api/import-linkedin-text';
      const body = mode === 'apollo' ? { csv } : { text };
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro desconhecido');
      setResult(data);
      setCsv('');
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const value = mode === 'apollo' ? csv : text;
  const setValue = mode === 'apollo' ? setCsv : setText;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Importar leads</h2>
          <p className="text-gray-600 mt-2">
            {mode === 'apollo'
              ? 'Exporte os resultados da sua busca no Apollo como CSV, abra o arquivo e cole o conteúdo aqui.'
              : 'Navegue normalmente no LinkedIn (sem bot), selecione e copie o texto de um perfil ou de uma lista de resultados de busca, e cole aqui.'}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
        >
          ← Voltar
        </button>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setMode('apollo')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${mode === 'apollo' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          CSV do Apollo
        </button>
        <button
          onClick={() => setMode('linkedin')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${mode === 'linkedin' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Texto do LinkedIn
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        Leads com o mesmo nome já existente no banco são atualizados automaticamente
        (cargo, empresa, etc.) em vez de duplicados. O cargo anterior fica guardado no histórico.
        {mode === 'linkedin' && ' A IA identifica nome, cargo, empresa, cidade e país a partir do texto colado — pode ser um perfil só ou vários de uma vez.'}
      </div>

      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={
          mode === 'apollo'
            ? 'First Name,Last Name,Title,Company,Person Linkedin Url,Email,Country&#10;Marina,Santos,CEO,Acme,...'
            : 'Cole aqui o texto copiado do perfil ou da página de resultados de busca do LinkedIn...'
        }
        className="w-full h-64 p-4 border border-gray-300 rounded-lg font-mono text-xs text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          ✅ {result.inserted} lead(s) novo(s), {result.updated} atualizado(s)
          {result.failed > 0 && `, ${result.failed} falharam`}.
        </div>
      )}

      <button
        id="import-submit-btn"
        onClick={handleImport}
        disabled={loading || !value.trim()}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {loading ? 'Importando...' : 'Importar leads'}
      </button>
    </div>
  );
}
