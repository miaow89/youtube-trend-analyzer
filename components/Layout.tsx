
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  return (
    <div className="flex h-screen overflow-hidden bg-[#f8f9fa]">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white border-r border-gray-200 hidden md:flex flex-col">
        <div className="p-8">
          <div className="flex items-center gap-2 text-red-600 font-black text-2xl tracking-tighter">
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-200">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 4-8 4z"/>
              </svg>
            </div>
            <span>TrendPulse</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem 
            label="트렌드 대시보드" 
            isActive={activeTab === 'trending'} 
            onClick={() => setActiveTab('trending')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>}
          />
          <NavItem 
            label="환경 설정" 
            isActive={activeTab === 'settings'} 
            onClick={() => setActiveTab('settings')}
            icon={<svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
          />
        </nav>

        <div className="p-4 border-t">
          <div className="bg-gray-50 rounded-xl p-4 text-xs font-bold text-gray-500 border border-dashed border-gray-300">
             &copy; 2026 TrendPulse Pro<br/>YouTube Data Analytics
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
          <h1 className="text-xl font-black text-gray-800 tracking-tight">
             {activeTab === 'trending' ? '성과 분석 대시보드' : '시스템 설정'}
          </h1>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-black text-gray-600">LIVE DATA ACTIVE</span>
             </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

const NavItem: React.FC<{ label: string; isActive: boolean; onClick: () => void; icon: React.ReactNode }> = ({ label, isActive, onClick, icon }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
      isActive ? 'bg-red-50 text-red-600 shadow-sm border border-red-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`}
  >
    <div className={`${isActive ? 'text-red-600' : 'text-gray-400'}`}>
      {icon}
    </div>
    <span className="font-bold text-sm tracking-tight">{label}</span>
  </button>
);

export default Layout;
