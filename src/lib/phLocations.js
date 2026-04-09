import PH_LOCATION_REGIONS_DATA from "./phLocations.data.json";

export const PHILIPPINES_COUNTRY = "Philippines";

function normalizeLocationText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function dedupe(values) {
  return Array.from(new Set((values || []).filter(Boolean)));
}

function matchesAnyAlias(input, aliases = []) {
  const normalizedInput = normalizeLocationText(input);
  if (!normalizedInput) return false;
  return aliases.some((alias) => normalizeLocationText(alias) === normalizedInput);
}

export const PH_LOCATION_REGIONS = PH_LOCATION_REGIONS_DATA.map((region) => ({
  ...region,
  aliases: dedupe(region.aliases || [region.name]),
  cities: (region.cities || []).map((city) => ({
    ...city,
    aliases: dedupe(city.aliases || [city.name]),
    barangays: dedupe(city.barangays || []),
  })),
}));

export const PH_REGION_OPTIONS = PH_LOCATION_REGIONS.map((region) => region.name);

export function filterLocationOptions(query, options) {
  const normalizedQuery = normalizeLocationText(query);
  const normalizedOptions = Array.isArray(options) ? options : [];

  if (!normalizedQuery) return normalizedOptions;

  const prefixMatches = [];
  const containsMatches = [];

  normalizedOptions.forEach((option) => {
    const normalizedOption = normalizeLocationText(option);

    if (normalizedOption.startsWith(normalizedQuery)) {
      prefixMatches.push(option);
      return;
    }

    if (normalizedOption.includes(normalizedQuery)) {
      containsMatches.push(option);
    }
  });

  return [...prefixMatches, ...containsMatches];
}

function findRegion(regionName) {
  return (
    PH_LOCATION_REGIONS.find((region) =>
      matchesAnyAlias(regionName, [region.name, ...(region.aliases || [])])
    ) || null
  );
}

function findCity(region, cityName) {
  if (!region) return null;

  return (
    (region.cities || []).find((city) =>
      matchesAnyAlias(cityName, [city.name, ...(city.aliases || [])])
    ) || null
  );
}

function findBarangay(city, barangayName) {
  if (!city) return null;

  return (
    (city.barangays || []).find(
      (barangay) =>
        normalizeLocationText(barangay) === normalizeLocationText(barangayName)
    ) || null
  );
}

export function getRegionByName(regionName) {
  return findRegion(regionName);
}

export function normalizeRegionName(regionName) {
  const match = findRegion(regionName);
  return match?.name || String(regionName || "").trim();
}

export function getCitiesByRegion(regionName) {
  return (findRegion(regionName)?.cities || []).map((city) => city.name);
}

export function getCityByRegionAndName(regionName, cityName) {
  return findCity(findRegion(regionName), cityName);
}

export function normalizeCityName(regionName, cityName) {
  const match = getCityByRegionAndName(regionName, cityName);
  return match?.name || String(cityName || "").trim();
}

export function getBarangaysByRegionCity(regionName, cityName) {
  return getCityByRegionAndName(regionName, cityName)?.barangays || [];
}

export function normalizeBarangayName(regionName, cityName, barangayName) {
  const match = findBarangay(
    getCityByRegionAndName(regionName, cityName),
    barangayName
  );
  return match || String(barangayName || "").trim();
}

export function coercePhilippinesLocation({
  region = "",
  city = "",
  barangay = "",
} = {}) {
  const nextRegion = normalizeRegionName(region);
  const nextCity = normalizeCityName(nextRegion, city);
  const nextBarangay = normalizeBarangayName(nextRegion, nextCity, barangay);

  return {
    region: nextRegion,
    city: nextCity,
    barangay: nextBarangay,
  };
}

export function getRegionMapData() {
  return PH_LOCATION_REGIONS.map((region) => ({
    name: region.name,
    coords: null,
    cities: (region.cities || []).map((city) => ({
      name: city.name,
      coords: null,
    })),
  }));
}

export function buildPhilippinesLocationLabel({
  region = "",
  city = "",
  barangay = "",
} = {}) {
  return [barangay, city, region].filter(Boolean).join(", ");
}

export { normalizeLocationText };
