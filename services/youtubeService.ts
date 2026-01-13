
import { YouTubeVideo } from '../types';

const BASE_URL = 'https://www.googleapis.com/youtube/v3';

/**
 * 공통 로직: 비디오 ID 리스트를 받아 상세 정보와 채널 정보를 통합합니다.
 */
const enrichVideoData = async (apiKey: string, videoItems: any[]): Promise<YouTubeVideo[]> => {
  if (videoItems.length === 0) return [];
  
  const videoIds = videoItems.map(item => typeof item.id === 'string' ? item.id : item.id.videoId).join(',');
  
  // 1. 비디오 상세 통계 가져오기
  const statsResponse = await fetch(
    `${BASE_URL}/videos?part=snippet,statistics&id=${videoIds}&key=${apiKey}`
  );
  if (!statsResponse.ok) throw new Error('비디오 상세 정보를 가져오지 못했습니다.');
  const statsData = await statsResponse.json();
  const videos: YouTubeVideo[] = statsData.items;

  // 2. 채널 구독자 수 가져오기
  const channelIds = Array.from(new Set(videos.map(v => v.snippet.channelId))).join(',');
  const channelResponse = await fetch(
    `${BASE_URL}/channels?part=statistics&id=${channelIds}&key=${apiKey}`
  );

  if (channelResponse.ok) {
    const channelData = await channelResponse.json();
    const channelMap: Record<string, string> = {};
    channelData.items.forEach((item: any) => {
      channelMap[item.id] = item.statistics.subscriberCount;
    });

    // 3. 성과 등급 계산 및 데이터 병합
    return videos.map(video => {
      const subCount = channelMap[video.snippet.channelId] || '0';
      const views = parseInt(video.statistics.viewCount);
      const subs = parseInt(subCount);
      
      const ratio = subs > 0 ? (views / subs) : 0;
      let grade: any = 'needs-improvement';
      
      // 성과 등급 기준: 구독자 대비 조회수 비율
      if (ratio > 0.15) grade = 'excellent'; // 매우 우수
      else if (ratio > 0.05) grade = 'good';  // 양호
      
      return {
        ...video,
        channelStats: { subscriberCount: subCount },
        performanceGrade: grade
      };
    });
  }

  return videos;
};

export const fetchTrendingVideos = async (apiKey: string, regionCode: string = 'KR'): Promise<YouTubeVideo[]> => {
  if (!apiKey) throw new Error('YouTube API Key is required');
  const response = await fetch(
    `${BASE_URL}/videos?part=id&chart=mostPopular&regionCode=${regionCode}&maxResults=25&key=${apiKey}`
  );
  if (!response.ok) throw new Error('인기 영상을 불러오지 못했습니다.');
  const data = await response.json();
  return enrichVideoData(apiKey, data.items);
};

export const searchVideosByKeyword = async (
  apiKey: string, 
  query: string, 
  startDate?: string, 
  endDate?: string
): Promise<YouTubeVideo[]> => {
  if (!apiKey) throw new Error('YouTube API Key is required');
  
  let url = `${BASE_URL}/search?part=id&q=${encodeURIComponent(query)}&type=video&maxResults=25&key=${apiKey}`;
  
  // RFC 3339 format (YYYY-MM-DDTHH:mm:ssZ)
  if (startDate) {
    url += `&publishedAfter=${new Date(startDate).toISOString()}`;
  }
  if (endDate) {
    const end = new Date(endDate);
    end.setHours(23, 59, 59);
    url += `&publishedBefore=${end.toISOString()}`;
  }

  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || '유튜브 검색에 실패했습니다.');
  }
  const data = await response.json();
  return enrichVideoData(apiKey, data.items);
};

export const getCategoryName = (categoryId: string): string => {
  const categories: Record<string, string> = {
    '1': '영화/애니메이션', '2': '자동차', '10': '음악', '15': '반려동물',
    '17': '스포츠', '19': '여행', '20': '게임', '22': '인물/블로그',
    '23': '코미디', '24': '엔터테인먼트', '25': '뉴스/정치',
    '26': '노하우/스타일', '27': '교육', '28': '과학기술',
  };
  return categories[categoryId] || '기타';
};
