# 🧭 TripMind

**Assistant de déplacement intelligent pour la France**  
Application Android (Capacitor) · 100% APIs publiques · Aucun token requis

---

## 🚀 Démarrage rapide

### Prérequis
- Node.js 22+
- Java 21 (JDK Temurin recommandé)

```bash
git clone https://github.com/StellaSecret/TripMind.git
cd TripMind
npm install
npx cap add android          # première fois uniquement (si android/ absent)
npx cap sync android
cd android && ./gradlew assembleDebug
```

L'APK est généré dans `android/app/build/outputs/apk/debug/app-debug.apk`.

---

## 🛰 APIs intégrées — 100% sans compte ni token

| Donnée | API | Clé requise |
|--------|-----|-------------|
| Météo + UV (16 jours) | [Open-Meteo](https://open-meteo.com) | ✅ Aucune |
| Qualité de l'air + Pollen | [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) — Copernicus CAMS + SILAM | ✅ Aucune |
| Géocodage + Autocomplétion | [Base Adresse Nationale](https://api-adresse.data.gouv.fr) (data.gouv.fr) | ✅ Aucune |
| Itinéraire routier | [OSRM](https://project-osrm.org) / OpenStreetMap | ✅ Aucune |
| Trains & transports publics | [Transitous](https://transitous.org) / MOTIS 2 | ✅ Aucune |

> **Note trafic temps réel :** OSRM fournit les durées théoriques sans congestion.  
> **Note trains :** Transitous est un service communautaire bénévole — des erreurs 500/504 peuvent survenir en cas de surcharge. L'app retente automatiquement une fois, puis affiche un message explicatif.

---

## 🚆 Transitous — trains sans token

TripMind utilise [Transitous](https://transitous.org), un routeur de transport public open source basé sur le moteur [MOTIS 2](https://github.com/motis-project/motis) et des données GTFS ouvertes, dont les données SNCF France.

**Pourquoi Transitous plutôt que l'API SNCF officielle ?**
- Navitia.io : inscriptions publiques fermées depuis fin 2023
- API SNCF officielle (`api.sncf.com`) : le support ne répond plus aux inscriptions individuelles
- Transitous : aucun compte, aucun token, couverture France complète

**Politique d'usage Transitous :**
Si TripMind est utilisé par un nombre significatif d'utilisateurs, contactez Transitous sur leur [channel Matrix](https://matrix.to/#/%23transitous:matrix.spline.de) pour vous signaler — c'est leur politique pour les apps FOSS.

---

## ✨ Fonctionnalités

| Onglet | Contenu |
|--------|---------|
| **🗺 Aperçu** | Score global /100, météo complète, AQI, alertes et recommandations |
| **🚗 Trajet** | Distance + durée OSRM, comparaison voiture / train / bus / covoiturage / vélo avec CO₂ |
| **💨 Air & Pollen** | Barres polliniques (5 espèces), polluants (PM₂.₅, PM₁₀, NO₂, O₃) |
| **💊 Santé** | Tableau de bord santé + recommandations personnalisées |
| **🚆 Trains** | Prochains trains via Transitous/MOTIS 2 + liens SNCF Connect, Ouigo, RATP… |

**Sélecteur de date** : prévisions sur 16 jours (J à J+15). Météo et pollen disponibles sur ~5 jours pour les données de qualité air.

---

## 📁 Structure du projet

```
TripMind/
├── .github/
│   └── workflows/
│       ├── build.yml          # CI/CD : build APK signé + release GitHub
│       └── pages.yml          # Déploiement GitHub Pages (www/)
├── www/                       # Application web (Capacitor webDir)
│   ├── index.html             # Structure HTML — 4 écrans
│   ├── css/
│   │   └── style.css          # Thème sombre + date picker + safe areas
│   └── js/
│       └── app.js             # Tout-en-un IIFE : APIs + logique + rendu
├── KEYSTORE_SETUP.md          # Guide pour signer les APKs de mise à jour
├── .gitignore
├── capacitor.config.json
├── package.json
└── README.md
```

---

## 🤖 Pipeline CI/CD

### Build APK (`build.yml`)
Se déclenche à chaque push sur `main`. Génère un APK release signé avec le keystore stocké en secrets GitHub → crée une Release avec l'APK en pièce jointe.

Voir `KEYSTORE_SETUP.md` pour configurer les secrets de signature.

**Lancer manuellement :** Actions → *Build TripMind APK* → **Run workflow**

### GitHub Pages (`pages.yml`)
Déploie `www/` sur GitHub Pages à chaque push sur `main`.

**Activation unique requise :** Settings → Pages → Source → **GitHub Actions**

URL : `https://stellasecret.github.io/TripMind/`

---

## 📱 Installation Android

1. Téléchargez `TripMind-vN.apk` depuis la dernière [Release](../../releases)
2. **Paramètres → Sécurité → Sources inconnues**
3. Installez — Android détecte automatiquement les mises à jour si l'APK est signé avec le même keystore

---

## 🏗 Développement local

```bash
# Tester dans le navigateur
cd www && python3 -m http.server 8080
# → http://localhost:8080

# Synchroniser après modifications de www/
npx cap sync android

# Ouvrir Android Studio
npx cap open android
```

---

## 🔒 Confidentialité

TripMind ne collecte aucune donnée personnelle. Aucun compte, aucun token, aucun tracking. Les requêtes API sont effectuées directement depuis l'appareil de l'utilisateur vers les services tiers listés ci-dessus.

---

## 📄 Licence

MIT — utilisation libre, contributions bienvenues.
