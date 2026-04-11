exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const { imageBase64, mimeType } = JSON.parse(event.body);
  const GEMINI_KEY = 'AIzaSyDTeBaEZxtesl_NUmZ3aI6PNtaJGzKYc7s';

  const prompt = `Analiza esta imagen de comida. Responde SOLO JSON válido sin texto extra ni backticks:
{"dishName":"nombre","calories":número,"calorieRange":"rango","protein":g,"carbs":g,"fat":g,"fiber":g,"sodium":mg,"sugar":g,"components":[{"name":"x","calories":n,"portion":"y"}],"advice":"consejo breve en español","confidence":0-100}
Si no hay comida: {"error":"No se detectó comida"}`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [
            { inline_data: { mime_type: mimeType, data: imageBase64 } },
            { text: prompt }
          ]}],
          generationConfig: { temperature: 0.1, maxOutputTokens: 1000 }
        })
      }
    );
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const clean = raw.replace(/```json|```/g, '').trim();
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: clean
    };
  } catch(e) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Error al analizar' }) };
  }
};
