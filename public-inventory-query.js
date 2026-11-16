"use strict";

const inventory = require("./inventory-contract");
const { resolvePublicLocation } = require("./public-listing-details");

// Shared read-only geography for public catalogs, API results and saved searches.
// Keep the original inventory untouched: a verified display point is not a DB edit.
function createPublicLocationResolver(properties, options = {}) {
  const publicRows = properties.filter(inventory.isPublic);
  const directory = { ...options.directory, areas: options.areas || options.directory?.areas || inventory.LOCATIONS };
  const cache = new WeakMap();
  return row => {
    if (!cache.has(row)) cache.set(row, resolvePublicLocation(row.locationSource || row, {
      properties: publicRows, directory, lang: options.lang,
    }));
    return cache.get(row);
  };
}

function queryPublicInventory(properties, input = {}, options = {}) {
  return inventory.queryInventory(properties, input, {
    ...options,
    publicLocationFor: options.publicLocationFor || createPublicLocationResolver(properties, options),
  });
}

module.exports = { createPublicLocationResolver, queryPublicInventory };
