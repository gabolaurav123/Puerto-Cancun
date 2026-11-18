(function (root, factory) {
  const config = factory();
  if (typeof module === "object" && module.exports) module.exports = config;
  else root.PccContacts = config;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const contacts = [
    { id: "mx", label: "México", labelEn: "Mexico", number: "5219982166563", display: "+52 1 998 216 6563" },
    { id: "us", label: "USA", labelEn: "USA", number: "19568037838", display: "+1 956 803 7838" },
  ];
  function whatsappUrl(id = "mx", message = "", officeNumber = "") {
    const contact = contacts.find((item) => item.id === id) || contacts[0];
    const number = String(officeNumber || contact.number).replace(/\D/g, "");
    return `https://wa.me/${number}${message ? `?text=${encodeURIComponent(message)}` : ""}`;
  }
  return { contacts, whatsappUrl };
});
