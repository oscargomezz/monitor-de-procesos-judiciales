
import React from 'react';
import { Process, JudicialAction } from '../types';
import { ActionItem } from './ActionItem';

interface ProcessDetailsProps {
  process: Process;
  onBack: () => void;
  onSummarizeAction: (processId: string, action: JudicialAction) => Promise<void>;
  onClassifyAction: (processId: string, action: JudicialAction) => Promise<void>;
}

export const ProcessDetails: React.FC<ProcessDetailsProps> = ({ process, onBack, onSummarizeAction, onClassifyAction }) => {
  return (
    <div className="mt-6 bg-gray-700 p-6 rounded-lg shadow-inner animate-fadeIn">
      <button
        onClick={onBack}
        className="mb-6 px-4 py-2 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-semibold rounded-md shadow-md transition-all duration-150 ease-in-out flex items-center"
      >
        <BackArrowIcon className="w-5 h-5 mr-2" />
        Volver a Resultados
      </button>

      <div className="mb-6 p-4 border border-gray-600 rounded-lg bg-gray-700">
        <h2 className="text-2xl font-bold text-blue-400 mb-3">{process.numeroRadicado}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <p><strong className="text-gray-300">Tipo Proceso:</strong> <span className="text-gray-200">{process.tipoProceso}</span></p>
          <p><strong className="text-gray-300">Despacho:</strong> <span className="text-gray-200">{process.despacho}</span></p>
          <p><strong className="text-gray-300">Demandante:</strong> <span className="text-gray-200">{process.demandante}</span></p>
          <p><strong className="text-gray-300">Demandado:</strong> <span className="text-gray-200">{process.demandado}</span></p>
          <p><strong className="text-gray-300">Fecha Radicación:</strong> <span className="text-gray-200">{new Date(process.fechaRadicacion).toLocaleDateString()}</span></p>
          <p><strong className="text-gray-300">Estado Actual:</strong> 
            <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${
                process.estadoActual === 'En trámite' ? 'bg-yellow-500 text-yellow-900' :
                process.estadoActual === 'Archivado' ? 'bg-gray-500 text-gray-100' :
                'bg-green-500 text-green-900'
              }`}>
              {process.estadoActual}
            </span>
          </p>
          {process.ponente && <p><strong className="text-gray-300">Ponente:</strong> <span className="text-gray-200">{process.ponente}</span></p>}
        </div>
      </div>

      <h3 className="text-xl font-semibold text-gray-100 mb-4">Actuaciones ({process.actuaciones.length})</h3>
      {process.actuaciones.length > 0 ? (
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          {process.actuaciones.sort((a,b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()).map(action => (
            <ActionItem
              key={action.id}
              action={action}
              onSummarize={() => onSummarizeAction(process.id, action)}
              onClassify={() => onClassifyAction(process.id, action)}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-400">No hay actuaciones registradas para este proceso.</p>
      )}
    </div>
  );
};

const BackArrowIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
);
