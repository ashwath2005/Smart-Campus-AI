import { useState, useEffect, useCallback } from 'react';
import { campusPulseApi } from '../services/campusPulseApi';

export function useCampusPulse() {
  const [pulseData, setPulseData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [locationData, setLocationData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [insightData, setInsightData] = useState(null);
  const [timeframe, setTimeframe] = useState('today');
  const [loading, setLoading] = useState(true);

  // Investigation Modal state
  const [investigatingBlock, setInvestigatingBlock] = useState(null);
  const [investigationPayload, setInvestigationPayload] = useState(null);

  const fetchAllMetrics = useCallback(async () => {
    try {
      const [pulse, history, locations, forecast, insights] = await Promise.all([
        campusPulseApi.getCurrentPulse(),
        campusPulseApi.getPulseHistory(timeframe),
        campusPulseApi.getPulseLocations(),
        campusPulseApi.getPulseForecast(),
        campusPulseApi.getPulseInsights()
      ]);

      setPulseData(pulse);
      setHistoryData(history);
      setLocationData(locations);
      setForecastData(forecast);
      setInsightData(insights);
    } catch (err) {
      console.error('Error fetching Campus Pulse data:', err);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchAllMetrics();
    // Auto-refresh pulse metrics every 30 seconds
    const interval = setInterval(fetchAllMetrics, 30000);
    return () => clearInterval(interval);
  }, [fetchAllMetrics]);

  const handleInvestigate = async (blockId) => {
    setInvestigatingBlock(blockId);
    try {
      const details = await campusPulseApi.investigateBlock(blockId);
      setInvestigationPayload(details);
    } catch (err) {
      console.error('Error fetching investigation payload:', err);
    }
  };

  const closeInvestigate = () => {
    setInvestigatingBlock(null);
    setInvestigationPayload(null);
  };

  return {
    pulseData,
    historyData,
    locationData,
    forecastData,
    insightData,
    timeframe,
    setTimeframe,
    loading,
    refreshPulse: fetchAllMetrics,
    investigatingBlock,
    investigationPayload,
    handleInvestigate,
    closeInvestigate
  };
}
