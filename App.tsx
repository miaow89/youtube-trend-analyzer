
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, YouTubeVideo } from './types';
import Layout from './components/Layout';
import { fetchTrendingVideos, searchVideosByKeyword } from './services/youtubeService';

const SortableHeader: React.FC<{
  label: string;
  sortKey: string;
  currentSort: { key: string; direction: 'asc' | 'desc' } | null;
  onSort: (key: string) => void;
  textAlign?: 'left' | 'center' | 'right';
}> = ({ label, sortKey, currentSort, onSort, textAlign = 'left' }) => {
  const isActive = currentSort?.key === sortKey;
  return (
    <th 
      className={`p-5 font-bold cursor-pointer hover:bg-gray-100 transition-colors text-${textAlign}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1 ${textAlign === 'center' ? 'justify-center' : textAlign === 'right' ? 'justify-end' : ''}`}>
        {label}
        <span className="text-[10px] text-gray-300">
          {isActive ? (currentSort.direction === 'asc' ? '▲' : '▼') : '↕'}
        </span>
      </div>
    </th>
  );
};

const App: React.FC = () => {
  const getFormattedDate = (date: Date) => date.toISOString().split('T')[0];
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 30);
  
  const [state, setState] = useState<AppState>({
    videos: [],
    isLoading: false,
    error: null,
    youtubeApiKey: localStorage.getItem('yt_api_key') || '',
    filter: 'all',
    searchQuery: '',
    sortConfig: { key: 'publishedAt', direction: 'desc' },
    startDate: getFormattedDate(defaultStartDate),
    endDate: getFormattedDate(new Date()),
  });

  const [apiSearchTerm, setApiSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState(localStorage.getItem('yt_api_key') ? 'trending' : 'settings');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  const loadData = useCallback(async (key: string, query?: string, start?: string, end?: string) => {
    if (!key) return;
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const videos = query 
        ? await searchVideosByKeyword(key, query, start, end)
        : await fetchTrendingVideos(key);
      setState(prev => ({ ...prev, videos, isLoading: false }));
    } catch (err: any) {
      setState(prev => ({ ...prev, error: err.message, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    if (state.youtubeApiKey && state.videos.length === 0) {
      loadData(state.youtubeApiKey);
    }
  }, [state.youtubeApiKey, loadData, state.videos.length]);

  const handleKeywordSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    loadData(state.youtubeApiKey, apiSearchTerm, state.startDate, state.endDate);
  };

  const handleSort = (key: string) => {
    setState(prev => {
      let direction: 'asc' | 'desc' = 'desc';
      if (prev.sortConfig && prev.sortConfig.key === key && prev.sortConfig.direction === 'desc') {
        direction = 'asc';
      }
      return { ...prev, sortConfig: { key, direction } };
    });
  };

  const sortedAndFilteredVideos = useMemo(() => {
    let result = [...state.videos].filter(video => {
      const matchesSearch = 
        video.snippet.title.toLowerCase().includes(state.searchQuery.toLowerCase()) || 
        video.snippet.channelTitle.toLowerCase().includes(state.searchQuery.toLowerCase());
      const matchesFilter = state.filter === 'all' || video.performanceGrade === state.filter;
      return matchesSearch && matchesFilter;
    });

    if (state.sortConfig) {
      const { key, direction } = state.sortConfig;
      result.sort((a, b) => {
        let valA: any;
        let valB: any;
        switch (key) {
          case 'publishedAt':
            valA = new Date(a.snippet.publishedAt).getTime();
            valB = new Date(b.snippet.publishedAt).getTime();
            break;
          case 'subscribers':
            valA = parseInt(a.channelStats?.subscriberCount || '0');
            valB = parseInt(b.channelStats?.subscriberCount || '0');
            break;
          case 'views':
            valA = parseInt(a.statistics.viewCount || '0');
            valB = parseInt(b.statistics.viewCount || '0');
            break;
          case 'vsRatio':
            valA = parseInt(a.statistics.viewCount) / (parseInt(a.channelStats?.subscriberCount || '1'));
            valB = parseInt(b.statistics.viewCount) / (parseInt(b.channelStats?.subscriberCount || '1'));
            break;
          default:
            return 0;
        }
        if (valA < valB) return direction === 'asc' ? -1 : 1;
        if (valA > valB) return direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [state.videos, state.searchQuery, state.filter, state.sortConfig]);

  const stats = useMemo(() => {
    return {
      excellentCount: state.videos.filter(v => v.performanceGrade === 'excellent').length,
      goodCount: state.videos.filter(v => v.performanceGrade === 'good').length,
      needsImprovementCount: state.videos.filter(v => v.performanceGrade === 'needs-improvement').length,
    };
  }, [state.videos]);

  const handleSaveApiKey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const key = (formData.get('apiKey') as string || '').trim();
    localStorage.setItem('yt_api_key', key);
    setState(prev => ({ ...prev, youtubeApiKey: key, error: null }));
    setActiveTab('trending');
    await loadData(key);
  };

  const formatCount = (count: string | undefined) => {
    if (!count) return '0';
    const num = parseInt(count);
    if (num >= 10000) return (num / 10000).toFixed(1) + '만';
    if (num >= 1000) return (num / 1000).toFixed(1) + '천';
    return num.toString();
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {playingVideoId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
           <div className="relative w-full max-w-4xl aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl">
              <button onClick={() => setPlayingVideoId(null)} className="absolute top-4 right-4 z-10 text-white bg-black/40 hover:bg-red-600 p-2 rounded-full transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <iframe src={`https://www.youtube.com/embed/${playingVideoId}?autoplay=1`} className="w-full h-full" allowFullScreen></iframe>
           </div>
        </div>
      )}

      {activeTab === 'settings' ? (
        <div className="max-w-xl mx-auto py-20 bg-white p-10 rounded-3xl shadow-sm border">
          <h2 className="text-2xl font-bold mb-6">시스템 초기 설정</h2>
          <form onSubmit={handleSaveApiKey} className="space-y-4">
            <label className="block text-sm font-bold text-gray-700">YouTube Data API Key</label>
            <input name="apiKey" type="password" className="w-full p-4 border rounded-xl focus:ring-2 focus:ring-red-500 outline-none" placeholder="API Key 입력" required />
            <button type="submit" className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 transition-all">설정 완료</button>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {state.error && (
            <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl font-bold text-sm">
              에러 발생: {state.error}
            </div>
          )}
          
          <div className="bg-white p-6 rounded-2xl shadow-sm border flex flex-col space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-sm font-bold text-gray-500 mr-2">성과 등급 필터:</span>
                <button onClick={() => setState(p => ({ ...p, filter: 'all' }))} className={`px-5 py-2 rounded-xl text-sm font-bold border transition-all ${state.filter === 'all' ? 'bg-gray-100 border-gray-300 text-gray-800' : 'bg-white border-transparent text-gray-400 hover:bg-gray-50'}`}>전체 ({state.videos.length})</button>
                <button onClick={() => setState(p => ({ ...p, filter: 'excellent' }))} className={`px-5 py-2 rounded-xl text-sm font-bold border transition-all ${state.filter === 'excellent' ? 'bg-[#e6fcf5] border-[#c3fae8] text-[#0ca678]' : 'bg-white border-transparent text-gray-400 hover:bg-gray-50'}`}>우수 ({stats.excellentCount})</button>
                <button onClick={() => setState(p => ({ ...p, filter: 'good' }))} className={`px-5 py-2 rounded-xl text-sm font-bold border transition-all ${state.filter === 'good' ? 'bg-[#fff9db] border-[#fff3bf] text-[#f08c00]' : 'bg-white border-transparent text-gray-400 hover:bg-gray-50'}`}>양호 ({stats.goodCount})</button>
                <button onClick={() => setState(p => ({ ...p, filter: 'needs-improvement' }))} className={`px-5 py-2 rounded-xl text-sm font-bold border transition-all ${state.filter === 'needs-improvement' ? 'bg-[#fff5f5] border-[#ffc9c9] text-[#fa5252]' : 'bg-white border-transparent text-gray-400 hover:bg-gray-50'}`}>개선필요 ({stats.needsImprovementCount})</button>
              </div>
            </div>
            
            <form onSubmit={handleKeywordSearch} className="flex flex-col gap-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
              <div className="flex flex-col xl:flex-row gap-6 items-end">
                <div className="flex-1 w-full space-y-2">
                  <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    유튜브 검색 키워드
                  </label>
                  <input 
                    type="text" 
                    placeholder="분석할 키워드 입력" 
                    className="w-full px-5 py-4 border border-gray-200 rounded-2xl text-base outline-none focus:border-red-500/30 transition-all bg-white font-semibold shadow-sm text-gray-900"
                    value={apiSearchTerm}
                    onChange={(e) => setApiSearchTerm(e.target.value)}
                  />
                </div>
                
                <div className="w-full xl:w-auto space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest">분석 기간</label>
                  </div>
                  <div className="flex gap-3 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm items-center">
                    <input 
                      type="date" 
                      className="px-3 py-2 text-sm font-bold outline-none bg-white text-gray-900 rounded-lg hover:bg-gray-50 focus:bg-white transition-colors" 
                      value={state.startDate} 
                      onChange={(e) => setState(p => ({ ...p, startDate: e.target.value }))} 
                    />
                    <span className="text-gray-400 font-bold">~</span>
                    <input 
                      type="date" 
                      className="px-3 py-2 text-sm font-bold outline-none bg-white text-gray-900 rounded-lg hover:bg-gray-50 focus:bg-white transition-colors" 
                      value={state.endDate} 
                      onChange={(e) => setState(p => ({ ...p, endDate: e.target.value }))} 
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={state.isLoading}
                  className="bg-red-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-red-700 disabled:bg-gray-400 h-[64px] transition-all active:scale-95 shadow-lg shadow-red-200"
                >
                  데이터 추출
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#fcfcfc] text-gray-400 font-bold border-b border-gray-100">
                  <tr>
                    <th className="p-5 font-bold w-52">썸네일</th>
                    <th className="p-5 font-bold min-w-[280px]">채널 정보 및 제목</th>
                    <SortableHeader label="업로드 날짜" sortKey="publishedAt" currentSort={state.sortConfig} onSort={handleSort} />
                    <SortableHeader label="구독자" sortKey="subscribers" currentSort={state.sortConfig} onSort={handleSort} textAlign="right" />
                    <SortableHeader label="조회수" sortKey="views" currentSort={state.sortConfig} onSort={handleSort} textAlign="right" />
                    <SortableHeader label="조회/구독비" sortKey="vsRatio" currentSort={state.sortConfig} onSort={handleSort} textAlign="center" />
                    <th className="p-5 font-bold text-center">성과등급</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {state.isLoading ? (
                    <tr><td colSpan={7} className="p-16 text-center text-gray-400 font-bold animate-pulse">데이터를 불러오는 중입니다...</td></tr>
                  ) : sortedAndFilteredVideos.length === 0 ? (
                    <tr><td colSpan={7} className="p-16 text-center text-gray-400 font-bold">표시할 데이터가 없습니다.</td></tr>
                  ) : sortedAndFilteredVideos.map(video => (
                    <tr key={video.id} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="p-5">
                        <div className="relative aspect-video rounded-xl overflow-hidden cursor-pointer shadow-sm group-hover:shadow-md transition-shadow" onClick={() => setPlayingVideoId(video.id)}>
                          <img src={video.snippet.thumbnails.medium.url} className="w-full h-full object-cover" alt="" />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors" />
                        </div>
                      </td>
                      <td className="p-5">
                        <div className="font-black text-gray-900 line-clamp-1 group-hover:text-red-600 transition-colors">{video.snippet.channelTitle}</div>
                        <div className="text-xs text-gray-500 line-clamp-2 mt-1">{video.snippet.title}</div>
                      </td>
                      <td className="p-5 text-gray-500 font-medium">
                        {new Date(video.snippet.publishedAt).toLocaleDateString()}
                      </td>
                      <td className="p-5 text-right font-bold text-gray-700">
                        {formatCount(video.channelStats?.subscriberCount)}
                      </td>
                      <td className="p-5 text-right font-black text-gray-900">
                        {formatCount(video.statistics.viewCount)}
                      </td>
                      <td className="p-5 text-center font-bold text-red-600 bg-red-50/30">
                        {(parseInt(video.statistics.viewCount) / (parseInt(video.channelStats?.subscriberCount || '1'))).toFixed(2)}x
                      </td>
                      <td className="p-5 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                          video.performanceGrade === 'excellent' ? 'bg-green-100 text-green-700' :
                          video.performanceGrade === 'good' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {video.performanceGrade}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
