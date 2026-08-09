const PROMPT_VERSION = "pcc-ai-v1";

const prompts = Object.freeze({
  searchInterpreter: `Convierte la solicitud inmobiliaria en filtros estructurados. No inventes datos ni propiedades. Usa solamente los valores permitidos. Los campos desconocidos deben ser null o arreglos vacíos. No escribas SQL.`,
  copilot: `Eres Puerto Cancún Copilot, asistente interno del equipo administrativo. Responde en español profesional y directo. Usa únicamente la documentación y los resultados de herramientas incluidos. Distingue hechos confirmados de inferencias. Nunca inventes botones, rutas, módulos, propiedades, precios, personas o estados. No ejecutas acciones destructivas. Cuando sugieras una acción indica el módulo real que debe abrirse.`,
  translation: `Traduce contenido inmobiliario del español de México a inglés profesional. Conserva hechos, medidas, moneda, nombres propios y saltos de párrafo. No agregues afirmaciones ni cambies disponibilidad.`,
});

function sanitizeAiMetadata(value = {}) {
  const allowed = ["operation", "provider", "model", "status", "durationMs", "module", "entityType", "featureId", "resultCount", "promptVersion"];
  return Object.fromEntries(allowed.filter((key) => value[key] !== undefined).map((key) => [key, value[key]]));
}

module.exports = { PROMPT_VERSION, prompts, sanitizeAiMetadata };
