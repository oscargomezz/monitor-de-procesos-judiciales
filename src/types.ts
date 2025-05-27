
export enum UrgencyLevel {
  ALTA = 'Alta',
  MEDIA = 'Media',
  BAJA = 'Baja',
  PENDIENTE = 'Pendiente',
  ERROR = 'Error',
}

export interface JudicialAction {
  id: string;
  fecha: string;
  descripcion: string;
  tipo?: string;
  resumen?: string;
  clasificacionUrgencia?: UrgencyLevel;
  justificacionUrgencia?: string;
  isSummarizing?: boolean;
  isClassifying?: boolean;
}

export interface Process {
  id: string; 
  numeroRadicado: string;
  despacho: string;
  ponente?: string;
  tipoProceso: string;
  demandante: string;
  demandado: string;
  fechaRadicacion: string;
  estadoActual: string;
  actuaciones: JudicialAction[];
  lastUpdated: number; // Timestamp for local storage management
}

export interface SearchQuery {
  type: 'NIT' | 'RAZON_SOCIAL' | 'RADICADO' | '';
  value: string;
}

export interface ClassificationResponse {
  clasificacion: UrgencyLevel;
  justificacion: string;
}
