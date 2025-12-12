import React, { useMemo } from 'react';
import { Question, ExamResult } from '../types';
import { Download, RefreshCw, XCircle, CheckCircle, Award, Upload } from 'lucide-react';
import { exportToWord } from '../services/exportService';

interface ResultViewProps {
  questions: Question[];
  result: ExamResult;
  onRetry: () => void;
  onNewFile: () => void;
}

const ResultView: React.FC<ResultViewProps> = ({ questions, result, onRetry, onNewFile }) => {
  // Score is already calculated as 0-100 in App.tsx
  const percentage = result.score;
  
  const handleExport = () => {
    exportToWord(questions, "璇宝题库_考试结果.docx");
  };

  const gradeColor = useMemo(() => {
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 70) return 'text-indigo-600';
    if (percentage >= 50) return 'text-yellow-600';
    return 'text-red-600';
  }, [percentage]);

  return (
    <div className="max-w-5xl mx-auto w-full pb-12">
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
        <div className="bg-indigo-600 p-8 text-center text-white">
          <Award className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-2">考试结束！</h2>
          <p className="opacity-90">以下是您的详细成绩报告</p>
        </div>
        
        <div className="grid grid-cols-3 gap-1 p-6 md:p-8 text-center border-b border-gray-100">
           <div className="p-4 rounded-xl bg-gray-50">
             <div className={`text-4xl font-black ${gradeColor} mb-1`}>{percentage}分</div>
             <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold">总分 (100)</div>
           </div>
           <div className="p-4 rounded-xl bg-green-50">
             <div className="text-4xl font-black text-green-600 mb-1">{result.correctCount}</div>
             <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold">正确</div>
           </div>
           <div className="p-4 rounded-xl bg-red-50">
             <div className="text-4xl font-black text-red-600 mb-1">{result.wrongCount}</div>
             <div className="text-sm text-gray-500 uppercase tracking-wide font-semibold">错误</div>
           </div>
        </div>

        <div className="p-6 flex flex-col md:flex-row gap-4 justify-center">
          <button
            onClick={onNewFile}
            className="flex items-center justify-center px-6 py-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl transition-colors font-medium shadow-sm"
          >
            <Upload className="w-5 h-5 mr-2" /> 上传新文档
          </button>
          <button
            onClick={onRetry}
            className="flex items-center justify-center px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white rounded-xl transition-colors font-medium shadow-lg"
          >
            <RefreshCw className="w-5 h-5 mr-2" /> 重新生成题目
          </button>
          <button
            onClick={handleExport}
            className="flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors font-medium shadow-lg"
          >
            <Download className="w-5 h-5 mr-2" /> 导出 Word 文档
          </button>
        </div>
      </div>

      <div className="space-y-6">
        <h3 className="text-2xl font-bold text-gray-800 ml-2">详细解析</h3>
        
        {questions.map((q, index) => {
          const userAns = result.userAnswers[q.id] || [];
          const correctAns = q.correctAnswerIndices;
          
          // Determine if correct
          const isCorrect = userAns.length === correctAns.length && userAns.every(v => correctAns.includes(v));
          
          return (
            <div
              key={q.id}
              className={`bg-white rounded-xl border-l-4 shadow-sm p-6 ${
                isCorrect ? 'border-green-500' : 'border-red-500'
              }`}
            >
              <div className="flex items-start gap-4 mb-4">
                <span className="font-bold text-gray-400 mt-1">#{index + 1}</span>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                        <span className={`text-xs px-2 py-0.5 rounded border ${q.type === 'multiple' ? 'border-purple-200 text-purple-700 bg-purple-50' : 'border-blue-200 text-blue-700 bg-blue-50'}`}>
                            {q.type === 'multiple' ? '多选' : '单选'}
                        </span>
                        <h4 className="text-lg font-semibold text-gray-900">{q.text}</h4>
                    </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {q.options.map((opt, optIdx) => {
                        let btnClass = "border-gray-200 text-gray-600 bg-gray-50";
                        const isSelectedByUser = userAns.includes(optIdx);
                        const isActuallyCorrect = correctAns.includes(optIdx);
                        
                        // Logic for highlighting results
                        if (isActuallyCorrect) {
                            btnClass = "border-green-500 bg-green-50 text-green-800 font-medium ring-1 ring-green-500";
                        } else if (isSelectedByUser && !isActuallyCorrect) {
                            btnClass = "border-red-400 bg-red-50 text-red-800";
                        }

                        return (
                            <div key={optIdx} className={`p-3 rounded-lg border text-sm ${btnClass} flex items-center gap-2`}>
                                <div className="w-5 h-5 flex items-center justify-center">
                                    {isActuallyCorrect && <CheckCircle className="w-4 h-4" />}
                                    {isSelectedByUser && !isActuallyCorrect && <XCircle className="w-4 h-4" />}
                                </div>
                                {opt}
                            </div>
                        )
                    })}
                  </div>
                </div>
              </div>

              {!isCorrect && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg text-sm text-yellow-900 border border-yellow-100 flex items-start gap-3">
                    <div className="mt-1 font-bold text-yellow-600 uppercase text-xs tracking-wider">解析</div>
                    <div className="leading-relaxed">{q.explanation}</div>
                </div>
              )}
               {isCorrect && (
                <div className="mt-4 p-4 bg-green-50 rounded-lg text-sm text-green-900 border border-green-100 flex items-start gap-3">
                    <div className="mt-1 font-bold text-green-600 uppercase text-xs tracking-wider">知识点</div>
                    <div className="leading-relaxed">{q.explanation}</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ResultView;