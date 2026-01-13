
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, YouTubeVideo, TrendAnalysis } from './types';
import Layout from './components/Layout';
import { fetchTrendingVideos, searchVideosByKeyword } from './services/youtubeService';
import { analyzeYouTubeTrends } from './services/geminiService';
import AnalysisView from './components/AnalysisView';

const App: React.FC = () => {
  // 기본 기간 설정: 최근 30일
  const getFormattedDate = (date: Date) => date.toISOString().split('T')[0];
  
  const defaultStartDate = new Date();
  defaultStartDate.setDate(defaultStartDate.getDate() - 30);
  
  const [state, setState] = useState<AppState>({
    videos: [],
    isLoading: false,
    error: null,
    youtubeApiKey: localStorage.getItem('yt_api_key') || '',
    analysis: null,
    isAnalyzing: false,
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
    if (!apiSearchTerm.trim()) {
      loadData(state.youtubeApiKey);
      return;
    }
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

  const setQuickRange = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setState(p => ({
      ...p,
      startDate: getFormattedDate(start),
      endDate: getFormattedDate(end)
    }));
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
          case 'lvRatio':
            valA = parseInt(a.statistics.likeCount || '0') / (parseInt(a.statistics.viewCount) || 1);
            valB = parseInt(b.statistics.likeCount || '0') / (parseInt(b.statistics.viewCount) || 1);
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
    const totalViews = state.videos.reduce((sum, v) => sum + parseInt(v.statistics.viewCount), 0);
    const totalLikes = state.videos.reduce((sum, v) => sum + parseInt(v.statistics.likeCount || '0'), 0);
    const totalComments = state.videos.reduce((sum, v) => sum + parseInt(v.statistics.commentCount || '0'), 0);
    
    return {
      totalViews: (totalViews / 10000).toFixed(1) + '만',
      totalLikes: (totalLikes / 10000).toFixed(1) + '만',
      totalComments: (totalComments / 10000).toFixed(1) + '만',
      excellentCount: state.videos.filter(v => v.performanceGrade === 'excellent').length,
      goodCount: state.videos.filter(v => v.performanceGrade === 'good').length,
      needsImprovementCount: state.videos.filter(v => v.performanceGrade === 'needs-improvement').length,
    };
  }, [state.videos]);

  const runAnalysis = async () => {
    if (state.videos.length === 0) return;
    setState(p => ({ ...p, isAnalyzing: true }));
    try {
      const analysis = await analyzeYouTubeTrends(state.videos);
      setState(p => ({ ...p, analysis, isAnalyzing: false }));
      setActiveTab('analysis');
    } catch (err: any) {
      setState(p => ({ ...p, error: err.message, isAnalyzing: false }));
    }
  };

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

  const getVSPercent = (video: YouTubeVideo) => {
    const views = parseInt(video.statistics.viewCount);
    const subs = parseInt(video.channelStats?.subscriberCount || '0');
    if (subs === 0) return '0.00x';
    return (views / subs).toFixed(2) + 'x';
  };

  const getLVPercent = (video: YouTubeVideo) => {
    const views = parseInt(video.statistics.viewCount);
    const likes = parseInt(video.statistics.likeCount || '0');
    if (views === 0) return '0.0%';
    return ((likes / views) * 100).toFixed(1) + '%';
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
      ) : activeTab === 'analysis' && state.analysis ? (
        <AnalysisView analysis={state.analysis} />
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

              <button 
                onClick={runAnalysis}
                disabled={state.isAnalyzing || state.videos.length === 0}
                className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all disabled:bg-gray-300 flex items-center gap-2"
              >
                {state.isAnalyzing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                AI 트렌드 분석 생성
              </button>
            </div>
            
            <form onSubmit={handleKeywordSearch} className="flex flex-col gap-6 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
              <div className="flex flex-col xl:flex-row gap-6 items-end">
                <div className="flex-1 w-full space-y-2">
                  <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    유튜브 검색 키워드
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      placeholder="분석할 키워드를 입력하세요 (예: 캠핑, 재테크, 아이폰)" 
                      className="w-full px-5 py-4 border border-gray-200 rounded-2xl text-base outline-none focus:ring-4 focus:ring-red-500/5 focus:border-red-500/30 transition-all bg-white font-semibold shadow-sm text-gray-900 placeholder:text-gray-400"
                      value={apiSearchTerm}
                      onChange={(e) => setApiSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="w-full xl:w-auto space-y-2">
                  <div className="flex items-center justify-between ml-1">
                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2v12a2 2 0 002 2z" /></svg>
                      분석 기간 설정
                    </label>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => setQuickRange(7)} className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-500 hover:border-red-500 hover:text-red-500 transition-all">7D</button>
                      <button type="button" onClick={() => setQuickRange(30)} className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-500 hover:border-red-500 hover:text-red-500 transition-all">30D</button>
                      <button type="button" onClick={() => setQuickRange(90)} className="text-[10px] font-black px-2 py-0.5 rounded-md bg-white border border-gray-200 text-gray-500 hover:border-red-500 hover:text-red-500 transition-all">90D</button>
                    </div>
                  </div>
                  <div className="flex gap-3 bg-white border border-gray-200 rounded-2xl p-1.5 shadow-sm items-center">
                    <div className="relative flex items-center">
                       <input 
                        type="date" 
                        className="px-4 py-2.5 text-sm font-bold text-gray-900 outline-none rounded-xl hover:bg-gray-50 transition-colors cursor-pointer appearance-none bg-transparent"
                        style={{ colorScheme: 'light' }}
                        value={state.startDate}
                        onChange={(e) => setState(p => ({ ...p, startDate: e.target.value }))}
                      />
                    </div>
                    <div className="flex items-center text-gray-400 font-black px-1">~</div>
                    <div className="relative flex items-center">
                      <input 
                        type="date" 
                        className="px-4 py-2.5 text-sm font-bold text-gray-900 outline-none rounded-xl hover:bg-gray-50 transition-colors cursor-pointer appearance-none bg-transparent"
                        style={{ colorScheme: 'light' }}
                        value={state.endDate}
                        onChange={(e) => setState(p => ({ ...p, endDate: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={state.isLoading}
                  className="w-full xl:w-auto bg-red-600 text-white px-12 py-4 rounded-2xl text-base font-black hover:bg-red-700 transition-all shadow-xl shadow-red-200 disabled:bg-gray-400 flex items-center justify-center gap-2 h-[64px]"
                >
                  {state.isLoading ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                  )}
                  분석 및 데이터 추출
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
                    <th className="p-5 font-bold text-center">링크</th>
                    <SortableHeader label="업로드 날짜" sortKey="publishedAt" currentSort={state.sortConfig} onSort={handleSort} />
                    <SortableHeader label="구독자 수" sortKey="subscribers" currentSort={state.sortConfig} onSort={handleSort} textAlign="right" />
                    <SortableHeader label="조회수" sortKey="views" currentSort={state.sortConfig} onSort={handleSort} textAlign="right" />
                    <SortableHeader label="구독자 대비 조회수" sortKey="vsRatio" currentSort={state.sortConfig} onSort={handleSort} textAlign="center" />
                    <SortableHeader label="조회수 대비 좋아요" sortKey="lvRatio" currentSort={state.sortConfig} onSort={handleSort} textAlign="center" />
                    <th className="p-5 font-bold text-center">성과등급</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {state.isLoading ? (
                    [...Array(5)].map((_, i) => (
                      <tr key={i} className="animate-pulse">
                        <td colSpan={9} className="p-16 text-center">
                          <div className="flex flex-col items-center gap-4">
                             <div className="w-12 h-12 border-4 border-red-100 border-t-red-600 rounded-full animate-spin"></div>
                             <span className="text-gray-400 font-bold">대용량 유튜브 데이터를 정밀 스캔 중입니다...</span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : sortedAndFilteredVideos.length === 0 ? (
                    <tr><td colSpan={9} className="p-32 text-center">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                         <svg className="w-12 h-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 9.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                         <p className="font-bold">검색 결과가 없습니다. 키워드나 날짜 범위를 조정해 보세요.</p>
                      </div>
                    </td></tr>
                  ) : (
                    sortedAndFilteredVideos.map(video => (
                      <tr key={video.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="p-5">
                          <div className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 group-hover:shadow-xl cursor-pointer transition-all" onClick={() => setPlayingVideoId(video.id)}>
                            <img src={video.snippet.thumbnails.medium.url} className="w-full h-full object-cover" alt="" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border border-white/30"><svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></div>
                            </div>
                          </div>
                        </td>
                        <td className="p-5">
                          <div className="font-black text-gray-900 line-clamp-1 mb-1 group-hover:text-red-600 transition-colors">{video.snippet.channelTitle}</div>
                          <div className="text-xs text-gray-400 font-semibold line-clamp-2 leading-relaxed">{video.snippet.title}</div>
                        </td>
                        <td className="p-5 text-center">
                          <a href={`https://youtu.be/${video.id}`} target="_blank" rel="noreferrer" className="w-10 h-10 inline-flex items-center justify-center rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-all border border-gray-100">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                        </td>
                        <td className="p-5 text-gray-600 font-bold whitespace-nowrap">{new Date(video.snippet.publishedAt).toLocaleDateString('ko-KR').replace(/ /g, '')}</td>
                        <td className="p-5 text-gray-900 font-black text-right whitespace-nowrap">{formatCount(video.channelStats?.subscriberCount)}명</td>
                        <td className="p-5 text-gray-900 font-black text-right whitespace-nowrap">{formatCount(video.statistics.viewCount)}회</td>
                        <td className="p-5 text-center text-gray-900 font-black tracking-tight">{getVSPercent(video)}</td>
                        <td className="p-5 text-center text-gray-900 font-black tracking-tight">{getLVPercent(video)}</td>
                        <td className="p-5 text-center"><PerformanceBadge grade={video.performanceGrade} /></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard label="분석 조회수 총합" value={stats.totalViews} icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>} color="text-red-500" bgColor="bg-red-50" />
            <MetricCard label="반응 지수 (좋아요)" value={stats.totalLikes} icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" /></svg>} color="text-green-500" bgColor="bg-green-50" />
            <MetricCard label="커뮤니티 소통" value={stats.totalComments} icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" /></svg>} color="text-blue-500" bgColor="bg-blue-50" />
            <MetricCard label="우수 성과 비율" value={`${Math.round((stats.excellentCount / (state.videos.length || 1)) * 100)}%`} icon={<svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" /></svg>} color="text-purple-500" bgColor="bg-purple-50" />
          </div>
        </div>
      )}
    </Layout>
  );
};

const SortableHeader: React.FC<{ 
  label: string; 
  sortKey: string; 
  currentSort: AppState['sortConfig']; 
  onSort: (key: string) => void;
  textAlign?: 'left' | 'center' | 'right';
}> = ({ label, sortKey, currentSort, onSort, textAlign = 'left' }) => {
  const isActive = currentSort?.key === sortKey;
  const alignmentClass = textAlign === 'right' ? 'justify-end' : textAlign === 'center' ? 'justify-center' : 'justify-start';

  return (
    <th 
      className={`p-5 font-bold cursor-pointer hover:bg-gray-100/50 transition-colors group select-none whitespace-nowrap text-${textAlign}`}
      onClick={() => onSort(sortKey)}
    >
      <div className={`flex items-center gap-1.5 ${alignmentClass}`}>
        {label}
        <div className={`flex flex-col text-[10px] leading-[0.6] transition-all ${isActive ? 'opacity-100 scale-110' : 'opacity-0 group-hover:opacity-40 scale-100'}`}>
          <span className={`${isActive && currentSort?.direction === 'asc' ? 'text-red-600' : 'text-gray-300'}`}>▲</span>
          <span className={`${isActive && currentSort?.direction === 'desc' ? 'text-red-600' : 'text-gray-300'}`}>▼</span>
        </div>
      </div>
    </th>
  );
};

const PerformanceBadge = ({ grade }: { grade?: string }) => {
  const configs = {
    excellent: { label: '우수', color: 'bg-[#e6fcf5] text-[#0ca678]', border: 'border-[#c3fae8]' },
    good: { label: '양호', color: 'bg-[#fff9db] text-[#f08c00]', border: 'border-[#fff3bf]' },
    'needs-improvement': { label: '개선필요', color: 'bg-[#fff5f5] text-[#fa5252]', border: 'border-[#ffc9c9]' }
  };
  const config = configs[grade as keyof typeof configs] || configs['needs-improvement'];
  return (
    <span className={`px-4 py-1.5 rounded-full text-[11px] font-black border uppercase tracking-wider ${config.border} ${config.color} shadow-sm`}>
      {config.label}
    </span>
  );
};

const MetricCard: React.FC<{ label: string; value: string; icon: React.ReactNode; color: string; bgColor: string }> = ({ label, value, icon, color, bgColor }) => (
  <div className="bg-white p-7 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-5 transition-all hover:shadow-xl hover:-translate-y-1">
    <div className={`w-14 h-14 ${bgColor} ${color} rounded-2xl flex items-center justify-center shadow-inner`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 mb-1 tracking-tight uppercase">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
    </div>
  </div>
);

export default App;
