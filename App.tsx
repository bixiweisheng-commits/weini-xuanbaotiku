import React, { useState, useEffect } from 'react';
import { Settings, FileText, GraduationCap, RotateCcw, Home } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ExamView from './components/ExamView';
import ResultView from './components/ResultView';
import ApiKeyModal from './components/ApiKeyModal';
import { extractTextFromFile } from './services/documentService';
import { generateQuestions } from './services/geminiService';
import { AppState, Question, ExamResult } from './types';

function App() {
  // State
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  
  // Changed to store array of indices for multi-choice support
  const [userAnswers, setUserAnswers] = useState<Record<number, number[]>>({});
  
  // Caching mechanism: Store extracted text to avoid re-parsing
  const [docText, setDocText] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  
  // API Key State
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  // Handlers
  const handleSaveKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('gemini_api_key', key);
  };

  const handleFileUpload = async (file: File) => {
    setAppState(AppState.PROCESSING);
    setError(null);
    setDocText(null); // Clear previous cache on new upload

    try {
      const textContent = await extractTextFromFile(file);
      if (textContent.length < 50) {
          throw new Error("文档内容过少，无法生成试题。");
      }
      setDocText(textContent); // Cache the text
      await processGeneration(textContent);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "发生未知错误，请检查文档是否正常。");
      setAppState(AppState.IDLE);
    }
  };

  const processGeneration = async (text: string) => {
    try {
        const generatedQuestions = await generateQuestions(text, apiKey);
        setQuestions(generatedQuestions);
        setAppState(AppState.EXAM);
        setCurrentQIndex(0);
        setUserAnswers({});
    } catch (err: any) {
        setError(err.message || "AI 生成题目失败。");
        setAppState(AppState.IDLE);
    }
  }

  // Handle re-generation from existing text
  const handleRegenerate = async () => {
      if (!docText) {
          setError("没有可用的文档内容，请重新上传。");
          setAppState(AppState.IDLE);
          return;
      }
      setAppState(AppState.PROCESSING);
      await processGeneration(docText);
  };

  const handleReturnHome = () => {
    setAppState(AppState.IDLE);
    setQuestions([]);
    setUserAnswers({});
    setError(null);
    setDocText(null); // Optional: Clear cache if they want to start fresh completely
  };

  const handleAnswerSelect = (questionId: number, optionIndex: number, isMultiple: boolean) => {
    setUserAnswers((prev) => {
      const currentSelected = prev[questionId] || [];
      
      if (isMultiple) {
        // Toggle selection for multiple choice
        if (currentSelected.includes(optionIndex)) {
            return { ...prev, [questionId]: currentSelected.filter(i => i !== optionIndex) };
        } else {
            return { ...prev, [questionId]: [...currentSelected, optionIndex].sort() };
        }
      } else {
        // Single choice: just replace
        return { ...prev, [questionId]: [optionIndex] };
      }
    });

    // Auto-advance for single choice questions
    if (!isMultiple && currentQIndex < questions.length - 1) {
      setTimeout(() => {
        setCurrentQIndex((prev) => {
          // Double check bounds in case state changed rapidly
          if (prev < questions.length - 1) return prev + 1;
          return prev;
        });
      }, 250); // Small delay to let user see the selection
    }
  };

  const handleSubmitExam = () => {
    setAppState(AppState.RESULT);
  };

  // Calculate Results
  const calculateResult = (): ExamResult => {
    let correct = 0;
    questions.forEach((q) => {
      const userAns = userAnswers[q.id] || [];
      const correctAns = q.correctAnswerIndices;
      
      // Check if arrays match (order independent comparison, though we sort them)
      const isCorrect = 
          userAns.length === correctAns.length && 
          userAns.every(val => correctAns.includes(val));

      if (isCorrect) {
        correct++;
      }
    });
    
    // Score calculation
    const score = Math.round((correct / questions.length) * 100);
    
    return {
      score,
      totalQuestions: questions.length,
      correctCount: correct,
      wrongCount: questions.length - correct,
      userAnswers,
    };
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-gray-800">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleReturnHome}>
              <div className="bg-indigo-600 p-2 rounded-lg">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight text-indigo-900">璇宝<span className="text-indigo-600">题库</span></span>
            </div>
            
            <div className="flex items-center gap-2">
                {appState !== AppState.IDLE && appState !== AppState.PROCESSING && (
                    <button 
                        onClick={handleReturnHome}
                        className="hidden md:flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                        <Home className="w-4 h-4" /> 返回主页
                    </button>
                )}
                <button
                onClick={() => setIsKeyModalOpen(true)}
                className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-full transition-colors"
                title="设置 API Key"
                >
                <Settings className="w-6 h-6" />
                </button>
            </div>
          </div>
        </div>
      </nav>

      <ApiKeyModal 
        isOpen={isKeyModalOpen} 
        onClose={() => setIsKeyModalOpen(false)} 
        onSave={handleSaveKey}
        currentKey={apiKey}
      />

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-start pt-12 px-4 pb-12">
        {appState === AppState.IDLE || appState === AppState.PROCESSING ? (
          <div className="text-center w-full max-w-4xl">
             {appState === AppState.IDLE && (
                <div className="mb-12 space-y-4">
                    <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
                        将文档一键转化为 <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
                             智能互动试卷
                        </span>
                    </h1>
                    <p className="text-xl text-gray-500 max-w-2xl mx-auto">
                        支持生成 50 道混合题型（单选/多选）。<br/>
                        上传您的学习资料 (PDF/Word)，AI 将自动评分并提供详细解析。
                    </p>
                </div>
             )}
            
            <FileUpload 
              onFileSelect={handleFileUpload} 
              isLoading={appState === AppState.PROCESSING} 
              error={error}
            />

            {appState === AppState.IDLE && (
                 <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
                    <FeatureCard 
                        icon={<FileText className="w-6 h-6 text-blue-500" />}
                        title="50 道精选试题"
                        desc="深度分析文档，一次生成包含单选和多选的完整试卷。"
                    />
                    <FeatureCard 
                        icon={<RotateCcw className="w-6 h-6 text-purple-500" />}
                        title="智能缓存优化"
                        desc="无需重复上传，直接基于现有文档重新生成新试题，节省算力。"
                    />
                     <FeatureCard 
                        icon={<GraduationCap className="w-6 h-6 text-green-500" />}
                        title="多维度测评"
                        desc="支持多选题评分，提供每一道题的详细解析和导出功能。"
                    />
                 </div>
            )}
          </div>
        ) : appState === AppState.EXAM ? (
          <ExamView
            questions={questions}
            currentQuestionIndex={currentQIndex}
            userAnswers={userAnswers}
            onAnswerSelect={handleAnswerSelect}
            onNavigate={setCurrentQIndex}
            onSubmit={handleSubmitExam}
            onReturnHome={handleReturnHome}
          />
        ) : (
          <ResultView
            questions={questions}
            result={calculateResult()}
            onRetry={handleRegenerate}
            onNewFile={handleReturnHome}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
           <p>&copy; {new Date().getFullYear()} 璇宝的考试题库. Powered by Google Gemini.</p>
        </div>
      </footer>
    </div>
  );
}

const FeatureCard = ({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) => (
    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
        <div className="mb-4 bg-gray-50 w-12 h-12 rounded-lg flex items-center justify-center">
            {icon}
        </div>
        <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
        <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
    </div>
)

export default App;