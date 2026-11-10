import React, { useState } from 'react';
import { toLocalDateString } from '../utils/date';
import { Todo, Priority, Category } from '../types';
import { Plus, Calendar, Tag, AlertCircle } from 'lucide-react';

interface TodoFormProps {
  onAddTodo: (todo: Omit<Todo, 'id' | 'createdAt'>) => void;
}

export const TodoForm: React.FC<TodoFormProps> = ({ onAddTodo }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Category>('일상');
  const [priority, setPriority] = useState<Priority>('medium');
  const [dueDate, setDueDate] = useState<string>(() => toLocalDateString());
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onAddTodo({
      title: title.trim(),
      category,
      priority,
      dueDate: dueDate || undefined,
      completed: false,
    });

    setTitle('');
    setIsExpanded(false);
  };

  const categories: Category[] = ['일상', '업무', '공부', '건강', '기타'];

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-sm transition-all focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-400"
    >
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          placeholder="할 일을 입력하세요... (예: 오늘 오후 3시 팀 미팅)"
          className="flex-1 text-sm bg-transparent outline-none placeholder:text-slate-400 text-slate-800 font-medium"
        />
        <button
          type="submit"
          disabled={!title.trim()}
          className="inline-flex items-center justify-center p-2 rounded-xl bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-40 disabled:hover:bg-indigo-600 transition-all cursor-pointer shadow-sm shadow-indigo-200 shrink-0"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      {/* Expanded options */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-3 text-xs">
          {/* Category Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="bg-transparent outline-none text-slate-700 font-medium cursor-pointer"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Selector */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="bg-transparent outline-none text-slate-700 font-medium cursor-pointer"
            >
              <option value="low">우선순위: 낮음</option>
              <option value="medium">우선순위: 보통</option>
              <option value="high">우선순위: 높음 🔥</option>
            </select>
          </div>

          {/* Due Date Picker */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200/60">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="bg-transparent outline-none text-slate-700 font-medium cursor-pointer"
            />
          </div>
        </div>
      )}
    </form>
  );
};

