import { useMemo } from "react";

export function useClimateMetrics(activeYear: number) {
  return useMemo(() => {
    const progress = (activeYear - 2026) / (2050 - 2026); // 0 to 1

    // BAU path data bounds
    const bauTemp = (0.2 + progress * 2.6).toFixed(1);
    const bauAqi = Math.round(55 + progress * 165);
    const bauForest = Math.round(31 - progress * 10);
    const bauSea = Math.round(progress * 28);

    // Eco path data bounds
    const ecoTemp = (0.2 + progress * 0.8).toFixed(1);
    const ecoAqi = Math.round(55 - progress * 15);
    const ecoForest = Math.round(31 + progress * 8);
    const ecoSea = Math.round(progress * 8);

    return {
      progress,
      bau: {
        temp: parseFloat(bauTemp),
        aqi: bauAqi,
        forest: bauForest,
        seaLevel: bauSea,
        tempPercent: Math.min(100, Math.max(10, (parseFloat(bauTemp) / 3.5) * 100)),
        aqiPercent: Math.min(100, (bauAqi / 300) * 100),
        forestCount: Math.round((bauForest / 40) * 8),
        seaPercent: Math.min(95, Math.max(15, (bauSea / 35) * 100)),
        narration: `Under Business-As-Usual (BAU), high emissions drive temperatures up by +${bauTemp}°C. Smog increases local AQI to ${bauAqi} (poor), causing deforestation to drop to ${bauForest}% and pushing sea levels up by +${bauSea}cm.`
      },
      eco: {
        temp: parseFloat(ecoTemp),
        aqi: ecoAqi,
        forest: ecoForest,
        seaLevel: ecoSea,
        tempPercent: Math.min(100, Math.max(10, (parseFloat(ecoTemp) / 3.5) * 100)),
        aqiPercent: Math.min(100, (ecoAqi / 300) * 100),
        forestCount: Math.round((ecoForest / 40) * 8),
        seaPercent: Math.min(95, Math.max(15, (ecoSea / 35) * 100)),
        narration: `With global offset logs, warming is capped at +${ecoTemp}°C. AQI clears to ${ecoAqi} (excellent), regional forests grow to ${ecoForest}%, and sea rise is limited to +${ecoSea}cm.`
      }
    };
  }, [activeYear]);
}
