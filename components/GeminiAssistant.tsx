
import React, { useState } from 'react';
import { Asset } from '../types';
import { getAiSummary } from '../services/geminiService';

interface GeminiAssistantProps {
  assets: Asset[];
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ assets }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const predefinedQueries = [
    "Ktoré náradie potrebuje revíziu v najbližšom mesiaci?",
    "Zhrň celkový stav všetkého náradia.",
    "Aké sú najčastejšie dôvody nevyhovujúcich revízií?",
    "Vypíš náradie, ktoré má viac ako 2 roky.",
  ];

  const handleQuerySubmit = async (currentQuery: string) => {
    if (!currentQuery.trim()) return;

    setIsLoading(true);
    setResponse('');
    const aiResponse = await getAiSummary(assets, currentQuery);
    setResponse(aiResponse);
    setIsLoading(false);
  };
  
  const handleFormSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleQuerySubmit(query);
  }

  const handlePredefinedQueryClick = (predefinedQuery: string) => {
    setQuery(predefinedQuery);
    handleQuerySubmit(predefinedQuery);
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 bg-primary-600 text-white rounded-full p-4 shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-transform transform hover:scale-110"
        aria-label="AI Asistent"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.486 2 2 6.486 2 12s4.486 10 10 10 10-4.486 10-10S17.514 2 12 2zm2.293 15.707l-1.061-1.06L12.5 16l-.732.732-1.061 1.061-1.232-1.232 1.06-1.06L11.268 15l-.732-.732-2.242-2.242.732-.732L9.5 12.5l-1.182-.469-1.06-1.061 2.293-2.293 1.06 1.06L11 10.5l.732-.732 1.06-1.06 1.232 1.232-1.06 1.06L12.232 12l.732.732 2.242 2.242-.732.732L14.293 16l1.182.469 1.06 1.06-2.242 2.242zM12 8a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2A.5.5 0 0112 8zm0 8a.5.5 0 01.5.5v2a.5.5 0 01-1 0v-2a.5.5 0 01.5-.5z"/></svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-full max-w-md bg-white rounded-lg shadow-2xl flex flex-col h-[60vh]">
          <div className="flex justify-between items-center p-4 bg-primary-600 text-white rounded-t-lg">
            <h3 className="font-bold text-lg">AI Asistent</h3>
            <button onClick={() => setIsOpen(false)} className="text-white hover:text-primary-200">&times;</button>
          </div>
          <div className="flex-grow p-4 overflow-y-auto">
            {response ? (
                <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: response.replace(/\n/g, '<br />') }}></div>
            ) : isLoading ? (
                <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
            ) : (
                <div className="text-center text-gray-500">
                    <p className="mb-4">Opýtajte sa ma niečo na základe dát o vašom náradí.</p>
                    <div className="space-y-2">
                        {predefinedQueries.map(q => (
                            <button key={q} onClick={() => handlePredefinedQueryClick(q)} className="w-full text-left text-sm p-2 bg-gray-100 rounded-md hover:bg-gray-200 transition">
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}
          </div>
          <form onSubmit={handleFormSubmit} className="p-4 border-t flex items-center gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Zadajte svoju otázku..."
              className="flex-grow border rounded-lg py-2 px-3 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={isLoading}
            />
            <button type="submit" className="bg-primary-600 text-white p-2 rounded-lg hover:bg-primary-700 disabled:bg-primary-300" disabled={isLoading}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" /></svg>
            </button>
          </form>
        </div>
      )}
    </>
  );
};

export default GeminiAssistant;
