"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { interpretCatalogSearch: interpret } = require("../catalog-search");
const { parseQuery, queryInventory } = require("../inventory-contract");

const filters = (patch = {}) => ({ entity: "properties", locations: [], ...patch });
const purchase = filters({ locations: ["puerto-cancun"], type: "Departamento", operation: "sale", currency: "USD", max: 700000 });
const resale = { ...purchase, modality: "resale" };
const rental = filters({ type: "Departamento", operation: "rent", rentPeriod: "month", currency: "USD", max: 5000 });

// Synthetic IDs/offers only. Names exercise phrases in the master, not live data.
const properties = [
  { id: "fixture-project", publicationSection: "developments", type: "Desarrollo", titleEs: "SLS Harbour Beach", developmentData: { id: "fixture-sls" }, zone: "Puerto Cancun", operation: "sale", price: 1, currency: "USD" },
  { id: "fixture-rental", titleEs: "Unidad de prueba mensual", developmentId: "fixture-sls", parentDevelopment: { id: "fixture-sls", nameEs: "SLS Harbour Beach" }, type: "Departamento", operation: "rent", catalogData: { rentPeriod: "month" }, price: 5000, currency: "USD", zone: "Puerto Cancun", beds: 2 },
  { id: "fixture-daily", titleEs: "Unidad de prueba diaria", developmentId: "fixture-sls", type: "Departamento", operation: "rent", catalogData: { rentPeriod: "day" }, price: 100, currency: "USD", zone: "Puerto Cancun" },
  { id: "fixture-limit", titleEs: "Unidad al limite", type: "Departamento", operation: "sale", price: 700000, currency: "USD", zone: "Puerto Canc\u00fan", catalogData: { salesModality: "resale" }, beds: 2 },
  { id: "fixture-too-expensive", titleEs: "Unidad fuera del limite", type: "Departamento", operation: "sale", price: 700000.01, currency: "USD", zone: "Puerto Cancun", beds: 3 },
  { id: "fixture-mxn", titleEs: "Otra moneda", type: "Departamento", operation: "sale", price: 650000, currency: "MXN", zone: "Puerto Cancun" },
  { id: "fixture-sqm", titleEs: "Otra base de precio", type: "Departamento", operation: "sale", price: 5000, currency: "USD", priceUnit: "sqm", zone: "Puerto Cancun" },
  { id: "fixture-collision-a", titleEs: "Penthouse de prueba", mls: "1707", type: "Departamento", operation: "sale", price: 10, currency: "USD", zone: "Punta Sam" },
  { id: "fixture-collision-b", titleEs: "Casa de prueba", mls: "1707", type: "Casa", operation: "sale", price: 20, currency: "MXN", zone: "Aldea Zama", city: "Tulum" },
  { id: "fixture-private", titleEs: "Proyecto secreto", type: "Desarrollo", status: "draft", isPublic: false, mls: "1707", developmentData: { id: "fixture-private-development" } },
];
const options = { properties };

// Complete expected filters, not partial assertions. E01-E40 cover master 13/21.2
// plus ES/EN counterparts and access/absence-of-data conditions.
const cases = [
  ["E01 ES compra explicita y limite", "Quiero comprar un departamento en Puerto Canc\u00fan de hasta 700000 USD", purchase],
  ["E02 EN compra equivalente", "I want to buy an apartment in Puerto Cancun up to 700,000 USD", purchase],
  ["E03 ES importe compacto", "Comprar departamento en Puerto Cancun hasta700000USD", purchase],
  ["E04 ES puntos de millares", "Comprar departamento en Puerto Cancun hasta 700.000 USD", purchase],
  ["E05 ES contexto reventa", "Ahora solo reventa", resale, purchase],
  ["E06 EN contexto reventa", "Now resale only", resale, purchase],
  ["E07 ES union Punta Sam limitada por contrato", "Incluye tambi\u00e9n Punta Sam", { ...resale, locations: ["puerto-cancun", "zona-hotelera"] }, resale, true, /union de subzonas/],
  ["E08 EN union Punta Sam", "Also include Punta Sam", { ...purchase, locations: ["puerto-cancun", "zona-hotelera"] }, purchase, true, /union de subzonas/],
  ["E09 ES unidades de un desarrollo", "Renta mensual en SLS Harbour Beach", filters({ operation: "rent", rentPeriod: "month", development: "fixture-sls" })],
  ["E10 EN unidades de un desarrollo", "Monthly rent in SLS Harbour Beach", filters({ operation: "rent", rentPeriod: "month", development: "fixture-sls" })],
  ["E11 ES casa preventa subzona", "Casas en preventa en Huayac\u00e1n", filters({ type: "Casa", operation: "sale", modality: "presale", locations: ["cancun-city"], zone: "Huayac\u00e1n" })],
  ["E12 EN casa preventa subzona", "Pre-sale houses in Huayacan", filters({ type: "Casa", operation: "sale", modality: "presale", locations: ["cancun-city"], zone: "Huayac\u00e1n" })],
  ["E13 ES terreno uso comercial", "Terreno comercial en Huayac\u00e1n", filters({ type: "Terreno", locations: ["cancun-city"], zone: "Huayac\u00e1n" }), {}, false, /Uso comercial.*no verificado/],
  ["E14 EN terreno uso comercial", "Commercial land in Huayacan", filters({ type: "Terreno", locations: ["cancun-city"], zone: "Huayac\u00e1n" }), {}, false, /Uso comercial.*no verificado/],
  ["E15 MLS sin asumir identidad global", "1707", filters({ text: "1707" })],
  ["E16 MLS con etiqueta", "MLS: 1707", filters({ text: "1707" })],
  ["E17 ES editorial publico bloqueado", "Desarrollos de Puerto Canc\u00fan sin portada", filters({ entity: "developments", locations: ["puerto-cancun"] }), {}, true, /administrativa autorizada/],
  ["E18 EN editorial publico bloqueado", "Developments in Puerto Cancun missing cover", filters({ entity: "developments", locations: ["puerto-cancun"] }), {}, true, /administrativa autorizada/],
  ["E19 ES moneda ausente", "Comprar casa hasta 700000", filters({ operation: "sale", type: "Casa", max: 700000 }), {}, true, /Elige una moneda/],
  ["E20 EN signo dolar ambiguo", "Buy house under $700000", filters({ operation: "sale", type: "Casa", max: 700000 }), {}, true, /Elige una moneda/],
  ["E21 ES operacion ausente", "Departamento en Puerto Cancun hasta 700000 USD", filters({ type: "Departamento", locations: ["puerto-cancun"], currency: "USD", max: 700000 }), {}, true, /Elige compra o renta/],
  ["E22 EN renta periodo ausente", "Rent a condo under 5000 USD", filters({ type: "Departamento", operation: "rent", currency: "USD", max: 5000 }), {}, true, /periodo de renta/],
  ["E23 ES tiempo sin rutas", "Casa a veinte minutos del aeropuerto", filters({ type: "Casa" }), {}, true, /servicio de rutas/],
  ["E24 EN tiempo sin rutas", "House within 20 minutes of the airport", filters({ type: "Casa" }), {}, true, /servicio de rutas/],
  ["E25 ES vista no documentada", "Departamento con vista al mar", filters({ type: "Departamento" }), {}, true, /no verificados/],
  ["E26 EN vista preferencia", "Buy a condo, preferably ocean view", filters({ type: "Departamento", operation: "sale" }), {}, false, /no verificados/],
  ["E27 ES preferencia no relaja limite", "Si tiene vista al mar, mejor", purchase, purchase, false, /no verificados/],
  ["E28 ES zona sin coincidencias conserva criterio", "Casas en Merida", filters({ type: "Casa", locations: ["fuera-de-cancun"], text: "M\u00e9rida" })],
  ["E29 EN locations y destacadas", "Featured apartments in the Hotel Zone", filters({ type: "Departamento", locations: ["zona-hotelera"], featured: true })],
  ["E30 ES venta no impone direct", "Casas en venta", filters({ type: "Casa", operation: "sale" })],
  ["E31 EN venta directa explicita", "Direct sale houses", filters({ type: "Casa", operation: "sale", modality: "direct" })],
  ["E32 ES recamaras en palabras", "Comprar departamento de dos recamaras en P Cancun hasta 700 mil dolares", { ...purchase, beds: 2 }],
  ["E33 EN intervalo con escala compartida", "Buy condos between 500 and 700 thousand USD", filters({ type: "Departamento", operation: "sale", currency: "USD", min: 500000, max: 700000 })],
  ["E34 ES decimal y millones", "Comprar casa hasta 1,5 millones de pesos", filters({ type: "Casa", operation: "sale", currency: "MXN", max: 1500000 })],
  ["E35 EN limite inferior", "Buy houses from 500000 USD to 700000 USD", filters({ type: "Casa", operation: "sale", currency: "USD", min: 500000, max: 700000 })],
  ["E36 ES unidades selector no entidad proyecto", "Departamentos del desarrollo SLS Harbour Beach", filters({ type: "Departamento", development: "fixture-sls" })],
  ["E37 ES proyectos nunca suman unidades", "Desarrollo SLS Harbour Beach", filters({ entity: "developments", text: "SLS Harbour Beach" })],
  ["E38 EN sustituir zona preserva presupuesto", "Now only Costa Mujeres", { ...purchase, locations: ["zona-hotelera"], zone: "Costa Mujeres" }, purchase],
  ["E39 ES alias sin acentos", "Departamentos en ZH", filters({ type: "Departamento", locations: ["zona-hotelera"] })],
  ["E40 EN dos agrupaciones representables", "Buy a house in Puerto Cancun and Cancun City", filters({ type: "Casa", operation: "sale", locations: ["puerto-cancun", "cancun-city"] })],
];

for (const [name, text, expected, previous = {}, clarification = false, warning] of cases) {
  test(name, () => {
    const result = interpret(text, previous, options);
    assert.deepEqual(result.filters, expected);
    assert.equal(result.clarificationRequired, clarification);
    if (warning) assert.match(result.warnings.join("\n"), warning);
    else assert.deepEqual(result.warnings, []);
    if (!clarification) assert.deepEqual(parseQuery(result.filters).errors, []);
    assert.ok(result.understood.length > 0);
    assert.deepEqual(Object.keys(result).sort(), ["clarificationRequired", "conversation", "filters", "understood", "warnings"]);
  });
}

test("moneda aclarada en otro turno preserva el presupuesto pendiente", () => {
  const first = interpret("Comprar casa hasta 700000");
  const second = interpret("USD", first);
  assert.deepEqual(second.filters, filters({ type: "Casa", operation: "sale", currency: "USD", max: 700000 }));
  assert.equal(second.clarificationRequired, false);
});

test("operacion y periodo se aclaran en turnos separados", () => {
  const first = interpret("Departamento hasta 5000 USD");
  const second = interpret("Renta", first.filters);
  assert.equal(second.filters.max, 5000);
  assert.equal(second.clarificationRequired, true);
  const third = interpret("Mensual", second);
  assert.deepEqual(third.filters, rental);
  assert.equal(third.clarificationRequired, false);
});

test("cambiar venta a renta no compara precio total con mensual", () => {
  const result = interpret("Ahora renta mensual", resale);
  assert.deepEqual(result.filters, filters({ type: "Departamento", locations: ["puerto-cancun"], operation: "rent", rentPeriod: "month", currency: "USD" }));
  assert.match(result.warnings.join(" "), /retira el presupuesto/);
});

test("nuevo presupuesto reemplaza el total al cambiar a renta", () => {
  const result = interpret("Ahora renta mensual hasta 5000 USD", resale);
  assert.deepEqual(result.filters, { ...rental, locations: ["puerto-cancun"] });
  assert.equal(result.clarificationRequired, false);
});

test("cambiar periodo retira solo presupuesto incompatible", () => {
  const result = interpret("Ahora por dia", rental);
  assert.deepEqual(result.filters, filters({ type: "Departamento", operation: "rent", rentPeriod: "day", currency: "USD" }));
  assert.match(result.warnings.join(" "), /cambiar el periodo/);
});

test("cambiar renta a preventa retira periodo y presupuesto de renta", () => {
  const result = interpret("Ahora preventa", rental);
  assert.deepEqual(result.filters, filters({ type: "Departamento", operation: "sale", modality: "presale", currency: "USD" }));
});

test("dos periodos exigen eleccion", () => {
  const result = interpret("Rent monthly or yearly under 5000 USD");
  assert.equal(result.clarificationRequired, true);
  assert.equal(result.filters.rentPeriod, undefined);
  assert.match(result.warnings.join(" "), /solo periodo/);
});

test("reinicio explicito limpia todo el contexto", () => {
  assert.deepEqual(interpret("Nueva busqueda: casas", resale).filters, filters({ type: "Casa" }));
  assert.deepEqual(interpret("Start over", resale).filters, filters());
});

test("limpiar criterios no borra los demas", () => {
  const result = interpret("Sin presupuesto, todas las zonas, cualquier modalidad, sin minimo de recamaras, no solo destacadas", { ...resale, beds: 2, featured: true });
  assert.deepEqual(result.filters, filters({ type: "Departamento", operation: "sale", currency: "USD" }));
});

test("contexto y catalogo no se mutan", () => {
  const before = JSON.stringify({ resale, properties });
  interpret("Incluye tambien Punta Sam", resale, options);
  assert.equal(JSON.stringify({ resale, properties }), before);
});

test("varios refinamientos son deterministas", () => {
  for (let run = 0; run < 10; run++) {
    const a = interpret(cases[0][1], {}, options);
    const b = interpret("Ahora solo reventa", a, options);
    assert.deepEqual(b.filters, resale);
    assert.deepEqual(interpret("Ahora solo reventa", b, options), b);
  }
});

test("precio por m2 no se confunde con total ni superficie", () => {
  const result = interpret("Comprar terreno hasta 4200 MXN por m\u00b2");
  assert.deepEqual(result.filters, filters({ type: "Terreno", operation: "sale", currency: "MXN", max: 4200, priceBasis: "sqm" }));
  assert.equal(result.clarificationRequired, false);
});

test("superficie y banos no se convierten en precios", () => {
  const result = interpret("Casa de 200 m2 con 3 banos");
  assert.deepEqual(result.filters, filters({ type: "Casa" }));
  assert.equal(result.clarificationRequired, true);
});

for (const [query, expected] of [
  ["Comprar hasta 1.234.567,89 USD", 1234567.89],
  ["Buy under USD 1,234,567.89", 1234567.89],
  ["Buy under 700k USD", 700000],
  ["Comprar hasta 700 000 USD", 700000],
  ["Comprar hasta 2m USD", 2000000],
  ["Comprar hasta 1 millon USD", 1000000],
  ["Comprar hasta 1 dolar", 1],
]) {
  test(`importe: ${query}`, () => {
    const result = interpret(query);
    assert.deepEqual(result.filters, filters({ operation: "sale", currency: "USD", max: expected }));
    assert.equal(result.clarificationRequired, false);
  });
}

test("intervalo invertido se bloquea sin intercambiar sus limites", () => {
  const result = interpret("Comprar entre 900000 y 700000 USD");
  assert.equal(result.filters.min, 900000);
  assert.equal(result.filters.max, 700000);
  assert.equal(result.clarificationRequired, true);
  assert.match(result.warnings.join(" "), /supera el m/);
});

test("monedas mezcladas o no soportadas requieren eleccion", () => {
  for (const text of ["Comprar hasta 700000 USD o MXN", "Buy under 700000 EUR"]) {
    const result = interpret(text);
    assert.equal(result.filters.currency, undefined);
    assert.equal(result.clarificationRequired, true);
    assert.match(result.warnings.join(" "), /USD o MXN/);
  }
});

test("presupuesto negativo no se vuelve positivo", () => {
  const result = interpret("Comprar hasta -100 USD");
  assert.equal(result.filters.max, undefined);
  assert.equal(result.clarificationRequired, true);
  assert.match(result.warnings.join(" "), /negativo/);
});

test("numero exagerado o formato dudoso no se redondea a un precio valido", () => {
  for (const text of ["Comprar hasta 99999999999999999999 USD", "Comprar hasta 7.00.000 USD"]) {
    const result = interpret(text);
    assert.equal(result.filters.max, undefined);
    assert.equal(result.clarificationRequired, true);
  }
});

test("limite imposible no se amplia y solo devuelve IDs del fixture", () => {
  const result = interpret("Comprar departamento en Puerto Cancun hasta 1 USD", {}, options);
  const found = queryInventory(properties, result.filters);
  assert.deepEqual(found.errors, []);
  assert.deepEqual(found.items, []);
  assert.equal(result.filters.max, 1);
  assert.equal("properties" in result, false);
  assert.equal("total" in result, false);
});

test("consulta integrada respeta limite, moneda, operacion, base y entidad", () => {
  const result = interpret(cases[0][1], {}, options);
  assert.deepEqual(queryInventory(properties, result.filters).all.map((p) => p.id), ["fixture-limit"]);
});

test("1707 devuelve ambas identidades publicas sin fusion ni borrador", () => {
  const result = interpret("1707", {}, options);
  assert.deepEqual(queryInventory(properties, result.filters).all.map((p) => p.id).sort(), ["fixture-collision-a", "fixture-collision-b"]);
});

test("renta mensual de desarrollo solo devuelve unidades mensuales", () => {
  const result = interpret("Renta mensual en SLS Harbour Beach", {}, options);
  assert.deepEqual(queryInventory(properties, result.filters).all.map((p) => p.id), ["fixture-rental"]);
});

test("selector de desarrollos no suma unidades vinculadas", () => {
  const result = interpret("Desarrollo SLS Harbour Beach", {}, options);
  assert.deepEqual(queryInventory(properties, result.filters).all.map((p) => p.id), ["fixture-project"]);
});

test("sin catalogo de nombres no inventa un development ID", () => {
  const result = interpret("Renta mensual en SLS Harbour Beach");
  assert.deepEqual(result.filters, filters({ operation: "rent", rentPeriod: "month", text: "sls harbour beach" }));
});

test("nombres privados no resuelven selectores", () => {
  const result = interpret("Unidades del desarrollo Proyecto secreto", {}, options);
  assert.equal(result.filters.development, undefined);
  assert.equal(JSON.stringify(result).includes("fixture-private"), false);
});

test("desarrollos homonimos necesitan elegir identidad", () => {
  const result = interpret("Unidades en SLS Harbour Beach", {}, { properties: [...properties, { id: "fixture-other-project", type: "Desarrollo", titleEs: "SLS Harbour Beach" }] });
  assert.equal(result.clarificationRequired, true);
  assert.equal(result.filters.development, undefined);
  assert.match(result.warnings.join(" "), /varios desarrollos/);
});

test("titulos concretos de unidades se conservan como texto", () => {
  const result = interpret("Unidad al limite", {}, options);
  assert.deepEqual(result.filters, filters({ text: "Unidad al limite" }));
});

test("cambiar entidad elimina restricciones exclusivas de unidad", () => {
  const result = interpret("Ahora desarrollos", { ...resale, beds: 2, development: "fixture-sls" });
  assert.deepEqual(result.filters, filters({ entity: "developments", locations: ["puerto-cancun"], operation: "sale", currency: "USD", max: 700000, modality: "resale" }));
});

test("catalogo opcional conserva zona exacta existente sin reclasificar registros", () => {
  const result = interpret("Casas en Huayacan", {}, { properties: [{ id: "fixture-huayacan", zone: "Avenida Huayac\u00e1n", type: "Casa" }] });
  assert.deepEqual(result.filters, filters({ type: "Casa", locations: ["cancun-city"], zone: "Avenida Huayac\u00e1n" }));
});

test("alias divergentes de subzona se advierten", () => {
  const result = interpret("Casas en Huayacan", {}, { properties: [{ zone: "Huayacan" }, { zone: "Avenida Huayacan" }] });
  assert.equal(result.clarificationRequired, true);
  assert.match(result.warnings.join(" "), /varios alias/);
});

test("Colosio y Cancun no se asignan por suposicion", () => {
  for (const text of ["Casa en Colosio", "House in Cancun"]) {
    const result = interpret(text);
    assert.deepEqual(result.filters.locations, []);
    assert.equal(result.clarificationRequired, true);
  }
});

test("una adicion ya incluida no reduce el grupo existente", () => {
  const prior = filters({ locations: ["zona-hotelera"], type: "Casa" });
  const result = interpret("Incluye tambien Punta Sam", prior);
  assert.deepEqual(result.filters, prior);
  assert.equal(result.clarificationRequired, false);
});

test("dos subzonas nunca se convierten en una interseccion imposible", () => {
  const result = interpret("Punta Sam y Costa Mujeres");
  assert.deepEqual(result.filters, filters({ locations: ["zona-hotelera"] }));
  assert.equal(result.clarificationRequired, true);
});

test("negacion no introduce un filtro positivo contrario", () => {
  const result = interpret("No casas en Puerto Cancun");
  assert.equal(result.filters.type, undefined);
  assert.equal(result.clarificationRequired, true);
  assert.match(result.warnings.join(" "), /exclusiones/);
});

test("varios tipos no eligen uno silenciosamente", () => {
  const result = interpret("Casas o departamentos");
  assert.equal(result.filters.type, undefined);
  assert.equal(result.clarificationRequired, true);
});

test("contexto parseQuery con null no crea limites cero", () => {
  const result = interpret("Ahora solo reventa", parseQuery({ type: "Casa" }).query);
  assert.deepEqual(result.filters, filters({ type: "Casa", operation: "sale", modality: "resale", featured: false, priceBasis: "total", priceBasisExplicit: false }));
  assert.equal(result.clarificationRequired, false);
  assert.equal(parseQuery(result.filters).query.max, null);
});

test("estado previo solo conserva claves publicas permitidas", () => {
  const result = interpret("", { includePrivate: true, status: "draft", entity: "properties", limit: 1000, q: "secret", page: 9 });
  assert.deepEqual(result.filters, filters());
});

test("entrada demasiado larga no se trunca a una consulta ejecutable", () => {
  const result = interpret("comprar ".repeat(90), resale);
  assert.deepEqual(result.filters, resale);
  assert.equal(result.clarificationRequired, true);
});

test("entrada vacia es estable y entrada no textual se bloquea", () => {
  assert.deepEqual(interpret(" ", resale).filters, resale);
  assert.equal(interpret(null).clarificationRequired, true);
});

test("terminos desconocidos conservan busqueda textual sin fabricar resultados", () => {
  const result = interpret("Busco Atlantis inexistente");
  assert.deepEqual(result.filters, filters({ text: "atlantis inexistente" }));
  assert.deepEqual(queryInventory(properties, result.filters).all, []);
});

test("las etiquetas no exponen sale o rent como texto de operacion", () => {
  assert.ok(interpret("Comprar casa").understood.includes("Operacion: Venta"));
  assert.ok(interpret("Casa").understood.includes("Operacion: Compra y renta"));
  assert.equal(interpret("Comprar casa").understood.includes("sale"), false);
});

test("modificar solo un limite conserva el otro", () => {
  const initial = { ...purchase, min: 500000 };
  assert.deepEqual(interpret("Ahora hasta 600000 USD", initial).filters, { ...initial, max: 600000 });
  assert.deepEqual(interpret("Ahora desde 550000 USD", initial).filters, { ...initial, min: 550000 });
});

test("texto nuevo no elimina la ciudad especificada en ese turno", () => {
  assert.deepEqual(interpret("Casas en Tulum Oasis").filters, filters({ type: "Casa", locations: ["fuera-de-cancun"], text: "Tulum oasis" }));
  assert.deepEqual(interpret("MLS 1707 en Tulum").filters, filters({ locations: ["fuera-de-cancun"], text: "Tulum 1707" }));
});

test("negaciones inglesas y destacadas no activan el filtro contrario", () => {
  for (const text of ["No destacadas", "Not featured", "Not houses", "Without apartments"]) {
    const result = interpret(text);
    assert.deepEqual(result.filters, filters());
    assert.equal(result.clarificationRequired, true);
  }
});

test("maximo y cantidad exacta de recamaras no se vuelven un minimo", () => {
  for (const text of ["Casa con exactamente dos recamaras", "House with at most 2 bedrooms"]) {
    const result = interpret(text);
    assert.deepEqual(result.filters, filters({ type: "Casa" }));
    assert.equal(result.clarificationRequired, true);
  }
});

test("un guion de intervalo o identificador no es un importe negativo", () => {
  assert.deepEqual(interpret("Buy between 500000-700000 USD").filters, filters({ operation: "sale", currency: "USD", min: 500000, max: 700000 }));
  assert.deepEqual(interpret("MLS N-1707").filters, filters({ text: "n-1707" }));
});

test("cambiar base no reutiliza el precio por m2 como total", () => {
  const result = interpret("Ahora precio total", filters({ operation: "sale", priceBasis: "sqm", currency: "MXN", max: 4200 }));
  assert.deepEqual(result.filters, filters({ operation: "sale", priceBasis: "total", currency: "MXN" }));
  assert.match(result.warnings.join(" "), /base de precio/);
});

test("padre privado de unidad publica tampoco resuelve un selector", () => {
  const result = interpret("Unidades de Proyecto oculto", {}, { properties: [{ id: "public-unit", developmentId: "private-parent", parentDevelopment: { id: "private-parent", nameEs: "Proyecto oculto", isPublic: false } }] });
  assert.equal(result.filters.development, undefined);
  assert.equal(JSON.stringify(result).includes("private-parent"), false);
});

test("locations del contexto se normalizan y las invalidas piden aclaracion", () => {
  assert.deepEqual(interpret("Ahora reventa", { locations: "Puerto Cancun" }).filters, filters({ locations: ["puerto-cancun"], operation: "sale", modality: "resale" }));
  const invalid = interpret("", { locations: 42 });
  assert.equal(invalid.clarificationRequired, true);
  assert.match(invalid.warnings.join(" "), /Location no reconocida/);
});

for (const [language, text, expected] of [
  ["en", "Comprar casa hasta 700000", /Choose a currency/],
  ["en-US", "Departamento hasta 5000 USD", /Choose purchase or rent/],
  ["EN", "Rent under 5000 USD", /rental period/],
  ["es-MX", "Buy house under 700000", /Elige una moneda/],
]) {
  test(`locale explicito ${language}: ${text}`, () => {
    const result = interpret(text, {}, { language });
    assert.equal(result.clarificationRequired, true);
    assert.match(result.warnings.join(" "), expected);
    assert.equal(result.conversation.language, language.slice(0, 2).toLowerCase());
  });
}

test("lang funciona en opciones y en el envelope del endpoint existente", () => {
  assert.match(interpret("Casa hasta 5", {}, { lang: "en" }).warnings.join(" "), /Choose/);
  const first = interpret("Buy house under 700000", { filters: {}, lang: "en" });
  assert.ok(first.understood.includes("Type: Home"));
  const next = interpret("USD", JSON.parse(JSON.stringify(first)));
  assert.equal(next.conversation.language, "en");
  assert.equal(next.clarificationRequired, false);
  assert.deepEqual(next.warnings, []);
});

for (const [query, code] of [
  ["House with sea view under 700000", "sea_view"],
  ["House within 20 minutes of the airport under 700000", "travel_time"],
  ["House with 2 bathrooms under 700000", "unsupported_attribute"],
  ["House of 200 m2 under 700000", "area"],
  ["House missing cover under 700000", "editorial"],
  ["Not houses under 700000", "exclusion"],
  ["House with exactly 2 bedrooms under 700000", "bedroom_operator"],
  ["Punta Sam and Costa Mujeres under 700000", "subzone_union"],
  ["House in Cancun under 700000", "cancun"],
  ["House in Colosio under 700000", "colosio"],
]) {
  test(`moneda y operacion no descartan ${code}`, () => {
    const first = interpret(query, {}, { lang: "en" });
    const snapshot = JSON.stringify(first);
    let current = interpret("USD", JSON.parse(snapshot));
    current = interpret("buy", JSON.parse(JSON.stringify(current)));
    assert.equal(current.filters.max, 700000);
    assert.equal(current.filters.currency, "USD");
    assert.equal(current.filters.operation, "sale");
    assert.equal(current.clarificationRequired, true);
    assert.deepEqual(current.conversation.pending.find((item) => item.code === code).sources, [query]);
    assert.equal(JSON.stringify(first), snapshot);
    assert.equal(current.warnings.some((message) => /Elige|requiere|No se|no tiene/.test(message)), false);
  });
}

test("resolver moneda, operacion y periodo no deja validaciones obsoletas", () => {
  let current = interpret("Condo under 5000", {}, { lang: "en" });
  for (const text of ["USD", "rent", "monthly"]) current = interpret(text, JSON.parse(JSON.stringify(current)));
  assert.equal(current.clarificationRequired, false);
  assert.deepEqual(current.warnings, []);
  assert.deepEqual(current.conversation.pending, []);
  assert.deepEqual(current.filters, rental);
});

test("cambiar idioma traduce tambien requisitos pendientes", () => {
  const first = interpret("Comprar casa con vista al mar hasta 700000");
  const second = interpret("USD", first, { language: "en" });
  assert.deepEqual(second.warnings, ["Sea views or access are unverified: they cannot be filtered or inferred from text or photos."]);
  const third = interpret("", second, { lang: "es" });
  assert.match(third.warnings[0], /Vista o acceso al mar/);
});

test("varios requisitos de la misma clase conservan sus fuentes", () => {
  const first = interpret("House with pool");
  const second = interpret("Also gym", first);
  assert.deepEqual(second.conversation.pending[0].sources, ["House with pool", "Also gym"]);
  assert.equal(interpret("USD", second).clarificationRequired, true);
});

for (const [query, answer, code] of [
  ["Casas o departamentos", "Casa", "type_conflict"],
  ["Buy or rent", "buy", "operation_conflict"],
  ["Preventa o reventa", "reventa", "modality_conflict"],
  ["Rent monthly or yearly", "monthly", "period_conflict"],
  ["Buy under 100 USD or MXN", "USD", "currency_conflict"],
  ["Buy under -100 USD", "under 200 USD", "negative_budget"],
  ["Buy under 100 USD or 200 USD", "under 150 USD", "budget_conflict"],
  ["Casa en Cancun", "Puerto Cancun", "cancun"],
  ["Casa en Colosio", "Colosio Cancun", "colosio"],
  ["Punta Sam y Costa Mujeres", "Punta Sam", "subzone_union"],
]) {
  test(`eleccion explicita resuelve ${code}`, () => {
    const first = interpret(query);
    assert.ok(first.conversation.pending.some((item) => item.code === code));
    const second = interpret(answer, first);
    assert.equal(second.conversation.pending.some((item) => item.code === code), false);
    assert.equal(second.clarificationRequired, false);
  });
}

test("nueva ambiguedad en la misma dimension no se borra por resolver la antigua", () => {
  const first = interpret("Punta Sam y Costa Mujeres");
  const second = interpret("Punta Sam y Huayacan", first);
  assert.equal(second.clarificationRequired, true);
  assert.deepEqual(second.conversation.pending[0].sources, ["Punta Sam y Huayacan"]);
});

test("renuncia explicita ES/EN permite retirar solo el requisito elegido", () => {
  for (const waiver of ["Sin requisito de vista al mar", "Drop sea view requirement"]) {
    const first = interpret("House with sea view within 20 minutes of the airport");
    const second = interpret(waiver, first);
    assert.deepEqual(second.conversation.pending.map((item) => item.code), ["travel_time"]);
    assert.equal(second.filters.text, undefined);
    assert.equal(interpret("Drop travel time requirement", second).clarificationRequired, false);
  }
});

test("discardRequirements solo se usa con eleccion explicita y valida", () => {
  const first = interpret("House with pool and sea view");
  const second = interpret("", first, { discardRequirements: ["unsupported_attribute"] });
  assert.deepEqual(second.conversation.pending.map((item) => item.code), ["sea_view"]);
  assert.equal(interpret("USD", first, { discardRequirements: ["invented"] }).clarificationRequired, true);
  const repeated = interpret("Sea view", first, { discardRequirements: ["sea_view"] });
  assert.ok(repeated.conversation.pending.some((item) => item.code === "sea_view"));
});

test("contexto antiguo conserva advertencias que no son validaciones recalculables", () => {
  const old = interpret("Casa con vista al mar hasta 5");
  delete old.conversation;
  const next = interpret("USD comprar", old);
  assert.equal(next.clarificationRequired, true);
  assert.deepEqual(next.conversation.pending.map((item) => item.code), ["sea_view"]);
});

for (const conversation of [null, {}, { version: 2, pending: [] }, { version: 1, pending: [{}] }, { version: 1, pending: [{ code: "sea_view", sources: [null] }] }]) {
  test(`estado invalido no se descarta: ${JSON.stringify(conversation)}`, () => {
    const result = interpret("USD", { conversation, filters: purchase }, { lang: "en" });
    assert.equal(result.clarificationRequired, true);
    assert.match(result.warnings.join(" "), /context is incomplete or invalid/);
    assert.equal(interpret("Start over", result).clarificationRequired, false);
  });
}

test("bounds y base explicita del contexto se conservan", () => {
  const prior = parseQuery({ bounds: "-87,20,-86,22", priceBasis: "total" }).query;
  const result = interpret("Now resale only", prior, { lang: "en" });
  assert.deepEqual(result.filters.bounds, [-87, 20, -86, 22]);
  assert.equal(result.filters.priceBasisExplicit, true);
});
