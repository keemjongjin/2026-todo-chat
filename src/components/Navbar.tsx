import React from 'react';
import { CheckSquare, Sparkles, Settings, Bot } from 'lucide-react';

interface NavbarProps {
  hasApiKey: boolean;
  onOpenSettings: () => void;
  activeView: 'todos' | 'chat' | 'split';
  setActiveView: (view: 'todos' | 'chat' | 'split') => void;
  completedRate: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  hasApiKey,
  onOpenSettings,
  activeView,
  setActiveView,
  completedRate,
}) => {
  const today = new Date().toLocaleDateString('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
            <CheckSquare className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">TodoAI</span>
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                {hasApiKey ? 'Gemini AI 연동됨' : '스마트 어시스턴트'}
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">{today} · 오늘의 달성률 {completedRate}%</p>
          </div>
        </div>

        {/* View Switcher (Desktop & Mobile) */}
        <div className="flex items-center gap-2">
          {/* Mobile view toggle */}
          <div className="flex lg:hidden bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveView('todos')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeView === 'todos'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              할 일 목록
            </button>
            <button
              onClick={() => setActiveView('chat')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                activeView === 'chat'
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              AI 챗봇
            </button>
          </div>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors relative"
            title="AI 설정 및 API 키"
          >
            <Settings className="w-5 h-5" />
            {!hasApiKey && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-white"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};

