import { useState } from 'react';

export default function SearchConfig({ onSearch }) {
  const [titles, setTitles] = useState([]);
  const [customTitle, setCustomTitle] = useState('');
  const [companyTypes, setCompanyTypes] = useState([]);
  const [locations, setLocations] = useState(['Mundo']);
  const [cities, setCities] = useState('');
  const [keyword, setKeyword] = useState('');
  const [combineMode, setCombineMode] = useState('AND');

  const titleOptions = [
    'Founder', 'Co-Founder', 'CEO', 'COO', 'CFO', 'CTO', 'CIO', 'CDO', 'CISO',
    'VP Engenharia', 'VP Tecnologia', 'VP Produto', 'VP TI',
    'Head de Produto', 'Head de Tecnologia', 'Head de TI', 'Head de Inovação', 'Head de Desenvolvimento',
    'Diretor de TI', 'Diretor de Tecnologia', 'Diretor de Produto', 'Diretor de Inovação',
    'Gerente de TI', 'Gerente de Tecnologia', 'Gerente de Produto', 'Gerente de Projetos',
    'Tech Lead', 'Engineering Manager', 'Product Manager', 'Scrum Master', 'Agile Coach',
    'Sócio', 'Proprietário', 'Gestor',
  ];
  const companyTypeOptions = [
    'Startup pré-seed',
    'Startup Série A',
    'PME',
    'Agência',
  ];
  const locationOptions = ['Mundo', 'Brasil', 'Portugal', 'EUA', 'Europa', 'Ásia'];

  const toggleTitle = (title) => {
    setTitles(t => t.includes(title) ? t.filter(x => x !== title) : [...t, title]);
  };

  const toggleCompanyType = (type) => {
    setCompanyTypes(t => t.includes(type) ? t.filter(x => x !== type) : [...t, type]);
  };

  const toggleLocation = (loc) => {
    if (loc === 'Mundo') {
      setLocations(l => l.includes('Mundo') ? [] : ['Mundo']);
    } else {
      setLocations(l => l.includes(loc) ? l.filter(x => x !== loc) : [...l, loc]);
    }
  };

  const handleSearch = () => {
    onSearch({
      titles,
      companyTypes,
      locations: locations.length === 0 ? ['Mundo'] : locations,
      cities: cities.split(',').map(c => c.trim()).filter(Boolean),
      keyword,
      combineMode,
    });
  };

  const selectedCount = titles.length + companyTypes.length + (cities.trim() ? 1 : 0) + (keyword.trim() ? 1 : 0);

  return (
    <div className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-gray-900 mb-8">Configurar busca de leads</h2>

      <div className="space-y-8">
        {/* Cargos */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">👤 Cargos desejados</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {titleOptions.map(title => (
              <label key={title} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={titles.includes(title)}
                  onChange={() => toggleTitle(title)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="ml-3 text-gray-700">{title}</span>
              </label>
            ))}
          </div>

          {/* Cargos customizados */}
          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ✏️ Adicionar cargo personalizado
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customTitle.trim()) {
                    const t = customTitle.trim();
                    if (!titles.includes(t)) setTitles(prev => [...prev, t]);
                    setCustomTitle('');
                  }
                }}
                placeholder="Ex: Superintendente, Coordenador de TI..."
                className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="button"
                onClick={() => {
                  const t = customTitle.trim();
                  if (t && !titles.includes(t)) setTitles(prev => [...prev, t]);
                  setCustomTitle('');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
            {titles.filter(t => !titleOptions.includes(t)).length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {titles.filter(t => !titleOptions.includes(t)).map(t => (
                  <span key={t} className="flex items-center gap-1 bg-blue-100 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full">
                    {t}
                    <button onClick={() => setTitles(prev => prev.filter(x => x !== t))} className="hover:text-red-600 ml-1">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tipo de empresa */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🏢 Tipo de empresa</h3>
          <div className="grid grid-cols-2 md:grid-cols-2 gap-3">
            {companyTypeOptions.map(type => (
              <label key={type} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={companyTypes.includes(type)}
                  onChange={() => toggleCompanyType(type)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="ml-3 text-gray-700">{type}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Localização */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">🌍 Localização</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {locationOptions.map(loc => (
              <label key={loc} className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={locations.includes(loc)}
                  onChange={() => toggleLocation(loc)}
                  className="w-5 h-5 text-blue-600 rounded"
                />
                <span className="ml-3 text-gray-700">{loc}</span>
              </label>
            ))}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              🏙️ Cidades (opcional, separe por vírgula)
            </label>
            <input
              type="text"
              value={cities}
              onChange={(e) => setCities(e.target.value)}
              placeholder="Ex: São Paulo, Lisboa, Austin"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Busca por palavra-chave (booleana) */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">🔎 Busca avançada (estilo LinkedIn)</h3>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder='Ex: founder AND (fintech OR "machine learning") NOT recruiter'
            className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-xs text-gray-500 mt-2">
            Use <code className="bg-gray-100 px-1 rounded">AND</code>, <code className="bg-gray-100 px-1 rounded">OR</code>, <code className="bg-gray-100 px-1 rounded">NOT</code>, parênteses e <code className="bg-gray-100 px-1 rounded">"frase exata"</code>. Busca em nome, cargo, empresa e sinais quentes.
          </p>
        </div>

        {/* Modo de combinação dos filtros */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">⚙️ Combinar filtros marcados acima</h3>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setCombineMode('AND')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm border transition-colors ${
                combineMode === 'AND'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              E (precisa bater em todos)
            </button>
            <button
              type="button"
              onClick={() => setCombineMode('OR')}
              className={`px-4 py-2 rounded-lg font-semibold text-sm border transition-colors ${
                combineMode === 'OR'
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              OU (basta bater em um)
            </button>
          </div>
        </div>

        {/* Info text */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p>💡 <strong>Dica:</strong> Você pode deixar em branco para buscar em todas as opções. Marque apenas se quiser filtrar.</p>
        </div>

        {/* Botão */}
        <button
          onClick={handleSearch}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-4 px-6 rounded-lg transition-all shadow-md hover:shadow-lg text-lg"
        >
          🔍 Gerar fila de leads
          {selectedCount > 0 && <span className="ml-2 bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">{selectedCount} filtros</span>}
        </button>
      </div>
    </div>
  );
}
