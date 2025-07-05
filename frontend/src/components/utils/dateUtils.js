export const formatDate = (time, mode = "long", getTimeDiff = false) => {
    const date = new Date(time);
    const currentYear = new Date().getFullYear();

    // Check if less than 24 hours ago
    const timeDiff = Math.abs(new Date() - date);
    const diffInHours = timeDiff / (1000 * 60 * 60);

    const options = {
        month: mode === "long" ? 'long' : 'short',
        day: 'numeric'
    };

    if (date.getFullYear() !== currentYear) {
        options.year = 'numeric';
    }

    if (mode === 'long') {
        options.hour = '2-digit';
        options.minute = '2-digit';
        options.hour12 = true;
    }

    if (getTimeDiff === true && diffInHours < 24) {
        return `${Math.floor(diffInHours)} hrs ago`;
    }

    return date.toLocaleDateString('en-US', options);
};