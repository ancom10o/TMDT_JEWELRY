const API_BASE = 'https://provinces.open-api.vn/api/v1';

const provinceCache = {
  items: null
};

const districtCache = new Map();
const wardCache = new Map();

async function fetchJson(url) {
  const response = await globalThis.fetch(url);

  if (!response.ok) {
    throw new Error('Không thể tải dữ liệu địa chỉ.');
  }

  return response.json();
}

export async function getProvinces() {
  if (provinceCache.items) {
    return provinceCache.items;
  }

  const data = await fetchJson(`${API_BASE}/`);
  provinceCache.items = Array.isArray(data) ? data : [];
  return provinceCache.items;
}

export async function getDistrictsByProvince(provinceCode) {
  if (!provinceCode) {
    return [];
  }

  if (districtCache.has(provinceCode)) {
    return districtCache.get(provinceCode);
  }

  const data = await fetchJson(`${API_BASE}/p/${provinceCode}?depth=2`);
  const districts = Array.isArray(data?.districts) ? data.districts : [];
  districtCache.set(provinceCode, districts);
  return districts;
}

export async function getWardsByDistrict(districtCode) {
  if (!districtCode) {
    return [];
  }

  if (wardCache.has(districtCode)) {
    return wardCache.get(districtCode);
  }

  const data = await fetchJson(`${API_BASE}/d/${districtCode}?depth=2`);
  const wards = Array.isArray(data?.wards) ? data.wards : [];
  wardCache.set(districtCode, wards);
  return wards;
}
