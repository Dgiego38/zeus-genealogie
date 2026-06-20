'use client';
import { useState, useRef, ChangeEvent } from 'react';

type Message = { id: number; role: 'user' | 'zeus'; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'zeus', content: 'Salutations. Je suis Zeus. Importez votre GEDCOM via le bouton en bas pour commencer notre exploration historique.' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [gedcomContent, setGedcomContent] = useState('');
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Nettoyage strict du texte (suppression des astérisques)
  const clean = (text: string) => text.replace(/\*\*/g, '').replace(/\*/g, '•');

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => setGedcomContent(e.target?.result as string);
    reader.readAsText(file);
    setMessages(prev => [...prev, { id: Date.now(), role: 'zeus', content: `Fichier ${file.name} chargé avec succès. Je suis prêt.` }]);
  };

  const askZeus = async () => {
    if (!input.trim() || !gedcomContent) return;
    setMessages(prev => [...prev, { id: Date.now(), role: 'user', content: input }]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gedcomContent, question: input }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'zeus', content: data.response }]);
    } catch {
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'zeus', content: "Une erreur est survenue lors de la consultation des archives." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-200 flex flex-col font-sans">
      
      {/* Header Minimaliste */}
      <header className="p-6 border-b border-white/5 bg-[#0a0a0a]/50 backdrop-blur-md sticky top-0 z-10">
        <h1 className="text-sm font-bold tracking-widest text-center text-gray-500 uppercase">Zeus Généalogie</h1>
      </header>

      {/* Zone de Chat */}
      <div className="flex-grow overflow-y-auto p-6 space-y-8 max-w-2xl mx-auto w-full mb-32">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${m.role === 'user' ? 'bg-sky-600/10 border border-sky-500/20 text-sky-100' : 'text-gray-300'}`}>
              {clean(m.content)}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-xs text-gray-600 animate-pulse px-4">Zeus analyse...</div>}
      </div>

      {/* Footer : Zone de contrôle tout-en-un */}
      <footer className="fixed bottom-0 w-full p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
        <div className="max-w-2xl mx-auto space-y-2">
          {/* Indicateur de fichier */}
          {fileName && <div className="text-[10px] text-sky-500 uppercase tracking-widest px-2">Actif: {fileName}</div>}
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2 flex items-center shadow-2xl backdrop-blur-xl">
            {/* Bouton Fichier */}
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-400 hover:text-white transition"
              title="Importer GEDCOM"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
            </button>
            
            {/* Input Texte */}
            <input 
              className="flex-grow bg-transparent p-3 outline-none text-sm placeholder:text-gray-700" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askZeus()}
              placeholder="Poser une question..."
            />
            
            {/* Bouton Envoyer */}
            <button onClick={askZeus} className="p-3 text-sky-500 hover:text-sky-300 transition">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      </footer>

      {/* Input fichier caché */}
      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".ged" className="hidden" />
    </main>
  );
}pu