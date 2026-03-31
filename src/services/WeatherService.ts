import type { GpsCoordinates, WeatherData, WeatherCondition } from '../types/drone';

const OWM_BASE = 'https://api.openweathermap.org/data/2.5/weather';

const CONDITION_MAP: Record<string, WeatherCondition> = {
  Clear: 'clear',
  Clouds: 'cloudy',
  Rain: 'rain',
  Drizzle: 'rain',
  Thunderstorm: 'storm',
  Snow: 'snow',
  Mist: 'fog',
  Fog: 'fog',
  Haze: 'fog',
};

function mapCondition(main: string): WeatherCondition {
  return CONDITION_MAP[main] ?? 'clear';
}

export function getBrightnessRecommendation(condition: WeatherCondition): number {
  switch (condition) {
    case 'clear': return 0.6;
    case 'cloudy': return 0.8;
    case 'overcast':
    case 'rain':
    case 'storm':
    case 'snow':
    case 'fog':
      return 1.0;
    default: return 1.0;
  }
}

export function getWarnings(weather: WeatherData): string[] {
  const warnings: string[] = [];
  if (weather.windSpeedMs > 10) warnings.push('HIGH WIND — drone stability risk');
  if (weather.condition === 'rain') warnings.push('RAIN — reduced visibility');
  if (weather.condition === 'storm') warnings.push('STORM — flight not recommended');
  if (weather.condition === 'snow') warnings.push('SNOW — reduced visibility');
  if (weather.condition === 'fog') warnings.push('FOG — reduced visibility');
  return warnings;
}

export async function fetchWeather(
  coords: GpsCoordinates,
  apiKey: string,
): Promise<WeatherData> {
  if (!apiKey || apiKey === 'demo') {
    return _demoWeather();
  }

  const url = `${OWM_BASE}?lat=${coords.latitude}&lon=${coords.longitude}&appid=${apiKey}&units=metric`;
  const resp = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!resp.ok) throw new Error(`Weather API error: ${resp.status}`);
  const data = await resp.json();

  const condition = mapCondition(data.weather?.[0]?.main ?? 'Clear');
  const weather: WeatherData = {
    condition,
    windSpeedMs: data.wind?.speed ?? 0,
    tempC: data.main?.temp ?? 0,
    humidity: data.main?.humidity ?? 0,
    description: data.weather?.[0]?.description ?? '',
    brightnessRecommendation: getBrightnessRecommendation(condition),
    warnings: [],
  };
  weather.warnings = getWarnings(weather);
  return weather;
}

function _demoWeather(): WeatherData {
  const conditions: WeatherCondition[] = ['clear', 'cloudy', 'overcast', 'rain'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  const weather: WeatherData = {
    condition,
    windSpeedMs: Math.round(Math.random() * 15 * 10) / 10,
    tempC: Math.round((15 + Math.random() * 20) * 10) / 10,
    humidity: Math.round(40 + Math.random() * 50),
    description: `demo ${condition} conditions`,
    brightnessRecommendation: getBrightnessRecommendation(condition),
    warnings: [],
  };
  weather.warnings = getWarnings(weather);
  return weather;
}
