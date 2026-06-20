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
      setMessages(prev => [...prev, { id: Date.now() + 1, role: 'zeus', content: "L'Olympe est indisponible." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#F0F2F5] text-gray-800 flex flex-col font-sans">
      
      {/* Header Glass */}
      <header className="p-4 bg-white/70 backdrop-blur-xl border-b border-white/50 sticky top-0 z-10 text-center">
        <h1 className="text-xs font-semibold tracking-[0.2em] text-gray-400 uppercase">Zeus Généalogie</h1>
      </header>

      {/* Zone de Chat */}
      <div className="flex-grow overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full mb-32">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[85%] px-5 py-3 rounded-[24px] text-[15px] shadow-sm
              ${m.role === 'user' 
                ? 'bg-[#007AFF] text-white rounded-br-lg' 
                : 'bg-white text-gray-800 rounded-bl-lg border border-gray-100'}
            `}>
              {clean(m.content)}
            </div>
          </div>
        ))}
        {isLoading && <div className="text-[12px] text-gray-400 px-6 animate-pulse">Zeus consulte les archives...</div>}
      </div>

      {/* Footer Glass - La "Dock" style Apple */}
      <footer className="fixed bottom-0 w-full p-6 bg-transparent">
        <div className="max-w-2xl mx-auto space-y-3">
          {fileName && <div className="text-[10px] font-medium text-[#007AFF] uppercase tracking-wider px-2">Fichier actif : {fileName}</div>}
          
          <div className="bg-white/80 backdrop-blur-2xl border border-white/50 rounded-[30px] p-2 flex items-center shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-3 text-gray-500 hover:text-[#007AFF] transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 4v16m8-8H4" /></svg>
            </button>
            
            <input 
              className="flex-grow bg-transparent p-3 outline-none text-[15px] placeholder:text-gray-400" 
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askZeus()}
              placeholder="Poser une question..."
            />
            
            <button onClick={askZeus} className="p-3 bg-[#007AFF] text-white rounded-full hover:bg-blue-600 transition-all">
              <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </div>
      </footer>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".ged" className="hidden" />
    </main>
  );
}