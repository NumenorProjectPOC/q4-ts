//utility function to format stock name
export const formatStockName = (name: string): string => {
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