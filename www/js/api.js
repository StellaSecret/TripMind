/**
 * api.js — Couche d'accès aux données (TripMind)
 *
 * APIs utilisées (toutes publiques, aucune clé requise sauf Navitia optionnel) :
 *  - Base Adresse Nationale   https://api-adresse.data.gouv.fr
 *  - Open-Meteo (météo)       https://api.open-meteo.com
 *  - Open-Meteo (air/pollen)  https://air-quality-api.open-meteo.com
 *  - OSRM / OpenStreetMap     https://router.project-osrm.org
 *  - Navitia (trains)         https://api.navitia.io  [token optionnel]
 */

'use strict';

/* ─── Utilitaires ──────────────────────────────────────────── */
const pad = n => String(n).padStart(2, '0');

/** Formate une durée en secondes → "2h05" ou "45 min" */
export function fmtDur(sec) {
  if (!sec || sec <= 0) return '—';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return h > 0 ? `${h}h${pad(m)}` : `${m} min`;
}

/** Extrait HH:MM depuis le format Navitia "20240612T143000" */
function fmtNavitiaTime(dt) {
  if (!dt || dt.length < 13) return '--:--';
  return `${dt.substring(9, 11)}:${dt.substring(11, 13)}`;
}

/** Génère le datetime courant au format Navitia */
function nowNavitia() {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
         `T${pad(d.getHours())}${pad(d.getMinutes())}00`;
}

function shortMode(m) {
  const v = (m || '').toLowerCase();
  if (v.includes('grande vitesse') || v.includes('tgv')) return 'TGV';
  if (v.includes('ouigo')) return 'OUIGO';
  if (v.includes('intercit')) return 'Intercités';
  if (v.includes('ter')) return 'TER';
  if (v.includes('eurostar')) return 'Eurostar';
  if (v.includes('thalys') || v.includes('izy')) return 'Thalys/IZY';
  if (v.includes('bus')) return 'Bus';
  return 'Train';
}

function reliabilityByMode(m) {
  const v = (m || '').toLowerCase();
  if (v.includes('grande vitesse')) return 92;
  if (v.includes('intercit')) return 88;
  if (v.includes('ter')) return 84;
  return 86;
}

/* ─── Géocodage — Base Adresse Nationale ─────────────────── */
/**
 * Géocode une commune française via l'API BAN (data.gouv.fr).
 * @param {string} city  Nom de ville
 * @returns {{ lat, lon, name, dept, postcode }}
 */
export async function geocodeBAN(city) {
  const url = `https://api-adresse.data.gouv.fr/search/?` +
              `q=${encodeURIComponent(city)}&limit=1&type=municipality`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`BAN HTTP ${r.status}`);
  const d = await r.json();
  if (!d.features?.length) throw new Error(`"${city}" introuvable en France`);
  const f = d.features[0];
  return {
    lat:      f.geometry.coordinates[1],
    lon:      f.geometry.coordinates[0],
    name:     f.properties.city || f.properties.name,
    dept:     f.properties.context || '',
    postcode: f.properties.postcode || '',
  };
}

/* ─── Météo — Open-Meteo ──────────────────────────────────── */
/**
 * Récupère la météo courante + prévision journalière via Open-Meteo.
 * @returns {{ temp, feels, humidity, wind, code, clouds, tmax, tmin, precip, precipProb, uv }}
 */
export async function fetchMeteo(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?` +
    `latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,cloud_cover` +
    `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,uv_index_max,precipitation_probability_max` +
    `&timezone=Europe%2FParis&forecast_days=1`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Open-Meteo météo HTTP ${r.status}`);
  const d = await r.json();
  const c = d.current, dy = d.daily;
  return {
    temp:       Math.round(c.temperature_2m),
    feels:      Math.round(c.apparent_temperature),
    humidity:   Math.round(c.relative_humidity_2m),
    wind:       Math.round(c.wind_speed_10m),
    code:       c.weather_code,
    clouds:     Math.round(c.cloud_cover),
    tmax:       Math.round(dy.temperature_2m_max[0]),
    tmin:       Math.round(dy.temperature_2m_min[0]),
    precip:     dy.precipitation_sum[0],
    precipProb: dy.precipitation_probability_max[0],
    uv:         Math.round(dy.uv_index_max[0]),
  };
}

/* ─── Qualité air + Pollen — Open-Meteo Air Quality ─────── */
/**
 * Récupère l'AQI européen, les polluants et les concentrations de pollen.
 * Source : Copernicus CAMS + SILAM model via Open-Meteo.
 * @returns {{ aqi, pm25, pm10, o3, no2, pollens, polMax, polActifs, polNiveau }}
 */
export async function fetchAirQuality(lat, lon) {
  const url = `https://air-quality-api.open-meteo.com/v1/air-quality?` +
    `latitude=${lat}&longitude=${lon}` +
    `&current=european_aqi,pm10,pm2_5,ozone,nitrogen_dioxide,sulphur_dioxide` +
    `&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen` +
    `&timezone=Europe%2FParis&forecast_days=1`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`Open-Meteo AQ HTTP ${r.status}`);
  const d = await r.json();
  const c = d.current, h = d.hourly;

  // Prendre la valeur de l'heure courante pour les pollens
  const hi = Math.min(new Date().getHours(), 23);
  const pollens = {
    'Aulne':     Math.round(h.alder_pollen?.[hi]  || 0),
    'Bouleau':   Math.round(h.birch_pollen?.[hi]  || 0),
    'Graminées': Math.round(h.grass_pollen?.[hi]  || 0),
    'Armoise':   Math.round(h.mugwort_pollen?.[hi] || 0),
    'Olivier':   Math.round(h.olive_pollen?.[hi]  || 0),
  };
  const polMax = Math.max(...Object.values(pollens));
  const polActifs = Object.entries(pollens)
    .filter(([, v]) => v > 2)
    .sort((a, b) => b[1] - a[1])
    .map(([k]) => k);

  const polNiveau =
    polMax < 10  ? { l: 'Faible',      c: 'bg' } :
    polMax < 50  ? { l: 'Modéré',      c: 'ba' } :
    polMax < 200 ? { l: 'Élevé',       c: 'ba' } :
                   { l: 'Très élevé',  c: 'br' };

  return {
    aqi:       c.european_aqi,
    pm25:      c.pm2_5?.toFixed(1),
    pm10:      c.pm10?.toFixed(1),
    o3:        c.ozone?.toFixed(1),
    no2:       c.nitrogen_dioxide?.toFixed(1),
    pollens,
    polMax,
    polActifs,
    polNiveau,
  };
}

/* ─── Itinéraire routier — OSRM ───────────────────────────── */
/**
 * Calcule la durée et distance théorique entre deux points via OSRM.
 * ⚠ Pas de trafic temps réel — durée sans congestion.
 * @returns {{ distKm, dist, dur, durSec, note }}
 */
export async function fetchRoute(oLat, oLon, dLat, dLon) {
  const url = `https://router.project-osrm.org/route/v1/driving/` +
              `${oLon},${oLat};${dLon},${dLat}?overview=false&annotations=false`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`OSRM HTTP ${r.status}`);
  const d = await r.json();
  if (!d.routes?.length) throw new Error('Aucun itinéraire routier trouvé');
  const rt = d.routes[0];
  const distM = rt.distance;
  return {
    distKm: Math.round(distM / 1000),
    dist:   distM >= 1000 ? `${Math.round(distM / 1000)} km` : `${Math.round(distM)} m`,
    dur:    fmtDur(rt.duration),
    durSec: rt.duration,
    note:   'Durée théorique sans trafic (OSRM / OpenStreetMap)',
  };
}

/* ─── Trains — Navitia ────────────────────────────────────── */
/**
 * Récupère les prochains trains via l'API Navitia (gratuit, inscription requise).
 * @param {string|null} token  Token Navitia (null → retourne { _nk: true })
 * @returns {{ trains: Array, _nk?: boolean, _err?: string, _empty?: boolean }}
 */
export async function fetchTrains(oLat, oLon, dLat, dLon, token) {
  if (!token) return { _nk: true, trains: [] };

  const url = `https://api.navitia.io/v1/journeys?` +
    `from=${oLon};${oLat}&to=${dLon};${dLat}` +
    `&datetime=${nowNavitia()}&count=5&min_nb_journeys=1`;

  let r;
  try {
    r = await fetch(url, {
      headers: { Authorization: 'Basic ' + btoa(token + ':') },
    });
  } catch (e) {
    return { _err: `Réseau : ${e.message}`, trains: [] };
  }

  if (r.status === 401) return { _err: 'Token Navitia invalide (401)', trains: [] };
  if (r.status === 404) return { _empty: true, trains: [] };
  if (!r.ok)            return { _err: `Navitia HTTP ${r.status}`, trains: [] };

  const d = await r.json();

  // Filtrer uniquement les trajets avec transport ferroviaire/bus
  const journeys = (d.journeys || [])
    .filter(j => j.sections?.some(s => s.type === 'public_transport'))
    .slice(0, 3);

  if (!journeys.length) return { _empty: true, trains: [] };

  const trains = journeys.map(j => {
    const pt = j.sections.filter(s => s.type === 'public_transport');
    const first = pt[0];
    const mode = first?.display_informations?.commercial_mode || 'Train';
    const num  = (first?.display_informations?.headsign || first?.display_informations?.label || '').trim();
    const line = first?.display_informations?.network || '';

    return {
      depart:    fmtNavitiaTime(j.departure_date_time),
      arrivee:   fmtNavitiaTime(j.arrival_date_time),
      duree:     fmtDur(j.duration),
      numero:    `${shortMode(mode)}${num ? ' ' + num : ''}`,
      reseau:    line,
      transfers: j.nb_transfers || 0,
      fiabilite: reliabilityByMode(mode),
      statut:    j.status || 'NO_SERVICE',
    };
  });

  return { trains };
}

/**
 * Teste la validité d'un token Navitia (appel léger).
 * @returns {{ ok: boolean, message: string }}
 */
export async function testNavitiaToken(token) {
  if (!token?.trim()) return { ok: false, message: 'Token vide' };
  try {
    const r = await fetch('https://api.navitia.io/v1/', {
      headers: { Authorization: 'Basic ' + btoa(token.trim() + ':') },
    });
    if (r.status === 401) return { ok: false, message: 'Token invalide (401 Unauthorized)' };
    if (!r.ok)            return { ok: false, message: `Erreur HTTP ${r.status}` };
    return { ok: true, message: 'Token valide ✓' };
  } catch (e) {
    return { ok: false, message: `Erreur réseau : ${e.message}` };
  }
}
