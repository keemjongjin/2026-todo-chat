import { Todo, ChatMessage, Priority, Category } from '../types';
import { toLocalDateString } from '../utils/date';

export interface ParseResult {
  message: string;
  action: {
    type: 'ADD_TODO' | 'COMPLETE_TODO' | 'DELETE_TODO' | 'SUGGEST_PLAN' | 'CLEAR_COMPLETED' | 'NONE';
    affectedTodos?: Todo[];
    suggestedTodos?: Partial<Todo>[];
  };
  suggestions?: string[];
}

// 헬퍼: 현재 날짜 기준 상대 날짜 계산
function getTargetDate(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return toLocalDateString(d);
}

// 요일 기준 날짜 계산
function getNextDayOfWeek(dayName: string): string {
  const days: { [key: string]: number } = {
    '일': 0, '월': 1, '화': 2, '수': 3, '목': 4, '금': 5, '토': 6
  };
  const targetDay = days[dayName];
  if (targetDay === undefined) return getTargetDate(0);

  const today = new Date();
  const currentDay = today.getDay();
  let distance = targetDay - currentDay;
  if (distance <= 0) {
    distance += 7;
  }
  const result = new Date();
  result.setDate(today.getDate() + distance);
  return toLocalDateString(result);
}

// 자연어 카테고리 유추
function inferCategory(text: string): Category {
  const lower = text.toLowerCase();
  if (/(회의|보고서|발표|업무|프로젝트|미팅|이메일|고객|클라이언트|출근|기획|개발|코딩|PR)/i.test(lower)) {
    return '업무';
  }
  if (/(공부|강의|독서|책|숙제|시험|과제|학습|자격증|영단어|강좌)/i.test(lower)) {
    return '공부';
  }
  if (/(운동|헬스|러닝|달리기|스트레칭|필라테스|요가|영양제|병원|약|산책|수영)/i.test(lower)) {
    return '건강';
  }
  if (/(빨래|청소|장보기|마트|설거지|분리수거|요리|쓰레기|정리|장보기|환기|밥)/i.test(lower)) {
    return '일상';
  }
  return '기타';
}

// 우선순위 유추
function inferPriority(text: string): Priority {
  if (/(중요|급한|우선|반드시|꼭|당장|high|긴급|필수)/i.test(text)) {
    return 'high';
  }
  if (/(천천히|나중에|여유|낮음|low|심심할때)/i.test(text)) {
    return 'low';
  }
  return 'medium';
}

// 날짜 및 시간 추출
function extractDateTime(text: string): { dueDate?: string; dueTime?: string; cleanText: string } {
  let dueDate: string | undefined;
  let dueTime: string | undefined;
  let cleanText = text;

  // 1. 날짜 패턴
  if (/오늘/.test(cleanText)) {
    dueDate = getTargetDate(0);
    cleanText = cleanText.replace(/오늘\s*(까지|에)?/g, '');
  } else if (/내일모레|모레/.test(cleanText)) {
    dueDate = getTargetDate(2);
    cleanText = cleanText.replace(/(내일모레|모레)\s*(까지|에)?/g, '');
  } else if (/내일/.test(cleanText)) {
    dueDate = getTargetDate(1);
    cleanText = cleanText.replace(/내일\s*(까지|에)?/g, '');
  } else if (/글피/.test(cleanText)) {
    dueDate = getTargetDate(3);
    cleanText = cleanText.replace(/글피\s*(까지|에)?/g, '');
  }

  // 요일 매칭 (예: 이번주 금요일, 다음주 월요일, 금요일까지)
  const weekDayMatch = cleanText.match(/(이번주|다음주)?\s*([월화수목금토일])요일/);
  if (weekDayMatch) {
    const dayName = weekDayMatch[2];
    dueDate = getNextDayOfWeek(dayName);
    cleanText = cleanText.replace(weekDayMatch[0], '');
  }

  // M월 D일 매칭
  const monthDayMatch = cleanText.match(/(\d{1,2})월\s*(\d{1,2})일/);
  if (monthDayMatch) {
    const now = new Date();
    const month = parseInt(monthDayMatch[1], 10) - 1;
    const day = parseInt(monthDayMatch[2], 10);
    const target = new Date(now.getFullYear(), month, day);
    dueDate = toLocalDateString(target);
    cleanText = cleanText.replace(monthDayMatch[0], '');
  }

  // 2. 시간 패턴 (오후 3시, 15시, 오전 10시 반 등)
  const timeMatch = cleanText.match(/(오전|오후|저녁|아침|밤)?\s*(\d{1,2})시(\s*반|\s*(\d{1,2})분)?/);
  if (timeMatch) {
    const period = timeMatch[1];
    let hour = parseInt(timeMatch[2], 10);
    const isHalf = timeMatch[3]?.includes('반');
    const minutes = isHalf ? 30 : (timeMatch[4] ? parseInt(timeMatch[4], 10) : 0);

    if (period === '오후' || period === '저녁' || period === '밤') {
      if (hour < 12) hour += 12;
    } else if (period === '오전' || period === '아침') {
      if (hour === 12) hour = 0;
    }

    dueTime = `${String(hour).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    cleanText = cleanText.replace(timeMatch[0], '');
  }

  // 불필요한 조사 정리
  cleanText = cleanText
    .replace(/(추가해줘|추가|등록해줘|등록|넣어줘|할일|해야돼|해야해|할거야|해줘|하기로 함|예정)/g, '')
    .trim();

  return { dueDate, dueTime, cleanText };
}

// 템플릿 플랜 생성기 (AI 추천 모의)
function generatePlanSuggestions(text: string): Partial<Todo>[] | null {
  const lower = text.toLowerCase();
  const today = getTargetDate(0);
  const tomorrow = getTargetDate(1);
  const dayAfter = getTargetDate(2);

  if (/다이어트|운동\s*계획|헬스\s*루틴/i.test(lower)) {
    return [
      { title: '물 2L 마시기 & 식단 일기 작성', category: '건강', priority: 'medium', dueDate: today },
      { title: '스트레칭 15분 & 가벼운 유산소 30분', category: '건강', priority: 'high', dueDate: today },
      { title: '스쿼트 & 코어 근력 운동 20분', category: '건강', priority: 'medium', dueDate: tomorrow },
      { title: '주간 인바디/체중 측정 및 피드백', category: '건강', priority: 'low', dueDate: dayAfter },
    ];
  }

  if (/코딩|프로그래밍|개발\s*공부/i.test(lower)) {
    return [
      { title: '공식 문서 / 튜토리얼 1챕터 정독', category: '공부', priority: 'high', dueDate: today },
      { title: '간단한 토이 프로젝트 기능 1개 구현', category: '공부', priority: 'high', dueDate: today },
      { title: '작성한 코드 리팩토링 & 깃허브 커밋', category: '공부', priority: 'medium', dueDate: tomorrow },
      { title: '새로 배운 내용 기술 블로그 정리', category: '공부', priority: 'low', dueDate: dayAfter },
    ];
  }

  if (/이사|방\s*정리|대청소/i.test(lower)) {
    return [
      { title: '안 쓰는 짐 및 옷 정리/비우기', category: '일상', priority: 'high', dueDate: today },
      { title: '종량제 봉투 구매 및 분리수거 배출', category: '일상', priority: 'medium', dueDate: today },
      { title: '바닥 청소기 돌리고 물걸레질하기', category: '일상', priority: 'medium', dueDate: tomorrow },
      { title: '창문 환기 및 가구 먼지 털기', category: '일상', priority: 'low', dueDate: tomorrow },
    ];
  }

  if (/여행|휴가\s*준비/i.test(lower)) {
    return [
      { title: '여행 일정표 및 가고 싶은 장소 리스트업', category: '일상', priority: 'high', dueDate: today },
      { title: '교통편(기차/항공권) 및 숙소 예약 확인', category: '일상', priority: 'high', dueDate: today },
      { title: '캐리어 짐 싸기 (의류, 세면도구, 충전기)', category: '일상', priority: 'medium', dueDate: tomorrow },
      { title: '비상약 및 신분증 챙기기', category: '일상', priority: 'medium', dueDate: dayAfter },
    ];
  }

  if (/시험|자격증|공부\s*계획/i.test(lower)) {
    return [
      { title: '시험 범위 핵심 개념 노트 요약하기', category: '공부', priority: 'high', dueDate: today },
      { title: '최신 기출문제 1회분 풀기 & 오답노트', category: '공부', priority: 'high', dueDate: today },
      { title: '자주 틀리는 취약 단원 집중 복습', category: '공부', priority: 'medium', dueDate: tomorrow },
      { title: '실전 모의고사 타이머 맞추고 풀기', category: '공부', priority: 'high', dueDate: dayAfter },
    ];
  }

  return null;
}

export function parseUserInput(input: string, currentTodos: Todo[]): ParseResult {
  const trimmed = input.trim();

  // 1. 계획/루틴 추천 요청
  if (/(계획|루틴|추천|짜줘|세워줘|아이디어|준비)/i.test(trimmed)) {
    const plans = generatePlanSuggestions(trimmed);
    if (plans) {
      return {
        message: `요청하신 목표를 위해 실천하기 좋은 ${plans.length}단계 할 일 플랜을 구성해 보았어요! 아래 버튼을 눌러 한 번에 할 일 목록에 추가할 수 있습니다. ✨`,
        action: {
          type: 'SUGGEST_PLAN',
          suggestedTodos: plans,
        },
        suggestions: ['여행 준비 계획 세워줘', '코딩 공부 계획 짜줘', '오늘 할 일 브리핑해줘']
      };
    }
  }

  // 2. 투두 브리핑 / 요약 요청
  if (/(할일|할 일|목록|뭐 있어|뭐야|현황|알려줘|브리핑|남은|오늘 뭐|남았어)/.test(trimmed) &&
      !/(추가|등록|완료|삭제|지워)/.test(trimmed)) {
    const active = currentTodos.filter(t => !t.completed);
    const todayStr = getTargetDate(0);
    const todayTasks = active.filter(t => t.dueDate === todayStr);
    const highPriority = active.filter(t => t.priority === 'high');

    if (active.length === 0) {
      return {
        message: '현재 진행 중인 할 일이 없습니다! 여유로운 하루를 보내시거나, 새로운 할 일을 등록해 보세요. 😊',
        action: { type: 'NONE' },
        suggestions: ['내일 할 일 추가', '다이어트 계획 세워줘', '코딩 공부 계획 짜줘']
      };
    }

    let report = `현재 완료되지 않은 할 일은 총 ${active.length}개입니다.\n\n`;
    if (todayTasks.length > 0) {
      report += `📅 **오늘 마감 예정 (${todayTasks.length}개)**:\n` +
        todayTasks.map(t => `- [${t.category}] ${t.title}${t.dueTime ? ` (${t.dueTime})` : ''}`).join('\n') + '\n\n';
    }
    if (highPriority.length > 0) {
      report += `🔥 **중요도가 높은 일 (${highPriority.length}개)**:\n` +
        highPriority.map(t => `- ${t.title}`).join('\n') + '\n\n';
    }
    report += `필요한 작업을 완료하시면 언제든 말씀해주세요!`;

    return {
      message: report,
      action: { type: 'NONE' },
      suggestions: ['오늘 할 일 다 했어', '새로운 할 일 추가', '완료된 항목 정리해줘']
    };
  }

  // 3. 완료된 항목 정리
  if (/(완료된|끝난).*?(정리|삭제|비워|지워)/.test(trimmed)) {
    const completedTodos = currentTodos.filter(t => t.completed);
    if (completedTodos.length === 0) {
      return {
        message: '현재 완료된 항목이 없습니다.',
        action: { type: 'NONE' },
      };
    }
    return {
      message: `완료된 ${completedTodos.length}개의 할 일을 정리했습니다! 깔끔해졌네요. 🧹✨`,
      action: {
        type: 'CLEAR_COMPLETED',
        affectedTodos: completedTodos,
      },
      suggestions: ['할 일 브리핑해줘', '오늘 할 일 추가']
    };
  }

  // 4. 완료 처리
  if (/(완료|끝났|다했|다 했|해결|체크)/.test(trimmed) && !/(추가|등록)/.test(trimmed)) {
    const keyword = trimmed
      .replace(/(완료했어|완료|끝났어|끝냄|다했어|다 했어|해결했어|체크해줘|체크)/g, '')
      .replace(/(은|는|이|가|을|를)(?=\s|$)/g, '')
      .trim();

    if (keyword) {
      // 키워드로 대상 투두 찾기 (미완료 항목 우선)
      const target = currentTodos.find(t => !t.completed && t.title.includes(keyword))
        || currentTodos.find(t => t.title.includes(keyword));

      if (target) {
        return {
          message: `'${target.title}' 할 일을 완료 처리했습니다! 수고하셨어요! 🎉`,
          action: {
            type: 'COMPLETE_TODO',
            affectedTodos: [target],
          },
          suggestions: ['남은 할 일 알려줘', '새로운 할 일 등록']
        };
      }
    }
  }

  // 5. 삭제 처리
  if (/(삭제|지워|취소|없애)/.test(trimmed) && !/(추가|등록)/.test(trimmed)) {
    const keyword = trimmed
      .replace(/(삭제해줘|삭제|지워줘|지워|취소해줘|취소|없애줘)/g, '')
      .replace(/(은|는|이|가|을|를)(?=\s|$)/g, '')
      .trim();

    if (keyword) {
      const target = currentTodos.find(t => t.title.includes(keyword));
      if (target) {
        return {
          message: `'${target.title}' 할 일을 삭제했습니다.`,
          action: {
            type: 'DELETE_TODO',
            affectedTodos: [target],
          },
          suggestions: ['남은 할 일 뭐야?', '오늘 할 일 추가']
        };
      }
    }
  }

  // 6. 투두 추가 (기본 동작 또는 명시적 추가 키워드)
  const { dueDate, dueTime, cleanText } = extractDateTime(trimmed);
  const title = cleanText.length > 0 ? cleanText : trimmed;

  if (title.length >= 2) {
    const category = inferCategory(trimmed);
    const priority = inferPriority(trimmed);

    const newTodo: Partial<Todo> = {
      title,
      dueDate: dueDate || getTargetDate(0), // 기본 마감일 오늘
      dueTime,
      category,
      priority,
      completed: false,
    };

    let responseMsg = `'${title}' 할 일을 추가했어요!`;
    const details = [];
    if (newTodo.dueDate) {
      const isToday = newTodo.dueDate === getTargetDate(0);
      const isTomorrow = newTodo.dueDate === getTargetDate(1);
      const dateName = isToday ? '오늘' : isTomorrow ? '내일' : newTodo.dueDate;
      details.push(`마감일: ${dateName}${newTodo.dueTime ? ` ${newTodo.dueTime}` : ''}`);
    }
    details.push(`카테고리: ${category}`);
    if (priority === 'high') details.push('우선순위: 높음 🔥');

    responseMsg += ` (${details.join(', ')})`;

    return {
      message: responseMsg,
      action: {
        type: 'ADD_TODO',
        suggestedTodos: [newTodo],
      },
      suggestions: ['오늘 할 일 브리핑', '다른 할 일 추가', '운동 계획 짜줘']
    };
  }

  // 7. 기본 안내
  return {
    message: '어떤 일을 도와드릴까요? 다음과 같이 말씀해 주시면 바로 처리해 드려요:\n- "내일 오후 3시 팀 미팅 추가해줘"\n- "오늘 할 일 알려줘"\n- "다이어트 계획 세워줘"\n- "운동 완료했어"',
    action: { type: 'NONE' },
    suggestions: ['오늘 할 일 뭐야?', '내일 오후 2시 회의 추가', '코딩 공부 계획 짜줘']
  };
}

