import { useState } from 'react';
import SearchConfig from './components/SearchConfig';
import LeadQueue from './components/LeadQueue';
import ImportLeads from './components/ImportLeads';
import { mockLeads } from './data/mockLeads';
import { matchesBooleanQuery } from './lib/booleanSearch';
import { normalizeDbLead } from './lib/leadAdapter';
import { apiUrl } from './lib/apiUrl';

function App() {
  const [screen, setScreen] = useState('config'); // 'config' | 'queue' | 'import'
  const [criteria, setCriteria] = useState(null);
  const [filteredLeads, setFilteredLeads] = useState([]);
  const [loadingRealLeads, setLoadingRealLeads] = useState(false);

  const handleViewRealLeads = async () => {
    setLoadingRealLeads(true);
    setCriteria(null);
    try {
      const res = await fetch(apiUrl('/api/leads'));
      const data = await res.json();
      setFilteredLeads((data.leads || []).map(normalizeDbLead));
    } catch {
      setFilteredLeads([]);
    } finally {
      setLoadingRealLeads(false);
      setScreen('queue');
    }
  };

  const handleSearch = (searchCriteria) => {
    setCriteria(searchCriteria);
    const specificLocations = searchCriteria.locations.filter(loc => loc !== 'Mundo');
    const combineMode = searchCriteria.combineMode || 'AND';

    const cities = searchCriteria.cities || [];

    const filtered = mockLeads.filter(lead => {
      const titleMatch = searchCriteria.titles.some(t => lead.title.toLowerCase().includes(t.toLowerCase()));
      const companyTypeMatch = searchCriteria.companyTypes.includes(lead.companyType);
      const locationMatch = specificLocations.some(loc => lead.country.toLowerCase().includes(loc.toLowerCase()));
      const cityMatch = cities.some(c => (lead.city || '').toLowerCase().includes(c.toLowerCase()));

      const activeGroupMatches = [];
      if (searchCriteria.titles.length) activeGroupMatches.push(titleMatch);
      if (searchCriteria.companyTypes.length) activeGroupMatches.push(companyTypeMatch);
      if (specificLocations.length) activeGroupMatches.push(locationMatch);
      if (cities.length) activeGroupMatches.push(cityMatch);

      const groupsOverall = activeGroupMatches.length === 0
        ? true
        : combineMode === 'OR'
          ? activeGroupMatches.some(Boolean)
          : activeGroupMatches.every(Boolean);

      const haystack = [lead.name, lead.title, lead.company, lead.companyType, lead.country, ...lead.hotSignals].join(' ');
      const keywordMatch = matchesBooleanQuery(haystack, searchCriteria.keyword);

      return groupsOverall && keywordMatch;
    });

    setFilteredLeads(filtered);
    setScreen('queue');
  };

  const handleBackToConfig = () => {
    setScreen('config');
  };

  const handleLeadUpdated = (updatedLead) => {
    setFilteredLeads(prev => prev.map(l => (l.id === updatedLead.id ? updatedLead : l)));
  };

  const handleLeadDeleted = (deletedId) => {
    setFilteredLeads(prev => prev.filter(l => l.id !== deletedId));
  };

  const handleLeadsBulkDeleted = (deletedIds) => {
    const idSet = new Set(deletedIds);
    setFilteredLeads(prev => prev.filter(l => !idSet.has(l.id)));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">🚀 We Expand SDR</h1>
            <p className="text-sm text-gray-600 mt-1">Fila inteligente de leads quentes</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setScreen('config')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${screen === 'config' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Buscar (demo)
            </button>
            <button
              onClick={() => setScreen('import')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${screen === 'import' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
            >
              Importar leads
            </button>
            <button
              onClick={handleViewRealLeads}
              disabled={loadingRealLeads}
              className="px-4 py-2 text-sm font-semibold rounded-lg transition-colors bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-60"
            >
              {loadingRealLeads ? 'Carregando...' : 'Meus leads'}
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {screen === 'config' && <SearchConfig onSearch={handleSearch} />}
        {screen === 'import' && <ImportLeads onBack={handleBackToConfig} />}
        {screen === 'queue' && (
          <LeadQueue
            leads={filteredLeads}
            criteria={criteria}
            onBack={handleBackToConfig}
            onLeadUpdated={handleLeadUpdated}
            onLeadDeleted={handleLeadDeleted}
            onLeadsBulkDeleted={handleLeadsBulkDeleted}
          />
        )}
      </div>
    </div>
  );
}

export default App;
