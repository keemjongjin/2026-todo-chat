import { Todo, ActionType } from '../types';

export interface GeminiResponse {
  message: string;
  action: {
    type: ActionType;
    affectedTodoIds?: string[];
    suggestedTodos?: Partial<Todo>[];
  };
  suggestions?: string[];
}

export async function callGeminiApi(
  apiKey: string,
  userMessage: string,
  currentTodos: Todo[]
): Promise<GeminiResponse> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`;

  const prompt = `
당신은 똑똑하고 친절한 "투두 & 생산성 AI 비서"입니다.
사용자의 메시지를 분석하여 현재 할 일 목록을 조작하거나 적절한 피드백을 제공하세요.
반드시 아래 JSON 포맷으로만 응답해야 합니다. 마크다운 코드블록(\`\`\`json) 없이 순수 JSON만 반환하세요.

현재 시각: ${new Date().toISOString()}
현재 할 일 목록:
${JSON.stringify(
  currentTodos.map(t => ({
    id: t.id,
    title: t.title,
    completed: t.completed,
    dueDate: t.dueDate,
    dueTime: t.dueTime,
    priority: t.priority,
    category: t.category,
  })),
  null,
  2
)}

가능한 action.type:
- 'ADD_TODO': 새 할 일을 추가할 때 (suggestedTodos 배열에 추가할 항목들을 채움)
- 'COMPLETE_TODO': 기존 할 일을 완료 처리할 때 (affectedTodoIds 배열에 대상 id들 추가)
- 'DELETE_TODO': 기존 할 일을 삭제할 때 (affectedTodoIds 배열에 대상 id들 추가)
- 'SUGGEST_PLAN': 목표나 계획에 대한 단계별 할 일들을 추천할 때 (suggestedTodos 배열에 항목들 채움)
- 'CLEAR_COMPLETED': 완료된 할 일들을 모두 정리할 때
- 'NONE': 단순 질문 답변 또는 조언일 때

JSON 출력 스키마:
{
  "message": "사용자에게 보여줄 친절하고 자연스러운 한국어 답변 (마크다운 지원)",
  "action": {
    "type": "ADD_TODO" | "COMPLETE_TODO" | "DELETE_TODO" | "SUGGEST_PLAN" | "CLEAR_COMPLETED" | "NONE",
    "affectedTodoIds": ["id1"],
    "suggestedTodos": [
      {
        "title": "할 일 제목",
        "category": "업무" | "공부" | "일상" | "건강" | "기타",
        "priority": "low" | "medium" | "high",
        "dueDate": "YYYY-MM-DD",
        "dueTime": "HH:mm"
      }
    ]
  },
  "suggestions": ["사용자가 다음에 누를 수 있는 추천 버튼 텍스트 2~3개"]
}

사용자 메시지: "${userMessage}"
`;

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API 호출 실패 (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini 응답이 비어 있습니다.');
  }

  try {
    const parsed: GeminiResponse = JSON.parse(text);
    return parsed;
  } catch (err) {
    console.error('Failed to parse Gemini response as JSON:', text, err);
    return {
      message: text,
      action: { type: 'NONE' },
    };
  }
}

