'use client';
import { useState, useRef, ChangeEvent } from 'react';

type Message = { id: number; role: 'user' | 'zeus'; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, role: 'zeus', content: 'Salutations. Je suis Zeus. Importez votre GEDCOM pour commencer notre exploration historique.' }
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
    setMessages(prev => [...prev, { id: Date.now(), role: 'zeus', content: `Fichier ${file.name} chargé. Je suis prêt.` }]);
  };

  const askZeus = async () => {
    // Condition supprimée : on envoie la question même sans GEDCOM
    if (!input.trim()) return;
    
    const newUserMessage = { id: Date.now(), role: 'user' as const, content: input };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          gedcomContent: gedcomContent || null, // On envoie null si rien n'est chargé
          messages: updatedMessages 
        }),
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
    <main className="main-wrapper">
      <header className="app-header">
        <h1 className="header-title">Zeus Généalogie</h1>
      </header>

      <div className="chat-container">
        {messages.map((m) => (
          <div key={m.id} className={`bubble ${m.role === 'user' ? 'user-msg' : 'zeus-msg'}`}>
            {clean(m.content)}
          </div>
        ))}
        {isLoading && <p className="bubble zeus-msg">Zeus consulte les archives...</p>}
      </div>

      <footer className="footer-dock">
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: '600px' }}>
          {fileName && <p className="file-info">Fichier actif : {fileName}</p>}
          <div className="dock-inner">
            <button className="file-btn" onClick={() => fileInputRef.current?.click()}>+</button>
            <input 
              className="text-input"
              value={input} 
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && askZeus()}
              placeholder="Poser une question..."
            />
            <button className="send-btn" onClick={askZeus}>Envoyer</button>
          </div>
        </div>
      </footer>

      <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".ged" className="hidden" />
    </main>
  );
}