// Image service for fetching relevant images based on event type and keywords

interface EventImageCache {
  [key: string]: string;
}

const imageCache: EventImageCache = {};

// Keyword mapping for event types to relevant search terms
const eventKeywords: Record<string, string[]> = {
  custody: ['family', 'parenting', 'home', 'together'],
  holiday: ['vacation', 'travel', 'beach', 'mountain', 'holiday'],
  activity: ['play', 'fun', 'kids', 'children playing', 'activities'],
  travel: ['road trip', 'journey', 'adventure', 'exploring'],
  medical: ['doctor', 'hospital', 'health', 'medical'],
  school: ['education', 'school', 'learning', 'classroom'],
  sports: ['sports', 'game', 'competition', 'athlete'],
  birthday: ['birthday', 'party', 'celebration', 'cake'],
  default: ['family', 'lifestyle', 'together']
};

/**
 * Extract keywords from event title for image search
 */
function extractKeywords(title: string, type: string): string[] {
  const lowerTitle = title.toLowerCase();
  const keywords: string[] = [];

  // Add type-based keywords
  if (eventKeywords[type]) {
    keywords.push(...eventKeywords[type]);
  }

  // Extract words from title (filter common words)
  const commonWords = ['the', 'a', 'an', 'with', 'for', 'at', 'in', 'on', 'and', 'or'];
  const titleWords = lowerTitle
    .split(/[\s,.-]+/)
    .filter(word => word.length > 2 && !commonWords.includes(word))
    .slice(0, 3);

  keywords.push(...titleWords);

  return keywords.length > 0 ? keywords : ['family'];
}

/**
 * Generate a consistent image URL based on event title and type
 * Using Lorem Picsum and cached fallbacks
 */
export function getEventImageUrl(title: string, type: string, eventId: number | string): string {
  const cacheKey = `${eventId}-${title}`;

  // Return cached image if available
  if (imageCache[cacheKey]) {
    return imageCache[cacheKey];
  }

  const keywords = extractKeywords(title, type);

  // Create a hash from the title to get a consistent image
  let hash = 0;
  const str = title + type + eventId.toString();
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }

  // Use positive hash and add variety based on event type
  const imageId = Math.abs(hash) + 1000;

  // Use picsum.photos with seed for consistent images per event
  // Adding keyword-based category selection
  const categoryMap: Record<string, number> = {
    custody: 0,
    holiday: 1000,
    activity: 2000,
    travel: 3000,
    medical: 4000,
    school: 5000,
    sports: 6000,
    birthday: 7000,
    oslo: 8000,
    default: 0
  };

  const categoryOffset = categoryMap[type] || categoryMap.default;
  const finalImageId = (imageId + categoryOffset) % 1000;

  // Use Lorem Picsum with seed for consistent images
  const imageUrl = `https://picsum.photos/id/${finalImageId}/800/600`;

  imageCache[cacheKey] = imageUrl;
  return imageUrl;
}

/**
 * Alternative: Use Pexels API for more relevant images
 * Requires API key: https://www.pexels.com/api/
 */
export async function getPexelImageUrl(query: string, perPage: number = 1): Promise<string | null> {
  // This requires a Pexels API key
  // Sign up at: https://www.pexels.com/api/new/
  const API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

  if (!API_KEY) {
    console.warn('Pexels API key not found, falling back to Unsplash');
    return null;
  }

  try {
    const response = await fetch(
      `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
      {
        headers: {
          Authorization: API_KEY
        }
      }
    );

    const data = await response.json();
    if (data.photos && data.photos.length > 0) {
      return data.photos[0].src.large;
    }
  } catch (error) {
    console.error('Error fetching from Pexels:', error);
  }

  return null;
}

/**
 * Get relevant image for event using multiple services
 */
export async function getRelevantEventImage(
  title: string,
  type: string,
  eventId: number | string
): Promise<string> {
  const keywords = extractKeywords(title, type);
  const primaryKeyword = keywords.join(', ');

  // Try Pexels first (higher quality, more relevant)
  const pexelImage = await getPexelImageUrl(primaryKeyword);
  if (pexelImage) {
    imageCache[`${eventId}-${title}`] = pexelImage;
    return pexelImage;
  }

  // Fallback to Unsplash
  return getEventImageUrl(title, type, eventId);
}

// Predefined high-quality images for common event types as fallback
const fallbackImages: Record<string, string> = {
  custody: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800',
  holiday: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
  activity: 'https://images.unsplash.com/photo-1596464716127-f2a82984de30?w=800',
  travel: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=800',
  medical: 'https://images.unsplash.com/photo-1516574187841-cb9cc2ca948b?w=800',
  school: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800',
  sports: 'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=800',
  birthday: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=800',
  default: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800'
};

/**
 * Get fallback image for event type
 */
export function getFallbackImage(type: string): string {
  return fallbackImages[type] || fallbackImages.default;
}
