"""Read five XLSX sources without evaluating formulas or saving workbooks."""

import collections
import datetime
import hashlib
import json
import pathlib
import re
import unicodedata
import urllib.parse
import zipfile

import openpyxl


REPO = pathlib.Path(__file__).resolve().parents[1]
WORKSPACE = REPO.parent.parent
PRIOR = WORKSPACE / "output/excel-import-20261026"
OUT = WORKSPACE / "output/master-20261029/audit"
DOWNLOADS = pathlib.Path.home() / "Downloads"
FILES = [
    "Inventario_Corredor_Colosio_41_Desarrollos_Ubicaciones_Google_Maps_Funcionales (1).xlsx",
    "Puerto_Cancun_45_Desarrollos_Descripcion_Comercial_Optimizada_CON_UBICACIONES (1).xlsx",
    "Inventario_Residenciales_Lujo_Zona_Hotelera_Cancun_2026_CON_UBICACIONES.xlsx",
    "Inventario_Residenciales_Lujo_Costa_Mujeres_Punta_Sam_2026_CON_UBICACIONES.xlsx",
    "Inventario_Residenciales_Alto_Nivel_Av_Huayacan_Cancun_2026_Google_Maps.xlsx",
]


def sha(data):
    return hashlib.sha256(data).hexdigest()


def canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), default=str)


def norm(value):
    value = unicodedata.normalize("NFKD", str(value or "")).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", " ", value).strip()


def urls(value):
    return re.findall(r'https?://[^\s<>"|]+', str(value or ""))


def link_type(url):
    parsed = urllib.parse.urlsplit(url)
    if "/maps/search/" in parsed.path:
        return "map-search-not-coordinate"
    if re.search(r"\.(?:jpg|jpeg|png|webp|avif)$", urllib.parse.unquote(parsed.path), re.I):
        return "image-url-candidate-unverified"
    return "reference-or-gallery-unverified"


def read_json(name):
    return json.loads((PRIOR / name).read_text(encoding="utf-8"))


def main():
    manifest = read_json("import-manifest.json")
    preflight = read_json("preflight.json")
    old_hashes = {pathlib.Path(b["path"]).name: b["sha256"] for b in manifest["sourceHashes"]}
    old_rows = {(pathlib.Path(r["sourceFile"]).name, r["sourceSheet"], r["sourceRow"]): r for r in preflight["rows"]}
    books, rows, links, related_cells = [], [], [], []
    needles = ["1707", "N1412", "1017", "1882", "188", "1944", "2015"]
    projects = ["novo cancun", "sls harbour", "allure", "x towers", "la amada", "aldea zama", "portofino", "punta cancun"]
    for filename in FILES:
        source = DOWNLOADS / filename
        original_hash = sha(source.read_bytes())
        # Normal mode exposes hyperlink relationships. No workbook save API is used.
        wb = openpyxl.load_workbook(source, read_only=False, data_only=False, keep_links=True)
        sheets = []
        main_sheets = []
        for sheet in wb.worksheets:
            populated = [row for row in sheet.iter_rows() if any(c.value is not None for c in row)]
            header = populated[0] if populated else []
            header_values = [c.value for c in header]
            is_main = any(norm(v) == "descripcion general" for v in header_values) and any(norm(v) == "enlace representativo" for v in header_values)
            numbered = [row for row in populated[1:] if isinstance(row[0].value, (int, float)) and not isinstance(row[0].value, bool) and len(row) > 1 and row[1].value]
            if is_main:
                main_sheets.append(sheet.title)
            formulas, formats = [], collections.Counter()
            embedded_count = text_url_count = 0
            for row in populated:
                for cell in row:
                    if cell.value is None:
                        continue
                    formats[cell.number_format] += 1
                    if cell.data_type == "f":
                        formulas.append({"cell": cell.coordinate, "sha256": sha(str(cell.value).encode())})
                    destinations = [(u, "text") for u in urls(cell.value)]
                    if cell.hyperlink:
                        embedded_count += 1
                        destinations.append((cell.hyperlink.target or cell.hyperlink.location or "", "hyperlink"))
                    for url, origin in destinations:
                        if origin == "text":
                            text_url_count += 1
                        links.append({"file": filename, "sheet": sheet.title, "cell": cell.coordinate, "origin": origin, "url": url, "kind": link_type(url), "resolution": "not-fetched"})
                    matched = [key for key in needles if re.search(r"(?<![A-Za-z0-9])" + re.escape(key) + r"(?![A-Za-z0-9])", str(cell.value), re.I)]
                    names = [key for key in projects if key in norm(cell.value)]
                    if matched or names:
                        related_cells.append({"file": filename, "sheet": sheet.title, "cell": cell.coordinate, "exactTokens": matched, "projectTerms": names, "value": cell.value})
            sheets.append({
                "name": sheet.title, "state": sheet.sheet_state, "role": "development-inventory" if is_main else "supporting-records" if numbered else "guide",
                "dimension": sheet.calculate_dimension(), "actualNonemptyRows": len(populated), "numberedDataRows": len(numbered),
                "headerRow": header[0].row if header else None, "columns": [{"column": c.column_letter, "label": c.value} for c in header],
                "usedColumns": max((c.column for row in populated for c in row if c.value is not None), default=0),
                "nonemptyCells": sum(c.value is not None for row in populated for c in row),
                "textUrlOccurrences": text_url_count, "hyperlinkCells": embedded_count, "formulas": formulas,
                "numberFormats": dict(formats), "mergedRanges": [str(r) for r in sheet.merged_cells.ranges],
            })
            if not is_main:
                continue
            for row in numbered:
                cells = [{"column": c.column_letter, "value": c.value, "type": c.data_type, "format": c.number_format,
                          "hyperlink": (c.hyperlink.target or c.hyperlink.location) if c.hyperlink else None} for c in row]
                row_hash = sha(canonical(cells).encode())
                number, title, description, reference, photo, address, maps = [c.value for c in row]
                old = old_rows.get((filename, sheet.title, row[0].row))
                fields = dict(zip(["number", "title", "description", "representativeUrl", "photoOrGalleryUrl", "addressReference", "googleMapsUrl"], [c.value for c in row]))
                rows.append({
                    "file": filename, "sheet": sheet.title, "row": row[0].row, "sourceSha256": original_hash,
                    "rowSha256": row_hash, "sourceRowKey": sha(canonical([original_hash, sheet.title, row[0].row, row_hash]).encode()),
                    "nameKey": norm(title), **fields,
                    "priorPreflightMatched": bool(old), "priorValueDifferences": [key for key, value in fields.items() if old and old.get(key) != value],
                })
        wb.close()
        with zipfile.ZipFile(source) as archive:
            parts = archive.namelist()
            media = [p for p in parts if p.startswith("xl/media/")]
            external = [p for p in parts if p.startswith("xl/externalLinks/") and p.endswith(".xml")]
            macros = [p for p in parts if "vbaproject" in p.lower()]
        assert sha(source.read_bytes()) == original_hash, "Workbook changed during read"
        books.append({"file": filename, "path": str(source), "bytes": source.stat().st_size, "sha256": original_hash,
                      "matchesImportedSourceHash": original_hash == old_hashes.get(filename), "mainSheets": main_sheets,
                      "sheets": sheets, "embeddedMediaFiles": len(media), "externalLinkParts": len(external), "macroParts": len(macros)})
    groups = collections.defaultdict(list)
    for row in rows:
        groups[row["nameKey"]].append({"file": row["file"], "sheet": row["sheet"], "row": row["row"], "title": row["title"], "rowSha256": row["rowSha256"]})
    result = {"capturedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "mode": "READ_ONLY_NO_IMPORT",
              "rowHashDefinition": "SHA256 of UTF-8 canonical JSON, sorted keys, compact separators, unescaped Unicode; full ordered cells with column,value,type,format,hyperlink. sourceRowKey includes file SHA256,sheet,row,row SHA256.",
              "books": books, "summary": {"files": len(books), "sheets": sum(len(b["sheets"]) for b in books),
              "actualNonemptyRowsAllSheets": sum(s["actualNonemptyRows"] for b in books for s in b["sheets"]),
              "mainDataRows": len(rows), "normalizedNameGroups": len(groups), "extraNameOccurrences": len(rows) - len(groups),
              "duplicateNameGroups": sum(len(g) > 1 for g in groups.values()),
              "hyperlinkCells": sum(s["hyperlinkCells"] for b in books for s in b["sheets"]),
              "textUrlOccurrences": sum(s["textUrlOccurrences"] for b in books for s in b["sheets"]),
              "formulaCells": sum(len(s["formulas"]) for b in books for s in b["sheets"]),
              "mainMapSearchRows": sum(link_type(r["googleMapsUrl"] or "") == "map-search-not-coordinate" for r in rows)},
              "duplicateGroups": [g for g in groups.values() if len(g) > 1], "rows": rows, "links": links, "caseSourceCells": related_cells}
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "xlsx-evidence.json").write_text(json.dumps(result, ensure_ascii=False, indent=2, default=str) + "\n", encoding="utf-8")
    print(json.dumps(result["summary"], ensure_ascii=True))


if __name__ == "__main__":
    main()
