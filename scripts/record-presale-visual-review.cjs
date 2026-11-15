"use strict";
// Human visual review of every numbered image in audit-presale-galleries.cjs.
// This file records decisions; it does not infer image type from filenames or text.
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const root = path.resolve(__dirname, "..");
const manifestText = fs.readFileSync(path.join(root, "outputs/qa-20261115/gallery/manifest.json"), "utf8");
if (crypto.createHash("sha256").update(manifestText).digest("hex") !== "d34855c53c87e476b5f251a83b3fdc13af71208feffef823bcd5b82212d84062") throw new Error("The image manifest changed. A new visual review is required; do not reuse the numbered decisions.");
const manifest = JSON.parse(manifestText);
const range = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i);
const renders = new Set([3,5,6,7,...range(10,17),20,44,47,48,50,52,58,69,77,78,...range(95,106),109,110,113,114,132,133,134,135,137,140,146,147,170,171,177,179,194,221,230,243,244,245,247,380,389,392,411,434,435,436,437,438,439,440,441,442,446,448,449,458,459,460,461,462,...range(463,468),...range(470,483)]);
const plans = new Set([36,128,145,168,242,359,...range(382,386),447,457,469,488,489]);
const mixedRender = new Set([380]);
const contextual = new Set([323,326,327,328,329,330,331,332,333,334,335,336,340,342,343,344,348,349,351,353,354,355,356,360,363,364,365,366]);
const photographicContradiction = new Set(["Bahía Príncipe Riviera Maya Resort", "Novo Cancún", "Riva Puerto Cancún"]);
const specialNotes = {
  "Mondrian Residences at Grand Island Cancún": "La portada existente y las cuatro imágenes de áreas comunes aportadas por el propietario pertenecen al desarrollo. No se creó ninguna unidad ni se incorporaron las tres fotos del departamento muestra. Su relación comercial ya es preventa explícita.",
  "DEPARTAMENTO EN PREVENTA SM10 CANCÚN": "MLS 2013: título y descripción públicos confirman preventa; siete renders, cuatro fotografías de entorno y dos planos. La propiedad conserva su ID; no existe relación comprobada con un desarrollo maestro y no se inventa.",
  "Riva Puerto Cancún": "Galería mixta: fotos de edificio terminado, planos y collage con render de amenidad externa Club de Playa Sur. Modalidad original direct. El render de una amenidad externa no acredita que las unidades actuales sean preventa.",
  "Novo Cancún": "Galería mixta: fotografías de torres y amenidades construidas, plano maestro y render del conjunto. La imagen histórica del proyecto no basta para reclasificar las unidades actuales.",
  "Bahía Príncipe Riviera Maya Resort": "Galería mixta: fotografías del resort operativo y un render de vivienda. No está identificada la etapa o unidad correspondiente al render.",
  "Residencial Lagos del Sol": "Se revisaron las 55 imágenes, incluidas fotos de fauna, mascotas y eventos. No se eliminaron ni reemplazaron; estas imágenes no prueban estado de construcción."
};
const records = manifest.records.map(record => {
  const images = manifest.images.filter(image => image.id === record.id).map(image => ({
    index: image.imageIndex, number: image.number, source: image.source,
    kind: image.number === 127 ? "non-property-screenshot" : image.error ? "unavailable" : renders.has(image.number) ? "render" : plans.has(image.number) ? "plan" : "photograph",
    evidence: image.number === 127 ? "Revisión visual por el agente coordinador en navegador con sesión administrativa, 2026-11-15: captura 1400×665 del formulario administrativo Responder solicitud de pruebas. No es imagen inmobiliaria. No se adjunta por contener contactos de prueba. La descarga sin sesión devuelve HTTP404." : image.error ? image.error : mixedRender.has(image.number) ? "Inspección visual: collage con render arquitectónico de amenidad y fotografías; no todo el cuadro es una foto real." : renders.has(image.number) ? "Inspección visual: representación arquitectónica con geometría, vegetación, personas o iluminación de visualización digital." : plans.has(image.number) ? "Inspección visual: plano maestro, planta, elevación o diagrama; no se usa como prueba de preventa." : contextual.has(image.number) ? "Inspección visual: fotografía de entorno, fauna o evento; no acredita fase comercial." : "Inspección visual: fotografía de edificio, interior o entorno; no se presume preventa por ser portada.",
    sheet: `sheet-${String(Math.ceil(image.number / 20)).padStart(2, "0")}.jpg`,
    sha256: image.sha256 || null, ...(mixedRender.has(image.number) ? { mixed: true } : {})
  }));
  const hasRender = images.some(image => image.kind === "render");
  const commercial = record.sourceCommercialStatus.join("; ");
  const conflict = /entrega inmediata|consolidado|construido|terminado|abierto desde|no verificada|no verificad[oa]|no corroborad[oa]|por verificar|aún no corroborada/i.test(commercial) || photographicContradiction.has(record.title);
  let decision = record.explicitModality === "presale" ? "confirmed-presale" : hasRender && !conflict ? "confirmed-presale" : hasRender || /preventa/i.test(commercial) ? "needs-verification" : "keep-current";
  if (!record.public) decision = "keep-unpublished";
  if (record.entity === "properties" && /SM10/.test(record.title)) decision = "confirmed-presale";
  const reason = specialNotes[record.title] || (!record.public ? "Registro archivado o borrador en la captura administrativa de 2026-11-03; no se publica ni se modifica." : decision === "confirmed-presale" ? record.explicitModality === "presale" ? "Preventa explícita vigente conservada." : "Render confirmado visualmente, sin contradicción de entrega/cierre en las fuentes disponibles: aplicar la regla solicitada." : decision === "needs-verification" ? conflict ? "Existe evidencia de entrega, operación, etapa no corroborada o edificio construido que contradice una reclasificación automática: confirmar la etapa comercial." : "La fuente importada menciona preventa, pero la imagen actual es fotografía/plano: confirmar etapa y vigencia antes de cambiar la clasificación." : "No se encontró render ni modalidad explícita de preventa: conservar clasificación actual.");
  return { id: record.id, title: record.title, entity: record.entity === "property" ? "properties" : record.entity || "developments", public: record.public, sourceSnapshot: record.sourceSnapshot || "outputs/qa-20261115/public-snapshot.json",
    publishedStatus: record.status, sourceCommercialStatus: record.sourceCommercialStatus, sourceFiles: record.sourceFiles,
    originalModality: record.explicitModality, stage: record.stage, decision, reason, evidence: `visual-review-20261115:${record.id}`,
    galleryType: !images.length ? "no-images" : new Set(images.map(image => image.kind)).size > 1 ? "mixed" : images[0].kind,
    images };
});
const payload = { version: 1, reviewDate: "2026-11-15", method: "Visual review of all 489 references: 488 downloaded images in numbered contact sheets with individual enlargement where needed, plus the private archived screenshot inspected by the coordinating agent in the authenticated administrator browser. No metadata-based render inference.",
  adminCorroboration: "2026-11-15: coordinating agent verified current admin counts and unpublished records by UI: 174 general developments, 4 drafts without a cover (Maioris Three Towers, Maya Kaan, Miramar, SHA Tower Costa Mujeres), and 3 archived records (Punta Cancun and gfdg without cover; fewf with one non-property screenshot). These seven match the archived source snapshot; no unpublished record was published.",
  totals: { developments: records.filter(row => row.entity === "developments").length, publicDevelopments: records.filter(row => row.entity === "developments" && row.public).length,
    controlProperties: records.filter(row => row.entity === "properties").length, imageReferences: manifest.images.length, visuallyReviewed: manifest.images.length,
    authenticatedOnly: 1, unavailable: 0 }, records };
fs.mkdirSync(path.join(root, "docs/qa-20261115"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/qa-20261115/gallery-review.json"), JSON.stringify(payload, null, 2) + "\n");
// The runtime uses only reviewed IDs, expected titles, decisions and image indices.
fs.writeFileSync(path.join(root, "data/presale-review-20261115.json"), JSON.stringify({ version: 1, reviewDate: payload.reviewDate, records: records.filter(row => row.public).map(row => ({
  id: row.id, title: row.title, entity: row.entity, decision: row.decision, evidence: row.evidence,
  images: row.images.filter(image => image.kind === "render").map(image => ({ index: image.index, kind: image.kind, source: image.source }))
})) }, null, 2) + "\n");
const csv = value => '"' + String(value ?? "").replaceAll('"', '""') + '"';
fs.writeFileSync(path.join(root, "docs/qa-20261115/gallery-review.csv"), [
  ["id", "name", "public", "image_index", "source", "image_type", "mixed_image", "commercial_source", "current_modality", "decision", "reason", "visual_evidence", "sheet", "sha256"].map(csv).join(","),
  ...records.flatMap(row => (row.images.length ? row.images : [{}]).map(image => [row.id,row.title,row.public,image.index,image.source,image.kind || "no-images",image.mixed || false,row.sourceCommercialStatus.join("; "),row.originalModality,row.decision,row.reason,image.evidence,image.sheet,image.sha256].map(csv).join(",")))
].join("\n") + "\n");
console.log(JSON.stringify({ ...payload.totals, decisions: records.reduce((all,row)=>(all[row.decision]=(all[row.decision]||0)+1,all),{}), confirmed: records.filter(row=>row.decision==="confirmed-presale").map(row=>row.title), pending: records.filter(row=>row.decision==="needs-verification").map(row=>row.title) },null,2));
