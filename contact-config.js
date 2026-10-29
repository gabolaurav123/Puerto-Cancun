(function (root, factory) {
  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  else root.PccContacts = config;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const contacts = [
    { id: "mx", label: "México", labelEn: "Mexico", number: "5219982166563", display: "+52 1 998 216 6563" },
    { id: "us", label: "USA", labelEn: "USA", number: "19562518956", display: "+1 956 251 8956" },
  ];
  function whatsappUrl(id = "mx", message = "") {
    const contact = contacts.find((item) => item.id === id) || contacts[0];
    return `https://wa.me/${contact.number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  }
  return { contacts, whatsappUrl };
});
