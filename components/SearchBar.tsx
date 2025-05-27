
import React, { useState } from 'react';
import { SearchQuery } from '../types';
import { SEARCH_TYPES } from '../constants';

interface SearchBarProps {
  onSearch: (query: SearchQuery) => void;
  initialQuery: SearchQuery;
  setSearchQuery: React.Dispatch<React.SetStateAction<SearchQuery>>;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, initialQuery, setSearchQuery }) => {
  const [queryValue, setQueryValue] = useState(initialQuery.value);
  const [queryType, setQueryType] = useState<'NIT' | 'RAZON_SOCIAL' | 'RADICADO' | ''>(initialQuery.type);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!queryType) {
        alert("Por favor seleccione un tipo de búsqueda.");
        return;
    }
    const currentQuery = { type: queryType, value: queryValue };
    setSearchQuery(currentQuery);
    onSearch(currentQuery);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-6 bg-gray-700 rounded-lg shadow-md flex flex-col sm:flex-row items-center gap-4">
      <div className="flex-grow w-full sm:w-auto">
        <label htmlFor="searchType" className="sr-only">Tipo de Búsqueda</label>
        <select
          id="searchType"
          value={queryType}
          onChange={(e) => setQueryType(e.target.value as 'NIT' | 'RAZON_SOCIAL' | 'RADICADO')}
          className="w-full p-3 bg-gray-600 border border-gray-500 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        >
          <option value="" disabled>Seleccione tipo</option>
          {SEARCH_TYPES.map(st => <option key={st.value} value={st.value}>{st.label}</option>)}
        </select>
      </div>
      <div className="flex-grow w-full sm:w-auto">
        <label htmlFor="searchValue" className="sr-only">Valor de Búsqueda</label>
        <input
          id="searchValue"
          type="text"
          value={queryValue}
          onChange={(e) => setQueryValue(e.target.value)}
          placeholder="Ingrese el valor a buscar..."
          className="w-full p-3 bg-gray-600 border border-gray-500 rounded-md text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
        />
      </div>
      <button
        type="submit"
        className="w-full sm:w-auto p-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-md shadow-lg transform hover:scale-105 transition-all duration-150 ease-in-out"
      >
        <SearchIcon className="w-5 h-5 inline mr-2" />
        Buscar
      </button>
    </form>
  );
};

const SearchIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);
