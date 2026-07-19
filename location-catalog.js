const mexicoStates = [
  "Aguascalientes", "Baja California", "Baja California Sur", "Campeche", "Chiapas", "Chihuahua",
  "Ciudad de México", "Coahuila", "Colima", "Durango", "Estado de México", "Guanajuato", "Guerrero",
  "Hidalgo", "Jalisco", "Michoacán", "Morelos", "Nayarit", "Nuevo León", "Oaxaca", "Puebla",
  "Querétaro", "Quintana Roo", "San Luis Potosí", "Sinaloa", "Sonora", "Tabasco", "Tamaulipas",
  "Tlaxcala", "Veracruz", "Yucatán", "Zacatecas",
];

const quintanaRooCities = [
  ["Bacalar", "bacalar"],
  ["Cancún / Benito Juárez", "cancun"],
  ["Chetumal / Othón P. Blanco", "chetumal"],
  ["Cozumel", "cozumel"],
  ["Felipe Carrillo Puerto", "felipe-carrillo-puerto"],
  ["Isla Mujeres", "isla-mujeres"],
  ["José María Morelos", "jose-maria-morelos"],
  ["Kantunilkín / Lázaro Cárdenas", "lazaro-cardenas"],
  ["Playa del Carmen", "playa-del-carmen"],
  ["Puerto Morelos", "puerto-morelos"],
  ["Tulum", "tulum"],
];

const quintanaRooZones = [
  ["Puerto Cancún", "cancun"], ["Zona Hotelera Cancún", "cancun"], ["Cancún Centro", "cancun"],
  ["Avenida Huayacán", "cancun"], ["Alfredo V. Bonfil", "cancun"], ["Polígono Sur", "cancun"],
  ["Lagos del Sol", "cancun"], ["Malecón Tajamar", "cancun"], ["Cumbres", "cancun"],
  ["Supermanzana 15", "cancun"], ["Supermanzana 17", "cancun"], ["Residencial Campestre", "cancun"],
  ["Playa Mujeres", "isla-mujeres"], ["Costa Mujeres", "isla-mujeres"], ["Punta Sam", "isla-mujeres"],
  ["Isla Mujeres Centro", "isla-mujeres"], ["Sac Bajo", "isla-mujeres"], ["Garrafón", "isla-mujeres"],
  ["Centro Playa del Carmen", "playa-del-carmen"], ["Playacar", "playa-del-carmen"], ["Corasol", "playa-del-carmen"],
  ["Mayakoba", "playa-del-carmen"], ["Colosio", "playa-del-carmen"], ["Ejidal", "playa-del-carmen"],
  ["Zazil-Ha", "playa-del-carmen"], ["Coco Beach", "playa-del-carmen"], ["Xcalacoco", "playa-del-carmen"],
  ["Puerto Aventuras", "playa-del-carmen"],
  ["Aldea Zamá", "tulum"], ["Región 15", "tulum"], ["La Veleta", "tulum"], ["Tulum Centro", "tulum"],
  ["Zona Hotelera Tulum", "tulum"], ["Akumal", "tulum"], ["Tankah", "tulum"], ["Bahía Solimán", "tulum"],
  ["Chemuyil", "tulum"],
  ["Bacalar Centro", "bacalar"], ["Laguna de Bacalar", "bacalar"], ["Buenavista", "bacalar"],
  ["Puerto Morelos Centro", "puerto-morelos"], ["Colonia Zetina Gasca", "puerto-morelos"],
  ["Ruta de los Cenotes", "puerto-morelos"],
  ["Cozumel Centro", "cozumel"], ["Zona Hotelera Norte Cozumel", "cozumel"],
  ["Zona Hotelera Sur Cozumel", "cozumel"], ["Country Club Cozumel", "cozumel"],
  ["Corpus Christi", "cozumel"], ["Independencia Cozumel", "cozumel"],
  ["Chetumal Centro", "chetumal"], ["Calderitas", "chetumal"], ["Mahahual", "chetumal"], ["Xcalak", "chetumal"],
  ["Holbox", "lazaro-cardenas"], ["Chiquilá", "lazaro-cardenas"], ["Kantunilkín", "lazaro-cardenas"],
  ["Felipe Carrillo Puerto Centro", "felipe-carrillo-puerto"],
  ["José María Morelos Centro", "jose-maria-morelos"],
];

const quintanaRooNeighborhoods = [
  ["Novo Cancún", "puerto-cancun"], ["Marina Puerto Cancún", "puerto-cancun"],
  ["SLS Harbour Beach", "puerto-cancun"], ["SLS Marina Beach", "puerto-cancun"],
  ["La Vela Puerto Cancún", "puerto-cancun"], ["Amara Puerto Cancún", "puerto-cancun"],
  ["Shark Tower", "puerto-cancun"], ["Blume", "puerto-cancun"], ["Isola", "puerto-cancun"],
  ["Bay View Grand", "zona-hotelera-cancun"], ["Pok Ta Pok", "zona-hotelera-cancun"],
  ["Isla Dorada", "zona-hotelera-cancun"], ["Residencial Las Quintas", "zona-hotelera-cancun"],
  ["La Amada", "playa-mujeres"], ["Maralago", "playa-mujeres"], ["Punta del Mar", "playa-mujeres"],
  ["Aqua Residencial", "avenida-huayacan"], ["Arbolada", "avenida-huayacan"],
  ["Vía Cumbres", "avenida-huayacan"], ["Long Island", "avenida-huayacan"],
  ["La Rioja", "avenida-huayacan"], ["Jardines del Sur", "poligono-sur"],
  ["Allure", "cumbres"], ["Palmaris", "cumbres"],
  ["Playacar Fase I", "playacar"], ["Playacar Fase II", "playacar"],
  ["The Village Corasol", "corasol"], ["Costa Beach Corasol", "corasol"],
  ["Ciudad Mayakoba", "mayakoba"], ["El Cielo", "xcalacoco"],
  ["Puerto Aventuras Marina", "puerto-aventuras"],
  ["Aldea Zamá Premium", "aldea-zama"], ["Aldea Maya", "aldea-zama"], ["Lu'um Zamá", "aldea-zama"],
  ["Selvazama", "region-15"], ["Holistika", "la-veleta"],
  ["Tankah Bay", "tankah"], ["Solimán Bay", "bahia-soliman"],
  ["Punta Allen", "zona-hotelera-tulum"],
  ["El Cielo Cozumel", "zona-hotelera-norte-cozumel"],
  ["Marina Cozumel", "zona-hotelera-sur-cozumel"],
  ["Nuevo Mahahual", "mahahual"], ["Costa Maya", "mahahual"],
  ["Punta Cocos", "holbox"], ["Punta Mosquito", "holbox"],
];

function locationSeedSlug(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildLocationSeedOptions() {
  const states = mexicoStates.map((name) => ({
    id: `loc-state-${locationSeedSlug(name)}`,
    type: "state",
    name,
    parentId: null,
  }));
  const cities = quintanaRooCities.map(([name, slug]) => ({
    id: `loc-city-${slug}`,
    type: "city",
    name,
    parentId: "loc-state-quintana-roo",
  }));
  const zones = quintanaRooZones.map(([name, citySlug]) => ({
    id: `loc-zone-${locationSeedSlug(name)}`,
    type: "zone",
    name,
    parentId: `loc-city-${citySlug}`,
  }));
  const neighborhoods = quintanaRooNeighborhoods.map(([name, zoneSlug]) => ({
    id: `loc-neighborhood-${zoneSlug}-${locationSeedSlug(name)}`,
    type: "neighborhood",
    name,
    parentId: `loc-zone-${zoneSlug}`,
  }));
  return [...states, ...cities, ...zones, ...neighborhoods];
}

module.exports = {
  buildLocationSeedOptions,
  locationSeedSlug,
  mexicoStates,
  quintanaRooCities,
  quintanaRooNeighborhoods,
  quintanaRooZones,
};
