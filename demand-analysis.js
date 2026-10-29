const inventory = require('./inventory-contract');
const { savedCatalogQuery } = require('./saved-catalog-search');

function analyzeDemand(searches, publicProperties) {
  const groups = new Map(), needsReview = [];
  let matched = 0;
  for (const search of searches) {
    const criteria = savedCatalogQuery(search.filters || {}, { queryText: search.query_text || '', properties: publicProperties });
    if (criteria.errors.length) { needsReview.push({ id: search.id, name: search.name, errors: criteria.errors }); continue; }
    const result = inventory.queryInventory(publicProperties, criteria);
    if (result.errors.length) { needsReview.push({ id: search.id, name: search.name, errors: result.errors }); continue; }
    if (result.total) { matched += 1; continue; }
    const key = inventory.toSearchParams({ ...criteria, locations: [...new Set(criteria.locations || [])].sort(), page: 1, sort: 'recent' }).toString();
    if (!groups.has(key)) groups.set(key, { criteria, searches: [] });
    groups.get(key).searches.push({ id: search.id, name: search.name, sellerId: search.seller_id, createdAt: search.created_at, updatedAt: search.updated_at });
  }
  return { analyzed: searches.length, matched, unmatched: [...groups.values()].reduce((sum, group) => sum + group.searches.length, 0), groups: [...groups.values()], needsReview };
}
module.exports = { analyzeDemand };
