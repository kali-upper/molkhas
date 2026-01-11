import { supabase } from './supabase';


export interface QuizData {
    title: string;
    questions: {
        question: string;
        options: string[];
        correctAnswer: number;
        explanation?: string;
    }[];
}

export class QuizService {
    // Save a generated quiz to the database
    async saveQuiz(userId: string, quizData: QuizData, sourceType: string = 'ai_generated') {
        try {
            // 1. Create the quiz record
            const { data: quiz, error: quizError } = await supabase
                .from('quizzes')
                .insert({
                    title: quizData.title,
                    user_id: userId,
                    source_type: sourceType
                })
                .select()
                .single();

            if (quizError) throw quizError;

            // 2. Create the questions
            const questionsToInsert = quizData.questions.map((q, index) => ({
                quiz_id: quiz.id,
                question: q.question,
                options: q.options,
                correct_answer: q.correctAnswer,
                explanation: q.explanation,
                order_index: index
            }));

            const { error: questionsError } = await supabase
                .from('quiz_questions')
                .insert(questionsToInsert);

            if (questionsError) throw questionsError;

            return quiz.id;
        } catch (error) {
            console.error('Error saving quiz:', error);
            throw error;
        }
    }

    // Fetch a quiz and its questions
    async getQuiz(quizId: string) {
        try {
            const { data: quiz, error: quizError } = await supabase
                .from('quizzes')
                .select('*')
                .eq('id', quizId)
                .single();

            if (quizError) throw quizError;

            const { data: questions, error: questionsError } = await supabase
                .from('quiz_questions')
                .select('*')
                .eq('quiz_id', quizId)
                .order('order_index');

            if (questionsError) throw questionsError;

            return { quiz, questions };
        } catch (error) {
            console.error('Error fetching quiz:', error);
            throw error;
        }
    }

    // Submit a quiz attempt
    async submitAttempt(quizId: string, userId: string | null, score: number, totalQuestions: number, answers: any[]) {
        try {
            const { error } = await supabase
                .from('quiz_attempts')
                .insert({
                    quiz_id: quizId,
                    user_id: userId,
                    score,
                    total_questions: totalQuestions,
                    answers
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error submitting attempt:', error);
            throw error;
        }
    }

    // Get user's quiz history
    async getUserAttempts(userId: string) {
        try {
            const { data, error } = await supabase
                .from('quiz_attempts')
                .select('*, quizzes(title)')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching attempts:', error);
            throw error;
        }
    }
}

export const quizService = new QuizService();
