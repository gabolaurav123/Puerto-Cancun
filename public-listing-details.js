function safePublicImages(property) {
  const images = [
    ...(Array.isArray(property.images) ? property.images : []),
    ...(Array.isArray(property.developmentImages) ? property.developmentImages : []),
  ];
  return [...new Set(images)].filter((image) => /^https?:\/\//i.test(image) || /^\/media\//.test(image) || /^\/assets\//.test(image));
}

function optimizedPublicImage(image, width) {
  if (!/^\/media\/properties\//.test(String(image || ""))) return image;
  const separator = String(image).includes("?") ? "&" : "?";
  return `${image}${separator}w=${width}`;
}

function localizedAmenity(amenity, lang = "es") {
  if (lang !== "en") return amenity;
  const key = String(amenity || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
  return {
    "acceso a playa": "Beach access",
    "acceso a playa privada": "Private beach access",
    alberca: "Swimming pool",
    albercas: "Swimming pools",
    "cancha de tenis": "Tennis court",
    "canchas deportivas": "Sports courts",
    cenote: "Cenote",
    "centro de negocios": "Business center",
    ciclovia: "Bike path",
    "club de playa": "Beach club",
    elevador: "Elevator",
    "frente a marina": "Marina front",
    "frente a playa": "Beachfront",
    "frente al mar": "Oceanfront",
    gimnasio: "Gym",
    jacuzzi: "Jacuzzi",
    malecon: "Waterfront promenade",
    marina: "Marina",
    muelle: "Dock",
    palapa: "Palapa",
    "playa privada": "Private beach",
    "salon de usos multiples": "Multipurpose room",
    seguridad: "Security",
    "seguridad 24/7": "24/7 security",
    "senderos peatonales": "Walking paths",
    spa: "Spa",
    "terraza - bar": "Terrace bar",
    "vista a la marina": "Marina view",
  }[key] || amenity;
}

module.exports = { safePublicImages, optimizedPublicImage, localizedAmenity };
