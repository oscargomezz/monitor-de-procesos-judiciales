
import React, { useState, useEffect, useCallback } from 'react';
import { SearchBar } from './components/SearchBar';
import { ProcessCard } from './components/ProcessCard';
import { ProcessDetails } from './components/ProcessDetails';
import { LoadingSpinner } from './components/LoadingSpinner';
import { JudicialAction, Process, SearchQuery, UrgencyLevel } from './types';
import { fetchProcesses as apiFetchProcesses } from './services/judicialApiService';
import { summarizeText, classifyActionUrgency } from './services/geminiService';
import { LOCAL_STORAGE_KEY } from './constants';

const App: React.FC = () => {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcess, setSelectedProcess] = useState<Process | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<SearchQuery>({ type: 'RADICADO', value: '' });

  useEffect(() => {
    const storedProcesses = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (storedProcesses) {
      try {
        const parsedProcesses: Process[] = JSON.parse(storedProcesses);
        // Optional: Clear old data, e.g., older than 7 days
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const recentProcesses = parsedProcesses.filter(p => p.lastUpdated && p.lastUpdated > sevenDaysAgo);
        setProcesses(recentProcesses);
      } catch (e) {
        console.error("Failed to parse stored processes:", e);
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    // Always save the current state of processes, even if it's an empty array.
    // This ensures localStorage accurately reflects the app's state.
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(processes));
  }, [processes]);

  const handleSearch = async (query: SearchQuery) => {
    if (!query.value.trim()) {
      setError("Por favor ingrese un valor para la búsqueda.");
      return;
    }
    setIsLoading(true);
    setError(null);
    setSelectedProcess(null); 

    try {
      const fetchedProcesses = await apiFetchProcesses(query.value, query.type as 'NIT' | 'RAZON_SOCIAL' | 'RADICADO');
      
      const updatedProcesses = fetchedProcesses.map(newProc => {
        const existingProc = processes.find(p => p.numeroRadicado === newProc.numeroRadicado);
        if (existingProc) {
          const mergedActuaciones = newProc.actuaciones.map(newAct => {
            const existingAct = existingProc.actuaciones.find(ea => ea.id === newAct.id || ea.descripcion === newAct.descripcion); 
            return existingAct ? { ...newAct, ...existingAct, isSummarizing: false, isClassifying: false } : newAct;
          });
          return { ...newProc, actuaciones: mergedActuaciones, lastUpdated: Date.now() };
        }
        return { ...newProc, lastUpdated: Date.now() };
      });

      setProcesses(prevProcesses => {
        const prevWithoutFetched = prevProcesses.filter(pp => !updatedProcesses.some(up => up.numeroRadicado === pp.numeroRadicado));
        return [...prevWithoutFetched, ...updatedProcesses];
      });

      if (updatedProcesses.length === 0 && !error) { // Solo mostrar si no hubo otro error previo
        setError("No se encontraron procesos para los criterios de búsqueda. Verifique el número o intente más tarde.");
      }
    } catch (err) {
      console.error("Search error:", err);
      let displayError = "Error desconocido al buscar procesos. Por favor, inténtelo de nuevo.";
      if (err instanceof Error) {
        if (err.message.includes("404")) {
          displayError = `El servicio de la Rama Judicial no se encontró en la URL configurada (Error 404). Por favor, verifique la constante RAMA_JUDICIAL_BASE_URL y el endpoint en judicialApiService.ts. Detalles técnicos: ${err.message}`;
        } else {
          displayError = err.message;
        }
      }
      setError(displayError);
    } finally {
      setIsLoading(false);
    }
  };
  
  const updateProcessAction = useCallback(<K extends keyof JudicialAction>(
    processId: string,
    actionId: string,
    updates: Pick<JudicialAction, K> | Partial<JudicialAction>
  ) => {
    setProcesses(prevProcesses =>
      prevProcesses.map(p =>
        p.id === processId
          ? {
              ...p,
              actuaciones: p.actuaciones.map(a =>
                a.id === actionId ? { ...a, ...updates } : a
              ),
              lastUpdated: Date.now(),
            }
          : p
      )
    );
    setSelectedProcess(prevSelected => 
      prevSelected?.id === processId 
      ? {
          ...prevSelected,
          actuaciones: prevSelected.actuaciones.map(a => 
            a.id === actionId ? { ...a, ...updates } : a
          ),
        }
      : prevSelected
    );
  }, []);

  const handleGenerateSummary = async (processId: string, action: JudicialAction) => {
    updateProcessAction(processId, action.id, { isSummarizing: true });
    try {
      const summary = await summarizeText(action.descripcion);
      updateProcessAction(processId, action.id, { resumen: summary, isSummarizing: false });
    } catch (err) {
      console.error("Summary error:", err);
      updateProcessAction(processId, action.id, { resumen: "Error al generar resumen.", isSummarizing: false });
    }
  };

  const handleClassifyAction = async (processId: string, action: JudicialAction) => {
    updateProcessAction(processId, action.id, { isClassifying: true });
    try {
      const classificationResult = await classifyActionUrgency(action.descripcion);
      updateProcessAction(processId, action.id, {
        clasificacionUrgencia: classificationResult.clasificacion,
        justificacionUrgencia: classificationResult.justificacion,
        isClassifying: false,
      });
    } catch (err) {
      console.error("Classification error:", err);
      updateProcessAction(processId, action.id, {
        clasificacionUrgencia: UrgencyLevel.ERROR,
        justificacionUrgencia: "Error al clasificar.",
        isClassifying: false,
      });
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 flex flex-col items-center p-4">
      <header className="w-full max-w-5xl mb-8 text-center">
        <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
          Monitor de Procesos Judiciales
        </h1>
        <p className="text-gray-400 mt-2">
          Consulte, siga y analice procesos judiciales en Colombia con ayuda de IA.
        </p>
      </header>

      <main className="w-full max-w-5xl bg-gray-800 shadow-2xl rounded-lg p-6">
        <SearchBar onSearch={handleSearch} initialQuery={searchQuery} setSearchQuery={setSearchQuery} />

        {isLoading && <div className="flex justify-center my-8"><LoadingSpinner /></div>}
        {error && <p className="text-red-400 text-center my-4 p-3 bg-red-900/30 rounded-md">{error}</p>}

        {!isLoading && !error && !selectedProcess && processes.length > 0 && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {processes.map(proc => (
              <ProcessCard key={proc.id} process={proc} onSelectProcess={setSelectedProcess} />
            ))}
          </div>
        )}
        
        {!isLoading && processes.length === 0 && !error && searchQuery.value && !isLoading && ( // Evitar mostrar si está cargando
           <p className="text-gray-400 text-center my-8">No se encontraron procesos para "{searchQuery.value}". Intente con otros criterios.</p>
        )}

        {!isLoading && !error && selectedProcess && (
          <ProcessDetails
            process={selectedProcess}
            onBack={() => setSelectedProcess(null)}
            onSummarizeAction={handleGenerateSummary}
            onClassifyAction={handleClassifyAction}
          />
        )}
         {!isLoading && !searchQuery.value && processes.length === 0 && !error && ( // Evitar mostrar si hay error
           <p className="text-gray-400 text-center my-8">Ingrese un criterio de búsqueda para comenzar.</p>
        )}
      </main>
      <footer className="w-full max-w-5xl mt-8 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} Monitor de Procesos Judiciales. Potenciado por Gemini API.</p>
        <p className="text-xs mt-1">API Key para Gemini (process.env.API_KEY) debe estar configurada en el entorno.</p>
      </footer>
    </div>
  );
};

export default App;
