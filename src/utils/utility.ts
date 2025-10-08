//utility function to format stock name
export const formatStockName = (name: string | undefined): string => {
    if (!name) return '';

    const nameWithSpaces = name.replace(/-/g, ' ');

    return nameWithSpaces.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export const formatLargeNumber = (num: number, decimals = 0): string => {
    // Values under 1,000: show with specified decimals (trim trailing zeros)
    if (Math.abs(num) < 1000) {
      const s = num.toFixed(decimals);
      // Trim unnecessary zeros
      return s.includes('.')
        ? s.replace(/\.?0+$/, '')
        : s;
    }
  
    // Large numbers with suffixes, always show 2 decimal places for readability
    const formatWithSuffix = (value: number, suffix: string) =>
      `${Number(value.toFixed(2))}${suffix}`;
  
    if (num >= 1e12) {
      return formatWithSuffix(num / 1e12, 'T');
    }
    if (num >= 1e9) {
      return formatWithSuffix(num / 1e9, 'B');
    }
    if (num >= 1e6) {
      return formatWithSuffix(num / 1e6, 'M');
    }
    if (num >= 1e3) {
      return formatWithSuffix(num / 1e3, 'K');
    }
  
    // Fallback, though covered by first branch
    return num.toFixed(decimals).replace(/\.?0+$/, '');
  };
  
  

/** Format large numbers → K / M / B / T  */
export const formatMagnitude = (n: number): string => {
    const abs = Math.abs(n);
    if (abs >= 1e12) return (n / 1e12).toFixed(2) + 'T';
    if (abs >= 1e9)  return (n / 1e9 ).toFixed(2) + 'B';
    if (abs >= 1e6)  return (n / 1e6 ).toFixed(2) + 'M';
    if (abs >= 1e3)  return (n / 1e3 ).toFixed(2) + 'K';
    return n.toFixed(2);
  };
  
  /** Decide tick label formatter for the x-axis */
//   const chooseTimeFormatter = (dates: Date[]) => {
//     const years = new Set(dates.map(d => d.getFullYear()));
//     return years.size === 1
//       ? d3.timeFormat('%b')          // show month if all in same year
//       : d3.timeFormat('%Y');         // otherwise show year
//   };
  