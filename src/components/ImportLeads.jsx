import { useState } from 'react';
import { apiUrl } from '../lib/apiUrl';

export default function ImportLeads({ onBack }) {
  const [mode, setMode] = useState('apollo'); // 'apollo' | 'linkedin' | 'connections'
  const [csv, setCsv] = useState('');
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const [connectionsCsv, setConnectionsCsv] = useState(null);
  const [connectionsFileName, setConnectionsFileName] = useState('');
  const [progress, setProgress] = useState(null); // { processed, total }

  async function handleImport() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const endpoint = apiUrl(mode === 'apollo' ? '/api/import-apollo-csv' : '/api/import-linkedin-text');
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

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setConnectionsFileName(file.name);
    setResult(null);
    setError(null);
    setProgress(null);
    const text = await file.text();
    setConnectionsCsv(text);
  }

  async function handleImportConnections() {
    if (!connectionsCsv) return;
    setLoading(true);
    setError(null);
    setResult(null);

    let offset = 0;
    let done = false;
    let totalProcessed = 0;
    let totalFailed = 0;
    let total = 0;

    try {
      while (!done) {
        const res = await fetch(apiUrl('/api/import-linkedin-connections'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ csv: connectionsCsv, offset }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erro desconhecido');

        totalProcessed += data.processed;
        totalFailed += data.failed;
        total = data.total;
        offset = data.nextOffset;
        done = data.done;
        setProgress({ processed: offset, total });
      }
      setResult({ inserted: totalProcessed, updated: 0, failed: totalFailed, connectionsMode: true });
      setConnectionsCsv(null);
      setConnectionsFileName('');
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
            {mode === 'apollo' && 'Exporte os resultados da sua busca no Apollo como CSV, abra o arquivo e cole o conteúdo aqui.'}
            {mode === 'linkedin' && 'Navegue normalmente no LinkedIn (sem bot), selecione e copie o texto de um perfil ou de uma lista de resultados de busca, e cole aqui.'}
            {mode === 'connections' && 'Envie o arquivo Connections.csv do export oficial do LinkedIn (Configurações → Privacidade de dados → Obter cópia dos dados → Conexões).'}
          </p>
        </div>
        <button
          onClick={onBack}
          className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
        >
          ← Voltar
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
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
        <button
          onClick={() => setMode('connections')}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${mode === 'connections' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
        >
          Conexões do LinkedIn (CSV)
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        Leads com o mesmo nome já existente no banco são atualizados automaticamente
        (cargo, empresa, etc.) em vez de duplicados. O cargo anterior fica guardado no histórico.
        {mode === 'linkedin' && ' A IA identifica nome, cargo, empresa, cidade e país a partir do texto colado — pode ser um perfil só ou vários de uma vez.'}
        {mode === 'connections' && ' Suas conexões entram como leads sem score/mensagem ainda — use "Analisar com IA" em cada uma quando quiser priorizar, ou filtre por cargo/empresa antes.'}
      </div>

      {mode !== 'connections' && (
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
      )}

      {mode === 'connections' && (
        <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
          <input
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="block mx-auto text-sm text-gray-700"
          />
          {connectionsFileName && (
            <p className="mt-3 text-sm text-gray-600">Arquivo selecionado: {connectionsFileName}</p>
          )}
        </div>
      )}

      {progress && mode === 'connections' && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, (progress.processed / progress.total) * 100)}%` }}
            />
          </div>
          <p className="text-sm text-gray-600">
            {progress.processed} de {progress.total} conexões processadas...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-sm text-green-800">
          {result.connectionsMode
            ? `✅ ${result.inserted} conexão(ões) importada(s)${result.failed > 0 ? `, ${result.failed} falharam` : ''}.`
            : `✅ ${result.inserted} lead(s) novo(s), ${result.updated} atualizado(s)${result.failed > 0 ? `, ${result.failed} falharam` : ''}.`}
        </div>
      )}

      <button
        id="import-submit-btn"
        onClick={mode === 'connections' ? handleImportConnections : handleImport}
        disabled={loading || (mode === 'connections' ? !connectionsCsv : !value.trim())}
        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
      >
        {loading ? 'Importando...' : 'Importar leads'}
      </button>
    </div>
  );
}
