import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage, Todo } from '../types';
import { Send, Bot, Sparkles, PlusCircle, Check, Loader2, RefreshCw } from 'lucide-react';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => Promise<void>;
  onBatchAddTodos: (todos: Partial<Todo>[]) => void;
  isLoading: boolean;
  hasApiKey: boolean;
  onClearHistory: () => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  onSendMessage,
  onBatchAddTodos,
  isLoading,
  hasApiKey,
  onClearHistory,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    const text = input.trim();
    setInput('');
    await onSendMessage(text);
  };

  const quickPrompts = [
    '📅 오늘 할 일 브리핑해줘',
    '✨ 다이어트 실천 계획 짜줘',
    '💻 코딩 공부 루틴 세워줘',
    '🧹 완료된 항목 정리해줘',
  ];

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      {/* Chat Header */}
      <div className="p-4 border-b border-slate-100 bg-gradient-to-r from-indigo-50/60 to-violet-50/60 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-800 flex items-center gap-1.5">
              AI Todo Assistant
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse" />
            </h3>
            <p className="text-[11px] text-slate-500">
              {hasApiKey ? 'Gemini 2.5 Flash 활성화' : '내장 자연어 엔진 작동 중'}
            </p>
          </div>
        </div>

        <button
          onClick={onClearHistory}
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          title="대화 내역 비우기"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.sender === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-indigo-600 text-white rounded-br-xs shadow-xs'
                  : 'bg-slate-100/80 text-slate-800 rounded-bl-xs border border-slate-200/60'
              }`}
            >
              {msg.content}

              {/* Suggested Plan Card if action is SUGGEST_PLAN */}
              {msg.actionTaken?.type === 'SUGGEST_PLAN' &&
                msg.actionTaken.suggestedTodos &&
                msg.actionTaken.suggestedTodos.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-2">
                    <p className="font-semibold text-xs text-indigo-700 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> 제안된 할 일 목록:
                    </p>
                    <ul className="space-y-1.5 text-xs text-slate-700">
                      {msg.actionTaken.suggestedTodos.map((plan, idx) => (
                        <li
                          key={idx}
                          className="flex items-center gap-1.5 bg-white p-2 rounded-lg border border-slate-200"
                        >
                          <span className="w-4 h-4 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-[10px]">
                            {idx + 1}
                          </span>
                          <span className="font-medium flex-1">{plan.title}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500">
                            {plan.category}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() =>
                        onBatchAddTodos(msg.actionTaken!.suggestedTodos!)
                      }
                      className="mt-2 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      위 항목 전체 할 일에 등록하기 ({msg.actionTaken.suggestedTodos.length}개)
                    </button>
                  </div>
                )}
            </div>

            {/* Suggestions buttons */}
            {msg.suggestions && msg.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {msg.suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(sug)}
                    className="text-[11px] bg-indigo-50/70 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/60 px-2.5 py-1 rounded-full transition-all cursor-pointer"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            )}

            <span className="text-[10px] text-slate-400 mt-1 px-1">
              {new Date(msg.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 text-slate-400 text-xs py-2">
            <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
            <span>AI 비서가 생각하고 있어요...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickPrompts.map((prompt, idx) => (
          <button
            key={idx}
            onClick={() => onSendMessage(prompt.slice(2).trim())}
            className="text-[11px] whitespace-nowrap bg-white text-slate-600 hover:text-indigo-600 hover:border-indigo-300 border border-slate-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer shadow-2xs"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 bg-white border-t border-slate-100 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="자연어로 지시해보세요 (예: 내일 회의 추가, 오늘 뭐 있어?)"
          disabled={isLoading}
          className="flex-1 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-indigo-400 focus:bg-white text-slate-800 transition-all disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all cursor-pointer shadow-xs shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};

