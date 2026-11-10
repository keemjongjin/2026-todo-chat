import React from 'react';
import { toLocalDateString } from '../utils/date';
import { Todo } from '../types';
import { CheckCircle2, Clock, Calendar, AlertCircle } from 'lucide-react';

interface StatsBarProps {
  todos: Todo[];
}

export const StatsBar: React.FC<StatsBarProps> = ({ todos }) => {
  const total = todos.length;
  const completed = todos.filter(t => t.completed).length;
  const active = total - completed;

  const todayStr = toLocalDateString();
  const todayTasks = todos.filter(t => !t.completed && t.dueDate === todayStr).length;
  const highPriority = todos.filter(t => !t.completed && t.priority === 'high').length;

  const rate = total === 0 ? 0 : Math.round((completed / total) * 100);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-slate-800">할 일 진행 현황</h2>
          <p className="text-xs text-slate-500 mt-0.5">오늘도 한 걸음씩 목표를 달성해보세요</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-indigo-600">{rate}%</span>
          <span className="text-xs text-slate-400 block">달성률</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-indigo-500 to-violet-500 h-2.5 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${rate}%` }}
        />
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-4 gap-2 pt-1 text-center">
        <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-center text-slate-500 mb-1">
            <Clock className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-bold text-slate-800">{active}</div>
          <div className="text-[11px] text-slate-500">진행 중</div>
        </div>

        <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-center text-emerald-500 mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-bold text-slate-800">{completed}</div>
          <div className="text-[11px] text-slate-500">완료됨</div>
        </div>

        <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-center text-blue-500 mb-1">
            <Calendar className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-bold text-slate-800">{todayTasks}</div>
          <div className="text-[11px] text-slate-500">오늘 마감</div>
        </div>

        <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
          <div className="flex items-center justify-center text-rose-500 mb-1">
            <AlertCircle className="w-3.5 h-3.5" />
          </div>
          <div className="text-lg font-bold text-slate-800">{highPriority}</div>
          <div className="text-[11px] text-slate-500">중요 할일</div>
        </div>
      </div>
    </div>
  );
};

