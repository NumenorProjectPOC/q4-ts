//utility function to format stock name
export const formatStockName = (name: string | undefined): string => {
    if (!name) return '';

    const nameWithSpaces = name.replace(/-/g, ' ');

    return nameWithSpaces.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

// utility function to format large numbers
export const formatLargeNumber = (num: number): string => {
    if (num >= 1e12) {
        const value = num / 1e12;
        return Number(value.toFixed(2)).toString() + 'T';
    }
    if (num >= 1e9) {
        const value = num / 1e9;
        return Number(value.toFixed(2)).toString() + 'B';
    }
    if (num >= 1e6) {
        const value = num / 1e6;
        return Number(value.toFixed(2)).toString() + 'M';
    }
    if (num >= 1e3) {
        const value = num / 1e3;
        return Number(value.toFixed(2)).toString() + 'K';
    }
    return num.toString();
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
  