import React from 'react';
import { Question } from '../types';
import { CheckCircle2, ChevronRight, ChevronLeft, Download, Square, CheckSquare, Home } from 'lucide-react';
import { exportToWord } from '../services/exportService';

interface ExamViewProps {
  questions: Question[];
  currentQuestionIndex: number;
  userAnswers: Record<number, number[]>;
  onAnswerSelect: (questionId: number, optionIndex: number, isMultiple: boolean) => void;
  onNavigate: (index: number) => void;
  onSubmit: () => void;
  onReturnHome?: () => void;
}

const ExamView: React.FC<ExamViewProps> = ({
  questions,
  currentQuestionIndex,
  userAnswers,
  onAnswerSelect,
  onNavigate,
  onSubmit,
  onReturnHome
}) => {
  const currentQuestion = questions[currentQuestionIndex];
  
  // Calculate progress based on answered questions count
  const answeredCount = Object.keys(userAnswers).length;
  const progress = (answeredCount / questions.length) * 100;
  
  const currentSelected = userAnswers[currentQuestion.id] || [];
  const isMultiple = currentQuestion.type === 'multiple';

  const handleExport = () => {
    exportToWord(questions, "璇宝题库_生成试卷.docx");
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm font-medium text-gray-500 mb-2">
            <span>第 {currentQuestionIndex + 1} 题 / 共 {questions.length} 题</span>
            <span>已完成 {Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="flex justify-between mb-4">
        <button
            onClick={onReturnHome}
            className="md:hidden flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
            <Home className="w-4 h-4" /> 返回主页
        </button>
        <div className="flex-grow"></div>
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors font-medium"
        >
          <Download className="w-4 h-4" /> 导出试卷 (Word)
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden min-h-[500px] flex flex-col">
        {/* Question Header */}
        <div className="p-8 border-b border-gray-100 bg-gray-50">
          <div className="mb-3">
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${isMultiple ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                  {isMultiple ? '多项选择题' : '单项选择题'}
              </span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800 leading-relaxed">
            {currentQuestion.text}
          </h2>
          {isMultiple && <p className="text-sm text-gray-500 mt-2">(请选择所有正确的选项)</p>}
        </div>

        {/* Options */}
        <div className="p-8 flex-grow space-y-4">
          {currentQuestion.options.map((option, index) => {
            const isSelected = currentSelected.includes(index);
            return (
              <button
                key={index}
                onClick={() => onAnswerSelect(currentQuestion.id, index, isMultiple)}
                className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group
                  ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-md'
                      : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50 text-gray-700'
                  }
                `}
              >
                <div className="flex items-center gap-4">
                  <span
                    className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-colors
                      ${isSelected ? 'text-indigo-600' : 'text-gray-400 group-hover:text-indigo-400'}
                    `}
                  >
                    {/* Render visual checkbox or radio indicator */}
                    {isMultiple ? (
                        isSelected ? <CheckSquare className="w-6 h-6" /> : <Square className="w-6 h-6" />
                    ) : (
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center border font-bold ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300 text-gray-500'}`}>
                            {String.fromCharCode(65 + index)}
                        </span>
                    )}
                  </span>
                  <span className="text-lg">{option}</span>
                </div>
                {isSelected && !isMultiple && <CheckCircle2 className="w-6 h-6 text-indigo-600" />}
              </button>
            );
          })}
        </div>

        {/* Navigation */}
        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
          <button
            onClick={() => onNavigate(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            className="flex items-center px-6 py-2.5 text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
          >
            <ChevronLeft className="w-5 h-5 mr-1" /> 上一题
          </button>

          {currentQuestionIndex === questions.length - 1 ? (
             <button
             onClick={onSubmit}
             className="flex items-center px-8 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-bold shadow-md shadow-green-200"
           >
             提交试卷
           </button>
          ) : (
            <button
              onClick={() => onNavigate(currentQuestionIndex + 1)}
              className="flex items-center px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors font-medium shadow-md shadow-indigo-200"
            >
              下一题 <ChevronRight className="w-5 h-5 ml-1" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExamView;