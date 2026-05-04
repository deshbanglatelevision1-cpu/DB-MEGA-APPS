export const YOUTUBE_API_KEY = "AIzaSyDhx5N7ccngR-jIk9-I38pZNq6SsuaiHsc";
const BASE_URL = "https://youtube.googleapis.com/youtube/v3";

export interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  publishedAt: string;
  description: string;
  viewCount?: string;
  isShort?: boolean;
}

export interface YouTubeResponse {
  videos: YouTubeVideo[];
  nextPageToken?: string;
  region?: string;
}

export async function searchVideos(query: string, pageToken?: string): Promise<YouTubeResponse> {
  try {
    const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
    const response = await fetch(
      `${BASE_URL}/search?part=snippet&maxResults=50&q=${encodeURIComponent(query)}&type=video&key=${YOUTUBE_API_KEY}${pageParam}`,
      { method: 'GET', mode: 'cors' }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube Search API Error:", errorData);
      return { videos: [] };
    }

    const data = await response.json();
    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description,
    }));

    return { videos, nextPageToken: data.nextPageToken };
  } catch (error) {
    console.error("Search fetch error:", error);
    return { videos: [] };
  }
}

export async function getTrendingVideos(pageToken?: string, regionCode?: string, categoryId?: string): Promise<YouTubeResponse> {
  try {
    const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
    const categoryParam = categoryId ? `&videoCategoryId=${categoryId}` : '';
    
    // Use provided region or pick a random one for initial load
    let region = regionCode;
    if (!pageToken && !regionCode) {
      const regions = ['BD', 'US', 'IN', 'GB', 'CA', 'AU', 'JP', 'KR', 'BR', 'FR', 'DE'];
      region = regions[Math.floor(Math.random() * regions.length)];
    } else if (!region) {
      region = 'BD'; // Fallback
    }

    const response = await fetch(
      `${BASE_URL}/videos?part=snippet,statistics&chart=mostPopular&maxResults=50&regionCode=${region}&key=${YOUTUBE_API_KEY}${pageParam}${categoryParam}`,
      { method: 'GET', mode: 'cors' }
    );

    if (!response.ok) {
      const errorData = await response.json();
      console.error("YouTube Trending API Error:", errorData);
      // If random region fails, try BD as fallback
      if (region !== 'BD' && !pageToken && !categoryId) {
        return getTrendingVideos(undefined, 'BD');
      }
      return { videos: [] };
    }

    const data = await response.json();
    const videos = data.items.map((item: any) => ({
      id: item.id,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description,
      viewCount: item.statistics.viewCount,
    }));

    return { videos, nextPageToken: data.nextPageToken, region };
  } catch (error) {
    console.error("Trending fetch error:", error);
    // Final fallback to BD on network error if it wasn't already BD
    if (regionCode !== 'BD' && !pageToken && !categoryId) {
      return getTrendingVideos(undefined, 'BD');
    }
    return { videos: [] };
  }
}

export async function getRelatedVideos(videoId: string, pageToken?: string): Promise<YouTubeResponse> {
  try {
    const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
    const response = await fetch(
      `${BASE_URL}/search?part=snippet&maxResults=25&relatedToVideoId=${videoId}&type=video&key=${YOUTUBE_API_KEY}${pageParam}`
    );
    const data = await response.json();

    if (data.error) {
      console.warn("Related videos API failed.");
      return { videos: [] };
    }

    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description,
    }));

    return { videos, nextPageToken: data.nextPageToken };
  } catch (error) {
    console.error("Related fetch error:", error);
    return { videos: [] };
  }
}

export async function getShorts(pageToken?: string): Promise<YouTubeResponse> {
  try {
    const pageParam = pageToken ? `&pageToken=${pageToken}` : '';
    
    // Heavy variety for shorts query
    const trendingTopics = [
      'trending', 'viral', 'popular', 'latest', 'new', 'daily', 'shorts'
    ];
    const nicheTopics = [
      'funny', 'gaming', 'music', 'dance', 'tech', 'cooking', 'travel', 
      'sports', 'art', 'nature', 'satisfying', 'diy', 'science', 
      'history', 'facts', 'adventure', 'magic', 'animals', 'asmr',
      'workout', 'motivation', 'lifehacks', 'comedy', 'billiards', 'football',
      'cricket', 'minecraft', 'roblox', 'space', 'oceans', 'gadgets'
    ];
    
    // Pick topics randomly with fallbacks
    const trendTopic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)] || 'shorts';
    const nicheTopic1 = nicheTopics[Math.floor(Math.random() * nicheTopics.length)] || 'trending';
    const nicheTopic2 = nicheTopics[Math.floor(Math.random() * nicheTopics.length)] || 'viral';
    
    // Construct query to maximize variety
    const query = pageToken 
      ? `%23shorts` 
      : `%23shorts ${trendTopic} ${nicheTopic1} ${nicheTopic2}`;

    const response = await fetch(
      `${BASE_URL}/search?part=snippet&maxResults=50&q=${encodeURIComponent(query)}&type=video&videoDuration=short&key=${YOUTUBE_API_KEY}${pageParam}`
    );
    const data = await response.json();

    if (data.error) {
      console.error("YouTube Shorts API Error:", data.error);
      return { videos: [] };
    }

    const videos = data.items.map((item: any) => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.high.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      description: item.snippet.description,
      isShort: true,
    }));

    // Shuffle results for extra variety on every load
    const shuffledVideos = videos.sort(() => Math.random() - 0.5);

    return { videos: shuffledVideos, nextPageToken: data.nextPageToken };
  } catch (error) {
    console.error("Shorts fetch error:", error);
    return { videos: [] };
  }
}

export async function getSearchSuggestions(query: string): Promise<string[]> {
  try {
    const response = await fetch(
      `/api/suggestions?q=${encodeURIComponent(query)}`
    );
    if (!response.ok) return [];
    const suggestions = await response.json();
    return suggestions;
  } catch (error) {
    console.error("Suggestions fetch error:", error);
    return [];
  }
}
