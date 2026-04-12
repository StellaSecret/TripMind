# 🧭 TripMind

**Assistant de déplacement intelligent pour la France**  
Application Android (Capacitor) · APIs publiques · Aucun token obligatoire

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

## 🛰 APIs intégrées

| Donnée | API | Token |
|--------|-----|-------|
| Météo + UV | [Open-Meteo](https://open-meteo.com) | ✅ Aucun |
| Qualité de l'air + Pollen | [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) (Copernicus CAMS + SILAM) | ✅ Aucun |
| Géocodage France + Autocomplétion | [Base Adresse Nationale](https://api-adresse.data.gouv.fr) (data.gouv.fr) | ✅ Aucun |
| Itinéraire routier | [OSRM](https://project-osrm.org) / OpenStreetMap | ✅ Aucun |
| Trains SNCF *(optionnel)* | [API SNCF officielle](https://numerique.sncf.com/startup/api) | 🔑 Gratuit — voir ci-dessous |

> **Navitia.io** n'accepte plus les inscriptions publiques depuis 2024. L'app utilise désormais l'**API SNCF officielle** (`api.sncf.com`), basée sur le même protocole Navitia, toujours gratuite.

---

## 🚆 Activer les trains (API SNCF)

1. Allez sur **[numerique.sncf.com/startup/api/token-developpeur](https://numerique.sncf.com/startup/api/token-developpeur/)**
2. Créez un compte — votre token vous est envoyé par email
3. Dans l'app : appuyez ⚙ → collez votre token → **Enregistrer**

**Limites gratuites :** 5 000 requêtes/jour · 150 000 requêtes/mois  
Le token est stocké **uniquement en local** sur votre appareil (`localStorage`). Il n'est jamais envoyé à un serveur tiers.

---

## ✨ Nouveautés v2

- **Autocomplétion des villes** — suggestions en temps réel via la Base Adresse Nationale dès 2 caractères tapés
- **API SNCF officielle** — remplace Navitia qui n'accepte plus les inscriptions
- **Bouton Retour corrigé** — refactorisé en JS vanilla sans ES modules pour compatibilité Capacitor WebView
- **Script unifié** — plus d'import/export ES modules : un seul `app.js` en IIFE, compatible tous les WebView Android

---

## 📁 Structure du projet

```
TripMind/
├── .github/
│   └── workflows/
│       └── build.yml          # CI/CD : build APK + release GitHub
├── www/                       # Application web (Capacitor webDir)
│   ├── index.html             # Structure HTML — 4 écrans
│   ├── css/
│   │   └── style.css          # Styles (thème sombre, dropdown autocomplete)
│   └── js/
│       └── app.js             # Tout-en-un : APIs + logique + rendu (IIFE, pas d'ES modules)
├── .gitignore
├── capacitor.config.json
├── package.json
└── README.md
```

---

## 🤖 Pipeline CI/CD (GitHub Actions)

Le workflow `.github/workflows/build.yml` se déclenche à chaque push sur `main` ou manuellement.

**Lancer manuellement :** GitHub → Actions → *Build TripMind APK* → **Run workflow**

---

## 📱 Installation sur Android

1. Téléchargez `app-debug.apk` depuis la dernière [Release GitHub](../../releases)
2. **Paramètres → Sécurité → Sources inconnues** (ou *Installer des apps inconnues*)
3. Ouvrez le fichier APK

---

## 🏗 Développement local

```bash
# Tester dans le navigateur (sans Android)
cd www && python3 -m http.server 8080
# → http://localhost:8080

# Synchroniser après modifications de www/
npx cap sync android

# Ouvrir dans Android Studio
npx cap open android
```

---

## 🗺 Fonctionnalités

| Onglet | Contenu |
|--------|---------|
| **🗺 Aperçu** | Score global /100, météo complète, AQI, alertes et recommandations |
| **🚗 Trajet** | Distance + durée OSRM, comparaison voiture / train / bus / covoiturage / vélo avec empreinte CO₂ |
| **💨 Air & Pollen** | Barres polliniques (aulne, bouleau, graminées, armoise, olivier), polluants (PM₂.₅, PM₁₀, NO₂, O₃) |
| **💊 Santé** | Tableau de bord + recommandations personnalisées |
| **🚆 Trains** | Prochains trains via API SNCF (si token configuré) + liens SNCF Connect, Ouigo, RATP… |

---

## 📄 Licence

MIT — utilisation libre, contributions bienvenues.
