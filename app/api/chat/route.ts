import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { gedcomContent, question } = await req.json();

    if (!gedcomContent || !question) {
      return NextResponse.json({ response: "Données manquantes." }, { status: 400 });
    }

    // 1. Préparation des données - RÉDUCTION SÉCURISÉE
    // On passe à 100 lignes pour garantir de rester sous la limite de 6000 tokens
    const lines = gedcomContent.split('\n');
    const gedcomSnippet = lines.slice(0, 100).join('\n');

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
            content: `Données GEDCOM (extraits):
            ${gedcomSnippet}

            Question: ${question}`
          }
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();

    // 3. Gestion spécifique de l'erreur de limite de jetons
    if (data.error && data.error.type === 'tokens') {
      return NextResponse.json({ 
        response: "L'Olympe est surchargé par la longueur du registre. Merci de poser une question plus ciblée." 
      }, { status: 429 });
    }

    if (!data.choices || !data.choices[0]) {
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