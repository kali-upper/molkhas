import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, ArrowRight, RefreshCw, Trophy } from 'lucide-react';
import { quizService } from '../lib/quiz';
import { useAuth } from '../contexts/AuthContext';
import { useAnalytics } from '../hooks/useAnalytics';

interface QuizPlayerProps {
  quizId: string;
  onComplete?: (score: number) => void;
  onClose?: () => void;
}

export function QuizPlayer({ quizId, onComplete, onClose }: QuizPlayerProps) {
  const { user } = useAuth();
  const { trackEvent } = useAnalytics();
  
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [answers, setAnswers] = useState<any[]>([]);

  useEffect(() => {
    loadQuiz();
  }, [quizId]);

  const loadQuiz = async () => {
    try {
      setLoading(true);
      const { quiz, questions } = await quizService.getQuiz(quizId);
      setQuiz(quiz);
      setQuestions(questions);
      trackEvent('quiz_started', { quiz_id: quizId, title: quiz.title });
    } catch (error) {
      console.error('Error loading quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionSelect = (index: number) => {
    if (isAnswered) return;
    setSelectedOption(index);
  };

  const handleSubmitAnswer = () => {
    if (selectedOption === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedOption === currentQuestion.correct_answer;
    
    setIsAnswered(true);
    if (isCorrect) {
      setScore(score + 1);
    }

    setAnswers([
      ...answers,
      {
        question_id: currentQuestion.id,
        selected_option: selectedOption,
        is_correct: isCorrect
      }
    ]);

    trackEvent('question_answered', {
      quiz_id: quizId,
      question_index: currentQuestionIndex,
      is_correct: isCorrect
    });
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    setShowResults(true);
    // Score is already updated in handleSubmitAnswer
    
    // Save attempt
    if (user) {
      await quizService.submitAttempt(quizId, user.id, score, questions.length, answers);
    }
    
    trackEvent('quiz_completed', {
      quiz_id: quizId,
      score: score,
      total: questions.length
    });

    if (onComplete) onComplete(score);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quiz || questions.length === 0) {
    return <div className="text-center p-8 text-red-500">فشل تحميل الاختبار</div>;
  }

  if (showResults) {
    const percentage = Math.round((score / questions.length) * 100);
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center animate-fade-in">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">اكتمل الاختبار!</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">نتيجتك النهائية</p>
        
        <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mb-2">
          {percentage}%
        </div>
        <p className="text-gray-500 dark:text-gray-400 mb-8">
          {score} من {questions.length} إجابات صحيحة
        </p>

        <div className="flex justify-center gap-4">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            إغلاق
          </button>
          <button
            onClick={() => {
              setCurrentQuestionIndex(0);
              setScore(0);
              setAnswers([]);
              setShowResults(false);
              setIsAnswered(false);
              setSelectedOption(null);
            }}
            className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            إعادة الاختبار
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
      {/* Progress Bar */}
      <div className="h-2 bg-gray-100 dark:bg-gray-700">
        <div 
          className="h-full bg-blue-600 transition-all duration-300"
          style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="p-6 sm:p-8">
        <div className="flex justify-between items-center mb-6">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            سؤال {currentQuestionIndex + 1} من {questions.length}
          </span>
          <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {score} نقاط
          </span>
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 leading-relaxed">
          {currentQuestion.question}
        </h3>

        <div className="space-y-3 mb-8">
          {currentQuestion.options.map((option: string, index: number) => {
            let optionClass = "w-full text-right p-4 rounded-lg border-2 transition-all ";
            
            if (isAnswered) {
              if (index === currentQuestion.correct_answer) {
                optionClass += "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300";
              } else if (index === selectedOption) {
                optionClass += "border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300";
              } else {
                optionClass += "border-gray-200 dark:border-gray-700 opacity-50";
              }
            } else {
              if (selectedOption === index) {
                optionClass += "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300";
              } else {
                optionClass += "border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700 text-gray-700 dark:text-gray-300";
              }
            }

            return (
              <button
                key={index}
                onClick={() => handleOptionSelect(index)}
                disabled={isAnswered}
                className={optionClass}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {isAnswered && index === currentQuestion.correct_answer && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {isAnswered && index === selectedOption && index !== currentQuestion.correct_answer && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end">
          {!isAnswered ? (
            <button
              onClick={handleSubmitAnswer}
              disabled={selectedOption === null}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              تحقق من الإجابة
            </button>
          ) : (
            <button
              onClick={handleNextQuestion}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>{currentQuestionIndex === questions.length - 1 ? 'إنهاء' : 'السؤال التالي'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
