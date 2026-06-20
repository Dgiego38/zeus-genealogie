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
    
    let snippet = lines.filter((line: string) => 
      keywords.some((kw: string) => line.toLowerCase().includes(kw))
    ).join('\n');

    if (!snippet) snippet = lines.slice(0, 100).join('\n');

    const cleanSnippet = snippet
      .replace(/@\w+@/g, '')
      .replace(/\d\s\w{3,4}\s/g, '') 
      .replace(/INDI|FAM|SOUR|EVEN|BIRT|DEAT/g, '');

    // 2. APPEL API AVEC PROMPT ÉRUDIT
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
            content: `Tu es Zeus, l'archiviste royal. Ta mission est de rédiger des synthèses généalogiques élégantes à partir d'archives brutes.

RÈGLES D'OR :
- AUCUN astérisque (*), gras (**), ou souligné.
- PAS de codes techniques (ex: @I12@, INDI). 
- Utilise exclusivement les emojis suivants : 👑 (Identité), ⛓️ (Lignée), 📅 (Chronologie).
- Rédige sous forme de paragraphes narratifs suivis de listes claires avec des tirets (-).
- Si l'information est absente, sois honnête et reste formel.
- Ton ton : majestueux, précis, érudit.
- GÉNÉRATION D'ARBRE : Pour chaque demande sur une personne, tu DOIS créer un schéma ASCII simple sous la section "⛓️ Arbre généalogique" :
   Père --- Mère
         |
      ENFANT
         |
   ------|------
   Frère   Soeur`
          },
          {
            role: "user",
            content: `Voici les archives nettes extraites du registre :
            ${cleanSnippet}

            Question : ${question}
            
            Réponds en suivant strictement les règles de ton rôle.`
          }
        ],
        temperature: 0.2,
      }),
    });

    const data = await response.json();
    return NextResponse.json({ response: data.choices[0].message.content });

  } catch (error) {
    console.error("Erreur Backend:", error);
    return NextResponse.json({ response: "L'Olympe est en travaux. Veuillez réessayer." }, { status: 500 });
  }
}