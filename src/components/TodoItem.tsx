import React, { useState } from 'react';
import { Todo } from '../types';
import { Check, Trash2, Edit2, Calendar, Clock, Flame } from 'lucide-react';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Todo>) => void;
}

export const TodoItem: React.FC<TodoItemProps> = ({
  todo,
  onToggle,
  onDelete,
  onUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(todo.title);

  const handleSave = () => {
    if (editTitle.trim()) {
      onUpdate(todo.id, { title: editTitle.trim() });
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') {
      setEditTitle(todo.title);
      setIsEditing(false);
    }
  };

  // Category Badge Color
  const categoryColors: Record<string, string> = {
    '업무': 'bg-blue-50 text-blue-600 border-blue-200/60',
    '공부': 'bg-purple-50 text-purple-600 border-purple-200/60',
    '일상': 'bg-amber-50 text-amber-700 border-amber-200/60',
    '건강': 'bg-emerald-50 text-emerald-600 border-emerald-200/60',
    '기타': 'bg-slate-100 text-slate-600 border-slate-200/60',
  };

  // D-Day 계산
  const getDDay = (dateStr?: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    const diff = Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diff === 0) return { text: '오늘 마감', color: 'text-amber-600 font-semibold' };
    if (diff === 1) return { text: '내일 마감', color: 'text-blue-600' };
    if (diff < 0) return { text: `${Math.abs(diff)}일 지남`, color: 'text-rose-600 font-semibold' };
    return { text: `D-${diff}`, color: 'text-slate-500' };
  };

  const dday = getDDay(todo.dueDate);

  return (
    <div
      className={`group flex items-start gap-3 p-3.5 rounded-xl bg-white border transition-all duration-200 hover:shadow-md ${
        todo.completed
          ? 'bg-slate-50/60 border-slate-200/50 opacity-65'
          : 'border-slate-200/80 hover:border-indigo-200'
      }`}
    >
      {/* Checkbox button */}
      <button
        type="button"
        onClick={() => onToggle(todo.id)}
        className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-all cursor-pointer ${
          todo.completed
            ? 'bg-indigo-600 border-indigo-600 text-white'
            : 'border-slate-300 hover:border-indigo-500 bg-white'
        }`}
      >
        {todo.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
      </button>

      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              className="w-full text-sm font-medium px-2 py-1 rounded border border-indigo-300 outline-none focus:ring-1 focus:ring-indigo-500 bg-white"
            />
            <button
              onClick={handleSave}
              className="text-xs px-2 py-1 bg-indigo-600 text-white rounded font-medium hover:bg-indigo-700"
            >
              저장
            </button>
          </div>
        ) : (
          <div>
            <p
              onClick={() => onToggle(todo.id)}
              className={`text-sm font-medium leading-relaxed cursor-pointer break-words ${
                todo.completed
                  ? 'line-through text-slate-400'
                  : 'text-slate-800 group-hover:text-slate-900'
              }`}
            >
              {todo.title}
            </p>

            {/* Badges & Meta info */}
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
              <span
                className={`px-2 py-0.5 rounded-md border text-[11px] font-medium ${
                  categoryColors[todo.category] || categoryColors['기타']
                }`}
              >
                {todo.category}
              </span>

              {todo.priority === 'high' && (
                <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-rose-50 text-rose-600 border border-rose-200/60 text-[11px] font-medium">
                  <Flame className="w-3 h-3 text-rose-500" />
                  중요
                </span>
              )}

              {todo.dueDate && (
                <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {todo.dueDate}
                  {dday && !todo.completed && (
                    <span className={`ml-1 ${dday.color}`}>({dday.text})</span>
                  )}
                </span>
              )}

              {todo.dueTime && (
                <span className="inline-flex items-center gap-1 text-slate-500 text-[11px]">
                  <Clock className="w-3 h-3 text-slate-400" />
                  {todo.dueTime}
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Action buttons (hover visible) */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isEditing && (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="수정"
          >
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={() => onDelete(todo.id)}
          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          title="삭제"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

