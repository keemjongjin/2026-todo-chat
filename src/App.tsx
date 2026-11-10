import React, { useState, useEffect } from 'react';
import { toLocalDateString } from './utils/date';
import { Todo, ChatMessage } from './types';
import { Navbar } from './components/Navbar';
import { StatsBar } from './components/StatsBar';
import { TodoForm } from './components/TodoForm';
import { TodoList } from './components/TodoList';
import { ChatPanel } from './components/ChatPanel';
import { SettingsModal } from './components/SettingsModal';
import { parseUserInput } from './services/nlpParser';
import { callGeminiApi } from './services/geminiService';

const INITIAL_TODOS: Todo[] = [
  {
    id: 'demo-1',
    title: '팀 주간 스프린트 회의 준비',
    completed: false,
    category: '업무',
    priority: 'high',
    dueDate: toLocalDateString(),
    dueTime: '15:00',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: '퇴근 후 러닝 5km & 스트레칭',
    completed: false,
    category: '건강',
    priority: 'medium',
    dueDate: toLocalDateString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    title: 'TypeScript & React 디자인 패턴 독서',
    completed: true,
    category: '공부',
    priority: 'low',
    dueDate: toLocalDateString(),
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: 'msg-welcome',
    sender: 'bot',
    content: `안녕하세요! 당신의 똑똑한 투두 & 생산성 비서입니다. 🤖✨\n\n말씀만 해주시면 할 일을 등록하고, 완료하고, 남은 일정을 정리해 드려요!\n\n예시:\n• "내일 오후 2시 디자인 리뷰 추가해줘"\n• "오늘 할 일 알려줘"\n• "운동 완료했어"\n• "코딩 공부 계획 세워줘"`,
    timestamp: new Date().toISOString(),
    suggestions: ['오늘 할 일 브리핑해줘', '내일 오후 2시 회의 추가', '다이어트 계획 세워줘'],
  },
];

export const App: React.FC = () => {
  // 1. Todos State
  const [todos, setTodos] = useState<Todo[]>(() => {
    const saved = localStorage.getItem('ai_todos_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved todos', e);
      }
    }
    return INITIAL_TODOS;
  });

  // 2. Chat Messages State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('ai_chat_messages_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved messages', e);
      }
    }
    return INITIAL_MESSAGES;
  });

  // 3. API Key & Settings
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem('gemini_api_key') || '';
  });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 4. Mobile View Mode
  const [activeView, setActiveView] = useState<'todos' | 'chat' | 'split'>('todos');

  // Sync to LocalStorage
  useEffect(() => {
    localStorage.setItem('ai_todos_v1', JSON.stringify(todos));
  }, [todos]);

  useEffect(() => {
    localStorage.setItem('ai_chat_messages_v1', JSON.stringify(messages));
  }, [messages]);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    if (key) {
      localStorage.setItem('gemini_api_key', key);
    } else {
      localStorage.removeItem('gemini_api_key');
    }
  };

  // Todo Operations
  const handleAddTodo = (newTodo: Omit<Todo, 'id' | 'createdAt'>) => {
    const item: Todo = {
      ...newTodo,
      id: 'todo-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
    };
    setTodos((prev) => [item, ...prev]);
  };

  const handleToggleTodo = (id: string) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTodo = (id: string) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
  };

  const handleUpdateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
    );
  };

  const handleClearCompleted = () => {
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  const handleBatchAddTodos = (suggested: Partial<Todo>[], notify = true) => {
    const newItems: Todo[] = suggested.map((s, idx) => ({
      id: 'todo-' + Date.now() + '-' + idx,
      title: s.title || '새 할 일',
      category: s.category || '일상',
      priority: s.priority || 'medium',
      dueDate: s.dueDate || toLocalDateString(),
      dueTime: s.dueTime,
      completed: false,
      createdAt: new Date().toISOString(),
    }));

    setTodos((prev) => [...newItems, ...prev]);
    if (!notify) return;

    // 봇 피드백 메시지
    const confirmMsg: ChatMessage = {
      id: 'bot-' + Date.now(),
      sender: 'bot',
      content: `🎉 제안된 ${newItems.length}개의 할 일을 목록에 모두 추가했습니다! 하나씩 차근차근 달성해 보세요.`,
      timestamp: new Date().toISOString(),
      suggestions: ['오늘 할 일 브리핑해줘', '남은 일 뭐야?'],
    };
    setMessages((prev) => [...prev, confirmMsg]);
  };

  // Chatbot Send Message Handler
  const handleSendMessage = async (text: string) => {
    const userMsg: ChatMessage = {
      id: 'user-' + Date.now(),
      sender: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      let botResponseContent = '';
      let actionType = 'NONE';
      let suggestedTodos: Partial<Todo>[] | undefined;
      let suggestions: string[] | undefined;

      // Gemini API가 설정되어 있다면 API 호출 시도
      if (apiKey) {
        try {
          const geminiRes = await callGeminiApi(apiKey, text, todos);
          botResponseContent = geminiRes.message;
          actionType = geminiRes.action.type;
          suggestedTodos = geminiRes.action.suggestedTodos;
          suggestions = geminiRes.suggestions;

          // 액션 수행
          if (geminiRes.action.type === 'ADD_TODO' && suggestedTodos) {
            handleBatchAddTodos(suggestedTodos, false);
          } else if (geminiRes.action.type === 'COMPLETE_TODO' && geminiRes.action.affectedTodoIds) {
            setTodos((prev) =>
              prev.map((t) =>
                geminiRes.action.affectedTodoIds?.includes(t.id)
                  ? { ...t, completed: true }
                  : t
              )
            );
          } else if (geminiRes.action.type === 'DELETE_TODO' && geminiRes.action.affectedTodoIds) {
            setTodos((prev) =>
              prev.filter((t) => !geminiRes.action.affectedTodoIds?.includes(t.id))
            );
          } else if (geminiRes.action.type === 'CLEAR_COMPLETED') {
            handleClearCompleted();
          }
        } catch (apiError: any) {
          console.warn('Gemini API fallback to local parser:', apiError);
          // API 실패 시 내장 로컬 엔진으로 fallback
          const localRes = parseUserInput(text, todos);
          botResponseContent = localRes.message;
          actionType = localRes.action.type;
          suggestedTodos = localRes.action.suggestedTodos;
          suggestions = localRes.suggestions;
          executeLocalAction(localRes);
        }
      } else {
        // 로컬 NLP 파서 사용
        const localRes = parseUserInput(text, todos);
        botResponseContent = localRes.message;
        actionType = localRes.action.type;
        suggestedTodos = localRes.action.suggestedTodos;
        suggestions = localRes.suggestions;
        executeLocalAction(localRes);
      }

      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'bot',
        content: botResponseContent,
        timestamp: new Date().toISOString(),
        actionTaken: {
          type: actionType as any,
          suggestedTodos,
        },
        suggestions,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      const errMsg: ChatMessage = {
        id: 'bot-err-' + Date.now(),
        sender: 'bot',
        content: '죄송합니다. 메시지를 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const executeLocalAction = (res: ReturnType<typeof parseUserInput>) => {
    if (res.action.type === 'ADD_TODO' && res.action.suggestedTodos) {
      const first = res.action.suggestedTodos[0];
      if (first) {
        handleAddTodo({
          title: first.title || '새 할 일',
          category: first.category || '기타',
          priority: first.priority || 'medium',
          dueDate: first.dueDate,
          dueTime: first.dueTime,
          completed: false,
        });
      }
    } else if (res.action.type === 'COMPLETE_TODO' && res.action.affectedTodos) {
      const ids = res.action.affectedTodos.map((t) => t.id);
      setTodos((prev) =>
        prev.map((t) => (ids.includes(t.id) ? { ...t, completed: true } : t))
      );
    } else if (res.action.type === 'DELETE_TODO' && res.action.affectedTodos) {
      const ids = res.action.affectedTodos.map((t) => t.id);
      setTodos((prev) => prev.filter((t) => !ids.includes(t.id)));
    } else if (res.action.type === 'CLEAR_COMPLETED') {
      handleClearCompleted();
    }
  };

  const handleClearHistory = () => {
    setMessages(INITIAL_MESSAGES);
  };

  const completedRate =
    todos.length === 0
      ? 0
      : Math.round((todos.filter((t) => t.completed).length / todos.length) * 100);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans">
      <Navbar
        hasApiKey={Boolean(apiKey)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        activeView={activeView}
        setActiveView={setActiveView}
        completedRate={completedRate}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          {/* Left: Todo Management Section (7 cols on desktop) */}
          <div
            className={`lg:col-span-7 space-y-6 ${
              activeView === 'chat' ? 'hidden lg:block' : 'block'
            }`}
          >
            <StatsBar todos={todos} />
            <TodoForm onAddTodo={handleAddTodo} />
            <TodoList
              todos={todos}
              onToggleTodo={handleToggleTodo}
              onDeleteTodo={handleDeleteTodo}
              onUpdateTodo={handleUpdateTodo}
              onClearCompleted={handleClearCompleted}
            />
          </div>

          {/* Right: AI Chatbot Assistant Section (5 cols on desktop) */}
          <div
            className={`lg:col-span-5 ${
              activeView === 'todos' ? 'hidden lg:block' : 'block'
            } h-[calc(100vh-8.5rem)] sticky top-20`}
          >
            <ChatPanel
              messages={messages}
              onSendMessage={handleSendMessage}
              onBatchAddTodos={handleBatchAddTodos}
              isLoading={isLoading}
              hasApiKey={Boolean(apiKey)}
              onClearHistory={handleClearHistory}
            />
          </div>
        </div>
      </main>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
      />
    </div>
  );
};

export default App;

