const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const {
  parseIntelligentSearch,
  propertyMatchesFilters,
  propertyMatchesQuery,
} = require("../intelligence-utils");

const root = path.join(__dirname, "..");
const source = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("la búsqueda inteligente encuentra desarrollos y sus unidades vinculadas", () => {
  const development = {
    id: "development-lagos",
    titleEs: "Residencial Lagos del Sol",
    titleEn: "Lagos del Sol Residential",
    type: "Desarrollo",
    publicationSection: "developments",
    operation: "sale",
    amenities: ["alberca"],
    keywords: ["desarrollo", "Lagos del Sol"],
  };
  const linkedProperty = {
    id: "property-lagos-1",
    titleEs: "Casa con vista al lago",
    type: "Casa",
    publicationSection: "properties",
    operation: "sale",
    parentDevelopment: {
      nameEs: "Residencial Lagos del Sol",
      nameEn: "Lagos del Sol Residential",
      developer: "Grupo Lagos",
    },
    amenities: [],
    keywords: [],
  };

  const developmentFilters = parseIntelligentSearch("muéstrame desarrollos");
  assert.equal(developmentFilters.propertyType, "Desarrollo");
  assert.equal(propertyMatchesFilters(development, developmentFilters), true);
  assert.equal(propertyMatchesQuery(development, "desarrollo"), true);
  assert.equal(propertyMatchesQuery(linkedProperty, "Lagos del Sol"), true);
});

test("el desarrollo administra enlaces, traducciones de imágenes y video sin cargar el binario en el catálogo", () => {
  const server = source("server.js");
  const app = source("app.js");
  const html = source("index.html");
  const seo = source("seo-pages.js");
  const schema = source("db/schema.sql");

  assert.match(html, /data-development-property-linker/);
  assert.match(app, /linkedPropertyIds: developmentMode \? selectedDevelopmentPropertyIds\(form\) : \[\]/);
  assert.match(server, /async function syncDevelopmentLinks/);
  assert.match(server, /SET parent_development_id = \$1/);
  assert.match(server, /requestAutomaticImageMetadataTranslation/);
  assert.match(schema, /CREATE TABLE IF NOT EXISTS property_videos/);
  assert.match(server, /app\.get\("\/media\/properties\/:id\/video"/);
  assert.match(server, /express\.raw\(\{ type: \["video\/mp4", "video\/webm"\]/);
  assert.match(seo, /\$\{videoSection\}\$\{gallery\}/);
  assert.match(seo, /Propiedades disponibles en este desarrollo/);
  assert.match(server, /item\.developmentId === developmentId/);
});
