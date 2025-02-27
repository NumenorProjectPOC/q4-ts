//utility function to format stock name
const formatStockName = (name: string): string => {
    if (!name) return '';

    const nameWithSpaces = name.replace(/-/g, ' ');

    return nameWithSpaces.split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
};

export default formatStockName;