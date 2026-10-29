(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PccCsv = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function cell(value) {
    const text = String(value ?? "");
    // CSV quoting alone does not prevent spreadsheets from evaluating formulas.
    const safe = /^[\s\p{Cc}\p{Cf}]*[=+\-@]/u.test(text) ? "'" + text : text;
    return `"${safe.replace(/"/g, '""')}"`;
  }

  function stringify(rows, newline = "\r\n") {
    return rows.map((row) => row.map(cell).join(",")).join(newline);
  }

  return { cell, stringify };
});
