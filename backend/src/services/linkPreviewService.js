// services/chat/linkPreviewService.js
import { getLinkPreview } from 'link-preview-js';
import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

export const extractUrlFromMessage = (content) => {
    if (!content) return null;
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const matches = content.match(urlRegex);
    return matches ? matches[0] : null;
};

/**
 * Check if preview data is valid (not an error page)
 */
const isValidPreview = (data) => {
    // Check for common error indicators
    const errorIndicators = ['error', 'not found', '404', 'access denied', 'forbidden'];
    const titleLower = (data.title || '').toLowerCase();
    
    if (errorIndicators.some(indicator => titleLower.includes(indicator))) {
        return false;
    }
    
    // Must have at least title or description
    if (!data.title && !data.description) {
        return false;
    }
    
    return true;
};

/**
 * Generate fallback preview from URL
 */
const getSocialMediaInfo = (url) => {
    const urlLower = url.toLowerCase();
    
    if (urlLower.includes('facebook.com')) {
        return {
            siteName: 'Facebook',
            favicon: 'https://static.facebook.com/favicon.ico',
            placeholder: 'Facebook Post'
        };
    }
    if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) {
        return {
            siteName: 'Twitter',
            favicon: 'https://abs.twimg.com/favicons/twitter.ico',
            placeholder: 'Twitter Post'
        };
    }
    if (urlLower.includes('instagram.com')) {
        return {
            siteName: 'Instagram',
            favicon: 'https://www.instagram.com/static/images/ico/favicon.ico/36b3ee2d91ed.ico',
            placeholder: 'Instagram Post'
        };
    }
    if (urlLower.includes('linkedin.com')) {
        return {
            siteName: 'LinkedIn',
            favicon: 'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
            placeholder: 'LinkedIn Post'
        };
    }
    
    return null;
};

// Use in generateFallbackPreview:
const generateFallbackPreview = (url) => {
    try {
        const urlObj = new URL(url);
        const domain = urlObj.hostname.replace('www.', '');
        
        // Check for social media
        const socialInfo = getSocialMediaInfo(url);
        if (socialInfo) {
            return {
                url: url,
                title: socialInfo.placeholder,
                description: `View this content on ${socialInfo.siteName}`,
                image: `https://via.placeholder.com/400x200/1877F2/ffffff?text=${encodeURIComponent(socialInfo.siteName)}`,
                siteName: socialInfo.siteName,
                favicon: socialInfo.favicon
            };
        }
        
        // ... rest of your code
    } catch (error) {
        return null;
    }
};

/**
 * Enhanced manual scraper
 */
const manualScrape = async (url) => {
    try {
        console.log('🔧 Starting manual scrape for:', url);
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            },
            timeout: 8000
        });

        if (!response.ok) {
            console.warn(`⚠️ HTTP ${response.status} for ${url}`);
            return null;
        }

        const html = await response.text();
        const $ = cheerio.load(html);

        // Try MULTIPLE sources for image
        const image = 
            $('meta[property="og:image"]').attr('content') ||
            $('meta[property="og:image:url"]').attr('content') ||
            $('meta[property="og:image:secure_url"]').attr('content') ||
            $('meta[name="twitter:image"]').attr('content') ||
            $('meta[name="twitter:image:src"]').attr('content') ||
            $('meta[itemprop="image"]').attr('content') ||
            null;

        // Try MULTIPLE sources for description
        const description = 
            $('meta[property="og:description"]').attr('content') ||
            $('meta[name="twitter:description"]').attr('content') ||
            $('meta[name="description"]').attr('content') ||
            $('meta[itemprop="description"]').attr('content') ||
            null;

        // Try MULTIPLE sources for title
        const title =
            $('meta[property="og:title"]').attr('content') || 
            $('meta[name="twitter:title"]').attr('content') ||
            $('meta[itemprop="name"]').attr('content') ||
            $('title').text().trim() ||
            null;

        // Get favicon
        let favicon = 
            $('link[rel="icon"]').attr('href') ||
            $('link[rel="shortcut icon"]').attr('href') ||
            $('link[rel="apple-touch-icon"]').attr('href') ||
            null;

        // Make favicon absolute URL if relative
        if (favicon && !favicon.startsWith('http')) {
            const urlObj = new URL(url);
            favicon = favicon.startsWith('/') 
                ? `${urlObj.protocol}//${urlObj.host}${favicon}`
                : `${urlObj.protocol}//${urlObj.host}/${favicon}`;
        }

        // Get site name
        const siteName = 
            $('meta[property="og:site_name"]').attr('content') ||
            new URL(url).hostname.replace('www.', '') ||
            null;

        const result = {
            url: url,
            title: title,
            description: description ? description.substring(0, 300) : null,
            image: image,
            siteName: siteName,
            favicon: favicon || `https://www.google.com/s2/favicons?domain=${url}&sz=64`
        };

        console.log('✅ Manual scrape result:', result);
        return result;
        
    } catch (error) {
        console.error('❌ Manual scrape failed:', error.message);
        return null;
    }
};

/**
 * Main fetch function with fallback strategy
 */
export const fetchLinkPreview = async (url) => {
    console.log('🌐 Fetching preview for:', url);
    
    let result = null;

    // Strategy 1: Try link-preview-js
    try {
        const preview = await getLinkPreview(url, {
            timeout: 8000,
            followRedirects: 'follow',
            headers: {
                'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        console.log('📋 link-preview-js raw result:', preview);

        result = {
            url: preview.url || url,
            title: preview.title || null,
            description: preview.description || null,
            image: preview.images && preview.images.length > 0 ? preview.images[0] : null,
            siteName: preview.siteName || null,
            favicon: preview.favicons && preview.favicons.length > 0 ? preview.favicons[0] : null
        };

        // Check if result is valid (not an error page)
        if (!isValidPreview(result)) {
            console.warn('⚠️ link-preview-js returned invalid/error data');
            result = null;
        } else {
            console.log('✅ Valid data from link-preview-js');
        }
    } catch (error) {
        console.error('❌ link-preview-js failed:', error.message);
    }

    // Strategy 2: If link-preview-js failed or returned invalid data, try manual scrape
    if (!result || !isValidPreview(result)) {
        console.log('🔄 Trying manual scrape...');
        const manualResult = await manualScrape(url);
        
        if (manualResult && isValidPreview(manualResult)) {
            result = manualResult;
        }
    }

    // Strategy 3: If both failed, generate fallback
    if (!result || !isValidPreview(result)) {
        console.log('⚠️ All methods failed, generating fallback');
        result = generateFallbackPreview(url);
    }

    // Ensure we have at least basic data
    if (result) {
        const domain = new URL(url).hostname.replace('www.', '');
        
        result.title = result.title || domain;
        result.description = result.description || `Content from ${domain}`;
        result.siteName = result.siteName || domain;
        result.favicon = result.favicon || `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
        
        // If still no image, use placeholder
        if (!result.image) {
            result.image = `https://via.placeholder.com/400x200/4F46E5/ffffff?text=${encodeURIComponent(domain)}`;
        }
    }

    console.log('📦 Final preview data:', result);
    return result;
};
