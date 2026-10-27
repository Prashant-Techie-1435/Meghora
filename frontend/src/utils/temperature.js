/**
 * Temperature conversion and formatting utility
 */
export const formatTemp = (tempInCelsius, unit = 'celsius') => {
  if (tempInCelsius === null || tempInCelsius === undefined) return '--';

  const num = Number(tempInCelsius);
  if (isNaN(num)) return '--';

  if (unit === 'fahrenheit') {
    const fahrenheit = (num * 9) / 5 + 32;
    return `${Math.round(fahrenheit)}°F`;
  }

  return `${Math.round(num)}°C`;
};

export const getTempUnitSymbol = (unit = 'celsius') => {
  return unit === 'fahrenheit' ? '°F' : '°C';
};
