import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { gedcomContent, question } = await req.json();

    if (!gedcomContent || !question) {
      return NextResponse.json({ response: "Données manquantes." }, { status: 400 });
    }

    // 1. FILTRE ET NETTOYAGE PROFOND
    const lines = gedcomContent.split('\n');
    const keywords = question.toLowerCase().match(/\b\w{4,}\b/g) || [];
    
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

    // 2. APPEL API AVEC MODE DUAL (Discussion vs Archivage)
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
            content: `Tu es Zeus, archiviste royal. Tu as deux modes :
1. MODE DISCUSSION : Si l'utilisateur salue ou pose une question générale, réponds de manière humaine, courtoise et naturelle.
2. MODE ARCHIVAGE : Si l'utilisateur pose une question sur une personne ou un événement précis, réponds UNIQUEMENT via ce format strict :

👑 IDENTITÉ
[Nom, Titres]

⛓️ LIGNÉE
- Père : [Nom]
- Mère : [Nom]
- Enfants : [Noms]

📅 CHRONOLOGIE
- [Date] : [Événement]

RÈGLES ARCHIVAGE :
- Pas d'introduction, pas de texte narratif.
- Pas de gras, pas d'astérisques.
- Si une info est absente, écris "Non documenté".`
          },
          {
            role: "user",
            content: `Archives : ${cleanSnippet}
Question : ${question}`
          }
        ],
        temperature: 0.2,
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