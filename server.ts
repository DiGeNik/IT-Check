import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import mammoth from 'mammoth';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

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
          taskName: { type: Type.STRING, description: 'Име на задачата или критерия (напр. "Задача 1: ..." или "Критерий: ...")' },
          score: { type: Type.INTEGER, description: 'Получени точки от ученика' },
          maxScore: { type: Type.INTEGER, description: 'Максимален брой точки за този критерий' },
          feedback: { type: Type.STRING, description: 'Кратка бележка и обосновка за оценката на тази задача' },
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
      description: 'Индивидуален насърчителен коментар за Google Classroom от 2-3 изречения на български език с обръщение по име, точна разбивка на точките по задачите и общия сбор, похвала за постигнатото и конкретен градивен съвет за пропуските.',
    },
    statusSummary: {
      type: Type.STRING,
      description: 'Кратка обобщена оценка на предадената работа (напр. "Пълно и коректно решение", "Частично предаване").',
    },
  },
  required: ['studentName', 'totalScore', 'maxScore', 'tasks', 'classroomComment', 'statusSummary'],
};

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '60mb' }));
  app.use(express.urlencoded({ limit: '60mb', extended: true }));

  // API endpoint for analyzing a single worksheet with dynamic rubric & reference solution
  app.post('/api/analyze-worksheet', async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        fileName,
        fileType,
        fileBase64,
        textContent,
        assignmentTopic,
        rubricCriteria,
        referenceSolution,
        maxScore,
      } = req.body;

      if (!fileName) {
        res.status(400).json({ error: 'Липсва име на файла.' });
        return;
      }

      let contentsParts: any[] = [];
      let extractedText = textContent || '';

      const lowerName = fileName.toLowerCase();
      const isDocx = lowerName.endsWith('.docx') || fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const isPdf = lowerName.endsWith('.pdf') || fileType === 'application/pdf';
      const isImage = fileType?.startsWith('image/') || /\.(png|jpe?g|webp|gif|bmp)$/i.test(lowerName);

      if (isDocx && fileBase64) {
        try {
          const buffer = Buffer.from(fileBase64, 'base64');
          const result = await mammoth.extractRawText({ buffer });
          extractedText = result.value;
        } catch (docxErr) {
          console.error('Docx extraction warning:', docxErr);
        }
      }

      const currentTopic = assignmentTopic || 'Информационни технологии';
      const currentRubric = rubricCriteria || `
Задача 1 (макс 7 т.): 5 т. за мрежови параметри (IPv4, Mask, Gateway, DNS, DHCP) и 2 т. за сравнение със смартфон.
Задача 2 (макс 2 т.): средни времена за ping към шлюз (1 т.) и смартфон (1 т.).
Задача 3 (макс 3 т.): открит публичен IP (1 т.) и обяснение за локален vs публичен IP / NAT (2 т.).
Общо: 12 точки.
`;

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
6. Напиши персонален, насърчителен и мотивиращ коментар за Google Classroom (2-3 изречения на български език), съдържащ името на ученика, точна разбивка на точките (напр. Зад 1: X/Y, Зад 2: Z/W... - Общо T/M т.), похвала за верните отговори и конструктивна препоръка за грешките или пропуските.

Име на файла: "${fileName}".
`;

      if (isPdf && fileBase64) {
        contentsParts = [
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: fileBase64,
            },
          },
          { text: promptInstructions },
        ];
      } else if (isImage && fileBase64) {
        const mime = fileType || (lowerName.endsWith('.png') ? 'image/png' : 'image/jpeg');
        contentsParts = [
          {
            inlineData: {
              mimeType: mime,
              data: fileBase64,
            },
          },
          { text: promptInstructions },
        ];
      } else if (extractedText) {
        contentsParts = [
          { text: promptInstructions + '\n\nСЪДЪРЖАНИЕ НА ПРЕДАДЕНИЯ ДОКУМЕНТ:\n' + extractedText },
        ];
      } else if (isDocx) {
        // Document was a .docx Word file, but mammoth extracted no raw text
        contentsParts = [
          { text: promptInstructions + '\n\n(Бележка: Предаденият файл е Microsoft Word (.docx), но съдържа само графични елементи или не съдържа извлечен текстов слой. Моля, отчети липсата на попълнен текст или оцени по името на файла и наличните метаданни.)' },
        ];
      } else if (fileBase64) {
        try {
          const decoded = Buffer.from(fileBase64, 'base64').toString('utf-8');
          // Sanitize: strip out null bytes
          const sanitized = decoded.replace(/\0/g, '');
          contentsParts = [
            { text: promptInstructions + '\n\nСЪДЪРЖАНИЕ НА ПРЕДАДЕНИЯ ДОКУМЕНТ:\n' + sanitized },
          ];
        } catch {
          contentsParts = [{ text: promptInstructions }];
        }
      } else {
        contentsParts = [{ text: promptInstructions }];
      }

      let response;
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        for (let attempt = 0; attempt < 2; attempt++) {
          try {
            response = await ai.models.generateContent({
              model: modelName,
              contents: { parts: contentsParts },
              config: {
                responseMimeType: 'application/json',
                responseSchema: universalAnalysisSchema,
                temperature: 0.2,
              },
            });
            if (response && response.text) break;
          } catch (err: any) {
            lastError = err;
            console.warn(`Model ${modelName} attempt ${attempt + 1} failed:`, err?.message || err);
            // If 429 quota error, immediately try next model instead of retrying same model
            if (err?.status === 429 || String(err?.message).includes('429')) {
              break;
            }
            await new Promise((r) => setTimeout(r, 1000));
          }
        }
        if (response && response.text) break;
      }

      if (!response || !response.text) {
        throw lastError || new Error('Моделът не успя да върне отговор. Моля опитайте отново.');
      }

      const responseText = response.text || '{}';
      const parsedData = JSON.parse(responseText.trim());

      // Ensure tasks is an array and totalScore matches sum
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

      res.json({
        success: true,
        data: parsedData,
      });
    } catch (error: any) {
      console.error('Worksheet analysis error:', error);
      res.status(500).json({
        error: error.message || 'Грешка при анализирането на файла с Gemini.',
      });
    }
  });

  // API endpoint to regenerate Classroom comment if teacher edits scores or criteria
  app.post('/api/generate-comment', async (req: Request, res: Response): Promise<void> => {
    try {
      const { studentName, tasks, totalScore, maxScore, topicTitle, notes } = req.body;

      const taskSummary = Array.isArray(tasks)
        ? tasks.map((t: any) => `${t.taskName}: ${t.score}/${t.maxScore} т.`).join(', ')
        : `Общо ${totalScore}/${maxScore} т.`;

      const prompt = `
Генерирай насърчителен индивидуален коментар за Google Classroom от 2-3 изречения на български език за ученик с име: ${studentName || 'Ученик'}.
Тема на заданието: "${topicTitle || 'Информационни технологии'}".
Резултати от проверката:
- Разбивка: ${taskSummary}
- Общ сбор: ${totalScore}/${maxScore} точки.
Допълнителни учителски бележки: ${notes || 'няма'}.

Изискване:
1. Включи топло обръщение с името на ученика.
2. Включи точната разбивка на точките: (${taskSummary} - Общо ${totalScore}/${maxScore} т.).
3. Похвали силните страни и дай градивен съвет за подобрение.
Върни само чист текст на коментара.
`;

      let response;
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
      for (const modelName of modelsToTry) {
        try {
          response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              temperature: 0.3,
            },
          });
          if (response?.text) break;
        } catch (e) {
          console.warn(`Comment generation failed on ${modelName}:`, e);
        }
      }

      res.json({
        comment: response?.text?.trim() || `Браво, ${studentName}! Отлична работа по поставените задачи (${taskSummary} - Общо ${totalScore}/${maxScore} т.). Продължавай все така упорито!`,
      });
    } catch (err: any) {
      console.error('Comment generation error:', err);
      res.status(500).json({ error: 'Неуспешно генериране на коментар.' });
    }
  });

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Strict JSON 404 for unhandled API routes so they NEVER fall through to Vite index.html
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({
      error: `API маршрутът ${req.method} ${req.path} не съществува.`,
    });
  });

  // Global JSON error handler for body-parser or middleware errors so they NEVER render HTML
  app.use((err: any, _req: Request, res: Response, _next: express.NextFunction) => {
    console.error('Express unhandled error:', err);
    res.status(err.status || 500).json({
      error: err.message || 'Сървърна грешка при обработката на заявката.',
    });
  });

  // Serve app via Vite in development, static in production
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
