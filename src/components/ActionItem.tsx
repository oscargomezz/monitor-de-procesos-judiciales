
import React from 'react';
import { JudicialAction, UrgencyLevel } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

interface ActionItemProps {
  action: JudicialAction;
  onSummarize: () => void;
  onClassify: () => void;
}

export const ActionItem: React.FC<ActionItemProps> = ({ action, onSummarize, onClassify }) => {
  const getUrgencyColor = (level?: UrgencyLevel) => {
    switch (level) {
      case UrgencyLevel.ALTA: return 'bg-red-500 text-red-100';
      case UrgencyLevel.MEDIA: return 'bg-yellow-500 text-yellow-900';
      case UrgencyLevel.BAJA: return 'bg-green-500 text-green-100';
      case UrgencyLevel.ERROR: return 'bg-gray-600 text-gray-300';
      default: return 'bg-gray-500 text-gray-200';
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-md border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="text-sm font-semibold text-blue-300">{action.tipo || 'Actuación'}</p>
          <p className="text-xs text-gray-400">{new Date(action.fecha).toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        {action.clasificacionUrgencia && action.clasificacionUrgencia !== UrgencyLevel.PENDIENTE && (
          <span title={action.justificacionUrgencia} className={`px-3 py-1 text-xs font-bold rounded-full ${getUrgencyColor(action.clasificacionUrgencia)}`}>
            {action.clasificacionUrgencia}
          </span>
        )}
      </div>
      <p className="text-sm text-gray-200 mb-3 leading-relaxed">{action.descripcion}</p>

      {action.resumen && (
        <div className="my-3 p-3 bg-gray-700 rounded-md border border-gray-600">
          <h4 className="text-xs font-semibold text-purple-300 mb-1">Resumen IA:</h4>
          <p className="text-xs text-gray-300 italic">{action.resumen}</p>
        </div>
      )}
      
      {action.clasificacionUrgencia && action.clasificacionUrgencia !== UrgencyLevel.PENDIENTE && action.justificacionUrgencia && (
         <div className="my-3 p-3 bg-gray-700 rounded-md border border-gray-600">
          <h4 className="text-xs font-semibold text-purple-300 mb-1">Justificación Urgencia IA:</h4>
          <p className="text-xs text-gray-300 italic">{action.justificacionUrgencia}</p>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mt-3">
        <button
          onClick={onSummarize}
          disabled={action.isSummarizing}
          className="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center"
        >
          {action.isSummarizing ? <LoadingSpinner size="sm" /> : <FileTextIcon className="w-4 h-4 mr-1.5" />}
          {action.resumen ? 'Re-Resumir' : 'Resumir'}
        </button>
        <button
          onClick={onClassify}
          disabled={action.isClassifying}
          className="px-3 py-1.5 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50 flex items-center"
        >
          {action.isClassifying ? <LoadingSpinner size="sm" /> : <TagIcon className="w-4 h-4 mr-1.5" />}
          {action.clasificacionUrgencia && action.clasificacionUrgencia !== UrgencyLevel.PENDIENTE ? 'Re-Clasificar' : 'Clasificar Urgencia'}
        </button>
      </div>
    </div>
  );
};

const FileTextIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);

const TagIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
  </svg>
);

