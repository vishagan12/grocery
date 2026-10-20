import { NextRequest, NextResponse } from 'next/server';
import { calculateDistanceKm, isWithinDeliveryRadius, DEFAULT_SHOP_COORDS } from '@/lib/geofence';
import { fetchWithTimeout, validateSafeExternalUrl } from '@/lib/resilience';

export interface PlaceSuggestion {
  id: string;
  title: string;          // Main place / building / street name
  subtitle: string;       // Area, Madurai, Pincode
  fullAddress: string;    // Complete formatted string
  houseNo: string;        // Extracted Door / Plot / Flat / Building name
  street: string;         // Extracted Street / Main Road / Cross Street
  area: string;           // Extracted Locality / Suburb / Nagar
  landmark: string;       // Extracted nearby POI / Landmark if present
  city: string;           // 'Madurai'
  pincode: string;        // 6-digit Madurai pincode (625xxx)
  lat: number;
  lng: number;
  distanceKm: number;
  deliverable: boolean;   // distanceKm <= 3.0
}

interface MaduraiLocality {
  name: string;
  street: string;
  area: string;
  pincode: string;
  lat: number;
  lng: number;
  landmark?: string;
  aliases?: string[];
}

// Built-in Instant Madurai Micro-Locality & Street Index (Tier 1 - 0ms Instant Match)
const MADURAI_LOCALITIES: MaduraiLocality[] = [
  // Immediate Vicinity (<3km of Sri Amman Supermarket near K.Pudur / Moondrumavadi)
  { name: 'K.Pudur', street: 'Alagar Kovil Main Road', area: 'K.Pudur', pincode: '625007', lat: 9.9575, lng: 78.1528, landmark: 'K.Pudur Bus Stand', aliases: ['pudur', 'k pudur'] },
  { name: 'Surveyor Colony', street: 'Surveyor Colony Main Road', area: 'Surveyor Colony', pincode: '625007', lat: 9.9680, lng: 78.1630, landmark: 'Surveyor Colony Junction', aliases: ['surveyor'] },
  { name: 'Moondrumavadi', street: 'Alagar Kovil Road', area: 'Moondrumavadi', pincode: '625007', lat: 9.9720, lng: 78.1650, landmark: 'Moondrumavadi Bus Stop', aliases: ['moondru mavadi', '3 mavadi'] },
  { name: 'Alagar Kovil Main Road', street: 'Alagar Kovil Main Road', area: 'K.Pudur', pincode: '625002', lat: 9.9610, lng: 78.1560, landmark: 'Sri Amman Supermarket Junction', aliases: ['alagar kovil', 'alagar koil road'] },
  { name: 'Mattuthavani', street: 'Melur Main Road', area: 'Mattuthavani', pincode: '625007', lat: 9.9472, lng: 78.1625, landmark: 'MGR Integrated Bus Stand', aliases: ['mattuthavani bus stand', 'integrated bus stand'] },
  { name: 'Karpaga Nagar', street: 'Karpaga Nagar 8th Street', area: 'K.Pudur', pincode: '625007', lat: 9.9620, lng: 78.1510, landmark: 'Karpaga Nagar Community Hall', aliases: ['karpagam nagar'] },
  { name: 'Meenakshi Nagar', street: 'Meenakshi Nagar Main Road', area: 'K.Pudur', pincode: '625007', lat: 9.9660, lng: 78.1590, landmark: 'Sri Amman Temple', aliases: ['meenakshi nagar pudur'] },
  { name: 'Pandian Nagar', street: 'Pandian Nagar Road', area: 'K.Pudur', pincode: '625007', lat: 9.9640, lng: 78.1620, landmark: 'Pandian Matriculation School', aliases: ['pandiyan nagar'] },
  { name: 'Tagore Nagar', street: 'Tagore Nagar Main Road', area: 'K.Pudur', pincode: '625007', lat: 9.9670, lng: 78.1560, landmark: 'Tagore School', aliases: ['tagor nagar'] },
  { name: 'Grace Nagar', street: 'Grace Nagar 2nd Cross', area: 'K.Pudur', pincode: '625007', lat: 9.9650, lng: 78.1530, landmark: 'Grace Church', aliases: ['grace nagar'] },
  { name: 'Teachers Colony', street: 'Teachers Colony Main Road', area: 'Moondrumavadi', pincode: '625007', lat: 9.9690, lng: 78.1590, landmark: 'Teachers Welfare Association', aliases: ['teachers colony'] },
  { name: 'Bharathi Nagar', street: 'Bharathi Nagar 1st Street', area: 'K.Pudur', pincode: '625007', lat: 9.9620, lng: 78.1550, landmark: 'Bharathi Community Hall', aliases: ['barathi nagar'] },
  { name: 'Athikulam', street: 'Athikulam Main Road', area: 'Athikulam', pincode: '625014', lat: 9.9550, lng: 78.1430, landmark: 'Athikulam Water Tank', aliases: ['aathikulam'] },
  { name: 'Surya Nagar', street: 'Surya Nagar 1st Street', area: 'Surya Nagar', pincode: '625014', lat: 9.9685, lng: 78.1480, landmark: 'Surya Nagar Park', aliases: ['soorya nagar'] },
  { name: 'Bank Colony', street: 'Bank Colony Road', area: 'Iyer Bungalow', pincode: '625014', lat: 9.9710, lng: 78.1490, landmark: 'Bank of India Colony', aliases: ['bank colony'] },
  { name: 'EB Colony', street: 'EB Colony Main Street', area: 'Iyer Bungalow', pincode: '625014', lat: 9.9700, lng: 78.1450, landmark: 'TNEB Substation', aliases: ['electricity board colony'] },
  { name: 'Iyer Bungalow', street: 'Natham Main Road', area: 'Iyer Bungalow', pincode: '625014', lat: 9.9740, lng: 78.1420, landmark: 'Iyer Bungalow Signal', aliases: ['iyar bungalow', 'iyer bunglow'] },
  { name: 'Reserve Line', street: 'Reserve Line Road', area: 'Reserve Line', pincode: '625014', lat: 9.9520, lng: 78.1390, landmark: 'Armed Reserve Police Ground', aliases: ['ar ground', 'reserve line'] },
  { name: 'Vishwanathapuram', street: 'Viswanathapuram Main Road', area: 'Vishwanathapuram', pincode: '625014', lat: 9.9650, lng: 78.1350, landmark: 'Viswanathapuram Post Office', aliases: ['viswanathapuram'] },
  { name: 'Uthangudi', street: 'Sivagangai Road', area: 'Uthangudi', pincode: '625107', lat: 9.9540, lng: 78.1750, landmark: 'Madurai High Court Bench', aliases: ['uthangudi junction'] },
  { name: 'Melur Road', street: 'Melur Main Road', area: 'Uthangudi', pincode: '625107', lat: 9.9580, lng: 78.1690, landmark: 'Agricultural College Junction', aliases: ['melur road'] },

  // Greater Madurai Locations
  { name: 'KK Nagar', street: '80 Feet Road', area: 'KK Nagar', pincode: '625020', lat: 9.9280, lng: 78.1520, landmark: 'KK Nagar Arch & Walkers Park', aliases: ['k.k. nagar', 'k k nagar'] },
  { name: 'Anna Nagar', street: 'Kuruvikaran Salai', area: 'Anna Nagar', pincode: '625020', lat: 9.9180, lng: 78.1480, landmark: 'Ambika Theatre Junction', aliases: ['annanagar'] },
  { name: 'Tallakulam', street: 'Alagar Kovil Road', area: 'Tallakulam', pincode: '625002', lat: 9.9360, lng: 78.1380, landmark: 'Tallakulam Perumal Kovil', aliases: ['thallakulam'] },
  { name: 'Goripalayam', street: 'Goripalayam Junction', area: 'Goripalayam', pincode: '625002', lat: 9.9290, lng: 78.1320, landmark: 'Thevar Statue', aliases: ['goripalaiyam'] },
  { name: 'Simmakkal', street: 'North Veli Street', area: 'Simmakkal', pincode: '625001', lat: 9.9240, lng: 78.1220, landmark: 'Simmakkal Roundabout', aliases: ['simmakal'] },
  { name: 'Sellur', street: 'Sellur 50 Feet Road', area: 'Sellur', pincode: '625002', lat: 9.9390, lng: 78.1210, landmark: 'Sellur Roundabout', aliases: ['sellur'] },
  { name: 'Narimedu', street: 'Lady Doak College Road', area: 'Narimedu', pincode: '625002', lat: 9.9390, lng: 78.1350, landmark: 'Lady Doak College', aliases: ['narimedu'] },
  { name: 'BB Kulam', street: 'PT Rajan Road', area: 'BB Kulam', pincode: '625002', lat: 9.9450, lng: 78.1360, landmark: 'Income Tax Office', aliases: ['b b kulam', 'bebe kulam'] },
  { name: 'Chokikulam', street: 'Gokhale Road', area: 'Chokikulam', pincode: '625002', lat: 9.9380, lng: 78.1390, landmark: 'Visalam Hospital', aliases: ['chokkikulam'] },
  { name: 'Shenoy Nagar', street: 'Shenoy Nagar 1st Street', area: 'Shenoy Nagar', pincode: '625020', lat: 9.9320, lng: 78.1380, landmark: 'Shenoy Nagar Park', aliases: ['shenoy nagar'] },
  { name: 'Gomathipuram', street: 'Gomathipuram Main Road', area: 'Gomathipuram', pincode: '625020', lat: 9.9120, lng: 78.1640, landmark: 'Vandiyur Lake View', aliases: ['gomathipuram'] },
  { name: 'Vandiyur', street: 'Vandiyur Ring Road', area: 'Vandiyur', pincode: '625020', lat: 9.9210, lng: 78.1720, landmark: 'Vandiyur Tollgate', aliases: ['vandiyoor'] },
  { name: 'Melamadai', street: 'Sivaganga Road', area: 'Melamadai', pincode: '625020', lat: 9.9240, lng: 78.1610, landmark: 'Apollo Speciality Hospitals', aliases: ['mela madai'] },
  { name: 'Othakadai', street: 'Melur Road', area: 'Othakadai', pincode: '625107', lat: 9.9790, lng: 78.1880, landmark: 'Yanaimalai Foothills', aliases: ['othakkadai'] },
  { name: 'Anaiyur', street: 'Anaiyur Main Road', area: 'Anaiyur', pincode: '625017', lat: 9.9750, lng: 78.1180, landmark: 'Anaiyur Bus Stop', aliases: ['anaiyur'] },
  { name: 'Koodal Nagar', street: 'Koodal Nagar Main Road', area: 'Koodal Nagar', pincode: '625018', lat: 9.9620, lng: 78.1080, landmark: 'Koodal Nagar Railway Station', aliases: ['koodalnagar'] },
  { name: 'Sikandar Savadi', street: 'Alanganallur Road', area: 'Sikandar Savadi', pincode: '625018', lat: 9.9820, lng: 78.1020, landmark: 'Dargah Junction', aliases: ['sikandar chavadi'] },
  { name: 'Vilangudi', street: 'Dindigul Main Road', area: 'Vilangudi', pincode: '625018', lat: 9.9580, lng: 78.0980, landmark: 'Fatima College', aliases: ['vilangudi'] },
  { name: 'SS Colony', street: 'Bypass Road', area: 'SS Colony', pincode: '625016', lat: 9.9180, lng: 78.1010, landmark: 'Milan Tex', aliases: ['s s colony', 'sscolony'] },
  { name: 'Bypass Road', street: 'Bypass Road', area: 'Kalavasal', pincode: '625016', lat: 9.9220, lng: 78.1020, landmark: 'Hotel Germanus / Guru Hotel', aliases: ['bye pass road'] },
  { name: 'Kalavasal', street: 'Theni Main Road', area: 'Kalavasal', pincode: '625016', lat: 9.9290, lng: 78.0980, landmark: 'Kalavasal Junction Flyover', aliases: ['kalavaasal'] },
  { name: 'Arasaradi', street: 'Ellis Nagar Main Road', area: 'Arasaradi', pincode: '625016', lat: 9.9270, lng: 78.1090, landmark: 'Railway Officers Club', aliases: ['arasaradi'] },
  { name: 'Ellis Nagar', street: '70 Feet Road', area: 'Ellis Nagar', pincode: '625016', lat: 9.9150, lng: 78.1120, landmark: 'TNHB Shopping Complex', aliases: ['ellisnagar'] },
  { name: 'Periyar', street: 'West Veli Street', area: 'Periyar', pincode: '625001', lat: 9.9160, lng: 78.1170, landmark: 'Periyar Bus Stand', aliases: ['periyar bus stand'] },
  { name: 'Tirupparankundram', street: 'GST Road', area: 'Tirupparankundram', pincode: '625005', lat: 9.8820, lng: 78.0720, landmark: 'Subramanya Swamy Temple', aliases: ['thiruparankundram', 'tpk'] },
  { name: 'Pasumalai', street: 'GST Road', area: 'Pasumalai', pincode: '625004', lat: 9.8960, lng: 78.0830, landmark: 'Harvey Patti / Pasumalai Hill', aliases: ['pasumalai'] },
  { name: 'TVS Nagar', street: 'Subramaniapuram Main Road', area: 'TVS Nagar', pincode: '625003', lat: 9.8990, lng: 78.0960, landmark: 'TVS Community Hall', aliases: ['t.v.s. nagar'] },
  { name: 'Palanganatham', street: 'Bypass Road', area: 'Palanganatham', pincode: '625003', lat: 9.9040, lng: 78.1040, landmark: 'Palanganatham Signal', aliases: ['palangatham'] },
  { name: 'Villapuram', street: 'Aruppukottai Main Road', area: 'Villapuram', pincode: '625012', lat: 9.8960, lng: 78.1290, landmark: 'Villapuram Housing Board', aliases: ['villa puram'] },
  { name: 'Avaniyapuram', street: 'Aruppukottai Road', area: 'Avaniyapuram', pincode: '625012', lat: 9.8780, lng: 78.1250, landmark: 'Jallikattu Ground', aliases: ['avaniapuram'] },
  { name: 'Teppakulam', street: 'East Veli Street', area: 'Teppakulam', pincode: '625009', lat: 9.9140, lng: 78.1510, landmark: 'Mariamman Teppakulam', aliases: ['theppakulam'] },
  { name: 'Munichalai', street: 'Kamarajar Salai', area: 'Munichalai', pincode: '625009', lat: 9.9160, lng: 78.1360, landmark: 'Munichalai Junction', aliases: ['munichalai'] },
  { name: 'Kamarajar Salai', street: 'Kamarajar Salai', area: 'Teppakulam', pincode: '625009', lat: 9.9150, lng: 78.1420, landmark: 'Nirmala Girls School', aliases: ['kamarajar street'] },
  { name: 'Jaihindpuram', street: 'Jaihindpuram 2nd Street', area: 'Jaihindpuram', pincode: '625011', lat: 9.9070, lng: 78.1120, landmark: 'Veerakali Amman Temple', aliases: ['jaihind puram'] },
  { name: 'Subramaniapuram', street: 'Subramaniapuram Main Road', area: 'Subramaniapuram', pincode: '625011', lat: 9.9080, lng: 78.1050, landmark: 'Corporation Ward Office', aliases: ['subramaniapuram'] },
  { name: 'Arapalayam', street: 'Palam Station Road', area: 'Arapalayam', pincode: '625016', lat: 9.9320, lng: 78.1080, landmark: 'Arapalayam Bus Stand', aliases: ['aarapalayam'] },
  { name: 'Ponnagaram', street: 'Ponnagaram Broadway', area: 'Ponnagaram', pincode: '625016', lat: 9.9280, lng: 78.1140, landmark: 'Ponnagaram Market', aliases: ['ponnagaram'] },
  { name: 'Kochadai', street: 'Theni Main Road', area: 'Kochadai', pincode: '625016', lat: 9.9370, lng: 78.0790, landmark: 'Fenner India Factory', aliases: ['kochadai'] },
  { name: 'HMS Colony', street: 'Theni Main Road', area: 'HMS Colony', pincode: '625016', lat: 9.9250, lng: 78.0890, landmark: 'HMS Kalyana Mandapam', aliases: ['h.m.s. colony'] },
  { name: 'Fenner Colony', street: 'Fenner Colony Road', area: 'Kochadai', pincode: '625016', lat: 9.9290, lng: 78.0830, landmark: 'Fenner Staff Quarters', aliases: ['fenner colony'] },

  // Key Commercial POIs & Landmarks
  { name: 'Vishaal De Mall', street: 'Gokhale Road', area: 'Chokikulam', pincode: '625002', lat: 9.9348, lng: 78.1362, landmark: 'Inox Cinemas / Vishaal De Mall', aliases: ['vishal de mall', 'vishal mall'] },
  { name: "Milan'Em Mall", street: '80 Feet Road', area: 'KK Nagar', pincode: '625020', lat: 9.9312, lng: 78.1512, landmark: "Milan'Em Shopping Mall", aliases: ['milan em mall', 'milanem'] },
  { name: 'Agrini Apartments', street: 'Andalpuram Road', area: 'Andalpuram', pincode: '625003', lat: 9.9140, lng: 78.1060, landmark: 'Agrini Gated Community', aliases: ['agrini', 'agrini township'] },
  { name: 'Apollo Speciality Hospitals', street: 'Lake View Road', area: 'KK Nagar', pincode: '625020', lat: 9.9272, lng: 78.1585, landmark: 'Apollo Hospital Madurai', aliases: ['apollo hospital'] },
  { name: 'Meenakshi Amman Temple', street: 'South Chithirai Street', area: 'Madurai Main', pincode: '625001', lat: 9.9195, lng: 78.1193, landmark: 'Meenakshi Temple South Tower', aliases: ['meenakshi temple', 'amman temple'] },
];

/**
 * Extracts leading door / plot / flat number from user query
 * e.g. "12B KK Nagar" -> houseNo: "12B", cleanQuery: "KK Nagar"
 * "No. 45 Anna Nagar" -> houseNo: "No. 45", cleanQuery: "Anna Nagar"
 */
function extractDoorAndQuery(rawQuery: string): { houseNo: string; cleanQuery: string } {
  const trimmed = rawQuery.trim();
  const doorPattern = /^(?:(no\.?\s*|door\s*(?:no\.?)?\s*|flat\s*(?:no\.?)?\s*|plot\s*(?:no\.?)?\s*|#\s*))?([0-9]+[a-zA-Z\/\-0-9]*)\b[,\s]*/i;
  const match = trimmed.match(doorPattern);

  if (match) {
    const prefix = match[1] ? match[1].trim() + ' ' : '';
    const num = match[2];
    const houseNo = `${prefix}${num}`.trim();
    const cleanQuery = trimmed.slice(match[0].length).trim();
    return {
      houseNo,
      cleanQuery: cleanQuery.length >= 2 ? cleanQuery : trimmed,
    };
  }

  return { houseNo: '', cleanQuery: trimmed };
}

/**
 * Finds the closest Madurai locality from our dataset to infer a reliable 625xxx pincode
 */
function inferPincodeByCoordsOrArea(area: string, lat: number, lng: number): string {
  const norm = area.toLowerCase().trim();
  const match = MADURAI_LOCALITIES.find(
    (l) => l.name.toLowerCase() === norm || l.area.toLowerCase() === norm || l.aliases?.some((a) => a === norm)
  );
  if (match) return match.pincode;

  // Find nearest by coordinates
  let nearestPincode = '625007';
  let minDist = Infinity;
  for (const loc of MADURAI_LOCALITIES) {
    const d = calculateDistanceKm(loc.lat, loc.lng, lat, lng);
    if (d < minDist) {
      minDist = d;
      nearestPincode = loc.pincode;
    }
  }
  return nearestPincode;
}

/**
 * Smart Address Fallback Parser so NO field is ever left blank
 */
function parseAddressParts(
  rawText: string,
  userQuery: string,
  apiParts: Partial<PlaceSuggestion>,
  shopLat: number,
  shopLng: number
): PlaceSuggestion {
  const { houseNo: extractedHouseNo } = extractDoorAndQuery(userQuery);
  const houseNo = apiParts.houseNo || extractedHouseNo || '';

  const lat = apiParts.lat || shopLat;
  const lng = apiParts.lng || shopLng;

  let street = apiParts.street || '';
  let area = apiParts.area || '';
  let landmark = apiParts.landmark || '';

  // If street or area are missing, derive from rawText or title
  if (!street || !area) {
    const parts = (rawText || apiParts.title || '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (!street) {
      street = parts[0] || apiParts.title || 'Main Road';
    }
    if (!area) {
      area = parts.length > 1 ? parts[1] : 'Madurai';
    }
  }

  // Clean area of generic names
  if (area.toLowerCase() === 'tamil nadu' || area.toLowerCase() === 'india') {
    area = 'Madurai';
  }

  let pincode = apiParts.pincode || '';
  if (!pincode || !/^625\d{3}$/.test(pincode)) {
    const pinMatch = (rawText || '').match(/\b(625\d{3})\b/);
    pincode = pinMatch ? pinMatch[1] : inferPincodeByCoordsOrArea(area, lat, lng);
  }

  const distanceKm = calculateDistanceKm(shopLat, shopLng, lat, lng);
  const deliverable = isWithinDeliveryRadius(distanceKm);

  const title = houseNo
    ? `${houseNo}, ${street || area}`
    : apiParts.title || street || area;

  const subtitle = `${area}, Madurai - ${pincode}`;

  const addressTokens = [houseNo, street, area, 'Madurai', pincode]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i);

  const fullAddress = addressTokens.join(', ');

  return {
    id: apiParts.id || `sug-${Math.random().toString(36).substring(2, 9)}`,
    title,
    subtitle,
    fullAddress,
    houseNo,
    street,
    area,
    landmark,
    city: 'Madurai',
    pincode,
    lat,
    lng,
    distanceKm,
    deliverable,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawQ = searchParams.get('q')?.trim() || '';
  const latParam = searchParams.get('lat');
  const lngParam = searchParams.get('lng');

  const shopLat = parseFloat(searchParams.get('shopLat') || '') || DEFAULT_SHOP_COORDS.lat;
  const shopLng = parseFloat(searchParams.get('shopLng') || '') || DEFAULT_SHOP_COORDS.lng;

  const googleApiKey = process.env.GOOGLE_MAPS_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  // 1. REVERSE GEOCODING (GPS DETECTION)
  if (latParam && lngParam) {
    const userLat = parseFloat(latParam);
    const userLng = parseFloat(lngParam);

    if (isNaN(userLat) || isNaN(userLng)) {
      return NextResponse.json({ error: 'Invalid coordinates' }, { status: 400 });
    }

    // Engine A: Google Geocoding API if key present
    if (googleApiKey) {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${userLat},${userLng}&key=${googleApiKey}`;
        if (validateSafeExternalUrl(gUrl)) {
          const gRes = await fetchWithTimeout(gUrl, {}, 3500);
          const gData = await gRes.json();
          if (gData.status === 'OK' && Array.isArray(gData.results) && gData.results.length > 0) {
            const first = gData.results[0];
            const components = first.address_components || [];

            let houseNo = '';
            let street = '';
            let area = '';
            let landmark = '';
            let pincode = '';

            for (const comp of components) {
              const types = comp.types || [];
              if (types.includes('street_number') || types.includes('subpremise') || types.includes('premise')) {
                houseNo = comp.long_name;
              } else if (types.includes('route')) {
                street = comp.long_name;
              } else if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood')) {
                if (!area) area = comp.long_name;
              } else if (types.includes('point_of_interest') || types.includes('establishment')) {
                landmark = comp.long_name;
              } else if (types.includes('postal_code')) {
                pincode = comp.long_name;
              }
            }

            const parsed = parseAddressParts(
              first.formatted_address || '',
              '',
              {
                id: `g-rev-${first.place_id || 'gps'}`,
                title: houseNo ? `${houseNo}, ${street || area}` : street || area || 'Current Location',
                houseNo,
                street,
                area,
                landmark,
                pincode,
                lat: userLat,
                lng: userLng,
              },
              shopLat,
              shopLng
            );

            return NextResponse.json({ suggestions: [parsed] });
          }
        }
      } catch (err) {
        console.warn('Google reverse geocode failed, falling back to OSM:', err);
      }
    }

    // Engine B: OpenStreetMap Nominatim Reverse
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${userLat}&lon=${userLng}&addressdetails=1`;
      if (validateSafeExternalUrl(nomUrl)) {
        const nomRes = await fetchWithTimeout(
          nomUrl,
          {
            headers: {
              'User-Agent': 'SriAmmanSupermarketMadurai/2.0 (contact@sriammansupermarket.in)',
              'Accept-Language': 'en',
            },
          },
          3500
        );
        const data = await nomRes.json();

        if (data && data.address) {
          const addr = data.address;
          const houseNo = addr.house_number || addr.building || '';
          const street = addr.road || addr.street || addr.pedestrian || addr.neighbourhood || '';
          const area = addr.suburb || addr.neighbourhood || addr.residential || addr.city_district || '';
          const landmark = addr.amenity || addr.shop || '';
          const pincode = addr.postcode || '';

          const parsed = parseAddressParts(
            data.display_name || '',
            '',
            {
              id: `osm-rev-${data.place_id || 'gps'}`,
              title: houseNo ? `${houseNo}, ${street || area}` : street || area || data.name || 'Current Location',
              houseNo,
              street,
              area,
              landmark,
              pincode,
              lat: userLat,
              lng: userLng,
            },
            shopLat,
            shopLng
          );

          return NextResponse.json({ suggestions: [parsed] });
        }
      }
    } catch (err) {
      console.warn('OSM reverse geocode error:', err);
    }

    // Default fallback suggestion for GPS using local nearest locality
    const parsed = parseAddressParts(
      'Current GPS Location, Madurai',
      '',
      {
        id: 'gps-raw',
        title: 'Current GPS Location',
        houseNo: '',
        street: 'Detected Street',
        area: 'Madurai',
        lat: userLat,
        lng: userLng,
      },
      shopLat,
      shopLng
    );

    return NextResponse.json({ suggestions: [parsed] });
  }

  // 2. FORWARD SEARCH AUTOCOMPLETE
  if (!rawQ || rawQ.length < 2) {
    return NextResponse.json({ suggestions: [] });
  }

  const { houseNo: extractedHouseNo, cleanQuery } = extractDoorAndQuery(rawQ);
  const searchLower = cleanQuery.toLowerCase();
  const suggestionsMap = new Map<string, PlaceSuggestion>();

  // TIER 1: Instant Local Index Match (0ms match)
  const localMatches = MADURAI_LOCALITIES.filter((loc) => {
    const n = loc.name.toLowerCase();
    const a = loc.area.toLowerCase();
    const s = loc.street.toLowerCase();
    const p = loc.pincode;
    const aliases = loc.aliases?.map((al) => al.toLowerCase()) || [];

    return (
      n.includes(searchLower) ||
      a.includes(searchLower) ||
      s.includes(searchLower) ||
      p.includes(searchLower) ||
      aliases.some((al) => al.includes(searchLower)) ||
      searchLower.includes(n) ||
      searchLower.includes(a)
    );
  });

  for (const loc of localMatches) {
    const key = `${loc.name}-${loc.area}`.toLowerCase();
    const parsed = parseAddressParts(
      `${loc.street}, ${loc.area}, Madurai - ${loc.pincode}`,
      rawQ,
      {
        id: `local-${loc.name.replace(/\s+/g, '-').toLowerCase()}`,
        title: extractedHouseNo ? `${extractedHouseNo}, ${loc.name}` : loc.name,
        houseNo: extractedHouseNo,
        street: loc.street,
        area: loc.area,
        landmark: loc.landmark || '',
        pincode: loc.pincode,
        lat: loc.lat,
        lng: loc.lng,
      },
      shopLat,
      shopLng
    );
    suggestionsMap.set(key, parsed);
  }

  // TIER 2 & TIER 3: Parallel Live External Geocoding via Promise.allSettled
  const liveTasks: Promise<any>[] = [];

  // Source A: Google Maps API (if apiKey present)
  if (googleApiKey) {
    const fetchGoogle = async () => {
      try {
        const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
          cleanQuery + ', Madurai, Tamil Nadu'
        )}&key=${googleApiKey}`;
        if (!validateSafeExternalUrl(gUrl)) {
          return [];
        }
        const res = await fetchWithTimeout(gUrl, {}, 3500);
        const data = await res.json();
        if (data.status === 'OK' && Array.isArray(data.results)) {
          return data.results.slice(0, 4).map((item: any) => {
            const comps = item.address_components || [];
            let houseNo = extractedHouseNo;
            let street = '';
            let area = '';
            let landmark = '';
            let pincode = '';

            for (const c of comps) {
              const types = c.types || [];
              if (types.includes('street_number') || types.includes('subpremise') || types.includes('premise')) {
                if (!houseNo) houseNo = c.long_name;
              } else if (types.includes('route')) {
                street = c.long_name;
              } else if (types.includes('sublocality') || types.includes('sublocality_level_1') || types.includes('neighborhood')) {
                if (!area) area = c.long_name;
              } else if (types.includes('point_of_interest') || types.includes('establishment')) {
                landmark = c.long_name;
              } else if (types.includes('postal_code')) {
                pincode = c.long_name;
              }
            }

            const itemLat = item.geometry?.location?.lat || shopLat;
            const itemLng = item.geometry?.location?.lng || shopLng;

            return parseAddressParts(
              item.formatted_address || '',
              rawQ,
              {
                id: `g-${item.place_id}`,
                title: houseNo ? `${houseNo}, ${street || area}` : street || area || item.formatted_address,
                houseNo,
                street,
                area,
                landmark,
                pincode,
                lat: itemLat,
                lng: itemLng,
              },
              shopLat,
              shopLng
            );
          });
        }
      } catch (err) {
        console.warn('Google Maps geocoding error:', err);
      }
      return [];
    };
    liveTasks.push(fetchGoogle());
  }

  // Source B: Photon Komoot Geocoder
  const fetchPhoton = async () => {
    try {
      const photonUrl = `https://photon.komoot.io/api/?q=${encodeURIComponent(
        cleanQuery + ' Madurai'
      )}&lat=${shopLat}&lon=${shopLng}&limit=8`;
      if (!validateSafeExternalUrl(photonUrl)) {
        return [];
      }
      const res = await fetchWithTimeout(
        photonUrl,
        {
          headers: {
            'User-Agent': 'SriAmmanSupermarketMadurai/2.0 (contact@sriammansupermarket.in)',
          },
        },
        3500
      );
      const data = await res.json();
      if (data && Array.isArray(data.features)) {
        return data.features.map((feat: any, idx: number) => {
          const props = feat.properties || {};
          const coords = feat.geometry?.coordinates || [shopLng, shopLat];
          const itemLng = coords[0];
          const itemLat = coords[1];

          const houseNo = props.housenumber || extractedHouseNo || '';
          const name = props.name || '';
          const street = props.street || name || '';
          const area = props.district || props.suburb || props.locality || 'Madurai';
          const pincode = props.postcode || '';

          return parseAddressParts(
            [name, street, area, 'Madurai', pincode].filter(Boolean).join(', '),
            rawQ,
            {
              id: `ph-${props.osm_id || idx}`,
              title: houseNo ? `${houseNo}, ${name || street || area}` : name || street || area,
              houseNo,
              street: street || name,
              area,
              landmark: name !== street ? name : '',
              pincode,
              lat: itemLat,
              lng: itemLng,
            },
            shopLat,
            shopLng
          );
        });
      }
    } catch (err) {
      console.warn('Photon fetch error:', err);
    }
    return [];
  };
  liveTasks.push(fetchPhoton());

  // Source C: OpenStreetMap Nominatim with AddressDetails
  const fetchNominatim = async () => {
    try {
      const nomUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        cleanQuery + ', Madurai'
      )}&addressdetails=1&limit=6`;
      if (!validateSafeExternalUrl(nomUrl)) {
        return [];
      }
      const res = await fetchWithTimeout(
        nomUrl,
        {
          headers: {
            'User-Agent': 'SriAmmanSupermarketMadurai/2.0 (contact@sriammansupermarket.in)',
            'Accept-Language': 'en',
          },
        },
        3500
      );
      const data = await res.json();
      if (Array.isArray(data)) {
        return data.map((item: any) => {
          const itemLat = parseFloat(item.lat);
          const itemLng = parseFloat(item.lon);
          const addr = item.address || {};

          const houseNo = addr.house_number || addr.building || extractedHouseNo || '';
          const street = addr.road || addr.pedestrian || addr.neighbourhood || item.name || '';
          const area = addr.suburb || addr.neighbourhood || addr.residential || 'Madurai';
          const landmark = addr.amenity || addr.shop || '';
          const pincode = addr.postcode || '';

          return parseAddressParts(
            item.display_name || '',
            rawQ,
            {
              id: `osm-${item.place_id}`,
              title: houseNo ? `${houseNo}, ${item.name || street || area}` : item.name || street || area,
              houseNo,
              street,
              area,
              landmark,
              pincode,
              lat: itemLat,
              lng: itemLng,
            },
            shopLat,
            shopLng
          );
        });
      }
    } catch (err) {
      console.warn('Nominatim fetch error:', err);
    }
    return [];
  };
  liveTasks.push(fetchNominatim());

  // Await parallel external geocoders with timeout grace
  const settled = await Promise.allSettled(liveTasks);
  for (const outcome of settled) {
    if (outcome.status === 'fulfilled' && Array.isArray(outcome.value)) {
      for (const item of outcome.value) {
        if (!item || !item.area) continue;
        // Deduplicate using rounded coords or street+area
        const key = `${item.lat.toFixed(3)}-${item.lng.toFixed(3)}`;
        if (!suggestionsMap.has(key)) {
          suggestionsMap.set(key, item);
        }
      }
    }
  }

  // Convert map to array and sort:
  // 1. Deliverable items (within 3km) prioritized
  // 2. Proximity to Sri Amman Supermarket
  const allSuggestions = Array.from(suggestionsMap.values());
  allSuggestions.sort((a, b) => {
    if (a.deliverable && !b.deliverable) return -1;
    if (!a.deliverable && b.deliverable) return 1;
    return a.distanceKm - b.distanceKm;
  });

  return NextResponse.json({
    suggestions: allSuggestions.slice(0, 8),
  });
}
