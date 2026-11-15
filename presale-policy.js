(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory(require("./data/presale-review-20261115.json"));
  else root.PccPresalePolicy = factory({ records: [] });
})(typeof globalThis === "undefined" ? this : globalThis, function (review) {
  "use strict";
  const fold = value => String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  const entityOf = row => row?.publicationSection === "developments" || row?.entity === "developments" || row?.type === "Desarrollo" ? "developments" : "properties";
  const entries = new Map((review.records || []).map(entry => [entry.id, entry]));
  function reviewedRecord(record) {
    const entry = entries.get(record?.id);
    return entry && fold(entry.title) === fold(record.titleEs || record.titleEn) ? entry : null;
  }
  function imageIdentity(source) {
    if (typeof source !== "string" || !source) return "";
    try {
      const url = new URL(source, "https://www.puertocancun.center");
      if (!["http:", "https:"].includes(url.protocol)) return "";
      for (const key of ["w", "width", "q", "quality", "format", "fit", "dpr"]) url.searchParams.delete(key);
      url.searchParams.sort();
      const origin = ["puertocancun.center", "www.puertocancun.center"].includes(url.hostname) ? "" : url.origin;
      return origin + url.pathname + url.search;
    } catch { return ""; }
  }
  function reviewedImages(record, entry) {
    const evidence = entry?.images || record.portalPresale?.renderImages || [];
    const identities = new Set(evidence.filter(image => !image.kind || image.kind === "render").map(image => imageIdentity(image.source)).filter(Boolean));
    // Indices alone are not evidence: an administrator may reorder or replace a
    // gallery. The versioned media identity must still match the reviewed image.
    return (Array.isArray(record.images) ? record.images : []).flatMap((source, index) =>
      identities.has(imageIdentity(source)) ? [{ index, source, kind: "render" }] : []);
  }
  function explicitModality(record) {
    return record?.catalogData?.salesModality || record?.salesModality || (record?.type === "Preventa" ? "presale" : "unclassified");
  }
  function independentUnit(record) {
    return entityOf(record) !== "developments" && (record?.operation === "rent" || explicitModality(record) === "resale");
  }
  function conflict(record) {
    return /^(delivered|completed|closed|sold out|entregado|terminado|cerrado|agotado)$/i.test(String(record?.developmentData?.stage || record?.commercialStatus || "").trim());
  }
  function presaleState(record, { directory = {}, records = [] } = {}) {
    if (!record || typeof record !== "object") return { isPresale: false, status: "unclassified", renderImageIndices: [] };
    const entry = reviewedRecord(record);
    const renderImages = reviewedImages(record, entry), renderImageIndices = renderImages.map(image => image.index);
    const reviewEvidence = entry?.evidence || record.portalPresale?.reviewEvidence || "";
    const reviewChanged = Boolean((entry?.images || record.portalPresale?.renderImages)?.length && Array.isArray(record.images) && !renderImages.length);
    const base = { isPresale: false, status: "unclassified", projectId: "", developmentId: "", propertyId: entityOf(record) === "properties" ? record.id || "" : "", originalModality: record.portalPresale?.originalModality || explicitModality(record), renderImageIndices, renderImages, reviewEvidence };
    if (independentUnit(record)) return { ...base, status: "independent-property" };
    if (conflict(record)) return { ...base, status: "needs-verification", reason: "commercial-status-conflict" };
    const projects = (directory.presales || []).filter(project => project.status === "confirmed" || !project.status);
    const project = projects.find(item => (!reviewChanged || (item.evidence !== reviewEvidence && item.reviewedGallery !== true)) && (entityOf(record) === "developments" ? item.developmentId === record.id : (item.propertyIds || []).includes(record.id)));
    const explicit = base.originalModality === "presale";
    const approved = entry?.decision === "confirmed-presale" && !reviewChanged;
    const projected = record.portalPresale?.isPresale === true && !reviewChanged;
    if (!project && !explicit && !approved && !projected) return { ...base, status: reviewChanged || entry?.decision === "needs-verification" ? "needs-verification" : "unclassified", ...(reviewChanged ? { reason: "reviewed-gallery-changed" } : {}) };
    // A child is never inferred merely because its parent is a presale development.
    // Only its explicit modality, reviewed source or an explicit project unit list qualifies it.
    const developmentId = entityOf(record) === "developments" ? record.id : project?.developmentId || record.portalDevelopmentId || record.parentDevelopment?.propertyId || "";
    const parentExists = !developmentId || entityOf(record) === "developments" || !records.length || records.some(parent => parent.id === developmentId && entityOf(parent) === "developments");
    return { ...base, isPresale: true, status: "confirmed", projectId: project?.id || record.portalPresale?.projectId || (entityOf(record) === "developments" ? `presale-${record.id}` : ""),
      developmentId: parentExists ? developmentId : "", source: project ? "directory" : explicit ? "listing" : approved ? "review-20261115" : "public-projection" };
  }
  const isPresale = (record, context) => presaleState(record, context).isPresale;
  function inquiryPolicy(record, context) {
    const presale = presaleState(record, context);
    if (presale.isPresale) return { ...presale, intent: "buy", allowedIntents: ["buy"], contextType: "presale" };
    if (entityOf(record) === "developments") return { ...presale, intent: "buy", allowedIntents: ["buy", "rent", "sell", "let"], contextType: "development" };
    const intent = record?.operation === "rent" ? "rent" : "buy";
    return { ...presale, intent, allowedIntents: [intent], contextType: "property" };
  }
  function imagePresentation(record, index, lang = "es", source) {
    const state = presaleState(record);
    const identity = imageIdentity(source || record?.images?.[Number(index)]);
    const render = Boolean(identity && state.renderImages?.some(image => imageIdentity(image.source) === identity));
    return { kind: render ? "render" : "unspecified", label: render ? (lang === "en" ? "Architectural rendering" : "Render arquitectónico") : "" };
  }
  function reviewedCorrectionPlan(records, directory = {}) {
    const projects = new Set((directory.presales || []).flatMap(project => [project.developmentId, ...(project.propertyIds || [])]).filter(Boolean));
    const operations = records.flatMap(record => {
      const entry = reviewedRecord(record), state = presaleState(record, { records, directory });
      if (entry?.decision !== "confirmed-presale" || !state.isPresale) return [];
      return [{ id: record.id, title: record.titleEs || record.titleEn, entity: entityOf(record), action: "project-public-presale-state", sourceModality: explicitModality(record), publicModality: "presale", createDirectoryProject: !projects.has(record.id), imageIndices: state.renderImageIndices, evidence: entry.evidence }];
    });
    return { version: 1, reviewDate: "2026-11-15", mode: "NON_DESTRUCTIVE_PUBLIC_PROJECTION", databaseWrites: 0, operations };
  }
  return { presaleState, isPresale, inquiryPolicy, imagePresentation, reviewedRecord, reviewedCorrectionPlan };
});
