import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});

/**
 * Transform a destination image into a branded cinematic asset.
 * - Applies auto-quality, cinematic crop, and a warm gradient overlay
 * - Overlays the agency name in a stylized watermark
 * Returns the transformed URL (no upload needed — uses Cloudinary's fetch/transform API).
 */
export const generateBrandedItineraryImage = (imageUrl, agencyName, destination) => {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            console.warn('[Cloudinary] No cloud name configured. Returning original URL.');
            return imageUrl;
        }

        // Use Cloudinary's fetch API to transform an external image URL on-the-fly
        const encoded = encodeURIComponent(imageUrl);

        const transformedUrl = cloudinary.url(`fetch/${encoded}`, {
            transformation: [
                // Cinematic 16:9 crop focusing on the most interesting part
                { width: 1280, height: 720, crop: 'fill', gravity: 'auto', quality: 'auto:best', format: 'webp' },
                // Artistic color grading: warm golden hour effect
                { effect: 'art:incognito' },
                // Semi-transparent dark gradient overlay (bottom)
                { overlay: { color: '#1a1a2e', opacity: 40 }, width: 1280, height: 720, crop: 'fill' },
                // Agency watermark text in bottom-right corner
                {
                    overlay: {
                        font_family: 'Montserrat',
                        font_size: 28,
                        font_weight: 'bold',
                        text: agencyName || 'Triponic',
                    },
                    color: 'white',
                    gravity: 'south_east',
                    x: 30,
                    y: 25,
                    opacity: 80,
                },
            ],
            sign_url: false,
            type: 'fetch',
        });

        console.log(`[Cloudinary] Generated branded image for: ${destination}`);
        return transformedUrl;
    } catch (err) {
        console.error('[Cloudinary] Error generating branded image:', err.message);
        return imageUrl; // Fallback to original
    }
};

/**
 * Upload an image buffer to Cloudinary and return the URL.
 */
export const uploadToCloudinary = async (buffer, folder = 'triponic') => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { folder, resource_type: 'image', quality: 'auto', format: 'webp' },
            (error, result) => {
                if (error) reject(error);
                else resolve(result.secure_url);
            }
        );
        uploadStream.end(buffer);
    });
};
