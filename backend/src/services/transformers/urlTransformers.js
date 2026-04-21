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

export const transformUrl = (url, folder) => {
    if (!url) return null;
    const normalized = url.replace(/\\/g, '/');
    const filename = normalized.split('/').pop();
    return `${folder}/${filename}`;
};

/**
 * Transform all company-related image URLs to standardized paths.
 * Handles logo, banner, images array, and CEO profile picture.
 * @param {Object} company - Company object from database
 * @param {string} [company.logo] - Original logo path
 * @param {string} [company.banner] - Original banner path
 * @param {string[]} [company.images] - Array of original image paths
 * @param {Object} [company.ceo] - CEO object
 * @param {string} [company.ceo.image] - Original CEO profile picture path
 * @returns {Object|null} Company object with normalized image URLs, or null if input is invalid
 */
export const transformCompanyData = (company) => {
    if (!company) return null;

    if (company.logo) {
        company.logo = transformUrl(company.logo, 'company_logos');
    }

    if (company.banner) {
        company.banner = transformUrl(company.banner, 'company_banners');
    }

    if (company.images && company.images.length > 0) {
        company.images = company.images.map((img) =>
            transformUrl(img, 'company_images')
        );
    }

    if (company.ceo?.image) {
        company.ceo.image = transformUrl(company.ceo.image, 'ceo_profile_pictures');
    }

    return company;
};