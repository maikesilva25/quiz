import { collection, getDocs, query, orderBy, Timestamp, doc, setDoc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../config/firebase';
import { QuizQuestion, QuizScore } from '../types';
import { addCoins } from './coinsService';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  reference?: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    question: 'Quem construiu a arca?',
    options: ['Noé', 'Moisés', 'Abraão', 'Davi'],
    correctAnswer: 0,
    reference: 'Gênesis 6:14-22',
  },
  {
    question: 'Quantos discípulos Jesus escolheu?',
    options: ['10', '11', '12', '13'],
    correctAnswer: 2,
    reference: 'Mateus 10:1-4',
  },
  {
    question: 'Qual foi o primeiro milagre de Jesus?',
    options: ['Cura do cego', 'Multiplicação dos pães', 'Transformação da água em vinho', 'Caminhar sobre as águas'],
    correctAnswer: 2,
    reference: 'João 2:1-11',
  },
  {
    question: 'Quem negou Jesus três vezes?',
    options: ['Judas', 'Pedro', 'João', 'Tiago'],
    correctAnswer: 1,
    reference: 'Mateus 26:69-75',
  },
  {
    question: 'Qual livro da Bíblia tem mais capítulos?',
    options: ['Gênesis', 'Salmos', 'Isaías', 'Jeremias'],
    correctAnswer: 1,
    reference: 'Salmos tem 150 capítulos',
  },
  {
    question: 'Quem foi lançado na cova dos leões?',
    options: ['Daniel', 'José', 'Davi', 'Elias'],
    correctAnswer: 0,
    reference: 'Daniel 6:16-23',
  },
  {
    question: 'Qual é o primeiro livro do Novo Testamento?',
    options: ['João', 'Mateus', 'Marcos', 'Lucas'],
    correctAnswer: 1,
    reference: 'Mateus',
  },
  {
    question: 'Quem foi o primeiro homem criado por Deus?',
    options: ['Abel', 'Adão', 'Caim', 'Sete'],
    correctAnswer: 1,
    reference: 'Gênesis 2:7',
  },
  {
    question: 'Quantos dias e noites choveu durante o dilúvio?',
    options: ['30', '40', '50', '60'],
    correctAnswer: 1,
    reference: 'Gênesis 7:12',
  },
  {
    question: 'Qual apóstolo escreveu mais livros do Novo Testamento?',
    options: ['Pedro', 'João', 'Paulo', 'Tiago'],
    correctAnswer: 2,
    reference: 'Paulo escreveu 13 epístolas',
  },
];

export const getRandomQuestions = (count: number = 10): QuizQuestion[] => {
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const saveQuizScore = async (
  userId: string,
  userName: string,
  userPhotoURL: string | undefined,
  score: number,
  totalQuestions: number,
  correctAnswers: number,
  timeSpent?: number
): Promise<string> => {
  try {
    // Verificar se já existe um registro para este usuário
    const userScoreRef = doc(db, 'userScores', userId);
    const userScoreDoc = await getDoc(userScoreRef);

    let coinsEarned = correctAnswers * 10;
    const percentage = (correctAnswers / totalQuestions) * 100;

    if (percentage >= 90) {
      coinsEarned += 50;
    } else if (percentage >= 80) {
      coinsEarned += 30;
    } else if (percentage >= 70) {
      coinsEarned += 20;
    }

    if (correctAnswers === totalQuestions) {
      coinsEarned += 100;
    }

    if (coinsEarned > 0) {
      await addCoins(userId, coinsEarned);
      console.log(`Usuário ${userName} ganhou ${coinsEarned} moedas.`);
    }

    if (userScoreDoc.exists()) {
      // Atualizar pontos existentes
      const currentData = userScoreDoc.data();
      await updateDoc(userScoreRef, {
        userName,
        userPhotoURL: userPhotoURL || currentData.userPhotoURL || null,
        score: increment(score),
        totalQuestions: increment(totalQuestions),
        correctAnswers: increment(correctAnswers),
        updatedAt: Timestamp.now(),
      });
      return userScoreDoc.id;
    } else {
      // Criar novo registro
      await setDoc(userScoreRef, {
        userId,
        userName,
        userPhotoURL: userPhotoURL || null,
        score,
        totalQuestions,
        correctAnswers,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return userScoreRef.id;
    }
  } catch (error) {
    console.error('Erro ao salvar pontuação do quiz:', error);
    throw error;
  }
};

export const getQuizRanking = async (limit: number = 10): Promise<QuizScore[]> => {
  try {
    // Buscar da coleção userScores onde cada usuário tem apenas um registro
    const q = query(collection(db, 'userScores'), orderBy('score', 'desc'));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.slice(0, limit).map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        userName: data.userName,
        userPhotoURL: data.userPhotoURL,
        score: data.score,
        totalQuestions: data.totalQuestions,
        correctAnswers: data.correctAnswers,
        createdAt: data.createdAt ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt ? data.updatedAt.toDate() : new Date(),
      } as QuizScore;
    });
  } catch (error) {
    console.error('Erro ao buscar ranking:', error);
    return [];
  }
};

