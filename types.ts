
export interface YouTubeVideo {
  id: string;
  snippet: {
    publishedAt: string;
    channelId: string;
    title: string;
    description: string;
    thumbnails: {
      high: { url: string };
      medium: { url: string };
    };
    channelTitle: string;
    tags?: string[];
    categoryId: string;
  };
  statistics: {
    viewCount: string;
    likeCount: string;
    commentCount: string;
  };
  channelStats?: {
    subscriberCount: string;
  };
  performanceGrade?: 'excellent' | 'good' | 'needs-improvement';
}

export interface TrendAnalysis {
  summary: string;
  keyThemes: {
    theme: string;
    explanation: string;
  }[];
  audienceInsights: string;
  prediction: string;
}

export interface AppState {
  videos: YouTubeVideo[];
  isLoading: boolean;
  error: string | null;
  youtubeApiKey: string;
  analysis: TrendAnalysis | null;
  isAnalyzing: boolean;
  filter: 'all' | 'excellent' | 'good' | 'needs-improvement';
  searchQuery: string;
  sortConfig: {
    key: string;
    direction: 'asc' | 'desc';
  } | null;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}
