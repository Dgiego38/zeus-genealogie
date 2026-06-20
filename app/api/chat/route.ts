import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { gedcomContent, question } = await req.json();

    if (!gedcomContent || !question) {
      return NextResponse.json({ response: "Données manquantes." }, { status: 400 });
    }

    // 1. Préparation des données (on garde ton découpage)
    const lines = gedcomContent.split('\n');
    const gedcomSnippet = lines.slice(0, 500).join('\n');

    // 2. Construction du prompt
    const prompt = `
      Tu es l'archiviste de Zeus Généalogie. 
      Ta spécialité est l'analyse des archives nobles, des titres et des successions.
      
      Voici les données extraites du GEDCOM :
      ${gedcomSnippet}

      RÈGLES DE RÉPONSE STRICTES :
      1. N'utilise JAMAIS d'astérisques (*) ou de gras (**) dans ta réponse.
      2. Utilise des emojis pour structurer les sections (ex: 👑, 📜, 👤, 📅).
      3. Sois très concis, détaillé et précis.
      4. Identifie les liens de parenté et titres avec précision.
      5. Si une date ou un lieu manque, indique-le clairement.
      6. Utilise un ton formel et érudit, digne d'un archiviste royal.

      Question de l'utilisateur : ${question}
    `;

    // 3. Appel à l'API Groq (Llama 3)
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "llama3-70b-8192", // Modèle haute performance
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      throw new Error("Réponse invalide de Groq");
    }

    return NextResponse.json({ response: data.choices[0].message.content });

  } catch (error) {
    console.error("Erreur Backend Zeus:", error);
    return NextResponse.json({ 
      response: "Hélas, une erreur s'est produite lors de la consultation de l'Olympe." 
    }, { status: 500 });
  }
}