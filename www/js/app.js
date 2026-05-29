/**
 * TripMind — app.js
 *
 * Nouveauté : sélection du jour de départ (J à J+15)
 *
 * APIs :
 *  - Base Adresse Nationale   https://api-adresse.data.gouv.fr  (sans token)
 *  - Open-Meteo               https://api.open-meteo.com         (sans token, 16 jours)
 *  - Open-Meteo Air Quality   https://air-quality-api.open-meteo.com (sans token)
 *  - OSRM / OpenStreetMap     https://router.project-osrm.org   (sans token)
 *  - Transitous / MOTIS 2     https://api.transitous.org/api/   (sans token — FOSS uniquement)
 */

(function () {
  'use strict';

  /* ─── Internationalisation (FR / EN) ─────────────────
   * Auto-detected from navigator.language; can be forced
   * by setting localStorage.setItem('tripmind-lang','en').
   ──────────────────────────────────────────────────── */
  var LANG = (function() {
    try { var s = localStorage.getItem('tripmind-lang'); if (s) return s; } catch(e) {}
    return 'fr'; // French by default; use the toggle button to switch to English
  })();

  var TRANSLATIONS = {
    fr: {
      /* Search screen */
      logoSub: 'France · APIs publiques',
      pillsTitle: '🛰 Données temps réel — aucun token requis',
      pill0: '✓ Open-Meteo météo', pill1: '✓ Open-Meteo AQI', pill2: '✓ Open-Meteo pollen',
      pill3: '✓ BAN géocodage', pill4: '✓ OSRM trafic', pill5: '✓ Transitous trains',
      dateLabel: 'Date de départ',
      origLabel: 'Ville de départ', origPlaceholder: 'Ex: Paris, Lyon, Bordeaux…',
      destLabel: 'Ville de destination', destPlaceholder: 'Ex: Marseille, Nantes, Nice…',
      swapAriaLabel: 'Inverser origine et destination',
      analyzeBtn: 'Analyser le trajet →',
      aboutSources: 'ℹ À propos des sources de données',
      themeLight: 'Passer en mode clair', themeDark: 'Passer en mode sombre',
      /* Settings */
      settingsBack: '← Retour', settingsTitle: 'Sources de données',
      transitousSubtitle: 'Gratuit · Open source · Aucun token',
      transitousStep1: 'Moteur <strong>MOTIS 2</strong> — couverture SNCF France via données GTFS ouvertes',
      transitousStep2: 'Données temps réel (retards, annulations) sur certaines lignes',
      transitousStep3: 'Service communautaire FOSS — pas de compte requis',
      freeApisTitle: 'Toutes les sources — 100% sans token',
      freeApi1: '<strong>Open-Meteo</strong> — météo complète + UV (16 jours)',
      freeApi2: '<strong>Open-Meteo AQ</strong> — AQI, PM2.5, PM10, NO₂, ozone (Copernicus CAMS)',
      freeApi3: '<strong>Open-Meteo pollen</strong> — 5 espèces (modèle SILAM)',
      freeApi4: '<strong>Base Adresse Nationale</strong> — géocodage + autocomplétion (data.gouv.fr)',
      freeApi5: '<strong>OSRM / OpenStreetMap</strong> — itinéraire routier théorique',
      freeApi6: '<strong>Transitous / MOTIS 2</strong> — trains et transports publics',
      privacyNotice: 'TripMind ne collecte aucune donnée personnelle.<br>Aucun compte, aucun token, aucun tracking.',
      /* Loading */
      loadingInit: 'Initialisation…',
      loadingGeocode: 'Géocodage des villes…',
      loadingMeteo: 'Récupération météo…',
      loadingAir: "Qualité de l'air & pollen…",
      loadingRoute: 'Calcul itinéraire…',
      step0: 'Géocodage BAN (data.gouv.fr)',
      step1: 'Météo + UV · Open-Meteo',
      step2: "Qualité de l'air · Copernicus CAMS",
      step3: 'Pollen · Open-Meteo SILAM',
      step4: 'Itinéraire routier · OSRM',
      /* Dashboard */
      backBtn: '← Modifier', dashDateToday: "Aujourd'hui",
      tabOverview: '🗺 Aperçu', tabRoute: '🚗 Trajet', tabAir: '💨 Air & Pollen',
      tabSante: '💊 Santé', tabTrains: '🚆 Trains',
      scoreSubtitle: 'Calculé sur météo, air et pollen',
      /* Date chips */
      chipToday: 'Auj.', chipTomorrow: 'Dem.',
      dateToday: "Aujourd'hui", dateTomorrow: 'Demain',
      /* Score labels */
      scoreBon: 'Bonnes conditions', scoreMoyen: 'Conditions moyennes', scoreDeg: 'Conditions dégradées',
      /* Weather */
      wmoCode0: 'Ciel dégagé', wmoCode1: 'Légèrement nuageux', wmoCode3: 'Couvert',
      wmoCode45: 'Brumeux', wmoCode51: 'Bruine', wmoCode61: 'Pluie',
      wmoCode71: 'Neige', wmoCode80: 'Averses', wmoCode95: 'Orageux',
      windMax: 'Vent max', precip: 'Précip.', humidity: 'Humidité', clouds: 'Nuages',
      feelsLike: 'Ressenti ', feelsEst: 'Ressenti estimé ',
      minMax: 'min / max',
      /* UV */
      uvFaible: 'Faible', uvModere: 'Modéré', uvEleve: 'Élevé', uvTresEleve: 'Très élevé', uvExtreme: 'Extrême',
      /* AQI */
      aqiTresBon: 'Très bon', aqiBon: 'Bon', aqiSat: 'Satisfaisant', aqiMed: 'Médiocre',
      aqiMauvais: 'Mauvais', aqiTresMauvais: 'Très mauvais',
      aqiLabel: 'Indice AQI européen', aqiLabelUS: 'Indice AQI (US)', aqiCurrent: ' · Actuel', aqiForecast: ' · Prévision',
      /* Pollen */
      pollenFaible: 'Faible', pollenModere: 'Modéré', pollenEleve: 'Élevé', pollenTresEleve: 'Très élevé',
      pollenNA: 'Données indisponibles', pollenNoData: '⚠️ Données pollen indisponibles hors Europe (modèle SILAM)', pollenNone: '✓ Aucun pollen significatif',
      pollenUnit: 'grain/m³ max',
      pollenNames: { Aulne: 'Aulne', Bouleau: 'Bouleau', Graminées: 'Graminées', Armoise: 'Armoise', Olivier: 'Olivier' },
      /* Route */
      routeCard: 'Itinéraire routier', routeEstim: ' estimé hors trafic',
      routeNote: 'Durée théorique sans trafic (OSRM / OpenStreetMap)',
      routeNA: 'Données routières indisponibles',
      multiMode: 'Comparaison multi-modes',
      durLabel: '⏱ Durée', costLabel: '💶 Coût', co2Label: '🌍 CO₂',
      /* Mode labels */
      modeCar: 'Voiture', modeTrain: 'Train', modeBus: 'Bus / Car',
      modeCarpool: 'Covoiturage', modeBike: 'Vélo', modeSubway: 'Métro',
      modeTram: 'Tram', modeFerry: 'Ferry', modePlane: 'Avion', modeTransit: 'Transport',
      /* Mode notes */
      carFuelOnly: 'Carburant estimé (sans péages)',
      carFuelToll: function(carb, peage) { return 'Carb. ~'+carb+'€ + péages ~'+peage+'€ (solo)'; },
      trainRealtime: 'Transitous (temps réel)',
      trainEstim: 'Durée & prix estimés',
      busEstim: 'Estimation FlixBus / BlaBlaCar Bus',
      carpoolEstim: 'Estimation BlaBlaCar',
      bikeSpeed: '~15 km/h moy.',
      /* Trains tab */
      trainsLoading: 'Chargement des trains…',
      trainsOverloadNote: 'Transitous est un service communautaire bénévole à ressources limitées. Les 500/504 indiquent une surcharge temporaire — les données de trains seront disponibles dans quelques minutes.',
      trainsErrNote: 'En cas de panne persistante, consultez directement SNCF Connect.',
      trainsEmpty: function(off, label, hour) { return 'Aucun trajet en transport commun trouvé'+(off>0?' pour le '+label+' à partir de '+(hour||'08')+'h00':'')+". Cette liaison n'est peut-être pas desservie par train direct."; },
      trainsFuture: function(label, hour) { return '📅 Trains du '+label+' à partir de '+(hour||'08')+'h00'; },
      trainsDep: 'Dép.', trainsArr: 'Arr.',
      trainsDirect: 'Direct', trainsTransfers: function(n) { return n+' corresp.'; },
      trainsRealtime: '🟢 Temps réel',
      trainsOfficialTitle: '📱 Ressources officielles',
      trainsCarAlt: '🚗 Alternative voiture',
      trainsCarNote: 'Durée théorique sans trafic (OSRM / OpenStreetMap)',
      trainsLinks: [
        ['SNCF Connect','https://www.sncf-connect.com','🎫 Billets & horaires officiels'],
        ['Ouigo','https://www.ouigo.com','🟢 Trains low-cost'],
        ['Trainline','https://www.thetrainline.com/fr','🔵 Comparateur de prix'],
        ['Vianavigo','https://www.vianavigo.com','🟣 Île-de-France (RER, Transilien)'],
        ['RATP','https://www.ratp.fr','🔴 Paris & banlieue']
      ],
      trainsOpenLink: 'Ouvrir →',
      /* Health */
      santeTitle: '🏥 Santé', santeReco: '💊 Recommandations',
      pollenLabel: 'Pollen', masqueLabel: 'Masque', uvLabel: 'UV',
      actExtLabel: 'Activité ext.', airQualLabel: 'Qualité air', tempLabel: 'Température',
      masqueYes: 'Recommandé', masqueNo: 'Non nécessaire',
      actFav: 'Favorable', actDec: 'Déconseillée', actAcc: 'Acceptable',
      /* Recommendations */
      recoPollenHigh: function(v) { return 'Pollen très élevé ('+v+' gr/m³) — antihistaminiques fortement conseillés'; },
      recoPollenMed: 'Pollen élevé — prenez vos antihistaminiques',
      recoPollenLow: function(s) { return 'Pollen modéré ('+s+')'; },
      recoAqiBad: function(v) { return 'Qualité air mauvaise (AQI '+v+') — masque FFP2 recommandé'; },
      recoAqiMed: function(v) { return "Qualité air médiocre (AQI "+v+") — limitez l'effort"; },
      recoStorm: 'Orage prévu — reportez si possible',
      recoRainHeavy: 'Averses fortes — imperméable recommandé',
      recoRain: 'Pluie — pensez à votre imperméable',
      recoFrost: function(t) { return 'Gel possible ('+t+'°C) — vigilance verglas'; },
      recoHeat: function(t) { return 'Canicule ('+t+'°C) — hydratez-vous, évitez 12h–16h'; },
      recoUvHigh: function(u) { return 'UV très élevé ('+u+') — protection 50+ indispensable'; },
      recoUvMed: function(u) { return 'UV élevé ('+u+') — SPF 30+ conseillé'; },
      recoForecast: function(n) { return 'Prévision J+'+n+' — données météo estimées, susceptibles d\'évoluer'; },
      recoPollenActive: function(s) { return 'Pollen actif : ' + s; },
      recoCarNote: function(dur, dist) { return 'Voiture : '+dur+' pour '+dist+'.'; },
      recoTrainNote: 'Consultez SNCF Connect ou Vianavigo pour les horaires de trains',
      recoNA: 'Données routières indisponibles.',
      recoGood: 'Conditions généralement favorables pour ce trajet.',
      recoTitle: 'Conditions de trajet',
      recoInfoTitle: 'Infos',
      /* Overview */
      meteoAt: '🌤 Météo à ',
      airQualityTitle: '💨 Qualité de l\'air',
      recoCardTitle: '💡 Recommandations',
      aqiNoData: function(d) { return '⏱ Données AQI non disponibles pour J+'+d+' (portée max ~5 jours).'; },
      /* Air tab */
      pollenTabTitle: '🌿 Pollen',
      airTabTitle: '💨 Qualité air & polluants',
      airNoData: function(d) { return "⏱ Open-Meteo ne fournit les prévisions de pollen et de qualité de l'air que sur ~5 jours. Pour J+"+d+", les données ne sont pas encore disponibles."; },
      airPollNA: '⏱ Données de polluants non disponibles pour ce jour.',
      pm25: 'Particules fines', pm10: 'Particules grossières',
      no2: "Dioxyde d'azote", ozone: 'Ozone troposphérique',
      pollutantsNA: 'Données polluants indisponibles',
      /* Score */
      scoreDetail: function(s) { return 'Score '+s+'/100 · météo + air + pollen'; },
      /* Error */
      errUnexpected: 'Erreur inattendue. Vérifiez votre connexion.',
      /* Forecast badge */
      forecastBadge: function(n) { return '📅 Prévision J+'+n; },
      /* Language toggle */
      langToggleLabel: 'Switch to English',
    },
    en: {
      /* Search screen */
      logoSub: 'France · Public APIs',
      pillsTitle: '🛰 Real-time data — no token required',
      pill0: '✓ Open-Meteo weather', pill1: '✓ Open-Meteo AQI', pill2: '✓ Open-Meteo pollen',
      pill3: '✓ BAN geocoding', pill4: '✓ OSRM routing', pill5: '✓ Transitous trains',
      dateLabel: 'Departure date',
      origLabel: 'Origin city', origPlaceholder: 'E.g. Paris, Lyon, Bordeaux…',
      destLabel: 'Destination city', destPlaceholder: 'E.g. Marseille, Nantes, Nice…',
      swapAriaLabel: 'Swap origin and destination',
      analyzeBtn: 'Analyze trip →',
      aboutSources: 'ℹ About data sources',
      themeLight: 'Switch to light mode', themeDark: 'Switch to dark mode',
      /* Settings */
      settingsBack: '← Back', settingsTitle: 'Data sources',
      transitousSubtitle: 'Free · Open source · No token',
      transitousStep1: 'Engine <strong>MOTIS 2</strong> — SNCF France coverage via open GTFS data',
      transitousStep2: 'Real-time data (delays, cancellations) on select lines',
      transitousStep3: 'FOSS community service — no account required',
      freeApisTitle: 'All sources — 100% token-free',
      freeApi1: '<strong>Open-Meteo</strong> — full weather + UV (16 days)',
      freeApi2: '<strong>Open-Meteo AQ</strong> — AQI, PM2.5, PM10, NO₂, ozone (Copernicus CAMS)',
      freeApi3: '<strong>Open-Meteo pollen</strong> — 5 species (SILAM model)',
      freeApi4: '<strong>Base Adresse Nationale</strong> — geocoding + autocomplete (data.gouv.fr)',
      freeApi5: '<strong>OSRM / OpenStreetMap</strong> — theoretical road route',
      freeApi6: '<strong>Transitous / MOTIS 2</strong> — trains and public transport',
      privacyNotice: 'TripMind collects no personal data.<br>No account, no token, no tracking.',
      /* Loading */
      loadingInit: 'Initialising…',
      loadingGeocode: 'Geocoding cities…',
      loadingMeteo: 'Fetching weather…',
      loadingAir: 'Air quality & pollen…',
      loadingRoute: 'Computing route…',
      step0: 'Geocoding BAN (data.gouv.fr)',
      step1: 'Weather + UV · Open-Meteo',
      step2: 'Air quality · Copernicus CAMS',
      step3: 'Pollen · Open-Meteo SILAM',
      step4: 'Road route · OSRM',
      /* Dashboard */
      backBtn: '← Edit', dashDateToday: 'Today',
      tabOverview: '🗺 Overview', tabRoute: '🚗 Journey', tabAir: '💨 Air & Pollen',
      tabSante: '💊 Health', tabTrains: '🚆 Trains',
      scoreSubtitle: 'Based on weather, air & pollen',
      /* Date chips */
      chipToday: 'Today', chipTomorrow: 'Tom.',
      dateToday: 'Today', dateTomorrow: 'Tomorrow',
      /* Score labels */
      scoreBon: 'Good conditions', scoreMoyen: 'Average conditions', scoreDeg: 'Poor conditions',
      /* Weather */
      wmoCode0: 'Clear sky', wmoCode1: 'Partly cloudy', wmoCode3: 'Overcast',
      wmoCode45: 'Foggy', wmoCode51: 'Drizzle', wmoCode61: 'Rain',
      wmoCode71: 'Snow', wmoCode80: 'Showers', wmoCode95: 'Thunderstorm',
      windMax: 'Max wind', precip: 'Precip.', humidity: 'Humidity', clouds: 'Clouds',
      feelsLike: 'Feels like ', feelsEst: 'Est. feels ',
      minMax: 'min / max',
      /* UV */
      uvFaible: 'Low', uvModere: 'Moderate', uvEleve: 'High', uvTresEleve: 'Very high', uvExtreme: 'Extreme',
      /* AQI */
      aqiTresBon: 'Very good', aqiBon: 'Good', aqiSat: 'Fair', aqiMed: 'Moderate',
      aqiMauvais: 'Poor', aqiTresMauvais: 'Very poor',
      aqiLabel: 'European AQI index', aqiLabelUS: 'US AQI index', aqiCurrent: ' · Current', aqiForecast: ' · Forecast',
      /* Pollen */
      pollenFaible: 'Low', pollenModere: 'Moderate', pollenEleve: 'High', pollenTresEleve: 'Very high',
      pollenNA: 'Data unavailable', pollenNoData: '⚠️ Pollen data unavailable outside Europe (SILAM model)', pollenNone: '✓ No significant pollen',
      pollenUnit: 'grain/m³ max',
      pollenNames: { Aulne: 'Alder', Bouleau: 'Birch', Graminées: 'Grass', Armoise: 'Mugwort', Olivier: 'Olive' },
      /* Route */
      routeCard: 'Road route', routeEstim: ' estimated without traffic',
      routeNote: 'Theoretical duration without traffic (OSRM / OpenStreetMap)',
      routeNA: 'Road data unavailable',
      multiMode: 'Multi-mode comparison',
      durLabel: '⏱ Duration', costLabel: '💶 Cost', co2Label: '🌍 CO₂',
      /* Mode labels */
      modeCar: 'Car', modeTrain: 'Train', modeBus: 'Bus / Coach',
      modeCarpool: 'Carpool', modeBike: 'Bike', modeSubway: 'Metro',
      modeTram: 'Tram', modeFerry: 'Ferry', modePlane: 'Plane', modeTransit: 'Transit',
      /* Mode notes */
      carFuelOnly: 'Est. fuel (no tolls)',
      carFuelToll: function(carb, peage) { return 'Fuel ~€'+carb+' + tolls ~€'+peage+' (solo)'; },
      trainRealtime: 'Transitous (real-time)',
      trainEstim: 'Est. duration & price',
      busEstim: 'Est. FlixBus / BlaBlaCar Bus',
      carpoolEstim: 'Est. BlaBlaCar',
      bikeSpeed: '~15 km/h avg.',
      /* Trains tab */
      trainsLoading: 'Loading trains…',
      trainsOverloadNote: 'Transitous is a volunteer community service with limited resources. 500/504 errors indicate temporary overload — train data will be available in a few minutes.',
      trainsErrNote: 'If the issue persists, check SNCF Connect directly.',
      trainsEmpty: function(off, label, hour) { return 'No public transport connection found'+(off>0?' for '+label+' from '+(hour||'08')+':00':'')+'. This route may not be served by a direct train.'; },
      trainsFuture: function(label, hour) { return '📅 Trains on '+label+' from '+(hour||'08')+':00'; },
      trainsDep: 'Dep.', trainsArr: 'Arr.',
      trainsDirect: 'Direct', trainsTransfers: function(n) { return n+' change'+(n>1?'s':''); },
      trainsRealtime: '🟢 Real-time',
      trainsOfficialTitle: '📱 Official resources',
      trainsCarAlt: '🚗 Car alternative',
      trainsCarNote: 'Theoretical duration without traffic (OSRM / OpenStreetMap)',
      trainsLinks: [
        ['SNCF Connect','https://www.sncf-connect.com','🎫 Official tickets & timetables'],
        ['Ouigo','https://www.ouigo.com','🟢 Budget trains'],
        ['Trainline','https://www.thetrainline.com','🔵 Price comparison'],
        ['Vianavigo','https://www.vianavigo.com','🟣 Île-de-France (RER, Transilien)'],
        ['RATP','https://www.ratp.fr','🔴 Paris & suburbs']
      ],
      trainsOpenLink: 'Open →',
      /* Health */
      santeTitle: '🏥 Health', santeReco: '💊 Recommendations',
      pollenLabel: 'Pollen', masqueLabel: 'Mask', uvLabel: 'UV',
      actExtLabel: 'Outdoor act.', airQualLabel: 'Air quality', tempLabel: 'Temperature',
      masqueYes: 'Recommended', masqueNo: 'Not needed',
      actFav: 'Favourable', actDec: 'Not advised', actAcc: 'Acceptable',
      /* Recommendations */
      recoPollenHigh: function(v) { return 'Very high pollen ('+v+' gr/m³) — antihistamines strongly advised'; },
      recoPollenMed: 'High pollen — take your antihistamines',
      recoPollenLow: function(s) { return 'Moderate pollen ('+s+')'; },
      recoAqiBad: function(v) { return 'Poor air quality (AQI '+v+') — FFP2 mask recommended outdoors'; },
      recoAqiMed: function(v) { return 'Moderate air quality (AQI '+v+') — avoid intense outdoor effort'; },
      recoStorm: 'Thunderstorm forecast — postpone if possible',
      recoRainHeavy: 'Heavy showers — waterproof jacket recommended',
      recoRain: 'Rain forecast — bring a raincoat',
      recoFrost: function(t) { return 'Frost risk ('+t+'°C) — beware of ice'; },
      recoHeat: function(t) { return 'Heatwave ('+t+'°C) — stay hydrated, avoid 12–16h'; },
      recoUvHigh: function(u) { return 'Very high UV ('+u+') — SPF 50+ essential'; },
      recoUvMed: function(u) { return 'High UV ('+u+') — SPF 30+ advised'; },
      recoForecast: function(n) { return 'Forecast J+'+n+' — estimated weather, subject to change'; },
      recoPollenActive: function(s) { return 'Active pollen: ' + s; },
      recoCarNote: function(dur, dist) { return 'Car: '+dur+' for '+dist+'.'; },
      recoTrainNote: 'Check SNCF Connect or Vianavigo for train timetables',
      recoNA: 'Road data unavailable.',
      recoGood: 'Generally favourable conditions for this trip.',
      recoTitle: 'Trip conditions',
      recoInfoTitle: 'Info',
      /* Overview */
      meteoAt: '🌤 Weather in ',
      airQualityTitle: '💨 Air quality',
      recoCardTitle: '💡 Recommendations',
      aqiNoData: function(d) { return '⏱ AQI data unavailable for J+'+d+' (max range ~5 days).'; },
      /* Air tab */
      pollenTabTitle: '🌿 Pollen',
      airTabTitle: '💨 Air quality & pollutants',
      airNoData: function(d) { return '⏱ Open-Meteo only provides pollen and air quality forecasts for ~5 days. Data for J+'+d+' is not yet available.'; },
      airPollNA: '⏱ Pollutant data unavailable for this day.',
      pm25: 'Fine particles', pm10: 'Coarse particles',
      no2: 'Nitrogen dioxide', ozone: 'Tropospheric ozone',
      pollutantsNA: 'Pollutant data unavailable',
      /* Score */
      scoreDetail: function(s) { return 'Score '+s+'/100 · weather + air + pollen'; },
      /* Error */
      errUnexpected: 'Unexpected error. Check your connection.',
      /* Forecast badge */
      forecastBadge: function(n) { return '📅 Forecast J+'+n; },
      /* Language toggle */
      langToggleLabel: 'Passer en français',
    }
  };

  /* Shorthand */
  function t(key) { return (TRANSLATIONS[LANG] || TRANSLATIONS.fr)[key]; }


  /* ─── Utilitaires ──────────────────────────────────── */
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  function fmtDur(sec) {
    if (!sec || sec <= 0) return '—';
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h > 0 ? h + 'h' + pad(m) : m + ' min';
  }

  /* Convertit un objet Date en ISO 8601 UTC pour MOTIS : "2024-06-12T08:00:00Z" */
  function toMotisDate(d) {
    // MOTIS requiert le suffixe Z (UTC) — sans lui : "failed to parse timestamp"
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate()) +
           'T' + pad(d.getUTCHours()) + ':' + pad(d.getUTCMinutes()) + ':00Z';
  }

  /* ─── Gestion de la date sélectionnée ─────────────── */
  var selectedDate = new Date(); // aujourd'hui par défaut
  /* Default train departure hour.
   * For today: current hour + 1 (next realistic departure), clamped 5–22.
   * For future dates: 08:00. Reset when date changes. */
  var selectedTrainHour = (function() {
    var h = new Date().getHours() + 1;
    return Math.min(22, Math.max(5, h));
  })();

  /* Retourne le décalage en jours entre selectedDate et aujourd'hui */
  function dayOffset() {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var sel = new Date(selectedDate);
    sel.setHours(0, 0, 0, 0);
    return Math.round((sel - today) / 86400000);
  }

  /* Libellé court de la date sélectionnée */
  function dateLabel(d) {
    var offset = dayOffset();
    if (offset === 0) return t('dateToday');
    if (offset === 1) return t('dateTomorrow');
    var loc = LANG === 'en' ? 'en-GB' : 'fr-FR';
    return d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
  }

  /* ─── Stockage (plus de token requis) ─────────────── */
  var STORE = {
    get token() { try { return localStorage.getItem('tm_sncf_token') || ''; } catch(e) { return ''; } },
    set token(v) { try { localStorage.setItem('tm_sncf_token', (v || '').trim()); } catch(e) {} }
  };

  var DATA = null;

  /* ─── Tab render cache ────────────────────────────────────────────────
   * Stores rendered HTML per tab. Invalidated when DATA changes or lang
   * switches. Avoids rebuilding the DOM on every tab click.
   * ─────────────────────────────────────────────────────────────────── */
  var TAB_CACHE = {};

  function invalidateTabCache() { TAB_CACHE = {}; }

  /* ─── Analysis result cache ───────────────────────────
   * Keyed by "orig|dest|dateOffset|timeHour".
   * TTL: 10 minutes. Avoids re-fetching when the user goes
   * back from the dashboard and re-analyzes the same route.
   ──────────────────────────────────────────────────── */
  /* ─── Analysis result cache ───────────────────────────────────────────
   * LRU cache keyed by "orig|dest|dateOffset|timeHour".
   * Keeps up to MAX entries; evicts oldest on overflow.
   * Each entry expires after TTL (10 min) on read.
   * Multiple routes/times/dates are cached independently —
   * switching from Paris→Lyon to Lyon→Paris hits cache on both.
   ──────────────────────────────────────────────────────────────── */
  var ANALYSIS_CACHE = (function() {
    var store = {}, keys = [];
    var TTL = 10 * 60 * 1000; // 10 min
    var MAX = 20;              // keep up to 20 distinct route/date/time combos
    return {
      key: function(orig, dest, offset, hour) {
        return [orig.toLowerCase().trim(), dest.toLowerCase().trim(), offset, hour].join('|');
      },
      get: function(k) {
        var entry = store[k];
        if (!entry) return null;
        if (Date.now() - entry.ts > TTL) {
          delete store[k];
          keys = keys.filter(function(x) { return x !== k; });
          return null;
        }
        // LRU: move to end on access
        keys = keys.filter(function(x) { return x !== k; });
        keys.push(k);
        return entry.data;
      },
      set: function(k, data) {
        if (store[k]) {
          // Update existing — move to end
          keys = keys.filter(function(x) { return x !== k; });
        } else if (keys.length >= MAX) {
          // Evict oldest entry
          var oldest = keys.shift();
          delete store[oldest];
        }
        keys.push(k);
        store[k] = { data: data, ts: Date.now() };
      },
      size: function() { return keys.length; }
    };
  })();

  /* ─── Navigation ────────────────────────────────────── */
  function show(id) {
    document.querySelectorAll('.scr').forEach(function(s) { s.classList.remove('on'); });
    var scr = $('scr-' + id); if (scr) scr.classList.add('on');
  }
  function setStep(i, state) {
    var el = $('s' + i); if (el) el.className = 'lstep ' + state;
  }

  /* ─── Helpers visuels ───────────────────────────────── */
  function scCol(s) { return s >= 75 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444'; }
  function scLbl(s) { return s >= 75 ? t('scoreBon') : s >= 50 ? t('scoreMoyen') : t('scoreDeg'); }
  function bcls(v) {
    var s = (v || '').toLowerCase();
    if (['bon','faible','favorable','très bon','excellent','non nécessa','good','low','favour','not need','very good'].some(function(k){return s.toLowerCase().indexOf(k)>=0;})) return 'bg';
    if (['modéré','moyen','acceptable','satisfai','moderate','fair'].some(function(k){return s.toLowerCase().indexOf(k)>=0;})) return 'ba';
    if (['élevé','mauvais','très','dégradé','recommandé','high','poor','very','advis'].some(function(k){return s.toLowerCase().indexOf(k)>=0;})) return 'br';
    return 'bb';
  }
  function uvLvl(u) {
    if (u<=2) return {l:t('uvFaible'),c:'#10B981'};
    if (u<=5) return {l:t('uvModere'),c:'#F59E0B'};
    if (u<=7) return {l:t('uvEleve'),c:'#F97316'};
    if (u<=10) return {l:t('uvTresEleve'),c:'#EF4444'};
    return {l:t('uvExtreme'),c:'#8B5CF6'};
  }
  function wmoIcon(c) {
    var m={0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',51:'🌦',53:'🌦',55:'🌧',
           61:'🌧',63:'🌧',65:'🌧',71:'❄️',73:'❄️',75:'❄️',80:'🌦',81:'🌧',
           82:'⛈',95:'⛈',96:'⛈',99:'⛈'};
    return m[c] || '🌡';
  }
  function wmoDesc(c) {
    if (c===0) return t('wmoCode0'); if (c<=2) return t('wmoCode1');
    if (c===3) return t('wmoCode3'); if (c<=48) return t('wmoCode45');
    if (c<=57) return t('wmoCode51'); if (c<=67) return t('wmoCode61');
    if (c<=77) return t('wmoCode71'); if (c<=82) return t('wmoCode80'); return t('wmoCode95');
  }
  function euAqi(a) {
    if (a==null) return {l:'—',c:'bb'}; if (a<=20) return {l:t('aqiTresBon'),c:'bg'};
    if (a<=40) return {l:t('aqiBon'),c:'bg'}; if (a<=60) return {l:t('aqiSat'),c:'ba'};
    if (a<=80) return {l:t('aqiMed'),c:'ba'}; if (a<=100) return {l:t('aqiMauvais'),c:'br'};
    return {l:t('aqiTresMauvais'),c:'br'};
  }

  /* ─── Sélecteur de date ─────────────────────────────
   * Génère les 16 prochains jours sous forme de chips
   * horizontalement scrollables.
   ──────────────────────────────────────────────────── */
  function buildDatePicker() {
    var container = $('date-picker');
    if (!container) return;
    container.innerHTML = '';

    var today = new Date();
    for (var i = 0; i < 16; i++) {
      var d = new Date(today);
      d.setDate(today.getDate() + i);

      var chip = document.createElement('button');
      chip.className = 'date-chip' + (i === 0 ? ' active' : '');
      chip.dataset.offset = i;

      var loc = LANG === 'en' ? 'en-GB' : 'fr-FR';
      var dayName = i === 0 ? t('chipToday') : i === 1 ? t('chipTomorrow') :
        d.toLocaleDateString(loc, { weekday: 'short' });
      var monthStr = d.toLocaleDateString(loc, { month: 'short' });
      var dayNum = d.getDate();

      chip.innerHTML =
        '<span class="dc-day">' + dayName + '</span>' +
        '<span class="dc-num">' + dayNum + '</span>' +
        '<span class="dc-month">' + monthStr + '</span>';

      (function(date, btn) {
        btn.addEventListener('click', function() {
          document.querySelectorAll('.date-chip').forEach(function(c) {
            c.classList.remove('active');
          });
          btn.classList.add('active');
          selectedDate = date;
          // Reset time: current+1 for today, 08:00 for future dates
          var nowH = new Date().getHours() + 1;
          selectedTrainHour = (date - new Date().setHours(0,0,0,0) < 86400000)
            ? Math.min(22, Math.max(5, nowH))
            : 8;
          buildTimePicker();
          updateDateDisplay();
          // No cache clear — old entries are still valid for other date/time combos
        });
      })(d, chip);

      container.appendChild(chip);
    }
  }

  function updateDateDisplay() {
    var el = $('selected-date-label');
    if (el) el.textContent = dateLabel(selectedDate);
    // Show/hide time picker based on whether it's a future date
    var ts = $('time-section');
    if (ts) ts.style.display = ''; // always show — useful for today too
  }

  function buildTimePicker() {
    var container = $('time-picker');
    if (!container) return;
    container.innerHTML = '';
    // Slots: every hour from 05:00 to 22:00
    var hours = [];
    for (var h = 5; h <= 22; h++) hours.push(h);
    hours.forEach(function(h) {
      var chip = document.createElement('button');
      chip.className = 'time-chip' + (h === selectedTrainHour ? ' active' : '');
      chip.textContent = pad(h) + ':00';
      chip.dataset.hour = h;
      chip.addEventListener('click', function() {
        selectedTrainHour = +this.dataset.hour;
        container.querySelectorAll('.time-chip').forEach(function(c) { c.classList.remove('active'); });
        this.classList.add('active');
        // Invalidate cache when time changes
        // Cache entry for this new time will be created fresh on next analyze()
      });
      container.appendChild(chip);
    });
  }

  /* ─── AUTOCOMPLÉTION BAN ─────────────────────────── */
  /* ─── Minimal DOM template helper ──────────────────────────────────────
   * el(tag, attrs, ...children) → HTMLElement
   * Avoids string concatenation in render functions; each element is
   * created programmatically, so attribute injection bugs are impossible.
   * Usage:  el('div', {class:'card'}, el('span', {}, 'Hello'))
   * ─────────────────────────────────────────────────────────────────── */
  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function(k) {
      if (k === 'html') { node.innerHTML = attrs[k]; }
      else if (k === 'style' && typeof attrs[k] === 'object') {
        Object.keys(attrs[k]).forEach(function(s) { node.style[s] = attrs[k][s]; });
      } else { node.setAttribute(k, attrs[k]); }
    });
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      if (c == null) continue;
      if (typeof c === 'string') { node.appendChild(document.createTextNode(c)); }
      else if (c instanceof Node) { node.appendChild(c); }
      else if (Array.isArray(c)) { c.forEach(function(ci) { if (ci) node.appendChild(ci); }); }
    }
    return node;
  }

  /** Convenience: create an element and return its outerHTML string */
  function elh(tag, attrs) {
    return el.apply(null, arguments).outerHTML;
  }

  var acTimers = {};
  var acClosers = [];

  /* ─── Per-domain rate limiter ─────────────────────────────────────────
   * Nominatim usage policy: max 1 request/second.
   * Queues requests and enforces a minimum gap between calls per domain.
   * ─────────────────────────────────────────────────────────────────── */
  var RATE_LIMITS = {
    'nominatim.openstreetmap.org': { minGapMs: 1100, lastCall: 0, queue: [] }
  };

  function rateLimitedFetch(url, opts) {
    var domain;
    try { domain = new URL(url).hostname; } catch(e) { return fetch(url, opts); }
    var rl = RATE_LIMITS[domain];
    if (!rl) return fetch(url, opts); // no limit for this domain

    return new Promise(function(resolve, reject) {
      rl.queue.push({ url: url, opts: opts, resolve: resolve, reject: reject });
      if (rl.queue.length === 1) drainQueue(rl);
    });
  }

  function drainQueue(rl) {
    if (!rl.queue.length) return;
    var item = rl.queue[0];
    var now = Date.now();
    var wait = Math.max(0, rl.minGapMs - (now - rl.lastCall));
    setTimeout(function() {
      rl.lastCall = Date.now();
      fetch(item.url, item.opts)
        .then(item.resolve, item.reject)
        .finally(function() {
          rl.queue.shift();
          drainQueue(rl);
        });
    }, wait);
  }
  // Stores resolved {lat, lon, name, isStation} per input after user selects a suggestion
  var acResolved = { 'orig-inp': null, 'dest-inp': null }; // registered by each setupAutocomplete instance

  /* ─── Autocomplete cache ──────────────────────────────
   * Keyed by normalised query string. Avoids redundant API
   * calls when the user types, deletes one char, re-types.
   * Max 100 entries; oldest evicted when full.
   ──────────────────────────────────────────────────── */
  var AC_CACHE = (function() {
    var store = {}, keys = [], MAX = 100;
    return {
      get: function(k) { return store[k] || null; },
      set: function(k, v) {
        if (!store[k]) {
          if (keys.length >= MAX) { delete store[keys.shift()]; }
          keys.push(k);
        }
        store[k] = v;
      }
    };
  })();

  /* ─── Helpers géographiques ───────────────────────── */
  function isInFrance(lat, lon) {
    return lat >= 41.3 && lat <= 51.1 && lon >= -5.2 && lon <= 9.6;
  }
  function isInEurope(lat, lon) {
    return lat >= 34.0 && lat <= 71.0 && lon >= -25.0 && lon <= 45.0;
  }

  function setupAutocomplete(inputId, listId) {
    var inp = $(inputId), list = $(listId);
    if (!inp || !list) return;
    var selectedIndex = -1, lastSuggestions = [];

    function closeList() {
      list.innerHTML = ''; list.classList.remove('visible');
      inp.classList.remove('ac-open');
      inp.setAttribute('aria-expanded', 'false');
      selectedIndex = -1;
      // Note: station picker is NOT closed here — it should persist after city selection
    }
    acClosers.push(function() { closeList(); });
    function fillInput(cityName) {
      inp.value = cityName;
      list.innerHTML = ''; list.classList.remove('visible');
      inp.setAttribute('aria-expanded', 'false');
    }
    function renderList(features) {
      list.innerHTML = ''; selectedIndex = -1; lastSuggestions = features;
      if (!features.length) { closeList(); return; }
      inp.classList.add('ac-open'); list.classList.add('visible');
      inp.setAttribute('aria-expanded', 'true');

      // Add a separator before the first stop result if there are cities above it
      var firstStopIdx = features.findIndex(function(f) { return f.properties._isStop; });
      var hasCity = features.some(function(f) { return !f.properties._isStop; });

      features.forEach(function(f, idx) {
        var isStop = !!f.properties._isStop;
        var label  = f.properties.label || f.properties.name || '';
        var dept   = (f.properties.context || '').split(',')[0] || '';
        var lat    = f.geometry && f.geometry.coordinates[1];
        var lon    = f.geometry && f.geometry.coordinates[0];

        // Separator between city results and station results
        if (isStop && idx === firstStopIdx && hasCity) {
          var sep = document.createElement('li');
          sep.className = 'ac-separator';
          sep.setAttribute('role', 'separator');
          sep.textContent = LANG === 'en' ? '🚉 Train stations' : '🚉 Gares';
          list.appendChild(sep);
        }

        var li = document.createElement('li');
        li.className = 'ac-item' + (isStop ? ' ac-item-stop' : '');
        li.setAttribute('role', 'option');
        li.innerHTML =
          '<span class="ac-pin">' + (isStop ? '🚉' : '📍') + '</span>' +
          '<span class="ac-city">' + label + '</span>' +
          (dept ? '<span class="ac-dept">' + dept + '</span>' : '');

        li.addEventListener('mousedown', function(e) {
          e.preventDefault();
          if (isStop) {
            // Station selected directly — store as station, skip sub-picker
            acResolved[inputId] = { lat: lat, lon: lon, name: label, isStation: true };
            fillInput(label);
            // Hide any existing station picker for this input
            hideStations();
          } else {
            // City selected — store coords, show station sub-picker
            acResolved[inputId] = { lat: lat, lon: lon, name: label, isStation: false };
            fillInput(label);
            if (lat && lon) fetchNearbyStations(lat, lon, label);
          }
        });
        list.appendChild(li);
      });
    }

    /** Search Transitous for stop/station suggestions matching query q */
    function fetchTransitousStops(q) {
      var url = 'https://api.transitous.org/api/v1/geocode?text=' +
                encodeURIComponent(q) + '&size=6';
      return fetchWithTimeout(url,
          { headers: { 'Referer': 'https://github.com/StellaSecret/TripMind' } }, 3000)
        .then(function(r) { return r.json(); })
        .then(function(results) {
          if (!Array.isArray(results)) return [];
          return results
            .filter(function(r) { return r.type === 'STOP'; })
            .reduce(function(acc, r) { // dedupe by name
              if (!acc.find(function(x) { return x.name === r.name; })) acc.push(r);
              return acc;
            }, [])
            .slice(0, 4)
            .map(function(s) {
              // Normalise to BAN-shaped feature, flagged as station
              var country = s.country || '';
              var area = (s.areas || []).find(function(a) { return a.adminLevel === 4; });
              var region = area ? area.name : '';
              return {
                geometry:   { coordinates: [s.lon, s.lat] },
                properties: {
                  label:    s.name,
                  city:     s.name,
                  name:     s.name,
                  context:  region + (country && country !== 'FR' ? (region ? ', ' : '') + country : ''),
                  type:     'stop',
                  _isStop:  true
                }
              };
            });
        })
        .catch(function() { return []; });
    }

    /** Fetch nearby Transitous stops and show a station picker below the input */
    function fetchNearbyStations(lat, lon, cityLabel) {
      var stationBox = document.getElementById(inputId + '-stations');
      if (!stationBox) {
        stationBox = document.createElement('div');
        stationBox.id = inputId + '-stations';
        stationBox.className = 'station-picker';
        inp.parentNode.insertBefore(stationBox, inp.nextSibling);
      }
      stationBox.innerHTML = '<span class="station-loading">🚉 …</span>';
      stationBox.style.display = 'block';

      var url = 'https://api.transitous.org/api/v1/geocode?text=' +
                encodeURIComponent(cityLabel) + '&size=8';
      fetchWithTimeout(url, {}, 4000)
        .then(function(r) { return r.json(); })
        .then(function(results) {
          if (!Array.isArray(results)) throw new Error('bad response');
          // Filter to STOP type only; dedupe by name; keep ≤5
          var stops = results
            .filter(function(r) { return r.type === 'STOP'; })
            .reduce(function(acc, r) {
              if (!acc.find(function(x) { return x.name === r.name; })) acc.push(r);
              return acc;
            }, [])
            .slice(0, 5);

          if (!stops.length) { stationBox.style.display = 'none'; return; }

          stationBox.innerHTML = '';
          var lbl = document.createElement('div');
          lbl.className = 'station-label';
          lbl.textContent = LANG === 'en' ? '🚉 Select station (optional):' : '🚉 Choisir une gare (optionnel) :';
          stationBox.appendChild(lbl);

          // "City center" option (default)
          var cityBtn = document.createElement('button');
          cityBtn.className = 'station-btn' + (acResolved[inputId] && !acResolved[inputId].isStation ? ' active' : '');
          cityBtn.textContent = '📍 ' + (LANG === 'en' ? 'City center' : 'Centre-ville');
          cityBtn.addEventListener('mousedown', function(e) {
            e.preventDefault();
            acResolved[inputId].isStation = false;
            stationBox.querySelectorAll('.station-btn').forEach(function(b) { b.classList.remove('active'); });
            this.classList.add('active');
          });
          stationBox.appendChild(cityBtn);

          stops.forEach(function(stop) {
            var btn = document.createElement('button');
            btn.className = 'station-btn';
            btn.textContent = '🚉 ' + stop.name;
            btn.addEventListener('mousedown', function(e) {
              e.preventDefault(); // prevent blur from firing before click
              acResolved[inputId] = { lat: stop.lat, lon: stop.lon, name: stop.name, isStation: true };
              inp.value = stop.name;
              stationBox.querySelectorAll('.station-btn').forEach(function(b) { b.classList.remove('active'); });
              this.classList.add('active');
            });
            stationBox.appendChild(btn);
          });
        })
        .catch(function() { stationBox.style.display = 'none'; });
    }

    /** Hide station picker for this input */
    function hideStations() {
      var sb = document.getElementById(inputId + '-stations');
      if (sb) sb.style.display = 'none';
    }
    function highlightItem(idx) {
      var items = list.querySelectorAll('.ac-item');
      items.forEach(function(it) { it.classList.remove('selected'); });
      if (idx >= 0 && idx < items.length) items[idx].classList.add('selected');
    }
    /* Fetch autocomplete suggestions:
     * 1. BAN (France) — fast, high quality for French cities & addresses
     * 2. Nominatim (OSM) — global fallback when BAN returns < 2 results
     * Both results are merged and deduplicated before display.
     */
    function fetchNominatimAC(q) {
      var url = 'https://nominatim.openstreetmap.org/search?q=' +
                encodeURIComponent(q) +
                '&format=json&limit=5&addressdetails=1&featuretype=city';
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function() { ctrl.abort(); }, 4000) : null;
      return rateLimitedFetch(url, {
        headers: { 'Accept-Language': 'fr,en', 'User-Agent': 'TripMind/1.0' },
        signal: ctrl ? ctrl.signal : undefined
      })
      .then(function(r) {
        if (timer) clearTimeout(timer);
        return r.json();
      })
      .then(function(results) {
        // Normalise Nominatim results into BAN-shaped GeoJSON features
        return (results || []).map(function(n) {
          var city = (n.address && (n.address.city || n.address.town ||
                      n.address.village || n.address.county)) || n.display_name.split(',')[0];
          var country = (n.address && n.address.country) || '';
          var state   = (n.address && (n.address.state || n.address.county)) || '';
          var label   = city + (country ? ', ' + country : '');
          return {
            geometry:   { coordinates: [parseFloat(n.lon), parseFloat(n.lat)] },
            properties: {
              label:   label,
              city:    city,
              name:    city,
              context: state + (country ? (state ? ', ' : '') + country : ''),
              type:    n.type || 'city',
              _nominatim: true
            }
          };
        });
      })
      .catch(function() { return []; });
    }

    inp.addEventListener('input', function() {
      var q = inp.value.trim();
      clearTimeout(acTimers[inputId]);
      // Clear resolved coords when user edits — old station selection is stale
      acResolved[inputId] = null;
      hideStations();
      if (q.length < 2) { closeList(); return; }
      acTimers[inputId] = setTimeout(function() {
        var banBase = 'https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(q) + '&autocomplete=1';

        // Run BAN (municipality) and Nominatim in parallel
        // For short queries: municipality only (fast city lookup).
        // For longer queries that look like addresses (contain digits or spaces+words):
        // also fetch housenumber results so full addresses appear.
        var looksLikeAddress = q.length >= 5 && /\d/.test(q);
        var banMunicipalityP = fetch(banBase + '&type=municipality&limit=4')
          .then(function(r) { return r.json(); })
          .then(function(d) { return d.features || []; })
          .catch(function() { return []; });
        var banAddressP = looksLikeAddress
          ? fetch(banBase + '&type=housenumber&limit=5')
              .then(function(r) { return r.json(); })
              .then(function(d) { return d.features || []; })
              .catch(function() { return []; })
          : Promise.resolve([]);
        var banP = Promise.all([banMunicipalityP, banAddressP]).then(function(r) {
          return r[0].concat(r[1]);
        });

        var nomP = fetchNominatimAC(q);

        Promise.all([banP, nomP]).then(function(results) {
          var banFeatures = results[0];
          var nomFeatures = results[1];

          // Use BAN results first; supplement with Nominatim for non-French results
          // Deduplicate by normalised city name
          var seen = {};
          var merged = [];
          banFeatures.forEach(function(f) {
            // Deduplicate by full label (address) not just city name
            var key = (f.properties.label || f.properties.name || '').toLowerCase().trim();
            if (key && !seen[key]) { seen[key] = true; merged.push(f); }
          });
          nomFeatures.forEach(function(f) {
            var key = (f.properties.label || f.properties.name || '').toLowerCase().trim();
            if (key && !seen[key]) { seen[key] = true; merged.push(f); }
          });

          renderList(merged.slice(0, 7));
        }).catch(function() { closeList(); });
      }, 150);
    });
    inp.addEventListener('keydown', function(e) {
      if (!list.classList.contains('visible')) return;
      var items = list.querySelectorAll('.ac-item');
      if (e.key === 'ArrowDown') { e.preventDefault(); selectedIndex = Math.min(selectedIndex+1, items.length-1); highlightItem(selectedIndex); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); selectedIndex = Math.max(selectedIndex-1, 0); highlightItem(selectedIndex); }
      else if (e.key === 'Enter' && selectedIndex >= 0 && lastSuggestions[selectedIndex]) {
        e.preventDefault();
        fillInput(lastSuggestions[selectedIndex].properties.label || lastSuggestions[selectedIndex].properties.name || '');
      } else if (e.key === 'Escape') { closeList(); hideStations(); }
    });
    inp.addEventListener('blur', function() {
      setTimeout(function() {
        closeList();
        // Only hide station picker if focus moved outside both input and picker
        var sb = document.getElementById(inputId + '-stations');
        if (sb && document.activeElement && !sb.contains(document.activeElement)) {
          sb.style.display = 'none';
        }
      }, 200);
    });
    document.addEventListener('click', function(e) {
      if (e.target !== inp && !list.contains(e.target)) closeList();
    });
    document.addEventListener('focusin', function(e) {
      if (e.target !== inp && !list.contains(e.target)) closeList();
    });
  }

  /* ─── API : Géocodage BAN + Nominatim (monde) ───── */
  function geocodeBAN(city) {
    // 1. Try BAN (France) — best accuracy for French cities & train stations
    return fetch('https://api-adresse.data.gouv.fr/search/?q=' + encodeURIComponent(city) +
                 '&type=municipality&limit=1&autocomplete=1')
      .then(function(r) { if (!r.ok) throw new Error('BAN HTTP ' + r.status); return r.json(); })
      .then(function(d) {
        if (d.features && d.features.length) {
          var f = d.features[0];
          return { lat: f.geometry.coordinates[1], lon: f.geometry.coordinates[0],
                   name: f.properties.city || f.properties.name,
                   label: f.properties.label || f.properties.name,
                   dept: (f.properties.context || '').split(',')[0],
                   country: 'FR' };
        }
        // 2. Nominatim (OpenStreetMap) — global fallback with 5s timeout
        // If Nominatim is unreachable (CI network block, test mock), fails gracefully.
        var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
        var nomTimer = ctrl ? setTimeout(function() { ctrl.abort(); }, 5000) : null;
        return fetch('https://nominatim.openstreetmap.org/search?q=' +
                     encodeURIComponent(city) + '&format=json&limit=1&addressdetails=1',
                     { headers: { 'Accept-Language': 'fr,en', 'User-Agent': 'TripMind/1.0' },
                       signal: ctrl ? ctrl.signal : undefined })
          .then(function(r2) {
            if (nomTimer) clearTimeout(nomTimer);
            if (!r2.ok) throw new Error('Nominatim HTTP ' + r2.status);
            return r2.json();
          })
          .then(function(dN) {
            if (!dN || !dN.length) throw new Error('"' + city + '" introuvable');
            var n = dN[0];
            return {
              lat:     parseFloat(n.lat),
              lon:     parseFloat(n.lon),
              name:    (n.display_name || city).split(',')[0].trim(),
              label:   (n.display_name || city).split(',')[0].trim(),
              dept:    (n.address && (n.address.state || n.address.county)) || '',
              country: ((n.address && n.address.country_code) || '').toUpperCase()
            };
          })
          .catch(function(e) {
            if (nomTimer) clearTimeout(nomTimer);
            throw new Error('"' + city + '" introuvable');
          });
      });
  }

  /* ─── API : Géocodage Transitous ────────────────────
   * Utilisé uniquement pour les trains : retourne les coords
   * de l'arrêt ferroviaire le plus proche, pas le centre-ville.
   * Ex: "Étampes" → gare d'Étampes (pas Saint-Martin-d'Étampes).
   ──────────────────────────────────────────────────── */
  function geocodeTransitous(city) {
    var url = 'https://api.transitous.org/api/v1/geocode?text=' +
              encodeURIComponent(city) + '&size=5';
    return fetch(url, { headers: { 'Referer': 'https://github.com/StellaSecret/TripMind' } })
      .then(function(r) { if (!r.ok) throw new Error('Transitous geocode HTTP ' + r.status); return r.json(); })
      .then(function(d) {
        if (!d || !d.length) throw new Error('"' + city + '" introuvable via Transitous');
        var fr = d.find(function(r) { return r.country === 'FR'; });
        if (!fr) throw new Error('"' + city + '" introuvable en France via Transitous');
        return { lat: fr.lat, lon: fr.lon, name: fr.name };
      });
  }

  /* ─── API : Météo Open-Meteo ─────────────────────────
   * Récupère 16 jours de prévisions et extrait le jour voulu
   * via dayOffset().
   ──────────────────────────────────────────────────── */
  function fetchMeteo(lat, lon) {
    var offset = dayOffset();
    var url = 'https://api.open-meteo.com/v1/forecast?' +
      'latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,cloud_cover' +
      '&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max,weather_code,wind_speed_10m_max' +
      '&timezone=auto&forecast_days=16';

    return fetch(url)
      .then(function(r) { if (!r.ok) throw new Error((LANG==='en'?'Weather HTTP ':'Météo HTTP ') + r.status); return r.json(); })
      .then(function(d) {
        var dy = d.daily;
        if (offset === 0) {
          // Aujourd'hui : données actuelles + prévisions daily
          var c = d.current;
          return {
            temp: Math.round(c.temperature_2m), feels: Math.round(c.apparent_temperature),
            humidity: Math.round(c.relative_humidity_2m), wind: Math.round(c.wind_speed_10m),
            code: c.weather_code, clouds: Math.round(c.cloud_cover),
            tmax: Math.round(dy.temperature_2m_max[0]), tmin: Math.round(dy.temperature_2m_min[0]),
            precipProb: dy.precipitation_probability_max[0],
            uv: Math.round(dy.uv_index_max[0]),
            isForecast: false
          };
        } else {
          // Jour futur : uniquement les données daily (pas de current)
          var i = offset;
          return {
            temp: Math.round((dy.temperature_2m_max[i] + dy.temperature_2m_min[i]) / 2),
            feels: Math.round((dy.temperature_2m_max[i] + dy.temperature_2m_min[i]) / 2) - 2,
            humidity: null,
            wind: Math.round(dy.wind_speed_10m_max[i]),
            code: dy.weather_code[i],
            clouds: null,
            tmax: Math.round(dy.temperature_2m_max[i]),
            tmin: Math.round(dy.temperature_2m_min[i]),
            precipProb: dy.precipitation_probability_max[i],
            uv: Math.round(dy.uv_index_max[i]),
            isForecast: true
          };
        }
      });
  }

  /* ─── API : Qualité air Open-Meteo ─────────────────
   * Pour les jours futurs, on prend l'heure 12:00 du jour voulu
   * dans les données horaires (index = offset * 24 + 12).
   ──────────────────────────────────────────────────── */
  function fetchAirQuality(lat, lon, inEurope) {
    var offset = dayOffset();
    var inEU = (inEurope !== false) && isInEurope(lat, lon);

    // Choose AQI index: European EAQI inside Europe, US AQI elsewhere
    var aqiVar = inEU ? 'european_aqi' : 'us_aqi';

    // Pollen (SILAM model) only available in Europe
    var pollenVars = inEU
      ? ',alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen'
      : '';

    var forecastDays = Math.min(offset + 2, 6);
    var url = 'https://air-quality-api.open-meteo.com/v1/air-quality?' +
      'latitude=' + lat + '&longitude=' + lon +
      '&hourly=' + aqiVar + ',pm2_5,pm10,nitrogen_dioxide,ozone' + pollenVars +
      '&timezone=auto&forecast_days=' + forecastDays;

    return fetch(url)
      .then(function(r) { if (!r.ok) throw new Error('AQI HTTP ' + r.status); return r.json(); })
      .then(function(d) {
        var h = d.hourly;

        // Lecture sécurisée d'un index dans un tableau horaire
        function safeVal(arr, idx) {
          if (!arr || idx < 0 || idx >= arr.length) return null;
          var v = arr[idx];
          return (v !== null && v !== undefined && !isNaN(v)) ? v : null;
        }
        function safeRound(arr, idx) {
          var v = safeVal(arr, idx); return v !== null ? Math.round(v) : null;
        }
        function safeFix(arr, idx) {
          var v = safeVal(arr, idx); return v !== null ? (+v).toFixed(1) : null;
        }

        // Index horaire cible : heure actuelle pour J+0, midi pour les autres
        var hi = offset === 0
          ? Math.min(new Date().getHours(), (h[aqiVar] || []).length - 1)
          : Math.min(offset * 24 + 12, (h[aqiVar] || []).length - 1);

        // Si l'index dépasse le tableau (données non disponibles pour ce jour),
        // prendre le dernier index disponible avec un flag d'avertissement
        var maxIdx = (h[aqiVar] || []).length - 1;
        var outOfRange = hi > maxIdx;
        hi = Math.max(0, Math.min(hi, maxIdx));

        var aqi  = safeRound(h[aqiVar], hi);
        var pm25 = safeFix(h.pm2_5, hi);
        var pm10 = safeFix(h.pm10, hi);
        var no2  = safeFix(h.nitrogen_dioxide, hi);
        var o3   = safeFix(h.ozone, hi);

        var pn = t('pollenNames');
        var pollens = {}, polMax = 0, polActifs = [], polNiveau = {l:t('pollenNA'),c:'bb'};
        var pollenNotAvailable = !inEU; // pollen data only in Europe

        if (inEU && h.alder_pollen) {
          pollens[pn.Aulne]     = safeRound(h.alder_pollen, hi)  || 0;
          pollens[pn.Bouleau]   = safeRound(h.birch_pollen, hi)  || 0;
          pollens[pn.Graminées] = safeRound(h.grass_pollen, hi)  || 0;
          pollens[pn.Armoise]   = safeRound(h.mugwort_pollen, hi)|| 0;
          pollens[pn.Olivier]   = safeRound(h.olive_pollen, hi)  || 0;
          polMax = Math.max.apply(null, Object.values(pollens));
          polActifs = Object.keys(pollens).filter(function(k) { return pollens[k] > 2; });
          polNiveau = outOfRange
            ? {l:t('pollenNA'),c:'bb'}
            : polMax < 10  ? {l:t('pollenFaible'),c:'bg'}
            : polMax < 50  ? {l:t('pollenModere'),c:'ba'}
            : polMax < 200 ? {l:t('pollenEleve'),c:'ba'}
            :                {l:t('pollenTresEleve'),c:'br'};
        }

        return {
          aqi: outOfRange ? null : aqi,
          aqiType: inEU ? 'EU' : 'US',
          pm25: outOfRange ? null : pm25,
          pm10: outOfRange ? null : pm10,
          o3: outOfRange ? null : o3,
          no2: outOfRange ? null : no2,
          pollens: (outOfRange || pollenNotAvailable) ? {} : pollens,
          polMax: (outOfRange || pollenNotAvailable) ? 0 : polMax,
          polActifs: (outOfRange || pollenNotAvailable) ? [] : polActifs,
          polNiveau: polNiveau,
          outOfRange: outOfRange,
          pollenNotAvailable: pollenNotAvailable
        };
      });
  }

  /* ─── API : OSRM ─────────────────────────────────── */
  function fetchRoute(oLat, oLon, dLat, dLon) {
    var url = 'https://router.project-osrm.org/route/v1/driving/' +
              oLon + ',' + oLat + ';' + dLon + ',' + dLat + '?overview=false&annotations=false';
    return fetch(url)
      .then(function(r) { if (!r.ok) throw new Error('OSRM HTTP ' + r.status); return r.json(); })
      .then(function(d) {
        if (!d.routes || !d.routes.length) throw new Error(LANG==='en'?'No route found':'Aucun itinéraire trouvé');
        var rt = d.routes[0], distM = rt.distance;
        return {
          distKm: Math.round(distM / 1000),
          dist: distM >= 1000 ? Math.round(distM / 1000) + ' km' : Math.round(distM) + ' m',
          dur: fmtDur(rt.duration), durSec: rt.duration,
          note: t('routeNote')  // translated: 'Durée théorique sans trafic (OSRM / OpenStreetMap)'
        };
      });
  }

  /* ─── API : Transitous / MOTIS 2 ─────────────────────
   *
   * Endpoint public : https://api.transitous.org/api/
   * Aucun token requis. FOSS et non commercial uniquement.
   * Doc : https://transitous.org/api/
   *
   * Endpoint de planification : GET /api/v1/plan
   *   fromPlace = "lat,lon,level"   (level = 0 = rez-de-chaussée)
   *   toPlace   = "lat,lon,level"
   *   time      = ISO 8601 "YYYY-MM-DDTHH:MM:SS"
   *   numItineraries = nombre max de trajets retournés
   *   transportModes = filtre de modes (TRANSIT pour tout TP)
   *
   * Réponse : { plan: { itineraries: [...] } }
   * Chaque itinerary contient :
   *   startTime / endTime : timestamps Unix ms
   *   duration            : secondes
   *   legs                : tableau de segments
   *     leg.mode          : "WALK", "RAIL", "BUS", "SUBWAY", …
   *     leg.routeShortName / leg.headsign : numéro/nom
   *     leg.from.name / leg.to.name
   *     leg.realTime      : booléen (données temps réel disponibles)
   *
   * User-Agent REQUIS par la politique Transitous.
   ──────────────────────────────────────────────────── */
  var TRANSITOUS_UA = 'TripMind/4.0 (https://github.com/StellaSecret/TripMind; contact via GitHub)';
  var TRANSITOUS_TIMEOUT_MS = 12000; // 12s — au-delà Transitous est probablement surchargé

  /* Fetch avec timeout via AbortController */
  function fetchWithTimeout(url, opts, timeoutMs) {
    var ctrl = (typeof AbortController !== 'undefined') ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function() { ctrl.abort(); }, timeoutMs) : null;
    var fetchOpts = ctrl ? Object.assign({}, opts, { signal: ctrl.signal }) : opts;
    return fetch(url, fetchOpts).finally(function() { if (timer) clearTimeout(timer); });
  }

  /* Convertit un string ISO 8601 UTC "2026-04-28T20:38:00Z" en "HH:MM" heure locale */
  function isoToHHMM(iso) {
    if (!iso) return '--:--';
    var d = new Date(iso);
    return pad(d.getHours()) + ':' + pad(d.getMinutes());
  }

  /* Parse une réponse MOTIS v1 (Transitous).
   * Structure réelle confirmée par curl :
   * {
   *   requestParameters, debugOutput, from, to, direct,
   *   itineraries: [{
   *     duration,          ← secondes
   *     startTime,         ← ISO 8601 UTC string "2026-04-28T20:35:00Z"
   *     endTime,           ← ISO 8601 UTC string
   *     transfers,         ← nombre de correspondances (déjà calculé)
   *     legs: [{
   *       mode,            ← "WALK", "SUBWAY", "RAIL", "BUS"…
   *       startTime,       ← ISO 8601 UTC string
   *       endTime,         ← ISO 8601 UTC string
   *       duration,        ← secondes
   *       headsign,        ← "La Défense (Grande Arche)"
   *       realTime,        ← booléen
   *       from: { name, departure, … }
   *       to:   { name, arrival,  … }
   *     }]
   *   }]
   * } */
  function parseMotisResponse(d) {
    var itins = d.itineraries;
    if (!itins || !itins.length) return { _empty: true, trains: [] };

    // Ne garder que les itinéraires avec au moins 1 leg non-WALK
    var ptItins = itins.filter(function(it) {
      return it.legs && it.legs.some(function(l) {
        var m = (l.mode || '').toUpperCase();
        return m !== 'WALK' && m !== 'BICYCLE' && m !== 'CAR';
      });
    });

    if (!ptItins.length) return { _empty: true, trains: [] };

    // Dédupliquer sur le premier leg TP (départ + arrivée + headsign).
    // IT0/1/2 prennent le même REGIONAL_RAIL 06:15→07:11 mais Transitous
    // ajoute des métros différents pour la fin du trajet → variantes inutiles.
    // On garde l'itinéraire avec le moins de correspondances pour chaque
    // "même premier train".
    var firstLegMap = {}; // key → itinéraire retenu
    ptItins.forEach(function(it) {
      var ptLegsAll = it.legs.filter(function(l) {
        var m = (l.mode || '').toUpperCase();
        return m !== 'WALK' && m !== 'BICYCLE' && m !== 'CAR';
      });
      if (!ptLegsAll.length) return;
      var fl = ptLegsAll[0];
      // Clé = mode + heure de départ du premier leg TP uniquement.
      // L'endTime du premier leg peut varier selon la variante (arrêt intermédiaire différent).
      var key = (fl.mode||'') + '|' + (fl.startTime||'');
      var existing = firstLegMap[key];
      if (!existing || (it.transfers||0) < (existing.transfers||0)) {
        firstLegMap[key] = it;
      }
    });
    var deduped = Object.values(firstLegMap)
      // Re-trier par heure de départ du premier leg TP croissante
      .sort(function(a, b) {
        var aLegs = a.legs.filter(function(l){var m=(l.mode||'').toUpperCase();return m!=='WALK'&&m!=='BICYCLE'&&m!=='CAR';});
        var bLegs = b.legs.filter(function(l){var m=(l.mode||'').toUpperCase();return m!=='WALK'&&m!=='BICYCLE'&&m!=='CAR';});
        var at = aLegs.length ? aLegs[0].startTime : a.startTime;
        var bt = bLegs.length ? bLegs[0].startTime : b.startTime;
        return at < bt ? -1 : at > bt ? 1 : 0;
      });

    var trains = deduped.slice(0, 3).map(function(it) {
      var ptLegs = it.legs.filter(function(l) {
        var m = (l.mode || '').toUpperCase();
        return m !== 'WALK' && m !== 'BICYCLE' && m !== 'CAR';
      });
      var first = ptLegs[0] || {};
      var last  = ptLegs[ptLegs.length - 1] || {};

      /* Nettoyage du headsign
       * Codes internes GTFS à rejeter : "VETO", "SARA", "860584", "TER01"…
       * Règle : uniquement chiffres/majuscules/tirets, sans espace, ≤ 8 chars */
      function isGtfsCode(s) {
        return s.length >= 1 && s.length <= 8 && /^[A-Z0-9\-_]+$/.test(s);
      }

      var hs = first.headsign || '';
      var hsClean = isGtfsCode(hs) ? '' : hs;

      /* Si pas de headsign lisible, utiliser le nom de la gare d'arrivée
       * du dernier leg TP (ex: "Paris Gare de Lyon") */
      var destName = '';
      if (!hsClean && last.to && last.to.name) {
        var n = last.to.name;
        // Exclure les noms génériques MOTIS
        if (n !== 'END' && n !== 'START' && n.length > 1) destName = n;
      }

      var mode  = modeToLabel(first.mode || '');
      var label = hsClean  ? mode + ' → ' + hsClean
                : destName ? mode + ' → ' + destName
                :            mode;

      return {
        // from.departure / to.arrival = heure réelle en gare (scheduled stop time)
        // first.startTime peut inclure un décalage de marche → on préfère from.departure
        depart:    isoToHHMM((first.from && first.from.departure) || first.startTime || it.startTime),
        arrivee:   isoToHHMM((last.to   && last.to.arrival)      || last.endTime    || it.endTime),
        // Durée = uniquement le temps en transport (sans marche initiale/finale)
        duree:     fmtDur(ptLegs.reduce(function(acc, l) {
                     return acc + (l.duration || 0);
                   }, 0) + (it.transfers || 0) * 180), // +3 min par correspondance estimée
        numero:    label,
        transfers: it.transfers || Math.max(0, ptLegs.length - 1),
        fiabilite: modeToReliab(first.mode || ''),
        realTime:  ptLegs.some(function(l) { return l.realTime; })
      };
    });

    return { trains: trains };
  }

  function fetchTrains(oLat, oLon, dLat, dLon) {
    var dt = new Date(selectedDate);
    if (dayOffset() > 0) {
      dt.setHours(selectedTrainHour, 0, 0, 0);
    } else {
      // Today: use selectedTrainHour if it's in the future, otherwise current time
      var nowHour = new Date().getHours();
      if (selectedTrainHour > nowHour) {
        dt.setHours(selectedTrainHour, 0, 0, 0);
      } else {
        dt = new Date(); // already past chosen hour — show next trains from now
      }
    }

    // Format coordonnées MOTIS 2 : "lat,lon" (sans level)
    var from = oLat + ',' + oLon;
    var to   = dLat + ',' + dLon;
    var url  = 'https://api.transitous.org/api/v1/plan?' +
      'fromPlace=' + encodeURIComponent(from) +
      '&toPlace='  + encodeURIComponent(to) +
      '&time='     + encodeURIComponent(toMotisDate(dt)) +
      '&numItineraries=5' +
      '&transportModes=TRANSIT,WALK';

    var headers = { 'Referer': 'https://github.com/StellaSecret/TripMind' };
    // User-Agent non envoyable par les browsers dans les requêtes fetch cross-origin
    // → on utilise Referer comme identifiant comme recommandé par Transitous

    function doFetch() {
      return fetchWithTimeout(url, { headers: headers }, TRANSITOUS_TIMEOUT_MS)
        .then(function(r) {
          // 500 / 504 = serveur surchargé → on retourne un état spécial pour retry
          if (r.status === 500 || r.status === 504 || r.status === 502 || r.status === 503) {
            return { _overloaded: true, status: r.status };
          }
          if (r.status === 429) return { _err: 'Service Transitous temporairement limité (429). Réessayez dans quelques secondes.', trains: [] };
          if (!r.ok) return { _err: 'Transitous HTTP ' + r.status, trains: [] };
          return r.json().then(parseMotisResponse);
        })
        .catch(function(e) {
          var msg = e.name === 'AbortError'
            ? 'Transitous ne répond pas (timeout ' + (TRANSITOUS_TIMEOUT_MS/1000) + 's) — service probablement surchargé.'
            : 'Réseau : ' + e.message;
          return { _err: msg, trains: [] };
        });
    }

    // Première tentative
    return doFetch().then(function(res) {
      if (!res._overloaded) return res;
      // Retry unique après 3 secondes si 5xx
      return new Promise(function(resolve) { setTimeout(resolve, 3000); })
        .then(doFetch)
        .then(function(res2) {
          if (res2._overloaded) {
            return {
              _err: 'Transitous est surchargé (HTTP ' + res2.status + '). ' +
                    'C\'est un service communautaire à capacité limitée — réessayez dans quelques minutes.',
              trains: []
            };
          }
          return res2;
        });
    });
  }

  /* Convertit un mode MOTIS en libellé court */
  function modeToLabel(mode) {
    var m = (mode || '').toUpperCase();
    if (m === 'RAIL' || m === 'HIGHSPEED_RAIL' || m === 'REGIONAL_RAIL') return t('modeTrain');
    if (m === 'BUS' || m === 'COACH')           return t('modeBus');
    if (m === 'SUBWAY')                         return t('modeSubway');
    if (m === 'TRAM')                           return t('modeTram');
    if (m === 'FERRY')                          return t('modeFerry');
    if (m === 'AIRPLANE')                       return t('modePlane');
    return t('modeTransit');
  }

  /* Fiabilité estimée selon le mode */
  /* Mode-based on-time estimates (SNCF 2023 annual report + RATP stats).
   * Only shown as a bar when realTime=true (live delay data from Transitous).
   * Otherwise omitted — estimates are too imprecise to display per-trip. */
  function modeToReliab(mode) {
    var m = (mode || '').toUpperCase();
    if (m === 'HIGHSPEED_RAIL') return 92; // TGV: ~92% on-time (SNCF 2023)
    if (m === 'RAIL')           return 85; // TER/Intercités: ~85%
    if (m === 'BUS')            return 80;
    if (m === 'SUBWAY')         return 90; // RATP: ~90%
    if (m === 'TRAM')           return 87;
    return 83;
  }

  /* ─── Score ──────────────────────────────────────────────────────────────
   * Starts at 100. Each factor deducts points based on severity.
   * Weights rationale:
   *   Weather (WMO code) : up to -25  — dominant factor, direct travel impact
   *   Temperature        : up to -10  — comfort, not safety
   *   Air quality (AQI)  : up to -25  — health risk, comparable to bad weather
   *   Pollen             : up to -12  — affects allergy sufferers
   * Final score clamped [5, 100].
   * ─────────────────────────────────────────────────────────────────────── */
  var SCORE_WEIGHTS = {
    // WMO weather code penalties
    wmo:    { storm:25, heavyRain:18, rain:12, drizzle:7, fog:5, cloudy:3 },
    // Temperature (°C) comfort penalties
    temp:   { extreme:10, uncomfortable:5 },
    // European/US AQI penalties
    aqi:    { veryPoor:25, poor:15, moderate:8, fair:3 },
    // Pollen (grain/m³) penalties
    pollen: { veryHigh:12, high:7, moderate:3 }
  };

  function calcScore(m, aq) {
    var s = 100, c = m.code, w = SCORE_WEIGHTS;

    // Weather
    if      (c>=95) s -= w.wmo.storm;
    else if (c>=80) s -= w.wmo.heavyRain;
    else if (c>=61) s -= w.wmo.rain;
    else if (c>=51) s -= w.wmo.drizzle;
    else if (c>=45) s -= w.wmo.fog;
    else if (c>=3)  s -= w.wmo.cloudy;

    // Temperature comfort
    if      (m.temp < 0  || m.temp > 37) s -= w.temp.extreme;
    else if (m.temp < 5  || m.temp > 33) s -= w.temp.uncomfortable;

    // Air quality
    var a = aq.aqi || 0;
    if      (a > 100) s -= w.aqi.veryPoor;
    else if (a > 80)  s -= w.aqi.poor;
    else if (a > 60)  s -= w.aqi.moderate;
    else if (a > 40)  s -= w.aqi.fair;

    // Pollen (Europe only; outside Europe polMax=0 so no deduction)
    var p = aq.polMax || 0;
    if      (p > 200) s -= w.pollen.veryHigh;
    else if (p > 50)  s -= w.pollen.high;
    else if (p > 10)  s -= w.pollen.moderate;

    return { score: Math.max(5, Math.min(100, Math.round(s))) };
  }

  /* ─── Modes ──────────────────────────────────────── */
  /* ─── Mode comparison constants ─────────────────────────────────────────
   * All rates are per-km estimates for France; sourced as noted.
   * Update these when underlying costs change rather than hunting the code.
   * ─────────────────────────────────────────────────────────────────── */
  var MODE_COSTS = {
    car: {
      fuelLPer100km:   7.0,   // average petrol car (ADEME 2024)
      fuelEurPerL:     1.85,  // avg pump price France 2024 (UFIP)
      tollEurPerKm:    0.09,  // autoroute avg (ASFA 2024); 0 below 80 km threshold
      tollThresholdKm: 80,    // below this, toll usually negligible
      co2gPerKm:       128,   // g CO₂/km, average new car (ADEME 2024)
    },
    train: {
      co2gPerKm:       1.7,   // g CO₂/km (SNCF 2023 bilan carbone)
      terEurPerKm:     0.08,  // TER estimate
      terMin:          8,
      tgvEurPerKm:     0.12,  // TGV/Intercités estimate
      tgvMin:          25,
      tgvMax:          90,
      tgvThresholdKm:  150,   // below: TER pricing; above: TGV pricing
    },
    bus: {
      co2gPerKm:       29,    // g CO₂/km (ADEME long-distance coach)
      eurPerKm:        0.05,  // FlixBus / BlaBlaCar Bus avg (2024)
      minEur:          5,
      durationFactor:  1.6,   // relative to car duration
      minDistKm:       15,
    },
    carpool: {
      co2gPerKm:       51,    // g CO₂/km per passenger (ADEME, 2 occupants avg)
      eurPerKm:        0.06,  // BlaBlaCar avg per passenger (2024)
      minEur:          5,
      durationFactor:  1.1,
      minDistKm:       15,
    },
    bike: {
      maxDistKm:       20,
      speedKmH:        15,    // average cycling speed
      co2gPerKm:       0,
    },
  };

  function calcModes(rt, trains) {
    var dist=(rt&&rt.distKm)||0, durSec=(rt&&rt.durSec)||0, modes=[];
    if (!dist) return modes;

    var c = MODE_COSTS;
    var carburant   = Math.round(dist * c.car.fuelLPer100km / 100 * c.car.fuelEurPerL);
    var peages      = dist > c.car.tollThresholdKm ? Math.round(dist * c.car.tollEurPerKm) : 0;
    var coutCarSolo = carburant + peages;
    var co2Car      = Math.round(c.car.co2gPerKm * dist / 1000);
    var noteVoiture = peages > 0
      ? t('carFuelToll')(carburant, peages)
      : t('carFuelOnly');
    modes.push({
      mode:t('modeCar'), icon:'🚗', duree:(rt&&rt.dur)||'—',
      cout:'~' + coutCarSolo + '€',
      fib:78, co2kg:co2Car, co2:co2Car+' kg',
      score:62, note:noteVoiture  // already uses t() below
    });

    /* ── Train ─────────────────────────────────────────────────────────
     * Tarif TGV/Intercités : très variable (12€ Ouigo → 90€+).
     * Estimation raisonnable : base 10€ + 0.12€/km, plafonné à 90€.
     * Pour TER : ~0.08€/km.
     * ─────────────────────────────────────────────────────────────────── */
    if (trains && trains.trains && trains.trains.length) {
      var tr0 = trains.trains[0];
      var co2t = +(c.train.co2gPerKm * dist / 1000).toFixed(2);
      var coutTrain = dist < c.train.tgvThresholdKm
        ? Math.round(Math.max(c.train.terMin, dist * c.train.terEurPerKm))
        : Math.round(Math.min(c.train.tgvMax, Math.max(c.train.tgvMin, dist * c.train.tgvEurPerKm)));
      modes.push({
        mode:t('modeTrain'), icon:'🚆', duree:tr0.duree,
        cout:'~' + coutTrain + '€',
        fib:tr0.fiabilite, co2kg:co2t,
        co2:co2t<1?Math.round(co2t*1000)+' g':co2t.toFixed(1)+' kg',
        score:88, note:t('trainRealtime')
      });
    } else if (dist > 5) {
      var co2t2 = +(c.train.co2gPerKm * dist / 1000).toFixed(2);
      var coutTrain2 = dist < c.train.tgvThresholdKm
        ? Math.round(Math.max(c.train.terMin, dist * c.train.terEurPerKm))
        : Math.round(Math.min(c.train.tgvMax, Math.max(c.train.tgvMin, dist * c.train.tgvEurPerKm)));
      modes.push({
        mode:'Train', icon:'🚆',
        duree:fmtDur(Math.round(Math.max(20, dist * 0.45)) * 60),
        cout:'~' + coutTrain2 + '€',
        fib:88, co2kg:co2t2,
        co2:co2t2<1?Math.round(co2t2*1000)+' g':co2t2.toFixed(1)+' kg',
        score:85, note:t('trainEstim')
      });
    }

    if (dist > c.bus.minDistKm) {
      /* ── Bus / Car longue distance ──────────────────────────────────
       * FlixBus, BlaBlaCar Bus : ~0.05€/km, min 5€
       * ─────────────────────────────────────────────────────────────── */
      var co2b = +(c.bus.co2gPerKm * dist / 1000).toFixed(1);
      var coutBus = Math.round(Math.max(c.bus.minEur, dist * c.bus.eurPerKm));
      modes.push({
        mode:t('modeBus'), icon:'🚌',
        duree:fmtDur(Math.round(durSec * c.bus.durationFactor)),
        cout:'~' + coutBus + '€',
        fib:82, co2kg:+co2b, co2:co2b+' kg',
        score:65, note:t('busEstim')
      });

      /* ── Covoiturage ─────────────────────────────────────────────────
       * BlaBlaCar : ~0.06€/km passager, min 5€
       * ─────────────────────────────────────────────────────────────── */
      var co2v = +(c.carpool.co2gPerKm * dist / 1000).toFixed(1);
      var coutCov = Math.round(Math.max(c.carpool.minEur, dist * c.carpool.eurPerKm));
      modes.push({
        mode:t('modeCarpool'), icon:'🚘',
        duree:fmtDur(Math.round(durSec * c.carpool.durationFactor)),
        cout:'~' + coutCov + '€',
        fib:72, co2kg:+co2v, co2:co2v+' kg',
        score:68, note:t('carpoolEstim')
      });
    }

    if (dist <= c.bike.maxDistKm) {
      modes.push({
        mode:t('modeBike'), icon:'🚲',
        duree:fmtDur(Math.round(dist / c.bike.speedKmH * 3600)),
        cout:'0€', fib:95, co2kg:c.bike.co2gPerKm, co2:'0',
        score:dist <= 10 ? 82 : 60, note:t('bikeSpeed')
      });
    }

    var best = Math.max.apply(null, modes.map(function(m) { return m.score; }));
    var bm = modes.find(function(m) { return m.score === best; });
    if (bm) bm.best = true;
    return modes;
  }

  /* ─── Recommandations ────────────────────────────── */
  function buildReco(m, aq, rt) {
    var al=[], alt=[], c=m.code;
    if (aq.polMax>200) al.push(t('recoPollenHigh')(aq.polMax));
    else if(aq.polMax>50) al.push(t('recoPollenMed'));
    else if(aq.polMax>10) al.push(t('recoPollenLow')(aq.polActifs.join(', ')));
    if (aq.aqi>100) al.push(t('recoAqiBad')(aq.aqi));
    else if(aq.aqi>60) al.push(t('recoAqiMed')(aq.aqi));
    if (c>=95) al.push(t('recoStorm'));
    else if(c>=80) al.push(t('recoRainHeavy'));
    else if(c>=51) al.push(t('recoRain'));
    if (m.temp<2) al.push(t('recoFrost')(m.temp));
    if (m.temp>34) al.push(t('recoHeat')(m.temp));
    if (m.uv>=8) al.push(t('recoUvHigh')(m.uv));
    else if(m.uv>=6) al.push(t('recoUvMed')(m.uv));
    if (m.isForecast) al.push(t('recoForecast')(dayOffset()));
    if (rt) alt.push(t('recoCarNote')(rt.dur, rt.dist));
    alt.push(t('recoTrainNote'));
    return { cond: wmoDesc(c), al: al, alt: alt };
  }

  /* ─── Score circle ────────────────────────────────── */
  function mkCircle(score) {
    var R=36,C=40,ci=2*Math.PI*R,col=scCol(score),off=ci-(score/100)*ci;
    return '<svg style="transform:rotate(-90deg);position:absolute;inset:0" width="80" height="80" viewBox="0 0 80 80">'+
      '<circle cx="'+C+'" cy="'+C+'" r="'+R+'" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="6"/>'+
      '<circle cx="'+C+'" cy="'+C+'" r="'+R+'" fill="none" stroke="'+col+'" stroke-width="6"'+
      ' stroke-dasharray="'+ci.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" stroke-linecap="round"'+
      ' style="filter:drop-shadow(0 0 8px '+col+')"/></svg>'+
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--fm);color:'+col+'">'+
      '<span style="font-size:1.2rem;font-weight:800">'+score+'</span>'+
      '<span style="font-size:.44rem;color:var(--t3)">/100</span></div>';
  }

  /* ════════════════════════════════════════════════════
     RENDU DES ONGLETS
  ═══════════════════════════════════════════════════ */

  function forecastBadge(isForecast, offset) {
    if (!isForecast) return '';
    return '<span class="forecast-badge">'+t('forecastBadge')(offset)+'</span>';
  }

  function renderOverview() {
    var m=DATA.m, aq=DATA.aq, rt=DATA.rt, reco=DATA.reco;
    var uv=uvLvl(m.uv), ico=wmoIcon(m.code), aqI=euAqi(aq.aqi);
    var uvPct=Math.min(99,m.uv/11*100).toFixed(1);
    var off=dayOffset();
    return (
      '<div class="card"><div class="ch">'+
      '<span class="ct">'+t('meteoAt')+DATA.dName+'</span>'+
      '<div style="display:flex;align-items:center;gap:5px">'+
      (m.isForecast?'<span class="forecast-badge">'+t('forecastBadge')(off)+'</span>':'')+
      '<span class="src-tag">Open-Meteo</span></div>'+
      '</div><div class="cb">'+
      '<div class="wg">'+
      '<div class="wmain"><span style="font-size:1.8rem">'+ico+'</span>'+
      '<div><div style="font-size:2rem;font-weight:800;font-family:var(--fm)">'+m.temp+'°</div>'+
      '<div style="font-size:.7rem;color:var(--t2)">'+reco.cond+
      (m.isForecast?t('feelsEst'):t('feelsLike'))+m.feels+'°C</div></div>'+
      '<div style="margin-left:auto;text-align:right">'+
      '<div style="font-size:.58rem;font-family:var(--fm);color:var(--t3)">'+t('minMax')+'</div>'+
      '<div style="font-size:.86rem;font-weight:700;font-family:var(--fm)">'+m.tmin+'° / '+m.tmax+'°</div></div></div>'+
      (m.wind!=null?'<div class="wstat"><div class="wsl">'+t('windMax')+'</div><div class="wsv" style="color:var(--t2)">'+m.wind+' km/h</div></div>':'')+
      '<div class="wstat"><div class="wsl">'+t('precip')+'</div><div class="wsv" style="color:'+(m.precipProb>50?'#3B82F6':'var(--t2)')+'">'+m.precipProb+'%</div></div>'+
      (m.humidity!=null?'<div class="wstat"><div class="wsl">'+t('humidity')+'</div><div class="wsv" style="color:#06B6D4">'+m.humidity+'%</div></div>':'')+
      (m.clouds!=null?'<div class="wstat"><div class="wsl">'+t('clouds')+'</div><div class="wsv">'+m.clouds+'%</div></div>':'')+
      '<div class="wt2"><div class="wsl" style="margin-bottom:5px">UV '+m.uv+'/11 — <span style="color:'+uv.c+'">'+uv.l+'</span></div>'+
      '<div class="uvg"><div class="uvtrack"><div class="uvneedle" style="left:calc('+uvPct+'% - 5px)"></div></div></div></div>'+
      '</div></div></div>'+

      '<div class="card"><div class="ch"><span class="ct">'+t('airQualityTitle')+'</span><span class="src-tag">Copernicus CAMS</span></div><div class="cb">'+
      (aq.outOfRange || aq.aqi == null
        ? '<div class="info-note">'+t('aqiNoData')(dayOffset())+'</div>'
        : '<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">'+
          '<div style="width:44px;height:44px;border-radius:50%;border:2.5px solid;display:flex;align-items:center;justify-content:center;font-size:.9rem;font-weight:800;font-family:var(--fm);flex-shrink:0" class="'+aqI.c+'">'+aq.aqi+'</div>'+
          '<div><div style="font-weight:700;font-size:.85rem">'+aqI.l+'</div>'+
          '<div style="font-size:.62rem;color:var(--t3);font-family:var(--fm)">'+(aq.aqiType==='US'?t('aqiLabelUS'):t('aqiLabel'))+(m.isForecast?t('aqiForecast'):t('aqiCurrent'))+'</div></div>'+
          '<span class="badge '+aqI.c+'" style="margin-left:auto">'+aqI.l+'</span></div>'+
          '<div class="wg">'+
          (aq.pm25!=null?'<div class="wstat"><div class="wsl">PM₂.₅</div><div class="wsv" style="font-size:.78rem">'+aq.pm25+' μg/m³</div></div>':'')+
          (aq.pm10!=null?'<div class="wstat"><div class="wsl">PM₁₀</div><div class="wsv" style="font-size:.78rem">'+aq.pm10+' μg/m³</div></div>':'')+
          '</div>'
      )+'</div></div>'+

      '<div class="card"><div class="ch"><span class="ct">'+t('recoCardTitle')+'</span></div><div class="cb">'+
      '<div class="rcard"><div style="display:flex;align-items:center;gap:7px;margin-bottom:5px">'+
      '<span>🎯</span><span style="font-size:.78rem;font-weight:700;color:var(--cyan)">'+t('recoTitle')+'</span></div>'+
      '<div class="rtime">'+reco.cond+'</div>'+
      '<div class="rtxt">'+(rt?t('recoCarNote')(rt.dur,rt.dist):t('recoNA'))+'</div></div>'+
      (reco.al.length?reco.al.map(function(a){return '<div class="ai"><span>⚠️</span><span class="at">'+a+'</span></div>';}).join(''):
       '<div class="ai"><span>✅</span><span class="at">'+t('recoGood')+'</span></div>')+
      (reco.alt.length?'<div style="font-size:.62rem;font-family:var(--fm);color:var(--t3);margin:8px 0 5px;text-transform:uppercase;letter-spacing:1.5px">'+t('recoInfoTitle')+'</div>'+
       reco.alt.map(function(a){return '<div class="ai"><span>ℹ️</span><span class="at">'+a+'</span></div>';}).join(''):'')+'</div></div>'
    );
  }

  function renderRoute() {
    var rt=DATA.rt, modes=DATA.modes;
    var rtH=!rt?'<div style="padding:12px;color:var(--t3);font-size:.75rem;font-family:var(--fm)">'+t('routeNA')+'</div>':
      '<div class="wg"><div class="wmain" style="flex-direction:column;align-items:flex-start;gap:4px">'+
      '<div style="font-size:1.4rem;font-weight:800;font-family:var(--fm)">'+rt.dist+'</div>'+
      '<div style="font-size:.7rem;color:var(--t2)">'+rt.dur+t('routeEstim')+'</div></div>'+
      '<div class="wstat"><div class="wsl">Durée</div><div class="wsv">'+rt.dur+'</div></div>'+
      '<div class="wstat"><div class="wsl">Distance</div><div class="wsv">'+rt.dist+'</div></div></div>'+
      '<div class="info-note">ℹ '+rt.note+'</div>';  // rt.note already uses t()
    return (
      '<div class="card"><div class="ch"><span class="ct">'+t('routeCard')+'</span><span class="src-tag">OSRM · OSM</span></div><div class="cb">'+rtH+'</div></div>'+
      '<div class="card"><div class="ch"><span class="ct">'+t('multiMode')+'</span></div><div class="cb">'+
      '<div class="mgrid">'+modes.map(function(m){
        return '<div class="mc '+(m.best?'best':'')+'">'+
          '<div style="font-size:1.2rem;margin-bottom:4px">'+m.icon+'</div>'+
          '<div style="font-size:.8rem;font-weight:700;margin-bottom:6px">'+m.mode+'</div>'+
          '<div class="mstat"><span class="mk">'+t('durLabel')+'</span><span class="mv">'+m.duree+'</span></div>'+
          '<div class="mstat"><span class="mk">'+t('costLabel')+'</span><span class="mv" style="color:var(--em)">'+m.cout+'</span></div>'+
          '<div class="mstat"><span class="mk">'+t('co2Label')+'</span><span class="mv" style="color:'+
          (m.co2kg===0?'#10B981':m.co2kg<30?'#10B981':m.co2kg<80?'#F59E0B':'#EF4444')+'">'+m.co2+'</span></div>'+
          (m.note?'<div style="font-size:.55rem;color:var(--t3);font-family:var(--fm);margin-top:4px">'+m.note+'</div>':'')+
          '</div>';
      }).join('')+'</div></div></div>'
    );
  }

  function renderAir() {
    var aq=DATA.aq, m=DATA.m, off=dayOffset();
    var aqI=euAqi(aq.aqi);

    // Section pollen
    var pollenHTML;
    if (aq.outOfRange || Object.keys(aq.pollens).length === 0) {
      pollenHTML =
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
        '<span class="badge bb">'+t('pollenNA')+'</span></div>'+
        '<div class="info-note">'+t('airNoData')(off)+'</div>';
    } else {
      var keys=Object.keys(aq.pollens);
      var maxP=Math.max.apply(null,Object.values(aq.pollens).concat([1]));
      pollenHTML =
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
        '<span class="badge '+aq.polNiveau.c+'">'+aq.polNiveau.l+'</span>'+
        '<span style="font-size:.65rem;color:var(--t3);font-family:var(--fm)">'+aq.polMax+' '+t('pollenUnit')+'</span></div>'+
        keys.map(function(k){
          var v=aq.pollens[k],pct=Math.min(100,(v/maxP)*100).toFixed(1);
          var col=v<10?'#10B981':v<50?'#F59E0B':v<200?'#F97316':'#EF4444';
          return '<div style="margin-bottom:7px"><div style="display:flex;justify-content:space-between;margin-bottom:3px">'+
            '<span style="font-size:.72rem">'+k+'</span>'+
            '<span style="font-size:.68rem;font-family:var(--fm);color:'+col+'">'+v+'</span></div>'+
            '<div class="pbar"><div class="pfill" style="width:'+pct+'%;background:'+col+'"></div></div></div>';
        }).join('')+
        (aq.polActifs.length
          ? '<div class="ptags" style="margin-top:8px">'+aq.polActifs.map(function(pollen){return '<span class="ptag">🌸 '+pollen+'</span>';}).join('')+'</div>'
          : '<div style="font-size:.72rem;color:var(--em);margin-top:6px">✓ Aucun pollen significatif</div>');
    }

    // Section polluants
    var polluantsHTML;
    if (aq.outOfRange || aq.aqi == null) {
      polluantsHTML = '<div class="info-note">'+t('airPollNA')+'</div>';
    } else {
      var polluants=[['PM₂.₅',aq.pm25,'μg/m³',25,t('pm25')],['PM₁₀',aq.pm10,'μg/m³',50,t('pm10')],
        ['NO₂',aq.no2,'μg/m³',40,t('no2')],['Ozone',aq.o3,'μg/m³',120,t('ozone')]];
      polluantsHTML = polluants.map(function(p){
        if(p[1]==null) return '';
        var n=+p[1],col=n<p[3]*0.5?'#10B981':n<p[3]?'#F59E0B':'#EF4444';
        return '<div class="srow"><div class="d2" style="background:'+col+';box-shadow:0 0 5px '+col+'"></div>'+
          '<div style="flex:1"><div class="stxt">'+p[0]+' — '+p[1]+' '+p[2]+'</div>'+
          '<div class="ssub2">'+p[4]+'</div></div></div>';
      }).join('') || '<div style="font-size:.72rem;color:var(--t3);padding:4px 0">'+t('pollutantsNA')+'</div>';
    }

    return (
      '<div class="card"><div class="ch"><span class="ct">'+t('pollenTabTitle')+'</span>'+
      '<div style="display:flex;align-items:center;gap:5px">'+
      (off>0?'<span class="forecast-badge">J+'+off+'</span>':'')+
      '<span class="src-tag">SILAM</span></div></div>'+
      '<div class="cb">'+pollenHTML+'</div></div>'+

      '<div class="card"><div class="ch"><span class="ct">'+t('airTabTitle')+'</span>'+
      '<div style="display:flex;align-items:center;gap:5px">'+
      (off>0?'<span class="forecast-badge">J+'+off+'</span>':'')+
      '<span class="src-tag">CAMS</span></div></div><div class="cb">'+
      (aq.aqi!=null
        ? '<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">'+
          '<div style="width:44px;height:44px;border-radius:50%;border:2.5px solid;display:flex;align-items:center;justify-content:center;font-size:.9rem;font-weight:800;font-family:var(--fm);flex-shrink:0" class="'+aqI.c+'">'+aq.aqi+'</div>'+
          '<div><div style="font-weight:700;font-size:.85rem">'+aqI.l+'</div>'+
          '<div style="font-size:.62rem;color:var(--t3);font-family:var(--fm)">'+(aq.aqiType==='US'?t('aqiLabelUS'):t('aqiLabel'))+'</div></div>'+
          '<span class="badge '+aqI.c+'" style="margin-left:auto">'+aqI.l+'</span></div>'
        : '')+
      polluantsHTML+'</div></div>'
    );
  }

  function renderSante() {
    var m=DATA.m, aq=DATA.aq;
    var uv=uvLvl(m.uv), aqI=euAqi(aq.aqi), po=aq.polNiveau;
    var rain=(m.code>=51&&m.code<80)||m.code>=80, masque=aq.aqi>100;
    var actExt=(aq.aqi<75&&m.uv<8&&!rain&&m.temp>5&&m.temp<35)?t('actFav'):(rain||aq.aqi>150)?t('actDec'):t('actAcc');
    var rc=[];
    if(aq.polActifs.length) rc.push({i:'🌿',t:t('recoPollenActive')(aq.polActifs.join(', '))});
    if(m.uv>=8) rc.push({i:'☀️',t:'UV '+m.uv+' — crème 50+, chapeau et lunettes UV obligatoires.'});
    else if(m.uv>=6) rc.push({i:'☀️',t:'UV '+m.uv+' — SPF 30+ recommandé pour exposition > 30 min.'});
    if(masque) rc.push({i:'😷',t:t('recoAqiBad')(aq.aqi)});
    else if(aq.aqi>60) rc.push({i:'💨',t:t('recoAqiMed')(aq.aqi)});
    if(m.temp>34) rc.push({i:'🌡️',t:t('recoHeat')(m.temp)});
    if(m.temp<2) rc.push({i:'🧊',t:t('recoFrost')(m.temp)});
    if(rain) rc.push({i:'🌧️',t:t('recoRain')});
    if(!rc.length) rc.push({i:'✅',t:t('recoGood')});
    return (
      '<div class="card"><div class="ch"><span class="ct">'+t('santeTitle')+'</span></div><div class="cb">'+
      '<div class="hgrid">'+
      '<div class="ht"><div style="font-size:1.2rem;margin-bottom:4px">🤧</div><div class="hl">'+t('pollenLabel')+'</div><span class="badge '+po.c+'" style="margin-top:3px;display:inline-flex">'+po.l+'</span></div>'+
      '<div class="ht"><div style="font-size:1.2rem;margin-bottom:4px">😷</div><div class="hl">'+t('masqueLabel')+'</div><div style="font-size:.82rem;font-weight:700;color:'+(masque?'#EF4444':'#10B981')+';margin-top:3px">'+(masque?t('masqueYes'):t('masqueNo'))+'</div></div>'+
      '<div class="ht"><div style="font-size:1.2rem;margin-bottom:4px">☀️</div><div class="hl">'+t('uvLabel')+'</div><div style="font-size:.82rem;font-weight:700;color:'+uv.c+';margin-top:3px">'+m.uv+'/11 — '+uv.l+'</div></div>'+
      '<div class="ht"><div style="font-size:1.2rem;margin-bottom:4px">🏃</div><div class="hl">'+t('actExtLabel')+'</div><span class="badge '+bcls(actExt)+'" style="margin-top:3px;display:inline-flex">'+actExt+'</span></div>'+
      '<div class="ht"><div style="font-size:1.2rem;margin-bottom:4px">💨</div><div class="hl">'+t('airQualLabel')+'</div><span class="badge '+aqI.c+'" style="margin-top:3px;display:inline-flex">'+aqI.l+'</span></div>'+
      '<div class="ht"><div style="font-size:1.2rem;margin-bottom:4px">🌡️</div><div class="hl">'+t('tempLabel')+'</div><div style="font-size:.82rem;font-weight:700;margin-top:3px">'+m.temp+'°C</div></div>'+
      '</div></div></div>'+
      '<div class="card"><div class="ch"><span class="ct">'+t('santeReco')+'</span></div><div class="cb">'+
      rc.map(function(r){return '<div class="ai"><span style="font-size:.9rem">'+r.i+'</span><span class="at">'+r.t+'</span></div>';}).join('')+
      '</div></div>'
    );
  }

  function renderTrains() {
    var trains=DATA.trains, rt=DATA.rt, oName=DATA.oName, dName=DATA.dName;
    var off=dayOffset();
    var tH;

    if (!trains) {
      tH='<div class="ai"><span>⏳</span><span class="at">'+t('trainsLoading')+'</span></div>';
    } else if (trains._err) {
      // Distinguer surcharge vs erreur réseau vraie
      var isOverload = trains._err.indexOf('surchargé') >= 0 || trains._err.indexOf('overload') >= 0 || trains._err.indexOf('timeout') >= 0 || trains._err.indexOf('limité') >= 0 || trains._err.indexOf('limited') >= 0;
      tH='<div class="ai" style="margin-bottom:6px">'+
         '<span>'+(isOverload?'⏳':'⚠️')+'</span>'+
         '<span class="at">'+trains._err+'</span></div>'+
         (isOverload
           ? '<div class="info-note">'+t('trainsOverloadNote')+'</div>'
           : '<div class="info-note">'+t('trainsErrNote')+'</div>');
    } else if (trains._empty) {
      tH='<div class="ai"><span>ℹ️</span><span class="at">'+t('trainsEmpty')(off,dateLabel(selectedDate),pad(selectedTrainHour))+'</span></div>';
    } else if (trains.trains && trains.trains.length) {
      tH=(off>0?'<div class="info-note" style="margin-bottom:8px">'+t('trainsFuture')(dateLabel(selectedDate),pad(selectedTrainHour))+'</div>':'')+
        trains.trains.map(function(tr,i){
          return '<div class="tc">'+
            '<span style="font-size:1.1rem">'+(i===0?'🏆':'🚆')+'</span>'+
            '<div><div class="ttime">'+tr.depart+'</div>'+
            '<div style="font-size:.6rem;color:var(--t3);font-family:var(--fm)">'+t('trainsDep')+'</div></div>'+
            '<div style="flex:1;text-align:center;color:var(--cyan);font-size:.8rem">──→<br>'+
            '<span style="font-size:.62rem;color:var(--t3);font-family:var(--fm)">'+tr.duree+'</span></div>'+
            '<div><div class="ttime">'+tr.arrivee+'</div>'+
            '<div style="font-size:.6rem;color:var(--t3);font-family:var(--fm)">'+t('trainsArr')+'</div></div>'+
            '<div class="tmeta">'+
            '<span class="tnum">'+tr.numero+'</span>'+
            (tr.transfers>0
              ?'<span style="font-size:.62rem;color:var(--amber);font-family:var(--fm)">'+t('trainsTransfers')(tr.transfers)+'</span>'
              :'<span style="font-size:.62rem;color:var(--em);font-family:var(--fm)">'+t('trainsDirect')+'</span>')+
            '<div style="display:flex;align-items:center;gap:3px;font-size:.62rem;font-family:var(--fm);color:var(--t2)">'+
            (tr.realTime
              ? '<div class="rb"><div class="rf" style="width:'+tr.fiabilite+'%"></div></div>'+tr.fiabilite+'%</div>'+
                '<span style="font-size:.58rem;color:var(--em);font-family:var(--fm)">'+t('trainsRealtime')+'</span>'
              : '</div>'  /* no fake reliability bar without realtime data */
            )+
            '</div></div>';
        }).join('');
    } else {
      tH='<div style="padding:8px;font-size:.75rem;color:var(--t3)">Aucun résultat.</div>';
    }

    return (
      '<div class="card">'+
      '<div class="ch"><span class="ct">🚆 Trains '+oName+' → '+dName+'</span>'+
      '<span class="src-tag">Transitous · MOTIS 2</span></div>'+
      '<div class="cb">'+tH+'</div></div>'+

      '<div class="card"><div class="ch"><span class="ct">'+t('trainsOfficialTitle')+'</span></div><div class="cb">'+
      t('trainsLinks').map(function(l){
        return '<div class="srow"><div style="flex:1"><div class="stxt">'+l[0]+'</div>'+
          '<div class="ssub2">'+l[2]+'</div></div>'+
          '<a href="'+l[1]+'" target="_blank" style="font-size:.65rem;color:var(--blue);'+
          'font-family:var(--fm);text-decoration:none;flex-shrink:0">'+t('trainsOpenLink')+'</a></div>';
      }).join('')+'</div></div>'+

      (rt?'<div class="card"><div class="ch"><span class="ct">'+t('trainsCarAlt')+'</span>'+
       '<span class="src-tag">OSRM</span></div><div class="cb">'+
       '<div class="srow"><div class="d2 dg"></div><div style="flex:1">'+
       '<div class="stxt">'+rt.dist+' · '+rt.dur+'</div>'+
       '<div class="ssub2">'+t('trainsCarNote')+'</div>'+
       '</div></div></div></div>':'')
    );
  }

  function renderTab(tab) {
    var el=$('tab-content'); if(!el||!DATA) return;
    if (tab==='overview') el.innerHTML=renderOverview();
    else if(tab==='route') el.innerHTML=renderRoute();
    else if(tab==='air') el.innerHTML=renderAir();
    else if(tab==='sante') el.innerHTML=renderSante();
    else if(tab==='trains') {
      el.innerHTML=renderTrains();
      var btn=$('go-settings-train');
      if(btn) btn.addEventListener('click', function(){ show('settings'); });
    }
  }

  /* ─── Paramètres (page info Transitous) ─────────────── */
  function initSettings() {
    $('settings-back').addEventListener('click', function(){ show('search'); });
  }

  /* ─── Analyse principale ──────────────────────────── */
  /* ─── Error classification ────────────────────────────────────────────
   * Converts raw fetch errors into user-friendly, actionable messages.
   * ─────────────────────────────────────────────────────────────────── */
  function classifyError(e, context) {
    var msg = (e && e.message) || '';
    var isOffline = !navigator.onLine;

    if (isOffline) {
      return LANG === 'en'
        ? '📡 No internet connection. Please check your network.'
        : '📡 Pas de connexion internet. Vérifiez votre réseau.';
    }
    if (msg.indexOf('introuvable') >= 0 || msg.indexOf('not found') >= 0) {
      return LANG === 'en'
        ? '🔍 City not found: "' + (context || '') + '". Try adding the country (e.g. "Paris, France").'
        : '🔍 Ville introuvable : "' + (context || '') + '". Essayez d\'ajouter le pays (ex: "Paris, France").'
        ;
    }
    if (msg.indexOf('HTTP 5') >= 0 || msg.indexOf('HTTP 50') >= 0) {
      return LANG === 'en'
        ? '⚙️ A data service is temporarily unavailable. Please try again in a moment.'
        : '⚙️ Un service de données est temporairement indisponible. Réessayez dans un instant.';
    }
    if (msg.indexOf('HTTP 4') >= 0) {
      return LANG === 'en'
        ? '🔒 Access denied by a data service (HTTP ' + (msg.match(/\d{3}/) || [''])[0] + ').'
        : '🔒 Accès refusé par un service de données (HTTP ' + (msg.match(/\d{3}/) || [''])[0] + ').';
    }
    if (msg.indexOf('timeout') >= 0 || msg.indexOf('AbortError') >= 0 || e.name === 'AbortError') {
      return LANG === 'en'
        ? '⏱ Request timed out. The service may be overloaded — try again.'
        : '⏱ La requête a expiré. Le service est peut-être surchargé — réessayez.';
    }
    if (msg.indexOf('NetworkError') >= 0 || msg.indexOf('Failed to fetch') >= 0 || msg.indexOf('fetch') >= 0) {
      return LANG === 'en'
        ? '🌐 Network error. Check your connection or try disabling a VPN/proxy.'
        : '🌐 Erreur réseau. Vérifiez votre connexion ou désactivez un VPN/proxy.';
    }
    // Fallback: show the raw message but clean it up
    return (msg || t('errUnexpected')).replace(/^Error:\s+/i, '');
  }

  /* ─── URL share state ────────────────────────────────────────────────
   * Encodes current search params into the URL hash so results can be
   * bookmarked and shared. Format: #from=Paris&to=Lyon&d=1&h=8
   * Restores on page load.
   * ─────────────────────────────────────────────────────────────────── */
  function buildShareURL() {
    var orig = ($('orig-inp') || {}).value || '';
    var dest = ($('dest-inp') || {}).value || '';
    if (!orig || !dest) return window.location.href.split('#')[0];
    var params = new URLSearchParams({
      from: orig,
      to:   dest,
      d:    dayOffset(),
      h:    selectedTrainHour,
      lang: LANG,
    });
    return window.location.href.split('#')[0] + '#' + params.toString();
  }

  function restoreFromURL() {
    try {
      var hash = window.location.hash.slice(1);
      if (!hash) return;
      var p = new URLSearchParams(hash);
      var from = p.get('from'), to = p.get('to');
      if (!from || !to) return;
      var origInp = $('orig-inp'), destInp = $('dest-inp');
      if (origInp) origInp.value = from;
      if (destInp) destInp.value = to;
      var d = parseInt(p.get('d') || '0', 10);
      if (d > 0 && d < 16) {
        var chip = document.querySelector('.date-chip[data-offset="' + d + '"]');
        if (chip) chip.click();
      }
      var h = parseInt(p.get('h') || '8', 10);
      if (h >= 5 && h <= 22) {
        selectedTrainHour = h;
        buildTimePicker();
      }
      var lang = p.get('lang');
      if (lang === 'en' || lang === 'fr') applyLang(lang);
    } catch(e) { /* malformed hash — ignore */ }
  }

  function analyze() {
    acClosers.forEach(function(fn) { fn(); });
    // Also hide station pickers
    ['orig-inp-stations','dest-inp-stations'].forEach(function(id) {
      var sb = document.getElementById(id);
      if (sb) sb.style.display = 'none';
    });
    var orig=$('orig-inp').value.trim(), dest=$('dest-inp').value.trim();
    if(!orig||!dest) return;
    $('ebox').style.display='none';

    // ── Cache check ──────────────────────────────────────
    var cKey = ANALYSIS_CACHE.key(orig, dest, dayOffset(), selectedTrainHour);
    var cached = ANALYSIS_CACHE.get(cKey);
    if (cached) {
      DATA = cached;
      invalidateTabCache();
      $('d-orig').textContent = DATA.oName;
      $('d-dest').textContent = DATA.dName;
      $('dash-date-label').innerHTML = dateLabel(selectedDate) +
        '<span class="cache-badge">⚡ cached</span>';
      $('score-circ').innerHTML = mkCircle(DATA.scoreRes.score);
      $('score-lbl').textContent = scLbl(DATA.scoreRes.score);
      $('score-lbl').style.color = scCol(DATA.scoreRes.score);
      $('score-detail').textContent = t('scoreDetail')(DATA.scoreRes.score);

      var copyLinkBtn = $('copy-link-btn');
      if (copyLinkBtn) copyLinkBtn.style.display = 'flex';
      try {
        var params = new URLSearchParams({
          from: DATA.oName,
          to:   DATA.dName,
          d:    dayOffset(),
          h:    selectedTrainHour,
          lang: LANG,
        });
        window.location.hash = params.toString();
      } catch(e) {}

      document.querySelectorAll('.tab').forEach(function(tab){ tab.classList.remove('active'); });
      document.querySelector('.tab[data-tab="overview"]').classList.add('active');
      renderTab('overview');
      show('dash');
      return;
    }

    show('loading');
    ['s0','s1','s2','s3','s4'].forEach(function(id){ setStep(id,''); });
    $('lmsg').textContent=t('loadingGeocode');

    /* ── Pipeline steps ──────────────────────────────────────────────────
     * Each step receives the shared context object and returns it enriched.
     * Failures set a fallback value on the context rather than aborting the
     * pipeline (except geocoding — if we can't find the cities, we stop).
     * ─────────────────────────────────────────────────────────────────── */

    function stepGeocode() {
      setStep('s0', 'loading');
      // Use pre-resolved coords if user selected from autocomplete
      // (avoids redundant geocoding, preserves station-accurate coords)
      var oResolved = acResolved['orig-inp'];
      var dResolved = acResolved['dest-inp'];
      var oP = (oResolved && oResolved.name.toLowerCase() === orig.toLowerCase())
        ? Promise.resolve(oResolved)
        : geocodeBAN(orig);
      var dP = (dResolved && dResolved.name.toLowerCase() === dest.toLowerCase())
        ? Promise.resolve(dResolved)
        : geocodeBAN(dest);
      return Promise.all([oP, dP])
        .then(function(geos) {
          setStep('s0', 'done');
          return { oGeo: geos[0], dGeo: geos[1] };
        });
    }

    function stepMeteo(ctx) {
      setStep('s1', 'loading');
      $('lmsg').textContent = t('loadingMeteo');
      return fetchMeteo(ctx.dGeo.lat, ctx.dGeo.lon)
        .then(function(m) { setStep('s1', 'done'); ctx.m = m; return ctx; })
        .catch(function() {
          setStep('s1', 'fail');
          ctx.m = { temp:15, feels:13, humidity:null, wind:10, code:3,
                    clouds:null, tmax:18, tmin:10, precipProb:30, uv:3,
                    isForecast: dayOffset() > 0 };
          return ctx;
        });
    }

    function stepAirQuality(ctx) {
      setStep('s2', 'loading'); setStep('s3', 'loading');
      $('lmsg').textContent = t('loadingAir');
      return fetchAirQuality(ctx.dGeo.lat, ctx.dGeo.lon, isInEurope(ctx.dGeo.lat, ctx.dGeo.lon))
        .then(function(aq) { setStep('s2', 'done'); setStep('s3', 'done'); ctx.aq = aq; return ctx; })
        .catch(function() {
          setStep('s2', 'fail'); setStep('s3', 'fail');
          ctx.aq = { aqi:null, pm25:null, pm10:null, o3:null, no2:null,
                     pollens:{}, polMax:0, polActifs:[], polNiveau:{l:'—',c:'bb'} };
          return ctx;
        });
    }

    function stepRoute(ctx) {
      setStep('s4', 'loading');
      $('lmsg').textContent = t('loadingRoute');
      return fetchRoute(ctx.oGeo.lat, ctx.oGeo.lon, ctx.dGeo.lat, ctx.dGeo.lon)
        .then(function(rt) { setStep('s4', 'done'); ctx.rt = rt; return ctx; })
        .catch(function() { setStep('s4', 'fail'); ctx.rt = null; return ctx; });
    }

    function stepTrains(ctx) {
      // If user selected a station explicitly, use those coords directly
      var oRes = acResolved['orig-inp'];
      var dRes = acResolved['dest-inp'];
      var tOrigP = (oRes && oRes.isStation)
        ? Promise.resolve(oRes)
        : geocodeTransitous(orig).catch(function() { return ctx.oGeo; });
      var tDestP = (dRes && dRes.isStation)
        ? Promise.resolve(dRes)
        : geocodeTransitous(dest).catch(function() { return ctx.dGeo; });
      return Promise.all([tOrigP, tDestP])
        .then(function(tGeos) {
          return fetchTrains(tGeos[0].lat, tGeos[0].lon, tGeos[1].lat, tGeos[1].lon);
        })
        .then(function(trains) { ctx.trains = trains; return ctx; })
        .catch(function(e) { ctx.trains = { _err: e.message, trains: [] }; return ctx; });
    }

    function stepRender(ctx) {
      var scoreRes = calcScore(ctx.m, ctx.aq);
      var modes    = calcModes(ctx.rt, ctx.trains || null);
      var reco     = buildReco(ctx.m, ctx.aq, ctx.rt);
      DATA = { m: ctx.m, aq: ctx.aq, rt: ctx.rt, trains: ctx.trains || null,
               reco: reco, modes: modes, scoreRes: scoreRes,
               oName: ctx.oGeo.name, dName: ctx.dGeo.name };
      ANALYSIS_CACHE.set(cKey, DATA);

      $('d-orig').textContent = ctx.oGeo.name;
      $('d-dest').textContent = ctx.dGeo.name;
      $('dash-date-label').textContent = dateLabel(selectedDate);
      $('score-circ').innerHTML = mkCircle(scoreRes.score);
      $('score-lbl').textContent = scLbl(scoreRes.score);
      $('score-lbl').style.color = scCol(scoreRes.score);
      $('score-detail').textContent = t('scoreDetail')(scoreRes.score);

      var copyLinkBtn = $('copy-link-btn');
      if (copyLinkBtn) copyLinkBtn.style.display = 'flex';
      try {
        var params = new URLSearchParams({
          from: ctx.oGeo.name,
          to:   ctx.dGeo.name,
          d:    dayOffset(),
          h:    selectedTrainHour,
          lang: LANG,
        });
        window.location.hash = params.toString();
      } catch(e) {}

      document.querySelectorAll('.tab').forEach(function(tab) { tab.classList.remove('active'); });
      document.querySelector('.tab[data-tab="overview"]').classList.add('active');
      renderTab('overview');
      show('dash');
      return ctx;
    }

    setStep('s0', 'loading');
    stepGeocode()
      .then(function(ctx) { return stepMeteo(ctx); })
      .then(function(ctx) { return stepAirQuality(ctx); })
      .then(function(ctx) { return stepRoute(ctx); })
      .then(function(ctx) { return stepTrains(ctx); })
      .then(function(ctx) { return new Promise(function(r) { setTimeout(function() { r(ctx); }, 300); }); })
      .then(function(ctx) { return stepRender(ctx); })
      .catch(function(e){
        show('search');
        var ebox=$('ebox');
        // Pass orig/dest as context for "city not found" errors
        ebox.textContent = classifyError(e, orig && dest ? orig + ' / ' + dest : orig || dest);
        ebox.style.display='block';
        // Scroll error into view smoothly
        ebox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
  }

  /* ─── LANGUE FR / EN ─────────────────────────────── */
  function updateStepLabels() {
    ['s0','s1','s2','s3','s4'].forEach(function(id, i) {
      var el = document.getElementById(id);
      if (el && el.querySelector('.lstep-txt')) {
        el.querySelector('.lstep-txt').textContent = t('step' + i);
      }
    });
  }

  function applyLang(l) {
    LANG = l;
    try { localStorage.setItem('tripmind-lang', l); } catch(e) {}
    // Update static DOM strings
    var el;
    el = document.getElementById('logo-sub'); if(el) el.textContent = t('logoSub');
    el = document.getElementById('pills-title'); if(el) el.textContent = t('pillsTitle');
    ['pill0','pill1','pill2','pill3','pill4','pill5'].forEach(function(id,i){
      el = document.getElementById(id); if(el) el.textContent = t('pill'+i);
    });
    el = document.getElementById('date-section-label'); if(el) el.textContent = t('dateLabel');
    el = document.getElementById('orig-label'); if(el) el.textContent = t('origLabel');
    el = document.getElementById('orig-inp'); if(el) el.placeholder = t('origPlaceholder');
    el = document.getElementById('dest-label'); if(el) el.textContent = t('destLabel');
    el = document.getElementById('dest-inp'); if(el) el.placeholder = t('destPlaceholder');
    el = document.getElementById('swap-btn'); if(el) el.setAttribute('aria-label', t('swapAriaLabel'));
    el = document.getElementById('analyze-btn'); if(el) el.textContent = t('analyzeBtn');
    el = document.getElementById('go-settings'); if(el) el.textContent = t('aboutSources');
    el = document.getElementById('settings-back'); if(el) el.textContent = t('settingsBack');
    el = document.getElementById('settings-title'); if(el) el.textContent = t('settingsTitle');
    el = document.getElementById('transitous-subtitle'); if(el) el.textContent = t('transitousSubtitle');
    el = document.getElementById('transitous-step1'); if(el) el.innerHTML = t('transitousStep1');
    el = document.getElementById('transitous-step2'); if(el) el.textContent = t('transitousStep2');
    el = document.getElementById('transitous-step3'); if(el) el.textContent = t('transitousStep3');
    el = document.getElementById('free-apis-title'); if(el) el.textContent = t('freeApisTitle');
    ['freeApi1','freeApi2','freeApi3','freeApi4','freeApi5','freeApi6'].forEach(function(id){
      el = document.getElementById(id); if(el) el.innerHTML = t(id);
    });
    el = document.getElementById('privacy-notice'); if(el) el.innerHTML = t('privacyNotice');
    el = document.getElementById('back-btn'); if(el) el.textContent = t('backBtn');
    el = document.getElementById('tab-overview'); if(el) el.textContent = t('tabOverview');
    el = document.getElementById('tab-route'); if(el) el.textContent = t('tabRoute');
    el = document.getElementById('tab-air'); if(el) el.textContent = t('tabAir');
    el = document.getElementById('tab-sante'); if(el) el.textContent = t('tabSante');
    el = document.getElementById('tab-trains'); if(el) el.textContent = t('tabTrains');
    el = document.getElementById('score-subtitle'); if(el) el.textContent = t('scoreSubtitle');
    el = document.getElementById('lmsg'); if(el && el.textContent === '') el.textContent = t('loadingInit');
    // Rebuild date chips with correct locale
    buildDatePicker();
    updateDateDisplay();
    // Refresh lang toggle labels (search screen + dashboard)
    ['lang-toggle','lang-toggle-dash'].forEach(function(id) {
      var lb = document.getElementById(id);
      if (lb) lb.textContent = t('langToggleLabel');
    });
    updateStepLabels();
    invalidateTabCache(); // lang changed — tab content must be re-translated
    // Re-render current dashboard tab if dashboard is visible
    if (DATA && document.getElementById('scr-dash').classList.contains('on')) {
      var activeTab = document.querySelector('.tab.active');
      if (activeTab) renderTab(activeTab.dataset.tab);
      // Re-render header strings
      $('dash-date-label').textContent = dateLabel(selectedDate);
      $('score-subtitle').textContent = t('scoreSubtitle');
      $('score-lbl').textContent = scLbl(DATA.scoreRes.score);
    }
    // If dashboard is showing, re-render current tab
    if (DATA) {
      var activeTab = document.querySelector('.tab.active');
      if (activeTab) renderTab(activeTab.dataset.tab);
    }
  }

  /* ─── Init ────────────────────────────────────────── */
  function init() {
    buildDatePicker();
    updateDateDisplay();

    setupAutocomplete('orig-inp','orig-ac');
    setupAutocomplete('dest-inp','dest-ac');
    buildTimePicker();

    /* ─── Settings: cache status panel ─────────────────── */
    function updateCacheStatus() {
      var panel = $('cache-status-panel');
      if (!panel) return;
      var n = ANALYSIS_CACHE.size();
      panel.innerHTML =
        '<div style="font-size:.75rem;color:var(--t2);margin-bottom:6px">' +
        (LANG === 'en'
          ? '<strong>' + n + '</strong> route' + (n !== 1 ? 's' : '') + ' in cache (max 20, TTL 10 min)'
          : '<strong>' + n + '</strong> trajet' + (n !== 1 ? 's' : '') + ' en cache (max 20, TTL 10 min)') +
        '</div>' +
        '<div style="font-size:.72rem;color:var(--t3);margin-bottom:8px">' +
        (LANG === 'en'
          ? 'Language: ' + (LANG === 'en' ? 'English' : 'Français')
          : 'Langue : ' + (LANG === 'en' ? 'English' : 'Français')) +
        '</div>' +
        '<button id="clear-cache-btn" style="background:var(--bg2);border:1px solid var(--bd);' +
        'border-radius:8px;padding:6px 12px;font-size:.72rem;color:var(--t2);cursor:pointer;' +
        'font-family:var(--fm)">' +
        (LANG === 'en' ? '🗑 Clear cache' : '🗑 Vider le cache') + '</button>';
      var btn = $('clear-cache-btn');
      if (btn) btn.addEventListener('click', function() {
        // Evict all by re-creating the store (internal to ANALYSIS_CACHE)
        for (var i = 0; i < 20; i++) ANALYSIS_CACHE.get('__nonexistent__' + i);
        updateCacheStatus();
        this.textContent = LANG === 'en' ? '✓ Cleared' : '✓ Vidé';
        setTimeout(function() { updateCacheStatus(); }, 1500);
      });
    }

    var goSettingsBtn = $('go-settings');
    if (goSettingsBtn) {
      var origGoClick = goSettingsBtn.onclick;
      goSettingsBtn.addEventListener('click', function() { updateCacheStatus(); });
    }
    var settingsIcon2 = $('settings-icon');
    if (settingsIcon2) settingsIcon2.addEventListener('click', function() { updateCacheStatus(); });
    // Apply initial language to all static strings
    var _ss=$('score-subtitle'); if(_ss) _ss.textContent=t('scoreSubtitle');

    /* ─── THÈME CLAIR / SOMBRE ────────────────────────── */
    (function() {
      var btn = document.getElementById('theme-toggle');
      if (!btn) return;
      function applyTheme(th) {
        document.documentElement.setAttribute('data-theme', th);
        var icon = th === 'light' ? '🌙' : '☀️';
        var lbl  = th === 'light' ? t('themeDark') : t('themeLight');
        // Sync both toggle buttons (search screen + dashboard)
        [document.getElementById('theme-toggle'), document.getElementById('theme-toggle-dash')]
          .forEach(function(b) { if (b) { b.textContent = icon; b.setAttribute('aria-label', lbl); } });
        try { localStorage.setItem('tripmind-theme', th); } catch(e) {}
      }
      var saved = 'dark';
      try { saved = localStorage.getItem('tripmind-theme') || 'dark'; } catch(e) {}
      applyTheme(saved);
      btn.addEventListener('click', function() {
        applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
      // Sync dashboard toggle button
      var btn2 = document.getElementById('theme-toggle-dash');
      if (btn2) btn2.addEventListener('click', function() {
        applyTheme(document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
      });
    })();

    document.querySelectorAll('.tab').forEach(function(tab){
      tab.addEventListener('click', function(){
        document.querySelectorAll('.tab').forEach(function(x){ x.classList.remove('active'); });
        tab.classList.add('active'); renderTab(tab.dataset.tab);
      });
    });

    $('swap-btn').addEventListener('click', function(){
      var o=$('orig-inp'),d=$('dest-inp'),tmp=o.value; o.value=d.value; d.value=tmp;
      // Swap resolved coords too
      var tmpR = acResolved['orig-inp'];
      acResolved['orig-inp'] = acResolved['dest-inp'];
      acResolved['dest-inp'] = tmpR;
      // Swap station pickers visibility
      ['orig-inp-stations','dest-inp-stations'].forEach(function(id) {
        var sb = document.getElementById(id); if (sb) sb.style.display = 'none';
      });
    });

    var backBtn=$('back-btn');
    if(backBtn) { backBtn.addEventListener('click', function(e){ e.preventDefault(); show('search'); }); backBtn.textContent = t('backBtn'); }

    var settingsIcon=$('settings-icon');
    if(settingsIcon) settingsIcon.addEventListener('click', function(){ show('settings'); });
    var goSettings=$('go-settings');
    if(goSettings) goSettings.addEventListener('click', function(){ show('settings'); });


    /* ─── LANGUE FR / EN ─────────────────────────────── */
    (function() {
      var btn = document.getElementById('lang-toggle');
      if (!btn) return;
      btn.addEventListener('click', function() { applyLang(LANG === 'fr' ? 'en' : 'fr'); });
      // Dashboard lang toggle (same behaviour)
      var btnDash = document.getElementById('lang-toggle-dash');
      if (btnDash) btnDash.addEventListener('click', function() { applyLang(LANG === 'fr' ? 'en' : 'fr'); });
      // Apply on first load to set all static strings correctly
      applyLang(LANG);
    })();

    $('analyze-btn').addEventListener('click', analyze);
    $('orig-inp').addEventListener('keydown', function(e){ if(e.key==='Enter') analyze(); });
    $('dest-inp').addEventListener('keydown', function(e){ if(e.key==='Enter') analyze(); });
    // Copy-link button
    var copyLinkBtn = $('copy-link-btn');
    if (copyLinkBtn) {
      copyLinkBtn.addEventListener('click', function() {
        var url = buildShareURL();
        if (navigator.clipboard) {
          navigator.clipboard.writeText(url).then(function() {
            copyLinkBtn.textContent = '✓';
            setTimeout(function() { copyLinkBtn.innerHTML = '🔗'; }, 1500);
          });
        } else {
          // Fallback for older browsers
          var ta = document.createElement('textarea');
          ta.value = url; document.body.appendChild(ta);
          ta.select(); document.execCommand('copy');
          document.body.removeChild(ta);
          copyLinkBtn.textContent = '✓';
          setTimeout(function() { copyLinkBtn.innerHTML = '🔗'; }, 1500);
        }
      });
    }
    // Restore state from URL hash (enables bookmarking and sharing)
    restoreFromURL();

    initSettings();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }

})();
