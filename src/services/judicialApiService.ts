
import { Process, JudicialAction, UrgencyLevel } from '../types';
import { RAMA_JUDICIAL_BASE_URL } from '../constants';

// Interfaces para tipar la respuesta esperada de la API (suposiciones)
interface ApiSujetoProcesal {
  tipo: string; // Ej: "DEMANDANTE", "DEMANDADO"
  nombre: string;
  // ... otros campos que pueda tener
}

interface ApiJudicialAction {
  id: string | number; // O algún identificador único de la actuación en la API
  fechaActuacion: string; // Formato ISO Date String
  tipoActuacion: string; // Ej: "AUTO", "MEMORIAL"
  anotacion: string; // Descripción de la actuación
  // ... otros campos
}

interface ApiProcess {
  idProceso: string | number; // O algún identificador único del proceso en la API
  numero: string; // Número de radicado de 23 dígitos
  despachoActual?: string; // Nombre del despacho
  departamento?: string; // Podría estar en otro campo o concatenado
  claseProceso?: string; // Tipo de proceso
  sujetosProcesales?: ApiSujetoProcesal[];
  fechaRadicacion: string; // Formato ISO Date String
  estadoActual?: string; // Estado del proceso
  actuaciones?: ApiJudicialAction[];
  ponente?: string;
  // ... otros campos que la API pueda devolver
}

const mapApiActuacionesToJudicialActions = (
  apiActuaciones: ApiJudicialAction[] | undefined,
  processId: string
): JudicialAction[] => {
  if (!apiActuaciones) return [];
  return apiActuaciones.map((act, index) => ({
    id: String(act.id || `act-${processId}-${index}-${new Date(act.fechaActuacion).getTime()}`), // Usar ID de API si existe, sino generar uno
    fecha: act.fechaActuacion,
    descripcion: act.anotacion,
    tipo: act.tipoActuacion,
    // Los campos de IA (resumen, clasificacionUrgencia) se llenarán después
    clasificacionUrgencia: UrgencyLevel.PENDIENTE, 
    isSummarizing: false,
    isClassifying: false,
  }));
};

const mapApiResponseToProcesses = (apiData: any): Process[] => {
  // La API podría devolver un solo objeto o un array. Lo normalizamos a array.
  // La estructura real de la respuesta de la Rama Judicial a veces es { procesos: [...] }
  const rawProcesses: ApiProcess[] = Array.isArray(apiData?.procesos) ? apiData.procesos : 
                                     Array.isArray(apiData) ? apiData : 
                                     (apiData?.procesos ? [apiData.procesos] : (apiData ? [apiData] : []));


  return rawProcesses.map((proc): Process => {
    const numeroRadicado = proc.numero; 

    let demandante = 'No disponible';
    let demandado = 'No disponible';

    if (proc.sujetosProcesales && Array.isArray(proc.sujetosProcesales)) {
      const demandanteSujeto = proc.sujetosProcesales.find(
        (s) => s.tipo?.toUpperCase().includes('DEMANDANTE') || s.tipo?.toUpperCase().includes('ACCIONANTE')
      );
      if (demandanteSujeto) demandante = demandanteSujeto.nombre;

      const demandadoSujeto = proc.sujetosProcesales.find(
        (s) => s.tipo?.toUpperCase().includes('DEMANDADO') || s.tipo?.toUpperCase().includes('ACCIONADO')
      );
      if (demandadoSujeto) demandado = demandadoSujeto.nombre;
    }
    
    return {
      id: numeroRadicado, 
      numeroRadicado: numeroRadicado,
      despacho: proc.despachoActual || 'No disponible',
      ponente: proc.ponente,
      tipoProceso: proc.claseProceso || 'No disponible',
      demandante: demandante,
      demandado: demandado,
      fechaRadicacion: proc.fechaRadicacion,
      estadoActual: proc.estadoActual || 'No disponible',
      actuaciones: mapApiActuacionesToJudicialActions(proc.actuaciones, numeroRadicado),
      lastUpdated: Date.now(),
    };
  });
};

export const fetchProcesses = async (
  queryValue: string,
  queryType: 'NIT' | 'RAZON_SOCIAL' | 'RADICADO'
): Promise<Process[]> => {
  if (!queryValue.trim()) {
    return [];
  }

  if (queryType === 'RADICADO') {
    const endpoint = `${RAMA_JUDICIAL_BASE_URL}/Procesos/ConsultaPublicaProcesos`; // Endpoint tentativo para POST
    
    console.log(`Fetching from real API (POST): ${endpoint}`);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ numeroRadicado: queryValue }) // Cuerpo de la solicitud tentativo
      });

      if (!response.ok) {
        let errorMessage = `Error en la API: ${response.status} ${response.statusText}. URL: ${endpoint}`;
        let errorBodyText = "No se pudo leer el cuerpo del error de la API.";
        try {
          errorBodyText = await response.text();
          if (response.headers.get("content-type")?.includes("application/json")) {
            const errorJson = JSON.parse(errorBodyText);
            errorMessage += ` - Detalles: ${errorJson.message || JSON.stringify(errorJson)}`;
          } else {
            errorMessage += ` - Respuesta (no JSON): ${errorBodyText.substring(0, 500)}...`;
          }
        } catch (e) {
           errorMessage += ` - Cuerpo de respuesta parcial: ${errorBodyText.substring(0, 500)}...`;
        }
        console.error(errorMessage);
        throw new Error(errorMessage);
      }

      const responseText = await response.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error(`Respuesta de API no es JSON válido. URL: ${endpoint}. Respuesta: ${responseText.substring(0, 500)}...`);
        throw new Error(`Respuesta de API no es JSON válido. Ver consola para detalles. URL: ${endpoint}`);
      }
      
      // Esperamos que 'data' contenga la lista de procesos o un objeto con una propiedad 'procesos'
      return mapApiResponseToProcesses(data);

    } catch (error) { 
      if (error instanceof Error) {
        console.error('Error al obtener procesos judiciales reales:', error.message);
        throw error; 
      } else {
        console.error('Error desconocido al obtener procesos judiciales reales:', error);
        throw new Error('Error desconocido al conectar con la API judicial.');
      }
    }
  } else if (queryType === 'NIT' || queryType === 'RAZON_SOCIAL') {
    console.warn(`La búsqueda por ${queryType} aún no está implementada para la API real. Se requiere conocer el endpoint y parámetros específicos.`);
    return Promise.resolve([]);
  } else {
    console.warn(`Tipo de búsqueda desconocido: ${queryType}`);
    return Promise.resolve([]);
  }
};