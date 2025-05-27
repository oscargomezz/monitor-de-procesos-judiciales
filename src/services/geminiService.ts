import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { UrgencyLevel, ClassificationResponse } from '../types';
import { GEMINI_TEXT_MODEL } from '../constants';

// Ensure API_KEY is available in the environment.
// The application should not prompt for it.
if (!process.env.API_KEY) {
  console.error("API_KEY environment variable is not set. Gemini Service will not function.");
  // You might throw an error here or let the app handle it,
  // but for now, operations will fail if key is missing.
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! }); // Non-null assertion as we check above or assume it's set

/**
 * Generates a summary for the given text using Gemini API.
 * @param text The text to summarize.
 * @returns A promise that resolves to the summary string or an error message.
 */
export const summarizeText = async (text: string): Promise<string> => {
  if (!process.env.API_KEY) return "Error: API Key no configurada.";
  if (!text.trim()) return "No hay texto para resumir.";

  const prompt = `Resume el siguiente texto de una actuación judicial en una o dos frases concisas. Enfócate en la acción principal, las partes involucradas si son relevantes para el resumen, y el resultado o el siguiente paso inmediato si es evidente. El resumen debe ser claro y fácil de entender para alguien que está siguiendo el caso. Texto original:\n\n"${text}"`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Error summarizing text with Gemini:", error);
    return "Error al generar resumen.";
  }
};

/**
 * Classifies the urgency of a judicial action description using Gemini API.
 * @param description The description of the judicial action.
 * @returns A promise that resolves to a ClassificationResponse object.
 */
export const classifyActionUrgency = async (description: string): Promise<ClassificationResponse> => {
  if (!process.env.API_KEY) {
    return {
      clasificacion: UrgencyLevel.ERROR,
      justificacion: "Error: API Key no configurada."
    };
  }
  if (!description.trim()) {
    return {
      clasificacion: UrgencyLevel.BAJA, // Or PENDIENTE if preferred for empty
      justificacion: "No hay descripción para clasificar."
    };
  }

  const prompt = `
Analiza la siguiente descripción de una actuación judicial y clasifica su urgencia.
Descripción: "${description}"

Niveles de urgencia permitidos: "ALTA", "MEDIA", "BAJA".
Responde únicamente en formato JSON con la siguiente estructura:
{
  "clasificacion": "NIVEL_DE_URGENCIA",
  "justificacion": "Una breve explicación concisa (máximo 30 palabras) de por qué se asignó esta urgencia."
}

Considera los siguientes criterios para la clasificación:
- ALTA: Requiere acción inmediata o atención prioritaria (ej. términos perentorios, audiencias próximas, requerimientos con plazo corto, decisiones que cambian drásticamente el estado del proceso, necesidad de interponer recursos con plazo).
- MEDIA: Requiere atención pronto pero no es de crisis inmediata (ej. notificaciones importantes que informan de decisiones, autos que impulsan el proceso sin plazo inminente, presentación de memoriales relevantes, estados para traslado).
- BAJA: Informativo, trámite rutinario, o acciones que no requieren respuesta urgente (ej. constancias de ejecutoria, archivo, solicitud de copias, anotaciones de trámite interno).

Si la descripción es ambigua o no provee suficiente información para una clasificación clara, asigna "BAJA" y justifica brevemente la ambigüedad.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_TEXT_MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let jsonStr = response.text.trim();
    const fenceRegex = /^```(?:json)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr.match(fenceRegex);
    if (match && match[1]) {
      jsonStr = match[1].trim();
    }
    
    const parsedData = JSON.parse(jsonStr) as { clasificacion: string; justificacion: string };

    let urgencyLevel: UrgencyLevel;
    const receivedClasificacion = parsedData.clasificacion?.toUpperCase();

    switch (receivedClasificacion) {
      case 'ALTA':
        urgencyLevel = UrgencyLevel.ALTA;
        break;
      case 'MEDIA':
        urgencyLevel = UrgencyLevel.MEDIA;
        break;
      case 'BAJA':
        urgencyLevel = UrgencyLevel.BAJA;
        break;
      default:
        console.warn(`Unexpected classification value from AI: "${parsedData.clasificacion}". Defaulting to BAJA.`);
        urgencyLevel = UrgencyLevel.BAJA;
        return {
          clasificacion: urgencyLevel,
          justificacion: parsedData.justificacion || `Clasificación no estándar (${parsedData.clasificacion}) recibida.`,
        };
    }

    return {
      clasificacion: urgencyLevel,
      justificacion: parsedData.justificacion || "Justificación no proporcionada por la IA.",
    };

  } catch (error) {
    console.error("Error classifying action urgency with Gemini:", error);
    let justificacionError = "Error al clasificar la urgencia.";
    if (error instanceof Error) {
        if (error.message.includes("JSON")) {
            justificacionError = "Error al procesar la respuesta JSON de la IA.";
        }
    }
    return {
      clasificacion: UrgencyLevel.ERROR,
      justificacion: justificacionError,
    };
  }
};
