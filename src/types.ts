export type Priority = 'low' | 'medium' | 'high';

export type Category = '업무' | '공부' | '일상' | '건강' | '기타';

export interface Todo {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  priority: Priority;
  category: Category;
  tags?: string[];
  createdAt: string;
}

export type ActionType = 
  | 'ADD_TODO'
  | 'COMPLETE_TODO'
  | 'DELETE_TODO'
  | 'SUGGEST_PLAN'
  | 'CLEAR_COMPLETED'
  | 'NONE';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  content: string;
  timestamp: string;
  actionTaken?: {
    type: ActionType;
    affectedTodos?: Todo[];
    suggestedTodos?: Partial<Todo>[];
  };
  suggestions?: string[];
}

