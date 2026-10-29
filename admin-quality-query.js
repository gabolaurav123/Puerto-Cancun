const inventory = require('./inventory-contract');

function qualityQuery(question, items, context = {}) {
  const text = inventory.fold(question);
  if (context.entityId && /que.*falta|calidad|incomplet/.test(text)) {
    const item = items.find(row => row.id === context.entityId);
    if (!item) return { entity: 'properties', ids: [], explanation: 'El registro ya no esta disponible.' };
    const quality = inventory.quality(item);
    return { entity: inventory.entityOf(item), ids: [item.id], explanation: quality.complete ? 'No faltan campos editoriales. Esto no verifica la disponibilidad.' : `Falta: ${quality.missing.join(', ')}.`, quality };
  }
  if (!/desarroll|propiedad|publicaci|inmuebl|casas|departamentos|terrenos/.test(text) || !/sin portada|sin foto|incomplet|complet[oa]s?|por revisar/.test(text)) return null;
  const entity = /desarroll/.test(text) ? 'developments' : 'properties';
  const location = inventory.locationId(text.includes('puerto cancun') ? 'Puerto Cancun' : text.includes('zona hotelera') ? 'Zona Hotelera' : text.includes('cancun city') ? 'Cancun City' : text.includes('fuera de cancun') ? 'Fuera de Cancun' : '');
  const missingCover = /sin portada|sin foto/.test(text);
  const incomplete = /incomplet/.test(text);
  const complete = !incomplete && /\bcomplet[oa]s?\b/.test(text);
  const review = /por revisar/.test(text);
  const physicalType = /\bcasas?\b/.test(text) ? 'Casa' : /\bdepartamentos?\b/.test(text) ? 'Departamento' : /\bterrenos?\b/.test(text) ? 'Terreno' : '';
  const remainder = text.replace(/puerto cancun|zona hotelera|cancun city|fuera de cancun|sin portada|sin fotos?|por revisar|incomplet[oa]s?|complet[oa]s?|muestrame|mostrar|ver|lista|publicaciones?|propiedades?|inmuebles?|desarrollos?|casas?|departamentos?|terrenos?|\b(?:de|del|la|el|las|los|en|con|y)\b/g, '').replace(/[\s?¿.,]/g, '');
  if (remainder) return null;
  const records = inventory.reconcile(items).records;
  const typedIds = new Set(items.filter(item => !physicalType || item.type === physicalType).map(item => item.id));
  const selected = records.filter(row => row.entity === entity && typedIds.has(row.id) && (!location || row.location.id === location)).filter(row => {
    const quality = row.quality;
    return (!missingCover || quality.missingFields.some(field => field.field === 'images' || field.field === 'image')) && (!incomplete || !quality.complete) && (!complete || quality.complete) && (!review || quality.issues.length || row.duplicateMlsIds.length);
  });
  return { entity, ids: selected.map(row => row.id), filters: { status: 'all', location, ...(missingCover ? { missingCover: true } : {}), ...(incomplete ? { quality: 'incomplete' } : {}), ...(complete ? { quality: 'ready' } : {}), ...(review ? { review: true } : {}) }, explanation: `${selected.length} IDs unicos. ${entity === 'developments' ? 'Desarrollos' : 'Propiedades'}${location ? ' de ' + inventory.LOCATIONS.find(row => row.id === location).name : ''}${missingCover ? ' sin portada' : incomplete ? ' con campos editoriales pendientes' : review ? ' con datos por revisar' : ' con campos editoriales completos'}. Incluye borradores y archivados; no se modifico ningun registro.` };
}

module.exports = { qualityQuery };
