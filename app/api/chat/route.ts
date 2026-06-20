import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
  try {
    const { gedcomContent, question } = await req.json();

    if (!gedcomContent || !question) {
      return NextResponse.json({ response: "Données manquantes." }, { status: 400 });
    }

    // 1. Initialisation de Gemini
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

    // 2. Simplification des données GEDCOM
    const lines = gedcomContent.split('\n');
    const gedcomSnippet = lines.slice(0, 500).join('\n');

    // 3. Construction du prompt d'expert avec consignes de formatage strictes
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

    // 4. Appel à l'API Gemini
    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();

    return NextResponse.json({ response: responseText });

  } catch (error) {
    console.error("Erreur Backend Zeus:", error);
    return NextResponse.json({ 
      response: "Hélas, une erreur s'est produite lors de la consultation de l'Olympe." 
    }, { status: 500 });
  }
}