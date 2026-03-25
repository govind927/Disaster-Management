import { useState, useEffect } from 'react';
import api from '../api/axios';

export const useWeatherAlerts = () => {
  const [weather, setWeather]   = useState(null);
  const [alert, setAlert]       = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        const { latitude: lat, longitude: lng } = coords;
        try {
          const [alertRes, forecastRes] = await Promise.all([
            api.get(`/alerts/weather?lat=${lat}&lng=${lng}`),
            api.get(`/alerts/forecast?lat=${lat}&lng=${lng}`),
          ]);
          setWeather(alertRes.data.weather);
          setAlert(alertRes.data.alert);
          setForecast(forecastRes.data);
        } catch (err) {
          setError('Failed to load weather data');
        } finally {
          setLoading(false);
        }
      },
      () => {
        setError('Location access denied');
        setLoading(false);
      }
    );
  }, []);

  return { weather, alert, forecast, loading, error };
};