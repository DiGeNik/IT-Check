import React, { useState } from 'react';
import {
  X,
  Sliders,
  Save,
  RotateCcw,
  BookOpen,
  CheckCircle2,
  HelpCircle,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { AssignmentSettings } from '../types';

export const DEFAULT_PRESETS: Array<{
  name: string;
  topicTitle: string;
  maxScore: number;
  rubricCriteria: string;
  referenceSolution: string;
}> = [
  {
    name: 'Компютърни мрежи (12 т.)',
    topicTitle: 'Компютърни мрежи, IP адресация и мрежова диагностика',
    maxScore: 12,
    rubricCriteria: `Задача 1 (макс 7 т.):
- 5 т. за извлечени параметри на компютърната мрежова карта (IPv4 адрес, Subnet Mask, Default Gateway, DNS сървър, DHCP статус/сървър) - по 1 точка за всеки правилен параметър.
- 2 т. за сравнение с настройките на смартфона (дали са в същата мрежа, еднакъв ли е шлюзът и маската, различен ли е IP адресът на хоста).

Задача 2 (макс 2 т.):
- 1 т. за отчетено средно време при ping към шлюза (Default Gateway).
- 1 т. за отчетено средно време при ping към смартфона.

Задача 3 (макс 3 т.):
- 1 т. за открит реален публичен IP адрес на мрежата.
- 2 т. за правилно и пълно обяснение за разликата между локален и публичен IP адрес и ролята на рутера / NAT (Network Address Translation).

Общ сбор: 12 точки.`,
    referenceSolution: `Задача 1:
- Компютър: локален IPv4 адрес (напр. 192.168.1.X или 10.0.0.X), маска (255.255.255.0), шлюз (напр. 192.168.1.1), DNS сървъри, включен DHCP.
- Смартфон: IP от същия адресeн диапазон с идентичен шлюз и маска.

Задача 2:
- Ping към рутера: ниско закъснение (1 - 5 ms).
- Ping към смартфона: нормално Wi-Fi закъснение (10 - 40 ms).

Задача 3:
- Публичен IP: валиден глобален адрес от сайт като whatismyip.com.
- Обяснение: Локалните адреси (RFC 1918) са за вътрешна връзка в дома/училището и не са директно достъпни от интернет. Рутерът използва NAT транслация, за да преобразува всички вътрешни заявки през един общ публичен IP адрес.`,
  },
  {
    name: 'Бази данни и SQL (20 т.)',
    topicTitle: 'Релационни бази данни и SQL заявки за извличане и филтриране',
    maxScore: 20,
    rubricCriteria: `Задача 1 (макс 6 т.):
- 3 т. за правилно дефиниране на първични и външни ключове (Primary Key, Foreign Key) в таблиците.
- 3 т. за вярно установени релационни връзки от тип едно-към-много (1:N).

Задача 2 (макс 8 т.):
- 4 т. за коректно съставена SELECT заявка с филтриращо условие (WHERE) и сортиране (ORDER BY).
- 4 т. за успешно съединяване на две свързани таблици чрез INNER JOIN.

Задача 3 (макс 6 т.):
- 3 т. за правилно използване на агрегатна функция (COUNT, AVG, SUM).
- 3 т. за правилно групиране на резултатите с GROUP BY и филтриране с HAVING.

Общ сбор: 20 точки.`,
    referenceSolution: `Задача 1: Дефинирани колони id INT PRIMARY KEY, department_id INT FOREIGN KEY REFERENCES departments(id).
Задача 2:
SELECT students.name, grades.subject, grades.score
FROM students
INNER JOIN grades ON students.id = grades.student_id
WHERE grades.score >= 5
ORDER BY students.name ASC;
Задача 3:
SELECT department_id, COUNT(*) AS total_employees, AVG(salary) AS avg_salary
FROM employees
GROUP BY department_id
HAVING COUNT(*) > 2;`,
  },
  {
    name: 'Python програмиране (15 т.)',
    topicTitle: 'Основи на програмирането с Python: функции, списъци и речници',
    maxScore: 15,
    rubricCriteria: `Задача 1: Дефиниране на функция и обработка на списък (макс 5 т.):
- 2 т. за правилна декларация на функция с параметри и валидация на входните данни.
- 3 т. за коректен алгоритъм за филтриране или преобразуване на елементите в списъка.

Задача 2: Работа с речници и структури от данни (макс 5 т.):
- 3 т. за създаване и коректно обхождане на речник с двойки ключ-стойност.
- 2 т. за извличане на агрегирана статистика (напр. най-висок резултат или честотен речник).

Задача 3: Обработка на изключения и стил на кодиране (макс 5 т.):
- 3 т. за прихващане на грешки чрез try/except (напр. ValueError, ZeroDivisionError).
- 2 т. за спазване на PEP 8 конвенциите (именуване, коментари, форматиране).

Общ сбор: 15 точки.`,
    referenceSolution: `Задача 1:
def filter_positive_numbers(numbers):
    if not isinstance(numbers, list):
        raise ValueError("Очаква се списък от числа.")
    return [num for num in numbers if num > 0]

Задача 2:
scores = {"Иван": 88, "Мария": 95, "Георги": 72}
top_student = max(scores, key=scores.get)

Задача 3:
try:
    result = 100 / count
except ZeroDivisionError:
    result = 0`,
  },
  {
    name: 'Електронни таблици в Excel (10 т.)',
    topicTitle: 'Обработка на данни с формули и функции в MS Excel',
    maxScore: 10,
    rubricCriteria: `Задача 1 (макс 4 т.):
- 2 т. за правилно изчисляване на суми и средни стойности (функции SUM, AVERAGE).
- 2 т. за използване на абсолютни адреси ($A$1) при изчисляване на процентни дялове или ДДС.

Задача 2 (макс 3 т.):
- 3 т. за правилно приложение на условна логическа функция IF или IFS за определяне на статус/категория.

Задача 3 (макс 3 т.):
- 2 т. за търсене на данни в свързана таблица с VLOOKUP или XLOOKUP.
- 1 т. за естетическо условно форматиране (Conditional Formatting) на стойностите.

Общ сбор: 10 точки.`,
    referenceSolution: `Задача 1: =SUM(B2:B20), =AVERAGE(C2:C20), =B2*$E$1
Задача 2: =IF(D2>=5, "Отличен", "За подобрение")
Задача 3: =XLOOKUP(A2, Products!A:A, Products!C:C, "Не е намерен")`,
  },
];

interface AssignmentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AssignmentSettings;
  onSave: (newSettings: AssignmentSettings, regradeExisting: boolean) => void;
  hasExistingSubmissions: boolean;
}

export const AssignmentSettingsModal: React.FC<AssignmentSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSave,
  hasExistingSubmissions,
}) => {
  const [topicTitle, setTopicTitle] = useState(settings.topicTitle);
  const [maxScore, setMaxScore] = useState(settings.maxScore);
  const [rubricCriteria, setRubricCriteria] = useState(settings.rubricCriteria);
  const [referenceSolution, setReferenceSolution] = useState(settings.referenceSolution);
  const [regradeOption, setRegradeOption] = useState(false);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: typeof DEFAULT_PRESETS[0]) => {
    setTopicTitle(preset.topicTitle);
    setMaxScore(preset.maxScore);
    setRubricCriteria(preset.rubricCriteria);
    setReferenceSolution(preset.referenceSolution);
  };

  const handleSave = () => {
    onSave(
      {
        topicTitle: topicTitle.trim() || 'Информационни технологии',
        maxScore: Number(maxScore) || 12,
        rubricCriteria: rubricCriteria.trim(),
        referenceSolution: referenceSolution.trim(),
      },
      regradeOption && hasExistingSubmissions
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-in fade-in duration-200 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Настройки на заданието и рубриката за оценяване
              </h2>
              <p className="text-xs text-slate-500">
                Задайте критериите и верните отговори за произволна тема по Ваш избор
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto space-y-5">
          {/* Preset Buttons */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Бързи шаблони за популярни теми:
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {DEFAULT_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    topicTitle === preset.topicTitle
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Topic Title & Max Points */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Тема на заданието или лабораторното упражнение:
              </label>
              <input
                type="text"
                value={topicTitle}
                onChange={(e) => setTopicTitle(e.target.value)}
                placeholder="напр. Компютърни мрежи, Бази данни, Алгоритми..."
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Максимален брой точки:
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={maxScore}
                onChange={(e) => setMaxScore(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-2 text-sm font-mono font-bold text-center bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Field 1: Evaluation Criteria / Rubric */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <FileCheck2 className="w-4 h-4 text-indigo-600" />
                1. Критерии за оценяване (рубрика и максимален брой точки):
              </label>
              <span className="text-[11px] text-slate-500">
                Опишете задачите, подкритериите и точките за всяка от тях
              </span>
            </div>
            <textarea
              rows={8}
              value={rubricCriteria}
              onChange={(e) => setRubricCriteria(e.target.value)}
              placeholder="Въведете детайлната рубрика..."
              className="w-full p-3 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono leading-relaxed"
            />
          </div>

          {/* Field 2: Reference Solution / Correct Answers (Optional) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                2. Еталонно решение или верни отговори (по избор):
              </label>
              <span className="text-[11px] text-slate-500">
                Помага на Gemini да сравни предадените работи с Вашите точни верни отговори
              </span>
            </div>
            <textarea
              rows={6}
              value={referenceSolution}
              onChange={(e) => setReferenceSolution(e.target.value)}
              placeholder="Въведете верните отговори или примерен код / стойности (незадължително)..."
              className="w-full p-3 text-xs text-slate-800 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-mono leading-relaxed"
            />
          </div>

          {/* Re-grade existing option */}
          {hasExistingSubmissions && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center gap-3">
              <input
                id="regradeCheckbox"
                type="checkbox"
                checked={regradeOption}
                onChange={(e) => setRegradeOption(e.target.checked)}
                className="w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 shrink-0"
              />
              <label htmlFor="regradeCheckbox" className="text-xs text-amber-900 font-medium cursor-pointer">
                <strong>Преоцени вече качените файлове в таблицата</strong> според новите критерии и еталонни отговори веднага след запазване.
              </label>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Отказ
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-100"
          >
            <Save className="w-4 h-4" />
            <span>Запази новата рубрика</span>
          </button>
        </div>
      </div>
    </div>
  );
};
