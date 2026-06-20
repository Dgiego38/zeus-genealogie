import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    // On reçoit désormais le tableau complet 'messages' au lieu d'une simple 'question'
    const { gedcomContent, messages } = await req.json();

    if (!gedcomContent || !messages || messages.length === 0) {
      return NextResponse.json({ response: "Données manquantes." }, { status: 400 });
    }

    // Récupère la dernière question posée par l'utilisateur
    const lastMessage = messages[messages.length - 1].content;

    // 1. FILTRE ET NETTOYAGE PROFOND
    const lines = gedcomContent.split('\n');
    const keywords = lastMessage.toLowerCase().match(/\b\w{4,}\b/g) || [];
    
    let snippetLines = lines.filter((line: string) => 
      (keywords.some((kw: string) => line.toLowerCase().includes(kw)) || keywords.length === 0)
      && line.trim().length > 0
    );

    const snippet = (snippetLines.length > 0 ? snippetLines : lines.slice(0, 40))
      .slice(0, 40)
      .join('\n');

    const cleanSnippet = snippet
      .replace(/@\w+@/g, '')
      .replace(/\d\s\w{3,4}\s/g, '') 
      .replace(/INDI|FAM|SOUR|EVEN|BIRT|DEAT/g, '');

    // 2. APPEL API AVEC HISTORIQUE COMPLET
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Tu es un assistant archiviste.
1. MODE DISCUSSION : Si l'utilisateur salue ou pose une question générale, réponds de manière courte et naturelle en DEUX PHRASES MAXIMUM. Pas d'analyse pédagogique, pas de jeu de rôle.
2. MODE ARCHIVAGE : Si la question concerne une personne ou un fait dans les archives, réponds UNIQUEMENT via ce format strict, sans aucune phrase d'introduction :

👑 IDENTITÉ
[Nom, Titres]

⛓️ LIGNÉE
- Père : [Nom]
- Mère : [Nom]
- Enfants : [Noms]

📅 CHRONOLOGIE
- [Date] : [Événement]

RÈGLES D'OR :
- Si MODE ARCHIVAGE, toute phrase hors format est interdite.
- Pas de gras, pas d'astérisques, pas de souligné.
- Si info absente : "Non documenté".`
          },
          // On injecte l'historique de la conversation pour la mémoire
          ...messages.map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.role === 'zeus' ? m.content : `Archives : ${cleanSnippet}\nQuestion : ${m.content}`
          })),
        ],
        temperature: 0.1,
      }),
    });

    const data = await response.json();

    if (data.error) {
      console.error("Erreur API Groq:", data.error);
      return NextResponse.json({ response: "L'Olympe est surchargé." }, { status: 500 });
    }

    return NextResponse.json({ response: data.choices[0].message.content });

  } catch (error) {
    console.error("Erreur Backend:", error);
    return NextResponse.json({ response: "L'Olympe est en travaux." }, { status: 500 });
  }
}