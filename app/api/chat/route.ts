import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { gedcomContent, question } = await req.json();

    if (!gedcomContent || !question) {
      return NextResponse.json({ response: "Données manquantes." }, { status: 400 });
    }

    // Préparation des données
    const lines = gedcomContent.split('\n');
    const gedcomSnippet = lines.slice(0, 500).join('\n');

    // Appel à l'API Groq (Llama 3.1)
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
            content: `Tu es Zeus, l'archiviste royal de Zeus Généalogie. 
            Spécialité : archives nobles, titres et successions.
            RÈGLES STRICTES :
            1. N'utilise JAMAIS d'astérisques (*) ou de gras (**).
            2. Utilise des emojis pour structurer (👑, 📜, 👤, 📅).
            3. Sois concis, détaillé et précis.
            4. Identifie les liens de parenté et titres avec précision.
            5. Si une information manque, indique-le clairement.
            6. Ton ton est formel, érudit et digne d'un archiviste royal.`
          },
          {
            role: "user",
            content: `Données extraites du GEDCOM :
            ${gedcomSnippet}

            Question de l'utilisateur : ${question}`
          }
        ],
        temperature: 0.3, // Température basse pour plus de rigueur factuelle
      }),
    });

    const data = await response.json();

    if (!data.choices || !data.choices[0]) {
      // Log détaillé pour debug dans Vercel
      console.error("Erreur API Groq:", JSON.stringify(data));
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