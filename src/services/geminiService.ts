import { GoogleGenAI, Type } from '@google/genai';

const universalAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    studentName: {
      type: Type.STRING,
      description: 'Име и фамилия на ученика, извлечени от предадената работа или името на файла.',
    },
    totalScore: {
      type: Type.INTEGER,
      description: 'Общ сбор от получените точки съгласно зададената рубрика.',
    },
    maxScore: {
      type: Type.INTEGER,
      description: 'Максималният възможен брой точки за цялото задание според рубриката.',
    },
    tasks: {
      type: Type.ARRAY,
      description: 'Разбивка на оценката по всяка отделна задача или критерий от рубриката.',
      items: {
        type: Type.OBJECT,
        properties: {
          taskName: { type: Type.STRING, description: 'Име на задачата или критерия' },
          score: { type: Type.INTEGER, description: 'Получени точки от ученика' },
          maxScore: { type: Type.INTEGER, description: 'Максимален брой точки за този критерий' },
          feedback: { type: Type.STRING, description: 'Кратка бележка и обосновка за оценката' },
        },
        required: ['taskName', 'score', 'maxScore', 'feedback'],
      },
    },
    strengths: {
      type: Type.STRING,
      description: 'Силни страни и верни отговори на ученика.',
    },
    weaknesses: {
      type: Type.STRING,
      description: 'Пропуски, неточности или липсващи отговори.',
    },
    classroomComment: {
      type: Type.STRING,
      description: 'Индивидуален насърчителен коментар за Google Classroom от 2-3 изречения на български език.',
    },
    statusSummary: {
      type: Type.STRING,
      description: 'Кратка обобщена оценка на предадената работа.',
    },
  },
  required: ['studentName', 'totalScore', 'maxScore', 'tasks', 'classroomComment', 'statusSummary'],
};

export interface AnalyzePayload {
  fileName: string;
  fileType?: string;
  fileBase64?: string;
  textContent?: string;
  assignmentTopic?: string;
  rubricCriteria?: string;
  referenceSolution?: string;
  maxScore?: number;
}

export async function analyzeWorksheetDirectly(payload: AnalyzePayload) {
  // Проверява за въведен ключ в localStorage или от обкръжението
  let apiKey = localStorage.getItem('gemini_api_key') || (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  
  if (!apiKey) {
    apiKey = prompt('Моля, въведете Вашия безплатен Gemini API ключ, за да стартирате проверката:') || '';
    if (apiKey.trim()) {
      localStorage.setItem('gemini_api_key', apiKey.trim());
    } else {
      throw new Error('Липсва Gemini API ключ. Проверката не може да продължи.');
    }
  }

  const ai = new GoogleGenAI({ apiKey });

  const {
    fileName,
    fileType,
    fileBase64,
    textContent,
    assignmentTopic,
    rubricCriteria,
    referenceSolution,
    maxScore,
  } = payload;

  const currentTopic = assignmentTopic || 'Информационни технологии';
  const currentRubric = rubricCriteria || 'Стандартни критерии за оценка';

  const promptInstructions = `
Ти си експертен учител, проверяващ предадена ученическа самостоятелна работа / лабораторен протокол по следната тема:
ТЕМА НА ЗАДАНИЕТО: "${currentTopic}".

ЗАДАДЕНИ КРИТЕРИИ ЗА ОЦЕНЯВАНЕ (РУБРИКА):
${currentRubric}

${referenceSolution && referenceSolution.trim() ? `ЕТАЛОННО РЕШЕНИЕ / ВЕРНИ ОТГОВОРИ (за сравнение):\n${referenceSolution}\n` : ''}

ОСНОВНИ ИЗИСКВАНИЯ:
1. Оцени предадената работа стриктно според зададената по-горе рубрика.
2. Върни точна разбивка по задачите/критериите (в списъка "tasks"). За всяка задача отчети получените точки, нейния максимум и кратка учителска обосновка.
3. Сумирай точно общия сбор "totalScore" (той трябва да е равен на сумата от точките на задачите).
4. Задай "maxScore" (стойност: ${maxScore || 12} или сумата от максимумите по критериите).
5. Извлечи името и фамилията на ученика от предадения документ или интелигентно от името на файла ("${fileName}").
6. Напиши персонален, насърчителен и мотивиращ коментар за Google Classroom (2-3 изречения на български език), съдържащ името на ученика, точна разбивка на точките, похвала и препоръка.

Име на файла: "${fileName}".
`;

  let contentsParts: any[] = [];
  const lowerName = fileName.toLowerCase();
  const isPdf = lowerName.endsWith('.pdf') || fileType === 'application/pdf';
  const isImage = fileType?.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(lowerName);

  if (isPdf && fileBase64) {
    contentsParts = [
      { inlineData: { mimeType: 'application/pdf', data: fileBase64 } },
      { text: promptInstructions },
    ];
  } else if (isImage && fileBase64) {
    const mime = fileType || (lowerName.endsWith('.png') ? 'image/png' : 'image/jpeg');
    contentsParts = [
      { inlineData: { mimeType: mime, data: fileBase64 } },
      { text: promptInstructions },
    ];
  } else if (textContent) {
    contentsParts = [{ text: promptInstructions + '\n\nСЪДЪРЖАНИЕ НА ПРЕДАДЕНИЯ ДОКУМЕНТ:\n' + textContent }];
  } else {
    contentsParts = [{ text: promptInstructions }];
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: contentsParts },
    config: {
      responseMimeType: 'application/json',
      responseSchema: universalAnalysisSchema,
      temperature: 0.2,
    },
  });

  if (!response || !response.text) {
    throw new Error('Моделът не успя да върне отговор. Моля, опитайте отново.');
  }

  const parsedData = JSON.parse(response.text.trim());
  const tasks = Array.isArray(parsedData.tasks) ? parsedData.tasks : [];
  let calculatedTotal = 0;
  let calculatedMax = 0;

  tasks.forEach((t: any) => {
    t.score = Math.max(0, Number(t.score) || 0);
    t.maxScore = Math.max(1, Number(t.maxScore) || 1);
    if (t.score > t.maxScore) t.score = t.maxScore;
    calculatedTotal += t.score;
    calculatedMax += t.maxScore;
  });

  parsedData.totalScore = calculatedTotal;
  if (!parsedData.maxScore || parsedData.maxScore <= 0) {
    parsedData.maxScore = calculatedMax || Number(maxScore) || 12;
  }

  return parsedData;
}
