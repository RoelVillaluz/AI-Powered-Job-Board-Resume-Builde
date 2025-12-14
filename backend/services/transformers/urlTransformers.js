/**
 * Transform Windows-style path to web-friendly URL
 * @param {string} path - File path with backslashes
 * @returns {string} Normalized path with forward slashes
 */

const normalizePath = (path) => {
    return path?.replace(/\\/g, '/') || '';
};

/**
 * Extract filename from path
 * @param {string} path - Full file path
 * @returns {string} Just the filename
 */

const getFileName = (path) => {
    return path?.split('/').pop() || '';
}

/**
 * Transform profile picture URL
 * @param {string|null} url - Original profile picture URL
 * @returns {string} Transformed URL or default
 */

export const transformProfilePictureUrl = (url) => {
    if (!url) {
        return 'profile_pictures/default.jpg';
    }
    
    const normalized = normalizePath(url);
    const filename = getFileName(normalized);
    
    return `profile_pictures/${filename}`;
};

/**
 * Transform attachment URL
 * @param {Object|string|null} attachment - Attachment object or string
 * @returns {Object|string|null} Transformed attachment
 */

export const transformAttachmentUrl = (attachment) => {
    if (!attachment) return null;

    // Handle object with url property
    if (typeof attachment === 'object' && attachment.url) {
        const normalized = normalizePath(attachment.url);
        const filename = getFileName(normalized);
        
        return {
            ...attachment,
            url: `message_attachments/${filename}`
        };
    }

    // Handle string
    if (typeof attachment === 'string') {
        const normalized = normalizePath(attachment);
        const filename = getFileName(normalized);
        
        return `message_attachments/${filename}`;
    }

    return null;
}