/* Generated from shared/constants.json. Do not edit. */
window.TRIPMIND_CONSTANTS = {
  "MODE_COSTS": {
    "car": {
      "fuelLPer100km": 7,
      "fuelEurPerL": 1.85,
      "runningEurPerKm": 0.12,
      "tollEurPerKm": 0.09,
      "tollThresholdKm": 80,
      "co2gPerKm": 128
    },
    "train": {
      "co2gPerKm": 1.7,
      "terEurPerKm": 0.1,
      "terMin": 10,
      "tgvEurPerKm": 0.2,
      "tgvMin": 30,
      "tgvMax": 130,
      "tgvThresholdKm": 150
    },
    "bus": {
      "co2gPerKm": 29,
      "eurPerKm": 0.07,
      "minEur": 8,
      "durationFactor": 1.6,
      "minDistKm": 15
    },
    "carpool": {
      "co2gPerKm": 51,
      "eurPerKm": 0.09,
      "minEur": 8,
      "durationFactor": 1.1,
      "minDistKm": 15
    },
    "bike": {
      "maxDistKm": 20,
      "speedKmH": 15,
      "co2gPerKm": 0
    }
  },
  "SCORE_WEIGHTS": {
    "wmo": {
      "storm": 25,
      "freezing": 22,
      "heavyRain": 18,
      "snow": 15,
      "rain": 12,
      "drizzle": 7,
      "fog": 5,
      "cloudy": 3
    },
    "precip": {
      "veryHigh": 30,
      "high": 18,
      "moderate": 8,
      "low": 3
    },
    "precipAmt": {
      "heavy": 18,
      "moderate": 10,
      "light": 4
    },
    "snow": {
      "heavy": 20,
      "moderate": 12,
      "light": 6
    },
    "visibility": {
      "veryPoor": 10,
      "poor": 6,
      "moderate": 3
    },
    "daylight": {
      "short": 4,
      "limited": 2
    },
    "cloud": {
      "overcast": 5,
      "cloudy": 3,
      "partly": 1
    },
    "temp": {
      "extreme": 10,
      "uncomfortable": 5
    },
    "wind": {
      "severe": 8,
      "strong": 5,
      "moderate": 2
    },
    "uv": {
      "extreme": 6,
      "veryHigh": 4,
      "high": 2
    },
    "humidity": {
      "veryHigh": 3,
      "high": 2
    },
    "aqi": {
      "veryPoor": 25,
      "poor": 15,
      "moderate": 8,
      "fair": 3
    },
    "pollutant": {
      "high": 8,
      "medium": 4,
      "low": 2
    },
    "pollen": {
      "veryHigh": 12,
      "high": 7,
      "moderate": 3
    }
  },
  "MODE_EXPOSURE": {
    "car": 1,
    "carpool": 1,
    "bus": 0.9,
    "bike": 1.2,
    "train": 0.2
  },
  "AQI_BANDS": {
    "EU": [
      {
        "min": 100,
        "level": "veryPoor"
      },
      {
        "min": 80,
        "level": "poor"
      },
      {
        "min": 60,
        "level": "moderate"
      },
      {
        "min": 40,
        "level": "fair"
      }
    ],
    "US": [
      {
        "min": 200,
        "level": "veryPoor"
      },
      {
        "min": 150,
        "level": "poor"
      },
      {
        "min": 100,
        "level": "moderate"
      },
      {
        "min": 50,
        "level": "fair"
      }
    ]
  }
};
