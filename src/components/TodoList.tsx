import React, { useState, useMemo } from 'react';
import { Todo, Category } from '../types';
import { TodoItem } from './TodoItem';
import { Search, Filter, ArrowUpDown, CheckCircle, Trash2 } from 'lucide-react';

interface TodoListProps {
  todos: Todo[];
  onToggleTodo: (id: string) => void;
  onDeleteTodo: (id: string) => void;
  onUpdateTodo: (id: string, updates: Partial<Todo>) => void;
  onClearCompleted: () => void;
}

export const TodoList: React.FC<TodoListProps> = ({
  todos,
  onToggleTodo,
  onDeleteTodo,
  onUpdateTodo,
  onClearCompleted,
}) => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority' | 'created'>('dueDate');

  const filteredAndSortedTodos = useMemo(() => {
    return todos
      .filter((todo) => {
        // Search filter
        if (search.trim() && !todo.title.toLowerCase().includes(search.toLowerCase())) {
          return false;
        }
        // Status filter
        if (statusFilter === 'active' && todo.completed) return false;
        if (statusFilter === 'completed' && !todo.completed) return false;
        // Category filter
        if (categoryFilter !== 'all' && todo.category !== categoryFilter) return false;

        return true;
      })
      .sort((a, b) => {
        // 항상 완료된 항목은 아래로 보내기
        if (a.completed !== b.completed) {
          return a.completed ? 1 : -1;
        }

        if (sortBy === 'priority') {
          const priorityWeight = { high: 3, medium: 2, low: 1 };
          return priorityWeight[b.priority] - priorityWeight[a.priority];
        }

        if (sortBy === 'dueDate') {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.localeCompare(b.dueDate);
        }

        // created
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [todos, search, statusFilter, categoryFilter, sortBy]);

  const completedCount = todos.filter((t) => t.completed).length;
  const categories: (Category | 'all')[] = ['all', '일상', '업무', '공부', '건강', '기타'];

  return (
    <div className="space-y-4">
      {/* Controls: Search & Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm space-y-3">
        {/* Search bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="할 일 검색..."
            className="w-full bg-slate-50 pl-9 pr-4 py-2 rounded-xl text-xs sm:text-sm text-slate-700 outline-none border border-slate-200 focus:border-indigo-400 focus:bg-white transition-all"
          />
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          {/* Status Tabs */}
          <div className="flex bg-slate-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              전체 ({todos.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'active'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              진행 중 ({todos.filter((t) => !t.completed).length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                statusFilter === 'completed'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              완료됨 ({completedCount})
            </button>
          </div>

          {/* Category & Sort controls */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-slate-600">
              <Filter className="w-3 h-3 text-slate-400" />
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent outline-none cursor-pointer"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'all' ? '전체 카테고리' : c}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200 text-slate-600">
              <ArrowUpDown className="w-3 h-3 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent outline-none cursor-pointer"
              >
                <option value="dueDate">마감일순</option>
                <option value="priority">우선순위순</option>
                <option value="created">최신 등록순</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Todo Items List */}
      <div className="space-y-2">
        {filteredAndSortedTodos.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-2 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-700">해당하는 할 일이 없습니다</p>
            <p className="text-xs text-slate-400">
              위의 입력창이나 우측 AI 챗봇에게 말해서 새 할 일을 등록해보세요!
            </p>
          </div>
        ) : (
          filteredAndSortedTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={onToggleTodo}
              onDelete={onDeleteTodo}
              onUpdate={onUpdateTodo}
            />
          ))
        )}
      </div>

      {/* Clear Completed Action */}
      {completedCount > 0 && (
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={onClearCompleted}
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-rose-600 transition-colors px-3 py-1.5 rounded-lg hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            완료된 항목 ({completedCount}개) 모두 정리하기
          </button>
        </div>
      )}
    </div>
  );
};

