const amenities = require("./development-amenities.json");

module.exports = {
  id: "20261126-reviewed-development-details",
  description: "Amenidades documentadas y punto oficial de La Amada",
  async up(client) {
    // Match the description that was reviewed. Respect later edits and existing amenity lists in either table.
    await client.query(`WITH reviewed AS (
        SELECT * FROM jsonb_to_recordset($1::jsonb) AS v(id text, title text, description_md5 text, amenities jsonb, planned boolean)
      ), updated AS (
        UPDATE properties p SET amenities = v.amenities,
          development_data = COALESCE(p.development_data, '{}') || jsonb_build_object('amenities', v.amenities, 'amenitiesPlanned', COALESCE(v.planned,false))
        FROM reviewed v WHERE p.id = v.id AND p.title_es = v.title AND p.publication_section = 'developments'
          AND md5(p.description_es) = v.description_md5 AND COALESCE(p.amenities,'[]') = '[]'
          AND COALESCE(p.development_data->'amenities','[]') = '[]'
          AND NOT EXISTS (SELECT 1 FROM developments d WHERE d.property_id = p.id AND COALESCE(d.amenities,'[]') <> '[]')
        RETURNING p.id, p.amenities
      ) UPDATE developments d SET amenities = u.amenities FROM updated u WHERE d.property_id = u.id`, [JSON.stringify(amenities)]);
    // These four listings name Lagos del Sol and carried the exact same point as the community.
    await client.query(`UPDATE properties p SET parent_development_id = d.id FROM developments d
      JOIN properties master ON master.id = d.property_id AND master.id = 'prop-7012bd50-561e-4e06-922d-9532a03ca626'
      WHERE p.id = ANY($1::text[]) AND p.parent_development_id IS NULL AND p.location_precision = 'exact'
        AND p.latitude = master.latitude AND p.longitude = master.longitude
        AND p.latitude = 21.05559 AND p.longitude = -86.849322
        AND concat_ws(' ', p.title_es, p.description_es, p.zone, p.neighborhood, p.address, p.map_place) ILIKE '%lagos del sol%'`,
      [["prop-b0ecfdd2-a223-4036-a3b0-4f7777c41189", "prop-a0a66a7d-bd68-4af1-b15b-4354b625a70b",
        "prop-78a44147-1581-46a6-a1db-c9efd86082c6", "prop-e9511fe9-5a2c-4531-a673-297329d7ffb8"]]);
    // Place pin linked by the development at https://laamada.com/ubicacion/.
    await client.query(`UPDATE properties SET latitude = 21.240692, longitude = -86.8032359,
      google_maps_url = 'https://www.google.com/maps/search/?api=1&query=21.240692,-86.8032359'
      WHERE id = 'prop-6c9ccecb-ba9f-4895-bc22-07a2a1c2812c' AND title_es = 'La Amada Residence'
        AND location_precision = 'exact' AND latitude = 21.240014 AND longitude = -86.802745`);
  },
};
