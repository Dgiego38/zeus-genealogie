import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { gedcomContent, question } = await req.json();

    if (!gedcomContent || !question) {
      return NextResponse.json({ response: "Données manquantes." }, { status: 400 });
    }

    // 1. FILTRE INTELLIGENT : Recherche ciblée au lieu d'un simple slice
    const lines = gedcomContent.split('\n');
    const keywords = question.toLowerCase().match(/\b\w{4,}\b/g) || [];
    
    // On cherche les lignes contenant au moins un mot-clé significatif
    const relevantLines = lines.filter((line: string) => 
      keywords.some((kw: string) => line.toLowerCase().includes(kw))
    );

    // On priorise les lignes trouvées, sinon on prend le début pour éviter le vide
    const gedcomSnippet = relevantLines.length > 0 
      ? relevantLines.slice(0, 100).join('\n') 
      : lines.slice(0, 100).join('\n');

    // 2. Appel à l'API Groq (Llama 3.1)
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
            content: `Tu es Zeus, l'archiviste royal. Analyse les archives nobles.
            RÈGLES STRICTES :
            1. JAMAIS d'astérisques (*) ou de gras (**).
            2. Utilise des emojis pour structurer (👑, 📜, 👤, 📅).
            3. Sois très concis et précis.
            4. Identifie les liens de parenté avec précision.
            5. Si une info manque, dis-le clairement.
            6. Ton ton est formel et érudit.`
          },
          {
            role: "user",
            content: `Données GEDCOM (extraits filtrés):
            ${gedcomSnippet}

            Question: ${question}`
          }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    // 3. Gestion des erreurs
    if (data.error) {
      console.error("Erreur API Groq:", data.error);
      return NextResponse.json({ 
        response: data.error.type === 'tokens' 
          ? "L'Olympe est surchargé. Merci de poser une question plus ciblée." 
          : "Hélas, l'Olympe est indisponible." 
      }, { status: 500 });
    }

    return NextResponse.json({ response: data.choices[0].message.content });

  } catch (error) {
    console.error("Erreur Backend Zeus:", error);
    return NextResponse.json({ 
      response: "Hélas, une erreur s'est produite lors de la consultation de l'Olympe." 
    }, { status: 500 });
  }
}