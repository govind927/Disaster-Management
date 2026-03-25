const axios = require('axios');

const API_KEY = process.env.OPENWEATHER_API_KEY;
const BASE_URL = 'https://api.openweathermap.org/data/2.5';

// Weather condition codes that indicate danger
const DANGER_MAP = {
  // Thunderstorm group (2xx)
  200: { severity: 'high',     label: 'Thunderstorm with light rain' },
  201: { severity: 'high',     label: 'Thunderstorm with rain' },
  202: { severity: 'critical', label: 'Thunderstorm with heavy rain' },
  210: { severity: 'medium',   label: 'Light thunderstorm' },
  211: { severity: 'high',     label: 'Thunderstorm' },
  212: { severity: 'critical', label: 'Heavy thunderstorm' },
  221: { severity: 'high',     label: 'Ragged thunderstorm' },
  231: { severity: 'high',     label: 'Thunderstorm with drizzle' },
  232: { severity: 'high',     label: 'Thunderstorm with heavy drizzle' },
  // Drizzle (3xx)
  301: { severity: 'low',      label: 'Drizzle' },
  302: { severity: 'low',      label: 'Heavy drizzle' },
  // Rain (5xx)
  500: { severity: 'low',      label: 'Light rain' },
  501: { severity: 'medium',   label: 'Moderate rain' },
  502: { severity: 'high',     label: 'Heavy intensity rain' },
  503: { severity: 'critical', label: 'Very heavy rain' },
  504: { severity: 'critical', label: 'Extreme rain' },
  511: { severity: 'high',     label: 'Freezing rain' },
  521: { severity: 'medium',   label: 'Shower rain' },
  522: { severity: 'high',     label: 'Heavy shower rain' },
  // Snow (6xx)
  601: { severity: 'medium',   label: 'Snow' },
  602: { severity: 'high',     label: 'Heavy snow' },
  611: { severity: 'medium',   label: 'Sleet' },
  // Atmosphere (7xx)
  701: { severity: 'low',      label: 'Mist' },
  711: { severity: 'medium',   label: 'Smoke' },
  721: { severity: 'low',      label: 'Haze' },
  731: { severity: 'medium',   label: 'Dust/Sand' },
  741: { severity: 'medium',   label: 'Fog' },
  751: { severity: 'high',     label: 'Sand' },
  761: { severity: 'high',     label: 'Dust' },
  762: { severity: 'critical', label: 'Volcanic Ash' },
  771: { severity: 'high',     label: 'Squalls' },
  781: { severity: 'critical', label: 'Tornado' },
};

// Get current weather and convert to alert if dangerous
exports.getWeatherAlert = async (lat, lng) => {
  const { data } = await axios.get(`${BASE_URL}/weather`, {
    params: { lat, lon: lng, appid: API_KEY, units: 'metric' },
  });

  const code     = data.weather[0].id;
  const danger   = DANGER_MAP[code];

  const weather = {
    city:        data.name,
    country:     data.sys.country,
    temp:        data.main.temp,
    feels_like:  data.main.feels_like,
    humidity:    data.main.humidity,
    wind_speed:  data.wind.speed,
    description: data.weather[0].description,
    icon:        data.weather[0].icon,
    code,
    lat:         data.coord.lat,
    lng:         data.coord.lon,
  };

  if (!danger) return { weather, alert: null };

  return {
    weather,
    alert: {
      title:    `${danger.label} Alert`,
      message:  `${danger.label} detected in ${data.name}. Temp: ${data.main.temp}°C, Wind: ${data.wind.speed} m/s, Humidity: ${data.main.humidity}%`,
      severity: danger.severity,
      source:   'OpenWeatherMap',
      lat:      data.coord.lat,
      lng:      data.coord.lon,
    },
  };
};

// Get 5-day forecast
exports.getForecast = async (lat, lng) => {
  const { data } = await axios.get(`${BASE_URL}/forecast`, {
    params: { lat, lon: lng, appid: API_KEY, units: 'metric', cnt: 40 },
  });

  // Group by day and pick the worst condition
  const days = {};
  data.list.forEach(item => {
    const date = item.dt_txt.split(' ')[0];
    if (!days[date]) days[date] = [];
    days[date].push({
      time:        item.dt_txt,
      temp:        item.main.temp,
      temp_min:    item.main.temp_min,
      temp_max:    item.main.temp_max,
      humidity:    item.main.humidity,
      wind_speed:  item.wind.speed,
      description: item.weather[0].description,
      icon:        item.weather[0].icon,
      code:        item.weather[0].id,
    });
  });

  return Object.entries(days).slice(0, 5).map(([date, items]) => ({
    date,
    temp_min:    Math.min(...items.map(i => i.temp_min)),
    temp_max:    Math.max(...items.map(i => i.temp_max)),
    humidity:    Math.round(items.reduce((a, b) => a + b.humidity, 0) / items.length),
    wind_speed:  Math.max(...items.map(i => i.wind_speed)),
    description: items[Math.floor(items.length / 2)].description,
    icon:        items[Math.floor(items.length / 2)].icon,
    isDangerous: items.some(i => DANGER_MAP[i.code]),
  }));
};