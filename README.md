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
- API SNCF officielle (`api.sncf.com`) : le support ne répond plus aux inscriptions individuelles.
- Transitous : aucun compte, aucun token, couverture France complète.

**Politique d'usage Transitous :**
Si TripMind est utilisé par un nombre significatif d'utilisateurs, contactez Transitous sur leur [channel Matrix](https://matrix.to/#/%23transitous:matrix.spline.de) pour vous signaler — c'est leur politique pour les apps FOSS.

---

## ✨ Fonctionnalités

| Onglet | Contenu |
|--------|---------|
| **🗺 Aperçu** | Score global /100, météo complète, AQI, alertes et recommandations. |
| **🚗 Trajet** | Distance + durée OSRM, comparaison voiture / train / bus / covoiturage / vélo avec CO₂. |
| **💨 Air & Pollen** | Barres polliniques (5 espèces), polluants (PM₂.₅, PM₁₀, NO₂, O₃). |
| **💊 Santé** | Tableau de bord santé + recommandations personnalisées. |
| **🚆 Trains** | Prochains trains via Transitous/MOTIS 2 + liens SNCF Connect, Ouigo, RATP… |

**Sélecteur de date** : prévisions sur 16 jours (J à J+15). Météo et pollen disponibles sur ~5 jours pour les données de qualité air.

---

## 🧪 Tests & Qualité

TripMind suit des standards de qualité rigoureux avec plus de 160 tests automatisés.

### Tests Unitaires (Vitest)
Ciblent la logique métier (calcul de score, parsing, gestion du cache).
```bash
npm run test:unit
```

### Tests E2E (Playwright)
Validations complètes de l'interface et des flux utilisateurs (165 tests). Les tests tournent en mode **offline** (données API mockées) pour garantir la reproductibilité.
```bash
cd e2e && npm test
```

---

## 📁 Structure du projet

```
TripMind/
├── .github/ workflows/
│   └── main.yml               # Pipeline CI/CD unique (Sécurité, Tests, Build, Deploy)
├── android/                   # Projet natif Capacitor (Java/Gradle)
├── e2e/                       # Tests de non-régression (Playwright) — 165 tests
├── unit/                      # Tests unitaires (Vitest)
├── www/                       # Application web (Capacitor webDir)
│   ├── index.html             # Structure HTML (Single Page App)
│   ├── css/ style.css         # Design responsive & safe areas
│   └── js/
│       ├── api.js             # Couche d'accès aux données (Fetch)
│       └── app.js             # Logique principale, calculs & rendu DOM
├── capacitor.config.json      # Configuration Capacitor
├── package.json               # Scripts & dépendances globales
└── README.md
```

---

## 🤖 Pipeline CI/CD (`main.yml`)

Le workflow GitHub Actions se déclenche à chaque push sur `main` et exécute :
1. **Sûreté** : Scan de secrets (TruffleHog) + Analyse statique (CodeQL) + Audit NPM.
2. **Validation** : Exécution de tous les tests Unitaires et E2E.
3. **Distribution Web** : Déploiement automatique sur GitHub Pages.
4. **Distribution Mobile** : Build de l'AAB (Play Store) et de l'APK (Release), signés numériquement.

---

## 🏗 Développement local

```bash
# Lancer l'application dans le navigateur (nécessite 'serve' ou python)
npx serve www --listen 8080
# ou
cd www && python3 -m http.server 8080

# Synchroniser les changements vers Android
npx cap sync android

# Ouvrir dans Android Studio
npx cap open android
```

---

## 🔒 Confidentialité

TripMind ne collecte aucune donnée personnelle. Aucun compte, aucun token, aucun tracking. Les requêtes API sont effectuées directement depuis l'appareil de l'utilisateur vers les services tiers listés ci-dessus.

---

## 📄 Licence

MIT — utilisation libre, contributions bienvenues.
