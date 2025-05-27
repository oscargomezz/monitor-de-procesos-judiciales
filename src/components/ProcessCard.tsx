
import React from 'react';
import { Process } from '../types';

interface ProcessCardProps {
  process: Process;
  onSelectProcess: (process: Process) => void;
}

export const ProcessCard: React.FC<ProcessCardProps> = ({ process, onSelectProcess }) => {
  return (
    <div 
      className="bg-gray-700 p-6 rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 cursor-pointer transform hover:-translate-y-1"
      onClick={() => onSelectProcess(process)}
    >
      <h3 className="text-xl font-semibold text-blue-400 mb-2 truncate" title={process.numeroRadicado}>
        {process.numeroRadicado}
      </h3>
      <p className="text-sm text-gray-300 mb-1"><span className="font-medium">Tipo:</span> {process.tipoProceso}</p>
      <p className="text-sm text-gray-300 mb-1 truncate" title={process.despacho}><span className="font-medium">Despacho:</span> {process.despacho}</p>
      <p className="text-sm text-gray-300 mb-1"><span className="font-medium">Demandante:</span> {process.demandante}</p>
      <p className="text-sm text-gray-300 mb-3"><span className="font-medium">Demandado:</span> {process.demandado}</p>
      <div className="flex justify-between items-center">
        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
            process.estadoActual === 'En trámite' ? 'bg-yellow-500 text-yellow-900' :
            process.estadoActual === 'Archivado' ? 'bg-gray-500 text-gray-100' :
            'bg-green-500 text-green-900' // Fallo, Terminado
          }`}>
          {process.estadoActual}
        </span>
        <span className="text-xs text-gray-400">{new Date(process.fechaRadicacion).toLocaleDateString()}</span>
      </div>
    </div>
  );
};
