/**
 * TripMind — app.js
 *
 * Fichier unique (pas d'ES modules) pour compatibilité Capacitor WebView.
 *
 * APIs :
 *  - Base Adresse Nationale   https://api-adresse.data.gouv.fr  (sans token)
 *  - Open-Meteo               https://api.open-meteo.com         (sans token)
 *  - Open-Meteo Air Quality   https://air-quality-api.open-meteo.com (sans token)
 *  - OSRM / OpenStreetMap     https://router.project-osrm.org   (sans token)
 *  - API SNCF officielle      https://api.sncf.com/v1/          (token optionnel)
 *
 * Inscription token SNCF (gratuit) :
 *   https://numerique.sncf.com/startup/api/token-developpeur/
 */

(function () {
  'use strict';

  /* ─── Utilitaires ──────────────────────────────────── */
  var $ = function (id) { return document.getElementById(id); };
  var pad = function (n) { return String(n).padStart(2, '0'); };

  function fmtDur(sec) {
    if (!sec || sec <= 0) return '—';
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60);
    return h > 0 ? h + 'h' + pad(m) : m + ' min';
  }
  function fmtNavTime(dt) {
    if (!dt || dt.length < 13) return '--:--';
    return dt.substring(9, 11) + ':' + dt.substring(11, 13);
  }
  function nowSNCF() {
    var d = new Date();
    return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) +
           'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00';
  }

  /* ─── Stockage token ───────────────────────────────── */
  var STORE = {
    get token() { try { return localStorage.getItem('tm_sncf_token') || ''; } catch(e) { return ''; } },
    set token(v) { try { localStorage.setItem('tm_sncf_token', (v || '').trim()); } catch(e) {} }
  };

  /* ─── État ─────────────────────────────────────────── */
  var DATA = null;

  /* ─── Navigation ────────────────────────────────────── */
  function show(id) {
    var screens = document.querySelectorAll('.scr');
    for (var i = 0; i < screens.length; i++) screens[i].classList.remove('on');
    var target = $('scr-' + id);
    if (target) target.classList.add('on');
  }
  function setStep(i, state) {
    var el = $('s' + i); if (el) el.className = 'lstep ' + state;
  }

  /* ─── Helpers visuels ───────────────────────────────── */
  function scCol(s) { return s >= 75 ? '#10B981' : s >= 50 ? '#F59E0B' : '#EF4444'; }
  function scLbl(s) { return s >= 75 ? 'Bonnes conditions' : s >= 50 ? 'Conditions moyennes' : 'Conditions dégradées'; }
  function bcls(v) {
    var s = (v || '').toLowerCase();
    if (['bon','faible','favorable','très bon','excellent','non nécessa'].some(function(k){return s.indexOf(k)>=0;})) return 'bg';
    if (['modéré','moyen','acceptable','satisfai'].some(function(k){return s.indexOf(k)>=0;})) return 'ba';
    if (['élevé','mauvais','très','dégradé','recommandé'].some(function(k){return s.indexOf(k)>=0;})) return 'br';
    return 'bb';
  }
  function uvLvl(u) {
    if (u<=2) return {l:'Faible',c:'#10B981'};
    if (u<=5) return {l:'Modéré',c:'#F59E0B'};
    if (u<=7) return {l:'Élevé',c:'#F97316'};
    if (u<=10) return {l:'Très élevé',c:'#EF4444'};
    return {l:'Extrême',c:'#8B5CF6'};
  }
  function wmoIcon(c) {
    var m={0:'☀️',1:'🌤',2:'⛅',3:'☁️',45:'🌫',48:'🌫',51:'🌦',53:'🌦',55:'🌧',61:'🌧',63:'🌧',65:'🌧',71:'❄️',73:'❄️',75:'❄️',80:'🌦',81:'🌧',82:'⛈',95:'⛈',96:'⛈',99:'⛈'};
    return m[c]||'🌡';
  }
  function wmoDesc(c) {
    if (c===0) return 'Ciel dégagé'; if (c<=2) return 'Légèrement nuageux'; if (c===3) return 'Couvert';
    if (c<=48) return 'Brumeux'; if (c<=57) return 'Bruine'; if (c<=67) return 'Pluie';
    if (c<=77) return 'Neige'; if (c<=82) return 'Averses'; return 'Orageux';
  }
  function euAqi(a) {
    if (a==null) return {l:'—',c:'bb'}; if (a<=20) return {l:'Très bon',c:'bg'};
    if (a<=40) return {l:'Bon',c:'bg'}; if (a<=60) return {l:'Satisfaisant',c:'ba'};
    if (a<=80) return {l:'Médiocre',c:'ba'}; if (a<=100) return {l:'Mauvais',c:'br'};
    return {l:'Très mauvais',c:'br'};
  }
  function shortMode(m) {
    var v=(m||'').toLowerCase();
    if (v.indexOf('grande vitesse')>=0||v.indexOf('tgv')>=0) return 'TGV';
    if (v.indexOf('ouigo')>=0) return 'OUIGO';
    if (v.indexOf('intercit')>=0) return 'Intercités';
    if (v.indexOf('ter')>=0) return 'TER';
    if (v.indexOf('eurostar')>=0) return 'Eurostar';
    if (v.indexOf('bus')>=0) return 'Bus';
    return 'Train';
  }
  function reliab(m) {
    var v=(m||'').toLowerCase();
    if (v.indexOf('grande vitesse')>=0) return 92;
    if (v.indexOf('intercit')>=0) return 88;
    if (v.indexOf('ter')>=0) return 84;
    return 86;
  }

  /* ─── AUTOCOMPLÉTION BAN ─────────────────────────────
   * L'API BAN supporte l'autocomplétion de communes françaises
   * sans token. On affiche 5 suggestions max.
   ──────────────────────────────────────────────────── */
  var acTimers = {};

  function setupAutocomplete(inputId, listId) {
    var inp = $(inputId), list = $(listId);
    if (!inp || !list) return;

    var selectedIndex = -1;
    var lastSuggestions = [];

    function closeList() {
      list.innerHTML = '';
      list.classList.remove('visible');
      inp.classList.remove('ac-open');
      inp.setAttribute('aria-expanded', 'false');
      selectedIndex = -1;
    }

    function fillInput(cityName) {
      inp.value = cityName;
      closeList();
    }

    function renderList(features) {
      list.innerHTML = '';
      selectedIndex = -1;
      lastSuggestions = features;
      if (!features.length) { closeList(); return; }

      inp.classList.add('ac-open');
      list.classList.add('visible');
      inp.setAttribute('aria-expanded', 'true');

      features.forEach(function (f, idx) {
        var city = f.properties.city || f.properties.name || '';
        var ctx  = f.properties.context || '';
        var dept = ctx.split(',')[0] || '';

        var li = document.createElement('li');
        li.className = 'ac-item';
        li.setAttribute('role', 'option');
        li.setAttribute('id', listId + '-opt-' + idx);
        li.innerHTML =
          '<span class="ac-pin">📍</span>' +
          '<span class="ac-city">' + city + '</span>' +
          (dept ? '<span class="ac-dept">' + dept + '</span>' : '');

        li.addEventListener('mousedown', function (e) {
          e.preventDefault(); // évite blur avant click
          fillInput(city);
        });
        list.appendChild(li);
      });
    }

    function highlightItem(idx) {
      var items = list.querySelectorAll('.ac-item');
      items.forEach(function(it){ it.classList.remove('selected'); });
      if (idx >= 0 && idx < items.length) {
        items[idx].classList.add('selected');
        inp.setAttribute('aria-activedescendant', listId + '-opt-' + idx);
      }
    }

    inp.addEventListener('input', function () {
      var q = inp.value.trim();
      clearTimeout(acTimers[inputId]);
      if (q.length < 2) { closeList(); return; }

      acTimers[inputId] = setTimeout(function () {
        fetch(
          'https://api-adresse.data.gouv.fr/search/?q=' +
          encodeURIComponent(q) +
          '&type=municipality&limit=5&autocomplete=1'
        )
          .then(function (r) { return r.json(); })
          .then(function (d) {
            renderList(d.features || []);
          })
          .catch(function () { closeList(); });
      }, 220);
    });

    inp.addEventListener('keydown', function (e) {
      if (!list.classList.contains('visible')) return;
      var items = list.querySelectorAll('.ac-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        highlightItem(selectedIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, 0);
        highlightItem(selectedIndex);
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && lastSuggestions[selectedIndex]) {
          e.preventDefault();
          var city = lastSuggestions[selectedIndex].properties.city ||
                     lastSuggestions[selectedIndex].properties.name || '';
          fillInput(city);
        }
      } else if (e.key === 'Escape') {
        closeList();
      }
    });

    inp.addEventListener('blur', function () {
      // Délai pour laisser le mousedown sur l'item se déclencher d'abord
      setTimeout(function () { closeList(); }, 200);
    });

    // Fermer si on clique ailleurs
    document.addEventListener('click', function (e) {
      if (e.target !== inp && !list.contains(e.target)) closeList();
    });
  }

  /* ─── API : Géocodage BAN ────────────────────────────
   * Renvoie {lat, lon, name} pour une commune française.
   ──────────────────────────────────────────────────── */
  function geocodeBAN(city) {
    return fetch(
      'https://api-adresse.data.gouv.fr/search/?q=' +
      encodeURIComponent(city) +
      '&limit=1&type=municipality'
    )
      .then(function (r) {
        if (!r.ok) throw new Error('BAN HTTP ' + r.status);
        return r.json();
      })
      .then(function (d) {
        if (!d.features || !d.features.length)
          throw new Error('"' + city + '" introuvable en France');
        var f = d.features[0];
        return {
          lat:  f.geometry.coordinates[1],
          lon:  f.geometry.coordinates[0],
          name: f.properties.city || f.properties.name,
          dept: (f.properties.context || '').split(',')[0]
        };
      });
  }

  /* ─── API : Météo Open-Meteo ─────────────────────────
   * Météo actuelle + prévisions journalières (UV, précip).
   ──────────────────────────────────────────────────── */
  function fetchMeteo(lat, lon) {
    var url = 'https://api.open-meteo.com/v1/forecast?' +
      'latitude=' + lat + '&longitude=' + lon +
      '&current=temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code,cloud_cover' +
      '&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max' +
      '&timezone=Europe%2FParis&forecast_days=1';
    return fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('Météo HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var c = d.current, dy = d.daily;
        return {
          temp: Math.round(c.temperature_2m), feels: Math.round(c.apparent_temperature),
          humidity: Math.round(c.relative_humidity_2m), wind: Math.round(c.wind_speed_10m),
          code: c.weather_code, clouds: Math.round(c.cloud_cover),
          tmax: Math.round(dy.temperature_2m_max[0]), tmin: Math.round(dy.temperature_2m_min[0]),
          precipProb: dy.precipitation_probability_max[0],
          uv: Math.round(dy.uv_index_max[0])
        };
      });
  }

  /* ─── API : Qualité air + Pollen Open-Meteo ──────────
   * Source : Copernicus CAMS + SILAM. Aucun token.
   ──────────────────────────────────────────────────── */
  function fetchAirQuality(lat, lon) {
    var url = 'https://air-quality-api.open-meteo.com/v1/air-quality?' +
      'latitude=' + lat + '&longitude=' + lon +
      '&current=european_aqi,pm10,pm2_5,ozone,nitrogen_dioxide' +
      '&hourly=alder_pollen,birch_pollen,grass_pollen,mugwort_pollen,olive_pollen' +
      '&timezone=Europe%2FParis&forecast_days=1';
    return fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('AQI HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        var c = d.current, h = d.hourly;
        var hi = Math.min(new Date().getHours(), 23);
        var pollens = {
          'Aulne':     Math.round((h.alder_pollen  && h.alder_pollen[hi])  || 0),
          'Bouleau':   Math.round((h.birch_pollen   && h.birch_pollen[hi])  || 0),
          'Graminées': Math.round((h.grass_pollen   && h.grass_pollen[hi])  || 0),
          'Armoise':   Math.round((h.mugwort_pollen && h.mugwort_pollen[hi])|| 0),
          'Olivier':   Math.round((h.olive_pollen   && h.olive_pollen[hi])  || 0)
        };
        var polMax = Math.max.apply(null, Object.values(pollens));
        var polActifs = Object.keys(pollens).filter(function(k){return pollens[k]>2;});
        var polNiveau = polMax<10?{l:'Faible',c:'bg'}:polMax<50?{l:'Modéré',c:'ba'}:polMax<200?{l:'Élevé',c:'ba'}:{l:'Très élevé',c:'br'};
        return {
          aqi: c.european_aqi,
          pm25: c.pm2_5 != null ? c.pm2_5.toFixed(1) : null,
          pm10: c.pm10  != null ? c.pm10.toFixed(1)  : null,
          o3:   c.ozone != null ? c.ozone.toFixed(1)  : null,
          no2:  c.nitrogen_dioxide != null ? c.nitrogen_dioxide.toFixed(1) : null,
          pollens: pollens, polMax: polMax, polActifs: polActifs, polNiveau: polNiveau
        };
      });
  }

  /* ─── API : OSRM — Itinéraire routier ────────────────
   * Distance et durée théorique (sans trafic temps réel).
   ──────────────────────────────────────────────────── */
  function fetchRoute(oLat, oLon, dLat, dLon) {
    var url = 'https://router.project-osrm.org/route/v1/driving/' +
              oLon + ',' + oLat + ';' + dLon + ',' + dLat +
              '?overview=false&annotations=false';
    return fetch(url)
      .then(function (r) { if (!r.ok) throw new Error('OSRM HTTP ' + r.status); return r.json(); })
      .then(function (d) {
        if (!d.routes || !d.routes.length) throw new Error('Aucun itinéraire trouvé');
        var rt = d.routes[0], distM = rt.distance;
        return {
          distKm: Math.round(distM / 1000),
          dist: distM >= 1000 ? Math.round(distM / 1000) + ' km' : Math.round(distM) + ' m',
          dur: fmtDur(rt.duration), durSec: rt.duration,
          note: 'Durée théorique sans trafic (OSRM / OpenStreetMap)'
        };
      });
  }

  /* ─── API : SNCF officielle ──────────────────────────
   * Endpoint : https://api.sncf.com/v1/coverage/sncf/
   * Auth Basic : username = token, password = vide.
   * Inscription : numerique.sncf.com/startup/api/token-developpeur/
   * Même protocole Navitia, couverture réseau SNCF uniquement.
   ──────────────────────────────────────────────────── */
  function fetchTrainsSNCF(oLat, oLon, dLat, dLon, token) {
    if (!token) return Promise.resolve({ _nk: true, trains: [] });
    var url = 'https://api.sncf.com/v1/coverage/sncf/journeys?' +
      'from=' + oLon + ';' + oLat +
      '&to=' + dLon + ';' + dLat +
      '&datetime=' + nowSNCF() +
      '&count=5&min_nb_journeys=1';

    return fetch(url, {
      headers: { 'Authorization': 'Basic ' + btoa(token + ':') }
    })
      .then(function (r) {
        if (r.status === 401) return { _err: 'Token SNCF invalide (401 — vérifiez votre token)', trains: [] };
        if (r.status === 404) return { _empty: true, trains: [] };
        if (!r.ok) return { _err: 'API SNCF HTTP ' + r.status, trains: [] };
        return r.json().then(function (d) {
          var journeys = (d.journeys || []).filter(function (j) {
            return j.sections && j.sections.some(function (s) { return s.type === 'public_transport'; });
          }).slice(0, 3);
          if (!journeys.length) return { _empty: true, trains: [] };
          var trains = journeys.map(function (j) {
            var pt = j.sections.filter(function(s){return s.type==='public_transport';});
            var first = pt[0] || {};
            var mode = (first.display_informations || {}).commercial_mode || 'Train';
            var num  = ((first.display_informations || {}).headsign ||
                        (first.display_informations || {}).label || '').trim();
            return {
              depart:    fmtNavTime(j.departure_date_time),
              arrivee:   fmtNavTime(j.arrival_date_time),
              duree:     fmtDur(j.duration),
              numero:    shortMode(mode) + (num ? ' ' + num : ''),
              transfers: j.nb_transfers || 0,
              fiabilite: reliab(mode)
            };
          });
          return { trains: trains };
        });
      })
      .catch(function (e) { return { _err: 'Réseau : ' + e.message, trains: [] }; });
  }

  function testSNCFToken(token) {
    if (!token || !token.trim()) return Promise.resolve({ ok: false, message: 'Token vide' });
    return fetch('https://api.sncf.com/v1/coverage/', {
      headers: { 'Authorization': 'Basic ' + btoa(token.trim() + ':') }
    })
      .then(function (r) {
        if (r.status === 401) return { ok: false, message: 'Token invalide (401 Unauthorized)' };
        if (!r.ok) return { ok: false, message: 'Erreur HTTP ' + r.status };
        return { ok: true, message: '✓ Token valide — API SNCF connectée' };
      })
      .catch(function (e) { return { ok: false, message: 'Erreur réseau : ' + e.message }; });
  }

  /* ─── Score global ───────────────────────────────────
   * Pondération : météo 40 pts, AQI 35 pts, pollen 25 pts.
   ──────────────────────────────────────────────────── */
  function calcScore(m, aq) {
    var s = 100, c = m.code;
    if (c>=95) s-=25; else if(c>=80) s-=18; else if(c>=61) s-=12;
    else if(c>=51) s-=7; else if(c>=45) s-=5; else if(c>=3) s-=3;
    if (m.temp<0||m.temp>37) s-=10; else if(m.temp<5||m.temp>33) s-=5;
    var a = aq.aqi||0;
    if (a>100) s-=25; else if(a>80) s-=15; else if(a>60) s-=8; else if(a>40) s-=3;
    var p = aq.polMax||0;
    if (p>200) s-=12; else if(p>50) s-=7; else if(p>10) s-=3;
    return { score: Math.max(5, Math.min(100, Math.round(s))) };
  }

  /* ─── Modes de transport ──────────────────────────── */
  function calcModes(rt, trains) {
    var dist = (rt && rt.distKm) || 0, durSec = (rt && rt.durSec) || 0, modes = [];
    if (!dist) return modes;

    var co2Car = Math.round(128 * dist / 1000);
    modes.push({ mode:'Voiture', icon:'🚗', duree:(rt&&rt.dur)||'—',
      cout:'~' + Math.round(dist*0.08) + '€', fib:78, co2kg:co2Car, co2:co2Car+' kg',
      score:62, note:'OSRM — sans trafic' });

    if (trains && trains.trains && trains.trains.length) {
      var t = trains.trains[0], co2t = +(1.7*dist/1000).toFixed(2);
      modes.push({ mode:'Train', icon:'🚆', duree:t.duree,
        cout:'~' + Math.round(Math.max(10,dist*0.1)) + '€', fib:t.fiabilite,
        co2kg:co2t, co2:co2t<1?Math.round(co2t*1000)+' g':co2t.toFixed(1)+' kg',
        score:88, note:'API SNCF (temps réel)' });
    } else if (dist > 5) {
      var co2t2 = +(1.7*dist/1000).toFixed(2);
      modes.push({ mode:'Train', icon:'🚆', duree:fmtDur(Math.round(Math.max(20,dist*0.45))*60),
        cout:'~' + Math.round(Math.max(10,dist*0.1)) + '€', fib:88,
        co2kg:co2t2, co2:co2t2<1?Math.round(co2t2*1000)+' g':co2t2.toFixed(1)+' kg',
        score:85, note:'Estimation (configurer API SNCF)' });
    }
    if (dist > 15) {
      var co2b = +(29*dist/1000).toFixed(1);
      modes.push({ mode:'Bus / Car', icon:'🚌', duree:fmtDur(Math.round(durSec*1.6)),
        cout:'~' + Math.max(5,Math.round(dist*0.04)) + '€', fib:82, co2kg:+co2b, co2:co2b+' kg',
        score:65, note:'Estimation' });
      var co2v = +(51*dist/1000).toFixed(1);
      modes.push({ mode:'Covoiturage', icon:'🚘', duree:fmtDur(Math.round(durSec*1.1)),
        cout:'~' + Math.round(dist*0.04+2) + '€', fib:72, co2kg:+co2v, co2:co2v+' kg',
        score:68, note:'Estimation' });
    }
    if (dist <= 20) modes.push({ mode:'Vélo', icon:'🚲', duree:fmtDur(Math.round(dist*4*60)),
      cout:'0€', fib:95, co2kg:0, co2:'0', score:dist<=10?82:60, note:'~15 km/h moy.' });

    var best = Math.max.apply(null, modes.map(function(m){return m.score;}));
    var bm = null;
    for (var i=0;i<modes.length;i++) { if(modes[i].score===best){bm=modes[i];break;} }
    if (bm) bm.best = true;
    return modes;
  }

  /* ─── Recommandations ─────────────────────────────── */
  function buildReco(m, aq, rt) {
    var al = [], alt = [], c = m.code;
    if (aq.polMax>200) al.push('Pollen très élevé (' + aq.polMax + ' gr/m³) — antihistaminiques fortement conseillés');
    else if(aq.polMax>50) al.push('Pollen élevé — prenez vos antihistaminiques');
    else if(aq.polMax>10) al.push('Pollen modéré (' + aq.polActifs.join(', ') + ')');
    if (aq.aqi>100) al.push('Qualité air mauvaise (AQI ' + aq.aqi + ') — masque FFP2 recommandé');
    else if(aq.aqi>60) al.push('Qualité air médiocre (AQI ' + aq.aqi + ') — limitez l\'effort en extérieur');
    if (c>=95) al.push('Orage prévu — reportez si possible');
    else if(c>=80) al.push('Averses fortes — imperméable recommandé');
    else if(c>=51) al.push('Pluie — pensez à votre imperméable');
    if (m.temp<2) al.push('Gel possible (' + m.temp + '°C) — vigilance verglas');
    if (m.temp>34) al.push('Canicule (' + m.temp + '°C) — hydratez-vous, évitez 12h–16h');
    if (m.uv>=8) al.push('UV très élevé (' + m.uv + ') — protection 50+ indispensable');
    else if(m.uv>=6) al.push('UV élevé (' + m.uv + ') — SPF 30+ conseillé');
    if (rt) alt.push('Voiture : ' + rt.dur + ' pour ' + rt.dist + ' (sans trafic temps réel)');
    alt.push('Consultez SNCF Connect ou Vianavigo pour les horaires de trains');
    if (c>=51) alt.push('Fortes pluies : préférez le train à la voiture');
    return { cond: wmoDesc(c), al: al, alt: alt };
  }

  /* ─── Score circle SVG ────────────────────────────── */
  function mkCircle(score) {
    var R=36,C=40,ci=2*Math.PI*R,col=scCol(score),off=ci-(score/100)*ci;
    return '<svg style="transform:rotate(-90deg);position:absolute;inset:0" width="80" height="80" viewBox="0 0 80 80">' +
      '<circle cx="'+C+'" cy="'+C+'" r="'+R+'" fill="none" stroke="rgba(255,255,255,.07)" stroke-width="6"/>' +
      '<circle cx="'+C+'" cy="'+C+'" r="'+R+'" fill="none" stroke="'+col+'" stroke-width="6"' +
      ' stroke-dasharray="'+ci.toFixed(1)+'" stroke-dashoffset="'+off.toFixed(1)+'" stroke-linecap="round"' +
      ' style="filter:drop-shadow(0 0 8px '+col+')"/></svg>' +
      '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:var(--fm);color:'+col+'">' +
      '<span style="font-size:1.2rem;font-weight:800">'+score+'</span>' +
      '<span style="font-size:.44rem;color:var(--t3)">/100</span></div>';
  }

  /* ══════════════════════════════════════════════════════
     RENDU DES ONGLETS
  ══════════════════════════════════════════════════════ */

  function renderOverview() {
    var m=DATA.m, aq=DATA.aq, rt=DATA.rt, reco=DATA.reco;
    var uv=uvLvl(m.uv), ico=wmoIcon(m.code), aqI=euAqi(aq.aqi);
    var uvPct=Math.min(99,m.uv/11*100).toFixed(1);
    var polluants=[['PM₂.₅',aq.pm25,'μg/m³'],['PM₁₀',aq.pm10,'μg/m³'],['NO₂',aq.no2,'μg/m³'],['Ozone',aq.o3,'μg/m³']];
    return (
      '<div class="card"><div class="ch"><span class="ct">🌤 Météo à '+DATA.dName+'</span><span class="src-tag">Open-Meteo</span></div><div class="cb">'+
      '<div class="wg">'+
      '<div class="wmain"><span style="font-size:1.8rem">'+ico+'</span>'+
      '<div><div style="font-size:2rem;font-weight:800;font-family:var(--fm)">'+m.temp+'°</div>'+
      '<div style="font-size:.7rem;color:var(--t2)">Ressenti '+m.feels+'°C · '+reco.cond+'</div></div>'+
      '<div style="margin-left:auto;text-align:right"><div style="font-size:.58rem;font-family:var(--fm);color:var(--t3)">min / max</div>'+
      '<div style="font-size:.86rem;font-weight:700;font-family:var(--fm)">'+m.tmin+'° / '+m.tmax+'°</div></div></div>'+
      '<div class="wstat"><div class="wsl">Humidité</div><div class="wsv" style="color:#06B6D4">'+m.humidity+'%</div></div>'+
      '<div class="wstat"><div class="wsl">Vent</div><div class="wsv" style="color:var(--t2)">'+m.wind+' km/h</div></div>'+
      '<div class="wstat"><div class="wsl">Précip.</div><div class="wsv" style="color:'+(m.precipProb>50?'#3B82F6':'var(--t2)')+'">'+m.precipProb+'%</div></div>'+
      '<div class="wstat"><div class="wsl">Nuages</div><div class="wsv">'+m.clouds+'%</div></div>'+
      '<div class="wt2"><div class="wsl" style="margin-bottom:5px">UV '+m.uv+'/11 — <span style="color:'+uv.c+'">'+uv.l+'</span></div>'+
      '<div class="uvg"><div class="uvtrack"><div class="uvneedle" style="left:calc('+uvPct+'% - 5px)"></div></div></div></div>'+
      '</div></div></div>'+

      '<div class="card"><div class="ch"><span class="ct">💨 Qualité de l\'air</span><span class="src-tag">Copernicus CAMS</span></div><div class="cb">'+
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px">'+
      '<div style="width:44px;height:44px;border-radius:50%;border:2.5px solid;display:flex;align-items:center;justify-content:center;font-size:.9rem;font-weight:800;font-family:var(--fm);flex-shrink:0" class="'+aqI.c+'">'+(aq.aqi!=null?aq.aqi:'—')+'</div>'+
      '<div><div style="font-weight:700;font-size:.85rem">'+aqI.l+'</div><div style="font-size:.62rem;color:var(--t3);font-family:var(--fm)">Indice AQI européen</div></div>'+
      '<span class="badge '+aqI.c+'" style="margin-left:auto">'+aqI.l+'</span></div>'+
      '<div class="wg">'+polluants.map(function(p){return p[1]!=null?'<div class="wstat"><div class="wsl">'+p[0]+'</div><div class="wsv" style="font-size:.78rem">'+p[1]+' '+p[2]+'</div></div>':'';}).join('')+'</div>'+
      '</div></div>'+

      '<div class="card"><div class="ch"><span class="ct">💡 Recommandations</span></div><div class="cb">'+
      '<div class="rcard"><div style="display:flex;align-items:center;gap:7px;margin-bottom:5px"><span>🎯</span><span style="font-size:.78rem;font-weight:700;color:var(--cyan)">Conditions de trajet</span></div>'+
      '<div class="rtime">'+reco.cond+'</div><div class="rtxt">'+(rt?'Voiture : '+rt.dur+' pour '+rt.dist+'.':'Données routières indisponibles.')+'</div></div>'+
      (reco.al.length?reco.al.map(function(a){return '<div class="ai"><span>⚠️</span><span class="at">'+a+'</span></div>';}).join(''):
       '<div class="ai"><span>✅</span><span class="at">Conditions généralement favorables pour ce trajet.</span></div>')+
      (reco.alt.length?'<div style="font-size:.62rem;font-family:var(--fm);color:var(--t3);margin:8px 0 5px;text-transform:uppercase;letter-spacing:1.5px">Infos complémentaires</div>'+
       reco.alt.map(function(a){return '<div class="ai"><span>ℹ️</span><span class="at">'+a+'</span></div>';}).join(''):'')+'</div></div>'
    );
  }

  function renderRoute() {
    var rt=DATA.rt, modes=DATA.modes;
    var rtH=!rt?'<div style="padding:12px;color:var(--t3);font-size:.75rem;font-family:var(--fm)">Données routières indisponibles</div>':
      '<div class="wg"><div class="wmain" style="flex-direction:column;align-items:flex-start;gap:4px">'+
      '<div style="font-size:1.4rem;font-weight:800;font-family:var(--fm)">'+rt.dist+'</div>'+
      '<div style="font-size:.7rem;color:var(--t2)">'+rt.dur+' estimé hors trafic</div></div>'+
      '<div class="wstat"><div class="wsl">Durée</div><div class="wsv">'+rt.dur+'</div></div>'+
      '<div class="wstat"><div class="wsl">Distance</div><div class="wsv">'+rt.dist+'</div></div></div>'+
      '<div class="info-note">ℹ '+rt.note+'</div>';
    return (
      '<div class="card"><div class="ch"><span class="ct">🗺 Itinéraire routier</span><span class="src-tag">OSRM · OpenStreetMap</span></div><div class="cb">'+rtH+'</div></div>'+
      '<div class="card"><div class="ch"><span class="ct">🚗 Comparaison multi-modes</span></div><div class="cb">'+
      '<div class="mgrid">'+modes.map(function(m){
        return '<div class="mc '+(m.best?'best':'')+'">'+
          '<div style="font-size:1.2rem;margin-bottom:4px">'+m.icon+'</div>'+
          '<div style="font-size:.8rem;font-weight:700;margin-bottom:6px">'+m.mode+'</div>'+
          '<div class="mstat"><span class="mk">⏱ Durée</span><span class="mv">'+m.duree+'</span></div>'+
          '<div class="mstat"><span class="mk">💶 Coût</span><span class="mv" style="color:var(--em)">'+m.cout+'</span></div>'+
          '<div class="mstat"><span class="mk">🌍 CO₂</span><span class="mv" style="color:'+(m.co2kg===0?'#10B981':m.co2kg<30?'#10B981':m.co2kg<80?'#F59E0B':'#EF4444')+'">'+m.co2+'</span></div>'+
          (m.note?'<div style="font-size:.55rem;color:var(--t3);font-family:var(--fm);margin-top:4px">'+m.note+'</div>':'')+'</div>';
      }).join('')+'</div>'+
      '<div class="info-note">Durées train/bus = estimations sauf si API SNCF configurée.</div>'+
      '</div></div>'
    );
  }

  function renderAir() {
    var aq=DATA.aq;
    var keys=Object.keys(aq.pollens), maxP=Math.max.apply(null,Object.values(aq.pollens).concat([1]));
    var polluants=[['PM₂.₅',aq.pm25,'μg/m³',25,'Particules fines'],['PM₁₀',aq.pm10,'μg/m³',50,'Particules grossières'],
      ['NO₂',aq.no2,'μg/m³',40,"Dioxyde d'azote"],['Ozone',aq.o3,'μg/m³',120,'Ozone troposphérique']];
    return (
      '<div class="card"><div class="ch"><span class="ct">🌿 Pollen</span><span class="src-tag">Open-Meteo SILAM</span></div><div class="cb">'+
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">'+
      '<span class="badge '+aq.polNiveau.c+'">'+aq.polNiveau.l+'</span>'+
      '<span style="font-size:.65rem;color:var(--t3);font-family:var(--fm)">'+aq.polMax+' grain/m³ max</span></div>'+
      keys.map(function(k){
        var v=aq.pollens[k], pct=Math.min(100,(v/maxP)*100).toFixed(1);
        var col=v<10?'#10B981':v<50?'#F59E0B':v<200?'#F97316':'#EF4444';
        return '<div style="margin-bottom:7px"><div style="display:flex;justify-content:space-between;margin-bottom:3px">'+
          '<span style="font-size:.72rem">'+k+'</span><span style="font-size:.68rem;font-family:var(--fm);color:'+col+'">'+v+'</span></div>'+
          '<div class="pbar"><div class="pfill" style="width:'+pct+'%;background:'+col+'"></div></div></div>';
      }).join('')+
      (aq.polActifs.length?'<div class="ptags" style="margin-top:8px">'+aq.polActifs.map(function(t){return '<span class="ptag">🌸 '+t+'</span>';}).join('')+'</div>':
       '<div style="font-size:.72rem;color:var(--em);margin-top:6px">✓ Aucun pollen significatif</div>')+
      '</div></div>'+

      '<div class="card"><div class="ch"><span class="ct">🏭 Polluants atmosphériques</span><span class="src-tag">Copernicus CAMS</span></div><div class="cb">'+
      polluants.map(function(p){
        if (p[1]==null) return '';
        var n=+p[1], col=n<p[3]*0.5?'#10B981':n<p[3]?'#F59E0B':'#EF4444';
        return '<div class="srow"><div class="d2" style="background:'+col+';box-shadow:0 0 5px '+col+'"></div>'+
          '<div style="flex:1"><div class="stxt">'+p[0]+' — '+p[1]+' '+p[2]+'</div><div class="ssub2">'+p[4]+'</div></div></div>';
      }).join('')+'</div></div>'
    );
  }

  function renderSante() {
    var m=DATA.m, aq=DATA.aq;
    var uv=uvLvl(m.uv), aqI=euAqi(aq.aqi), po=aq.polNiveau;
    var rain=(m.code>=51&&m.code<80)||m.code>=80, masque=aq.aqi>100;
    var actExt=(aq.aqi<75&&m.uv<8&&!rain&&m.temp>5&&m.temp<35)?'Favorable':(rain||aq.aqi>150)?'Déconseillée':'Acceptable';
    var rc=[];
    if(aq.polActifs.length) rc.push({i:'🌿',t:'Pollens actifs : '+aq.polActifs.join(', ')+'. Vitres fermées, douche en rentrant.'});
    if(m.uv>=8) rc.push({i:'☀️',t:'UV '+m.uv+' — crème 50+, chapeau et lunettes UV obligatoires. Évitez 12h–16h.'});
    else if(m.uv>=6) rc.push({i:'☀️',t:'UV '+m.uv+' — SPF 30+ recommandé pour exposition > 30 min.'});
    if(masque) rc.push({i:'😷',t:'AQI '+aq.aqi+' — masque FFP2 fortement recommandé en extérieur.'});
    else if(aq.aqi>60) rc.push({i:'💨',t:'AQI '+aq.aqi+' — évitez l\'effort physique intense dehors.'});
    if(m.temp>34) rc.push({i:'🌡️',t:m.temp+'°C — hydratez-vous (1,5 L+), évitez les heures chaudes.'});
    if(m.temp<2) rc.push({i:'🧊',t:m.temp+'°C — risque de verglas. Équipement chaud indispensable.'});
    if(rain) rc.push({i:'🌧️',t:'Précipitations — imperméable et chaussures imperméables conseillés.'});
    if(!rc.length) rc.push({i:'✅',t:'Conditions sanitaires et environnementales favorables pour ce trajet.'});
    return (
      '<div class="card"><div class="ch"><span class="ct">🏥 Tableau de bord santé</span></div><div class="cb">'+
      '<div class="hgrid">'+
      '<div class="ht"><div style="font-size:1.2rem;margin-bottom:4px">🤧</div><div class="hl">Risque pollen</div><span class="badge '+po.c+'" style="margin-top:3px;display:inline-flex">'+po.l+'</span></div>'+
      '<div class="ht"><div style="font-size:1.2rem;margin-bottom:4px">😷</div><div class="hl">Masque</div><div style="font-size:.82rem;font-weight:700;color:'+(masque?'#EF4444':'#10B981')+';margin-top:3px">'+(masque?'Recommandé':'Non nécessaire')+'</div></div>'+
      '<div class="ht"><div style="font-size:1.2rem;margin-bottom:4px">☀️</div><div class="hl">UV</div><div style="font-size:.82rem;font-weight:700;color:'+uv.c+';margin-top:3px">'+m.uv+'/11 — '+uv.l+'</div></div>'+
      '<div class="ht"><div style="font-size:1.2rem;margin-bottom:4px">🏃</div><div class="hl">Activité ext.</div><span class="badge '+bcls(actExt)+'" style="margin-top:3px;display:inline-flex">'+actExt+'</span></div>'+
      '<div class="ht"><div style="font-size:1.2rem;margin-bottom:4px">💨</div><div class="hl">Qualité air</div><span class="badge '+aqI.c+'" style="margin-top:3px;display:inline-flex">'+aqI.l+'</span></div>'+
      '<div class="ht"><div style="font-size:1.2rem;margin-bottom:4px">🌡️</div><div class="hl">Température</div><div style="font-size:.82rem;font-weight:700;margin-top:3px">'+m.temp+'°C</div></div>'+
      '</div></div></div>'+
      '<div class="card"><div class="ch"><span class="ct">💊 Recommandations personnalisées</span></div><div class="cb">'+
      rc.map(function(r){return '<div class="ai"><span style="font-size:.9rem">'+r.i+'</span><span class="at">'+r.t+'</span></div>';}).join('')+
      '</div></div>'
    );
  }

  function renderTrains() {
    var trains=DATA.trains, rt=DATA.rt, oName=DATA.oName, dName=DATA.dName;
    var hasToken=!!STORE.token;
    var tH;
    if (!trains || (!hasToken && !trains.trains)) {
      tH='<div class="train-notice"><div class="tn-icon">🔑</div>'+
         '<div class="tn-ttl">Configurer l\'API SNCF pour les trains temps réel</div>'+
         '<div class="tn-txt">Gratuit · 150 000 requêtes/mois · inscription sur numerique.sncf.com</div>'+
         '<button class="navitia-goto-btn" id="go-settings-train">⚙ Configurer l\'API SNCF →</button></div>';
    } else if (trains._err) {
      tH='<div class="ai" style="margin-bottom:8px"><span>⚠️</span><span class="at">'+trains._err+'</span></div>'+
         '<button class="navitia-goto-btn" id="go-settings-train">⚙ Vérifier le token</button>';
    } else if (trains._empty) {
      tH='<div class="ai"><span>ℹ️</span><span class="at">Aucun train direct trouvé pour cette relation. Consultez SNCF Connect.</span></div>';
    } else if (trains.trains && trains.trains.length) {
      tH=trains.trains.map(function(t,i){
        return '<div class="tc"><span style="font-size:1.1rem">'+(i===0?'🏆':'🚆')+'</span>'+
          '<div><div class="ttime">'+t.depart+'</div><div style="font-size:.6rem;color:var(--t3);font-family:var(--fm)">Dép.</div></div>'+
          '<div style="flex:1;text-align:center;color:var(--cyan);font-size:.8rem">──→<br><span style="font-size:.62rem;color:var(--t3);font-family:var(--fm)">'+t.duree+'</span></div>'+
          '<div><div class="ttime">'+t.arrivee+'</div><div style="font-size:.6rem;color:var(--t3);font-family:var(--fm)">Arr.</div></div>'+
          '<div class="tmeta"><span class="tnum">'+t.numero+'</span>'+
          (t.transfers>0?'<span style="font-size:.62rem;color:var(--amber);font-family:var(--fm)">'+t.transfers+' corresp.</span>':
           '<span style="font-size:.62rem;color:var(--em);font-family:var(--fm)">Direct</span>')+
          '<div style="display:flex;align-items:center;gap:3px;font-size:.62rem;font-family:var(--fm);color:var(--t2)">'+
          '<div class="rb"><div class="rf" style="width:'+t.fiabilite+'%"></div></div>'+t.fiabilite+'%</div></div></div>';
      }).join('');
    } else {
      tH='<div style="padding:8px;font-size:.75rem;color:var(--t3)">—</div>';
    }
    var links=[['SNCF Connect','https://www.sncf-connect.com','🎫 Billets & horaires officiels'],
      ['Ouigo','https://www.ouigo.com','🟢 Trains low-cost'],
      ['Trainline','https://www.thetrainline.com/fr','🔵 Comparateur de prix'],
      ['Vianavigo','https://www.vianavigo.com','🟣 Île-de-France'],
      ['RATP','https://www.ratp.fr','🔴 Paris & banlieue']];
    return (
      '<div class="card"><div class="ch"><span class="ct">🚆 Trains '+oName+' → '+dName+'</span>'+(hasToken?'<span class="src-tag">API SNCF</span>':'')+'</div><div class="cb">'+tH+'</div></div>'+
      '<div class="card"><div class="ch"><span class="ct">📱 Ressources officielles</span></div><div class="cb">'+
      links.map(function(l){return '<div class="srow"><div style="flex:1"><div class="stxt">'+l[0]+'</div><div class="ssub2">'+l[2]+'</div></div>'+
        '<a href="'+l[1]+'" target="_blank" style="font-size:.65rem;color:var(--blue);font-family:var(--fm);text-decoration:none;flex-shrink:0">Ouvrir →</a></div>';}).join('')+
      '</div></div>'+
      (rt?'<div class="card"><div class="ch"><span class="ct">🚗 Alternative voiture</span><span class="src-tag">OSRM</span></div><div class="cb">'+
       '<div class="srow"><div class="d2 dg"></div><div style="flex:1"><div class="stxt">'+rt.dist+' · '+rt.dur+'</div>'+
       '<div class="ssub2">Durée théorique sans trafic (OSRM / OpenStreetMap)</div></div></div></div></div>':'')
    );
  }

  function renderTab(tab) {
    var el = $('tab-content'); if (!el || !DATA) return;
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

  /* ─── Paramètres SNCF ─────────────────────────────── */
  function initSettings() {
    var inp = $('sncf-token-input');
    if (inp) inp.value = STORE.token;

    $('settings-back').addEventListener('click', function () { show('search'); });

    $('sncf-test-btn').addEventListener('click', function () {
      var token = $('sncf-token-input').value.trim();
      var status = $('token-status');
      status.textContent = 'Test en cours…';
      status.className = 'token-status bb';
      status.style.display = 'block';
      testSNCFToken(token).then(function (res) {
        status.textContent = res.message;
        status.className = 'token-status ' + (res.ok ? 'ok' : 'err');
      });
    });

    $('sncf-save-btn').addEventListener('click', function () {
      var token = $('sncf-token-input').value.trim();
      STORE.token = token;
      var badge = $('token-badge-search');
      if (badge) badge.style.display = token ? 'inline-flex' : 'none';
      var status = $('token-status');
      status.textContent = token ? '✓ Token enregistré localement' : 'Token supprimé';
      status.className = 'token-status ' + (token ? 'ok' : 'err');
      status.style.display = 'block';
      setTimeout(function () { show('search'); }, 900);
    });
  }

  /* ─── Analyse principale ──────────────────────────── */
  function analyze() {
    var orig = $('orig-inp').value.trim();
    var dest = $('dest-inp').value.trim();
    if (!orig || !dest) return;

    var ebox = $('ebox'); ebox.style.display = 'none';
    show('loading');
    ['s0','s1','s2','s3','s4'].forEach(function(id){ setStep(id,''); });
    $('lmsg').textContent = 'Géocodage des villes…';

    // Géocodage BAN
    setStep('s0', 'loading');
    Promise.all([geocodeBAN(orig), geocodeBAN(dest)])
      .then(function (geos) {
        var oGeo = geos[0], dGeo = geos[1];
        setStep('s0', 'done');

        // Météo
        setStep('s1', 'loading');
        $('lmsg').textContent = 'Récupération météo…';
        return fetchMeteo(dGeo.lat, dGeo.lon)
          .then(function (m) {
            setStep('s1', 'done');
            return { oGeo: oGeo, dGeo: dGeo, m: m };
          })
          .catch(function () {
            setStep('s1', 'fail');
            return { oGeo: oGeo, dGeo: dGeo, m: {temp:15,feels:13,humidity:60,wind:10,code:3,clouds:50,tmax:18,tmin:10,precipProb:30,uv:3} };
          });
      })
      .then(function (ctx) {
        // AQI + Pollen
        setStep('s2', 'loading'); setStep('s3', 'loading');
        $('lmsg').textContent = "Qualité de l'air & pollen…";
        return fetchAirQuality(ctx.dGeo.lat, ctx.dGeo.lon)
          .then(function (aq) {
            setStep('s2', 'done'); setStep('s3', 'done');
            ctx.aq = aq; return ctx;
          })
          .catch(function () {
            setStep('s2', 'fail'); setStep('s3', 'fail');
            ctx.aq = {aqi:50,pm25:null,pm10:null,o3:null,no2:null,pollens:{},polMax:0,polActifs:[],polNiveau:{l:'Inconnu',c:'bb'}};
            return ctx;
          });
      })
      .then(function (ctx) {
        // OSRM
        setStep('s4', 'loading');
        $('lmsg').textContent = 'Calcul itinéraire…';
        return fetchRoute(ctx.oGeo.lat, ctx.oGeo.lon, ctx.dGeo.lat, ctx.dGeo.lon)
          .then(function (rt) {
            setStep('s4', 'done'); ctx.rt = rt; return ctx;
          })
          .catch(function () {
            setStep('s4', 'fail'); ctx.rt = null; return ctx;
          });
      })
      .then(function (ctx) {
        // SNCF (optionnel, non bloquant)
        var token = STORE.token;
        if (!token) return Promise.resolve(ctx);
        return fetchTrainsSNCF(ctx.oGeo.lat, ctx.oGeo.lon, ctx.dGeo.lat, ctx.dGeo.lon, token)
          .then(function (trains) { ctx.trains = trains; return ctx; })
          .catch(function (e) { ctx.trains = {_err: e.message, trains:[]}; return ctx; });
      })
      .then(function (ctx) {
        return new Promise(function(resolve){ setTimeout(function(){ resolve(ctx); }, 300); });
      })
      .then(function (ctx) {
        var scoreRes = calcScore(ctx.m, ctx.aq);
        var modes    = calcModes(ctx.rt, ctx.trains || null);
        var reco     = buildReco(ctx.m, ctx.aq, ctx.rt);

        DATA = { m:ctx.m, aq:ctx.aq, rt:ctx.rt, trains:ctx.trains||null,
                 reco:reco, modes:modes, scoreRes:scoreRes,
                 oName:ctx.oGeo.name, dName:ctx.dGeo.name };

        $('d-orig').textContent   = ctx.oGeo.name;
        $('d-dest').textContent   = ctx.dGeo.name;
        $('score-circ').innerHTML = mkCircle(scoreRes.score);
        $('score-lbl').textContent = scLbl(scoreRes.score);
        $('score-lbl').style.color = scCol(scoreRes.score);
        $('score-detail').textContent = 'Score ' + scoreRes.score + '/100 · météo + air + pollen';

        document.querySelectorAll('.tab').forEach(function(t){ t.classList.remove('active'); });
        document.querySelector('.tab[data-tab="overview"]').classList.add('active');
        renderTab('overview');
        show('dash');
      })
      .catch(function (e) {
        show('search');
        var ebox = $('ebox');
        ebox.textContent = e.message || 'Erreur inattendue. Vérifiez votre connexion.';
        ebox.style.display = 'block';
      });
  }

  /* ─── Initialisation ──────────────────────────────── */
  function init() {
    // Autocomplétion sur les deux champs
    setupAutocomplete('orig-inp', 'orig-ac');
    setupAutocomplete('dest-inp', 'dest-ac');

    // Tabs
    document.querySelectorAll('.tab').forEach(function (t) {
      t.addEventListener('click', function () {
        document.querySelectorAll('.tab').forEach(function(x){ x.classList.remove('active'); });
        t.classList.add('active');
        renderTab(t.dataset.tab);
      });
    });

    // Swap
    $('swap-btn').addEventListener('click', function () {
      var o=$('orig-inp'), d=$('dest-inp');
      var tmp=o.value; o.value=d.value; d.value=tmp;
    });

    // Bouton retour dashboard → search
    var backBtn = $('back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', function (e) {
        e.preventDefault();
        show('search');
      });
    }

    // Icône paramètres dans le dashboard
    var settingsIcon = $('settings-icon');
    if (settingsIcon) {
      settingsIcon.addEventListener('click', function () {
        var inp = $('sncf-token-input');
        if (inp) inp.value = STORE.token;
        show('settings');
      });
    }

    // Bouton paramètres depuis search
    var goSettings = $('go-settings');
    if (goSettings) {
      goSettings.addEventListener('click', function () {
        var inp = $('sncf-token-input');
        if (inp) inp.value = STORE.token;
        show('settings');
      });
    }

    // Bouton analyser
    $('analyze-btn').addEventListener('click', analyze);
    $('orig-inp').addEventListener('keydown', function(e){ if(e.key==='Enter') analyze(); });
    $('dest-inp').addEventListener('keydown', function(e){ if(e.key==='Enter') analyze(); });

    // Paramètres SNCF
    initSettings();

    // Badge si token déjà présent
    if (STORE.token) {
      var badge = $('token-badge-search');
      if (badge) badge.style.display = 'inline-flex';
    }
  }

  // Attendre que le DOM soit prêt (compatible Capacitor)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
