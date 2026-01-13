
import React from 'react';
import { TrendAnalysis } from '../types';

interface AnalysisViewProps {
  analysis: TrendAnalysis;
}

const AnalysisView: React.FC<AnalysisViewProps> = ({ analysis }) => {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Summary Hero */}
      <section className="bg-gradient-to-br from-red-900/30 to-zinc-950 p-8 rounded-3xl border border-red-500/20 shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 -right-10">
           <svg className="w-48 h-48 text-red-500/5 rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
        </div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3">
            <span className="bg-red-600 w-2.5 h-10 rounded-full"></span>
            AI 트렌드 요약 리포트
          </h2>
          <p className="text-zinc-200 leading-relaxed text-xl max-w-4xl font-medium italic">
            "{analysis.summary}"
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Key Themes */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
            <svg className="w-6 h-6 text-yellow-500" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
            핵심 콘텐츠 테마
          </h3>
          <div className="grid gap-4">
            {analysis.keyThemes.map((theme, i) => (
              <div key={i} className="bg-zinc-900/60 border border-white/5 p-6 rounded-2xl hover:bg-zinc-800/80 transition-all group">
                <h4 className="font-black text-red-500 mb-2 uppercase tracking-tight text-sm group-hover:text-red-400 transition-colors">
                  {theme.theme}
                </h4>
                <p className="text-zinc-400 text-sm leading-relaxed font-medium">{theme.explanation}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Audience & Prediction */}
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 005.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              시청자 심리 및 행동 분석
            </h3>
            <div className="bg-zinc-900/60 border border-white/5 p-6 rounded-2xl">
              <p className="text-zinc-400 text-sm leading-relaxed font-medium">{analysis.audienceInsights}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xl font-bold flex items-center gap-2 text-zinc-100">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              향후 트렌드 예측 (The Next Wave)
            </h3>
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-white/5 p-6 rounded-2xl shadow-xl">
              <p className="text-zinc-300 text-sm leading-relaxed font-semibold italic">"{analysis.prediction}"</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisView;
