
import React from 'react';
import { YouTubeVideo } from '../types';
import { getCategoryName } from '../services/youtubeService';

interface VideoCardProps {
  video: YouTubeVideo;
  onPlay: (videoId: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onPlay }) => {
  const formatCount = (count: string) => {
    const num = parseInt(count);
    if (num >= 100000000) return (num / 100000000).toFixed(1) + '억회';
    if (num >= 10000) return (num / 10000).toFixed(1) + '만회';
    if (num >= 1000) return (num / 1000).toFixed(1) + '천회';
    return num.toString() + '회';
  };

  return (
    <div 
      onClick={() => onPlay(video.id)}
      className="group bg-zinc-900/50 rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-all hover:scale-[1.02] cursor-pointer"
    >
      <div className="relative aspect-video overflow-hidden">
        <img 
          src={video.snippet.thumbnails.high.url} 
          alt={video.snippet.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
           <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center shadow-xl shadow-red-900/40">
              <svg className="w-6 h-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
           </div>
        </div>
        <div className="absolute bottom-2 right-2 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-bold text-white">
          재생하기
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center text-xs font-bold text-zinc-400 overflow-hidden border border-white/5">
            {video.snippet.channelTitle.charAt(0)}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm line-clamp-2 leading-tight mb-1 group-hover:text-red-500 transition-colors text-zinc-100">
              {video.snippet.title}
            </h3>
            <p className="text-xs text-zinc-400 truncate hover:text-zinc-200 transition-colors">{video.snippet.channelTitle}</p>
            <div className="flex items-center gap-2 mt-2 text-[11px] text-zinc-500">
              <span>조회수 {formatCount(video.statistics.viewCount)}</span>
              <span>•</span>
              <span className="bg-zinc-800 px-2 py-0.5 rounded text-zinc-400 font-medium">
                {getCategoryName(video.snippet.categoryId)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
