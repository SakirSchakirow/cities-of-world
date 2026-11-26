import rawCities from '../data/worldCities.json';
import type { CityInfo, ResolveCityResponse } from '../types/game';
import { haversineKm } from './geo';

type CompactCityTuple = [number, string, number, number, number];

interface IndexedCity extends CityInfo {
  normForms: string[];
  compactForms: string[];
}

const CHAR_TRANSLIT: Record<string, string> = {
  Ł: 'L',
  ł: 'l',
  Ø: 'O',
  ø: 'o',
  Æ: 'AE',
  æ: 'ae',
  Œ: 'OE',
  œ: 'oe',
  ß: 'ss',
  İ: 'I',
  ı: 'i',
  Đ: 'D',
  đ: 'd',
  Þ: 'TH',
  þ: 'th',
};

function transliterate(text: string): string {
  let out = '';
  for (const ch of text) {
    out += CHAR_TRANSLIT[ch] ?? ch;
  }
  return out.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function expandUmlauts(text: string): string {
  return text
    .replace(/Ä/g, 'Ae')
    .replace(/Ö/g, 'Oe')
    .replace(/Ü/g, 'Ue')
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss');
}

function normalizeLettersOnly(text: string): string {
  return transliterate(text)
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeCompact(text: string): string {
  return transliterate(text)
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function extractFirstLetter(text: string): string {
  const clean = transliterate(text.trim()).toUpperCase();
  for (const ch of clean) {
    if (ch >= 'A' && ch <= 'Z') return ch;
  }
  return '';
}

function extractLastLetter(text: string): string {
  const clean = transliterate(text.trim()).toUpperCase();
  for (let i = clean.length - 1; i >= 0; i--) {
    const ch = clean[i];
    if (ch >= 'A' && ch <= 'Z') return ch;
  }
  return '';
}

function damerauLevenshtein(a: string, b: string, maxDist: number): number {
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > maxDist) return maxDist + 1;
  if (a === b) return 0;

  const dp: number[][] = Array.from({ length: la + 1 }, () => new Array(lb + 1).fill(0));
  for (let i = 0; i <= la; i++) dp[i][0] = i;
  for (let j = 0; j <= lb; j++) dp[0][j] = j;

  for (let i = 1; i <= la; i++) {
    let rowMin = maxDist + 1;
    for (let j = 1; j <= lb; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let val = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        val = Math.min(val, dp[i - 2][j - 2] + cost);
      }
      dp[i][j] = val;
      if (val < rowMin) rowMin = val;
    }
    if (rowMin > maxDist) return maxDist + 1;
  }
  return dp[la][lb];
}

// Cities with active/formed Google Developers Group (GDG) chapters as of 2026
// Key format: "<compact_name>"
const GDG_CHAPTER_KEYS = new Set<string>([
  'linz',
  'vienna',
  'wien',
  'graz',
  'klagenfurt',
  'innsbruck',
  'salzburg',
  'hagenberg',
  'berlin',
  'munich',
  'munchen',
  'hamburg',
  'frankfurt',
  'frankfurtammain',
  'cologne',
  'koln',
  'stuttgart',
  'dresden',
  'nuremberg',
  'nurnberg',
  'dusseldorf',
  'leipzig',
  'karlsruhe',
  'aachen',
  'zurich',
  'geneva',
  'genf',
  'basel',
  'lausanne',
  'bern',

  // Western & Northern Europe
  'london',
  'manchester',
  'edinburgh',
  'birmingham',
  'bristol',
  'glasgow',
  'cambridge',
  'dublin',
  'cork',
  'paris',
  'lyon',
  'marseille',
  'toulouse',
  'nantes',
  'bordeaux',
  'lille',
  'strasbourg',
  'madrid',
  'barcelona',
  'valencia',
  'seville',
  'sevilla',
  'bilbao',
  'malaga',
  'lisbon',
  'lissabon',
  'porto',
  'coimbra',
  'rome',
  'rom',
  'milan',
  'mailand',
  'turin',
  'torino',
  'bologna',
  'naples',
  'neapel',
  'florence',
  'florenz',
  'venice',
  'venedig',
  'amsterdam',
  'rotterdam',
  'utrecht',
  'eindhoven',
  'brussels',
  'brussel',
  'antwerp',
  'ghent',
  'luxembourg',
  'copenhagen',
  'kopenhagen',
  'aarhus',
  'stockholm',
  'gothenburg',
  'malmo',
  'oslo',
  'bergen',
  'trondheim',
  'helsinki',
  'tampere',
  'reykjavik',

  // Central, Eastern & Southern Europe
  'warsaw',
  'warschau',
  'krakow',
  'wroclaw',
  'gdansk',
  'poznan',
  'lodz',
  'katowice',
  'prague',
  'prag',
  'brno',
  'bratislava',
  'kosice',
  'budapest',
  'debrecen',
  'bucharest',
  'clujnapoca',
  'timisoara',
  'iasi',
  'sofia',
  'plovdiv',
  'varna',
  'belgrade',
  'novisad',
  'zagreb',
  'split',
  'ljubljana',
  'sarajevo',
  'skopje',
  'tirana',
  'athens',
  'athen',
  'thessaloniki',
  'istanbul',
  'ankara',
  'izmir',
  'antalya',
  'kyiv',
  'lviv',
  'odesa',
  'vilnius',
  'kaunas',
  'riga',
  'tallinn',
  'chisinau',
  'tbilisi',
  'yerevan',
  'baku',

  // North America
  'newyork',
  'newyorkcity',
  'sanfrancisco',
  'mountainview',
  'sunnyvale',
  'sanjose',
  'losangeles',
  'seattle',
  'austin',
  'chicago',
  'boston',
  'atlanta',
  'miami',
  'washington',
  'denver',
  'dallas',
  'houston',
  'portland',
  'sandiego',
  'phoenix',
  'philadelphia',
  'detroit',
  'minneapolis',
  'raleigh',
  'charlotte',
  'pittsburgh',
  'saltlakecity',
  'orlando',
  'columbus',
  'nashville',
  'toronto',
  'montreal',
  'vancouver',
  'ottawa',
  'calgary',
  'waterloo',
  'edmonton',
  'mexicocity',
  'guadalajara',
  'monterrey',
  'puebla',
  'queretaro',

  // Latin America & Caribbean
  'saopaulo',
  'riodejaneiro',
  'belohorizonte',
  'curitiba',
  'portoalegre',
  'brasilia',
  'recife',
  'salvador',
  'florianopolis',
  'campinas',
  'fortaleza',
  'buenosaires',
  'cordoba',
  'rosario',
  'mendoza',
  'laplata',
  'santiago',
  'valparaiso',
  'bogota',
  'medellin',
  'cali',
  'barranquilla',
  'lima',
  'arequipa',
  'quito',
  'guayaquil',
  'montevideo',
  'asuncion',
  'lapaz',
  'santacruzdelasierra',
  'caracas',
  'panamacity',
  'guatemalacity',
  'santodomingo',
  'sanjuan',

  // Middle East & Africa
  'telaviv',
  'telavivyafo',
  'jerusalem',
  'haifa',
  'dubai',
  'abudhabi',
  'riyadh',
  'jeddah',
  'amman',
  'beirut',
  'doha',
  'muscat',
  'kuwaitcity',
  'cairo',
  'kairo',
  'alexandria',
  'tunis',
  'algiers',
  'casablanca',
  'rabat',
  'lagos',
  'abuja',
  'ibadan',
  'nairobi',
  'mombasa',
  'kampala',
  'kigali',
  'addisababa',
  'daressalaam',
  'accra',
  'dakar',
  'abidjan',
  'douala',
  'yaounde',
  'kinshasa',
  'johannesburg',
  'capetown',
  'kapstadt',
  'pretoria',
  'durban',
  'lusaka',
  'harare',
  'maputo',
  'antananarivo',
  'portlouis',

  // Asia-Pacific
  'bengaluru',
  'bangalore',
  'mumbai',
  'newdelhi',
  'delhi',
  'hyderabad',
  'chennai',
  'pune',
  'kolkata',
  'ahmedabad',
  'jaipur',
  'chandigarh',
  'kochi',
  'thiruvananthapuram',
  'indore',
  'nagpur',
  'surat',
  'lucknow',
  'coimbatore',
  'islamabad',
  'lahore',
  'karachi',
  'peshawar',
  'dhaka',
  'chattogram',
  'kathmandu',
  'colombo',
  'singapore',
  'kualalumpur',
  'georgetown',
  'penang',
  'johorbahru',
  'bangkok',
  'chiangmai',
  'jakarta',
  'bandung',
  'surabaya',
  'yogyakarta',
  'semarang',
  'medan',
  'denpasar',
  'manila',
  'cebu',
  'cebucity',
  'davao',
  'hanoi',
  'hochiminhcity',
  'danang',
  'phnompenh',
  'yangon',
  'tokyo',
  'tokio',
  'osaka',
  'kyoto',
  'nagoya',
  'fukuoka',
  'sapporo',
  'yokohama',
  'seoul',
  'busan',
  'daegu',
  'incheon',
  'daejeon',
  'taipei',
  'taichung',
  'kaohsiung',
  'tainan',
  'hongkong',
  'beijing',
  'peking',
  'shanghai',
  'shenzhen',
  'guangzhou',
  'chengdu',
  'hangzhou',
  'xian',
  'nanjing',
  'wuhan',
  'ulaanbaatar',
  'almaty',
  'astana',
  'tashkent',
  'sydney',
  'melbourne',
  'brisbane',
  'perth',
  'adelaide',
  'canberra',
  'auckland',
  'wellington',
  'christchurch',
]);

function isGdgChapterCity(name: string): boolean {
  return (
    GDG_CHAPTER_KEYS.has(normalizeCompact(name)) ||
    GDG_CHAPTER_KEYS.has(normalizeCompact(expandUmlauts(name)))
  );
}

const EXONYM_AND_SPECIAL_SEEDS: CompactCityTuple[] = [
  [900001, 'Wien', 48.2085, 16.3721, 1931000],
  [900002, 'München', 48.1374, 11.5755, 1488000],
  [900003, 'Köln', 50.9333, 6.95, 1086000],
  [900004, 'Nürnberg', 49.4542, 11.0775, 518000],
  [900005, 'Zürich', 47.3667, 8.55, 421000],
  [900006, 'Genf', 46.2022, 6.1457, 203000],
  [900007, 'Rom', 41.8919, 12.5113, 2873000],
  [900008, 'Mailand', 45.4643, 9.1895, 1396000],
  [900009, 'Venedig', 45.4371, 12.3327, 260000],
  [900010, 'Florenz', 43.7793, 11.2463, 382000],
  [900011, 'Neapel', 40.8522, 14.2681, 967000],
  [900012, 'Prag', 50.088, 14.4208, 1335000],
  [900013, 'Warschau', 52.2298, 21.0118, 1794000],
  [900014, 'Moskau', 55.7522, 37.6156, 12655000],
  [900015, 'Tokio', 35.6895, 139.6917, 13960000],
  [900016, 'Kairo', 30.0626, 31.2497, 9900000],
  [900017, 'Peking', 39.9075, 116.3972, 21540000],
  [900018, 'Lissabon', 38.7167, -9.1333, 545000],
  [900019, 'Athen', 37.9838, 23.7278, 664000],
  [900020, 'Brüssel', 50.8505, 4.3488, 1218000],
  [900021, 'Kopenhagen', 55.6759, 12.5655, 638000],
  [900022, 'Kapstadt', -33.9258, 18.4232, 4618000],
  [900023, 'New York', 40.7143, -74.006, 8804190],
  [900024, 'Washington', 38.8951, -77.0364, 702455],
  [900025, 'Klagenfurt', 46.6247, 14.3053, 101400],
  [900026, 'Hagenberg', 48.3667, 14.5167, 2900],
  [900027, 'Bangalore', 12.9719, 77.5937, 8443675],
];

const citiesByLetter = new Map<string, IndexedCity[]>();
const majorStartingCities: IndexedCity[] = [];

function buildCityForms(name: string): { normForms: string[]; compactForms: string[] } {
  const candidates = [name, expandUmlauts(name)];
  const normSet = new Set<string>();
  const compactSet = new Set<string>();
  for (const c of candidates) {
    const n = normalizeLettersOnly(c);
    const comp = normalizeCompact(c);
    if (n) normSet.add(n);
    if (comp) compactSet.add(comp);
  }
  return {
    normForms: Array.from(normSet),
    compactForms: Array.from(compactSet),
  };
}

function addCity(tuple: CompactCityTuple) {
  const [id, name, lat, lng, population] = tuple;
  const startLetter = extractFirstLetter(name);
  const endLetter = extractLastLetter(name);
  if (!startLetter || !endLetter) return;

  const forms = buildCityForms(name);
  const indexed: IndexedCity = {
    id,
    name,
    lat,
    lng,
    population,
    isGdg: isGdgChapterCity(name),
    startLetter,
    endLetter,
    ...forms,
  };

  const bucket = citiesByLetter.get(startLetter);
  if (bucket) {
    bucket.push(indexed);
  } else {
    citiesByLetter.set(startLetter, [indexed]);
  }

  if (
    population >= 450000 &&
    name.length >= 4 &&
    !/[^a-zA-Z\s\-'.]/.test(transliterate(name))
  ) {
    majorStartingCities.push(indexed);
  }
}

let initialized = false;
function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  for (const seed of EXONYM_AND_SPECIAL_SEEDS) {
    addCity(seed);
  }
  for (const tuple of rawCities as CompactCityTuple[]) {
    addCity(tuple);
  }
  for (const [, list] of citiesByLetter) {
    list.sort((a, b) => b.population - a.population);
  }
}

function toPublicCity(city: IndexedCity): CityInfo {
  return {
    id: city.id,
    name: city.name,
    lat: city.lat,
    lng: city.lng,
    population: city.population,
    isGdg: city.isGdg,
    startLetter: city.startLetter,
    endLetter: city.endLetter,
  };
}

export function getRandomStartingCity(): CityInfo {
  ensureInitialized();
  const goodStarters = majorStartingCities.filter((c) => {
    const nextCount = citiesByLetter.get(c.endLetter)?.length ?? 0;
    return nextCount >= 40;
  });
  const pool = goodStarters.length > 0 ? goodStarters : majorStartingCities;
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  return toPublicCity(chosen);
}

export function resolveCityQuery(
  query: string,
  requiredLetter: string,
  usedIds: number[],
): ResolveCityResponse {
  ensureInitialized();

  const trimmed = query.trim();
  if (!trimmed) {
    return { valid: false, reason: 'EMPTY', message: 'Please type a city name.' };
  }

  const req = requiredLetter.toUpperCase();
  const typedFirst = extractFirstLetter(trimmed);
  if (!typedFirst) {
    return { valid: false, reason: 'EMPTY', message: 'Please enter a valid city name.' };
  }

  if (typedFirst !== req) {
    return {
      valid: false,
      reason: 'WRONG_FIRST_LETTER',
      typedFirst,
      message: `Starts with "${typedFirst}", but must start with "${req}". You can misspell the city, not its first letter.`,
    };
  }

  const bucket = citiesByLetter.get(req) || [];
  const usedSet = new Set(usedIds);

  const queryNorms = Array.from(
    new Set([normalizeLettersOnly(trimmed), normalizeLettersOnly(expandUmlauts(trimmed))].filter(Boolean)),
  );
  const queryCompacts = Array.from(
    new Set([normalizeCompact(trimmed), normalizeCompact(expandUmlauts(trimmed))].filter(Boolean)),
  );

  // 1. Exact match (highest population wins)
  let exactAlreadyUsed: IndexedCity | null = null;
  for (const city of bucket) {
    const isExact =
      city.normForms.some((f) => queryNorms.includes(f)) ||
      city.compactForms.some((f) => queryCompacts.includes(f));
    if (isExact) {
      if (usedSet.has(city.id)) {
        exactAlreadyUsed = city;
        continue;
      }
      return {
        valid: true,
        city: toPublicCity(city),
        wasMisspelled: false,
      };
    }
  }

  if (exactAlreadyUsed) {
    return {
      valid: false,
      reason: 'ALREADY_USED',
      message: `${exactAlreadyUsed.name} has already been played in this match.`,
      city: toPublicCity(exactAlreadyUsed),
    };
  }

  // 2. Prefix match for multi-word cities
  const primaryQueryNorm = queryNorms[0] || '';
  const primaryQueryCompact = queryCompacts[0] || '';
  if (primaryQueryCompact.length >= 5) {
    for (const city of bucket) {
      if (usedSet.has(city.id)) continue;
      if (city.normForms.some((f) => f.startsWith(`${primaryQueryNorm} `))) {
        return {
          valid: true,
          city: toPublicCity(city),
          wasMisspelled: normalizeCompact(city.name) !== primaryQueryCompact,
          matchedFrom: trimmed,
        };
      }
    }
  }

  // 3. Fuzzy misspelling match within the exact starting letter bucket
  if (primaryQueryCompact.length < 3) {
    return {
      valid: false,
      reason: 'NOT_FOUND',
      message: `No city starting with "${req}" matched "${trimmed}".`,
    };
  }

  let bestCity: IndexedCity | null = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const city of bucket) {
    for (const qComp of queryCompacts) {
      for (const cComp of city.compactForms) {
        const maxLen = Math.max(qComp.length, cComp.length);
        const maxAllowed =
          maxLen <= 4 ? 1 : maxLen <= 8 ? 2 : maxLen <= 13 ? 3 : 4;
        if (Math.abs(qComp.length - cComp.length) > maxAllowed) continue;

        const dist = damerauLevenshtein(qComp, cComp, maxAllowed);
        if (dist <= maxAllowed && dist < cComp.length - 1) {
          const secondLetterBonus =
            qComp.length >= 2 && cComp.length >= 2 && qComp[1] === cComp[1] ? 0 : 0.35;
          const popTieBreaker = -Math.log10(Math.max(10, city.population)) * 0.04;
          const composite = dist + secondLetterBonus + popTieBreaker;
          if (composite < bestScore) {
            bestScore = composite;
            bestCity = city;
          }
        }
      }
    }
  }

  if (bestCity) {
    if (usedSet.has(bestCity.id)) {
      return {
        valid: false,
        reason: 'ALREADY_USED',
        message: `${bestCity.name} has already been played in this match.`,
        city: toPublicCity(bestCity),
      };
    }
    return {
      valid: true,
      city: toPublicCity(bestCity),
      wasMisspelled: true,
      matchedFrom: trimmed,
    };
  }

  return {
    valid: false,
    reason: 'NOT_FOUND',
    message: `No known city starting with "${req}" matched "${trimmed}".`,
  };
}

export function pickAiCity(
  requiredLetter: string,
  usedIds: number[],
  prevLat: number,
  prevLng: number,
): CityInfo | null {
  ensureInitialized();
  const req = requiredLetter.toUpperCase();
  const bucket = citiesByLetter.get(req) || [];
  const usedSet = new Set(usedIds);

  const candidates = bucket.filter(
    (c) =>
      !usedSet.has(c.id) &&
      (c.population >= 80000 || c.isGdg) &&
      (citiesByLetter.get(c.endLetter)?.length ?? 0) >= 5,
  );

  const pool = candidates.length > 0 ? candidates : bucket.filter((c) => !usedSet.has(c.id));
  if (pool.length === 0) return null;

  const scored = pool.slice(0, 450).map((city) => {
    const dist = haversineKm(prevLat, prevLng, city.lat, city.lng);
    const estPoints =
      Math.round(dist / 20) +
      (city.isGdg ? 100 : 0) +
      Math.min(40, Math.log10(Math.max(100, city.population)) * 5);
    return { city, estPoints };
  });

  scored.sort((a, b) => b.estPoints - a.estPoints);
  const topPool = scored.slice(0, Math.min(6, scored.length));
  const chosen = topPool[Math.floor(Math.random() * topPool.length)];
  return toPublicCity(chosen.city);
}
