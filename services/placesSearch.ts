export interface PlaceSuggestion {
  id: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  if (!query || query.trim().length < 2) return [];

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=6&addressdetails=1&accept-language=en`;

  const res = await fetch(url, {
    headers: { 'User-Agent': 'GlidoApp/1.0' },
  });

  if (!res.ok) return [];

  const data = await res.json();

  return data.map((item: any) => {
    const a = item.address ?? {};
    const shortName =
      a.amenity || a.road || a.neighbourhood || a.suburb || a.town || a.city || item.name || '';
    const city = a.city || a.town || a.county || '';
    const country = a.country || '';
    const addressLine = [city, country].filter(Boolean).join(', ');

    return {
      id: item.place_id?.toString() ?? Math.random().toString(),
      name: shortName || item.display_name.split(',')[0],
      address: addressLine || item.display_name,
      lat: parseFloat(item.lat),
      lon: parseFloat(item.lon),
    };
  });
}
