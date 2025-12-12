import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { getRandomQuestions, saveQuizScore, QuizQuestion } from '../services/quizService';
import { getUserPowerUps, usePowerUp } from '../services/shopService';

interface QuizScreenProps {
  onShowRanking?: () => void;
}

export const QuizScreen: React.FC<QuizScreenProps> = ({ onShowRanking }) => {
  const { colors } = useTheme();
  const { user, userData, refreshUserData } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
  const [quizStarted, setQuizStarted] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [powerUps, setPowerUps] = useState<{ eliminate_option: number; extra_time: number; special_hint: number }>({
    eliminate_option: 0,
    extra_time: 0,
    special_hint: 0,
  });
  const [timeRemaining, setTimeRemaining] = useState(30);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    loadQuestions();
    if (user) {
      loadPowerUps();
    }
  }, [user]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (quizStarted && timerActive && timeRemaining > 0 && !showResult) {
      timer = setTimeout(() => setTimeRemaining(prev => prev - 1), 1000);
    } else if (timeRemaining === 0 && timerActive) {
      Alert.alert('Tempo Esgotado!', 'Você não respondeu a tempo.');
      handleNext(true);
    }
    return () => clearTimeout(timer);
  }, [timeRemaining, quizStarted, timerActive, showResult]);

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const qs = getRandomQuestions(10);
      setQuestions(qs);
    } catch (error) {
      Alert.alert('Erro', 'Não foi possível carregar as perguntas');
    } finally {
      setLoading(false);
    }
  };

  const loadPowerUps = async () => {
    if (!user) return;
    try {
      const userPowerUps = await getUserPowerUps(user.uid);
      setPowerUps({
        eliminate_option: userPowerUps.find(p => p.type === 'eliminate_option')?.uses || 0,
        extra_time: userPowerUps.find(p => p.type === 'extra_time')?.uses || 0,
        special_hint: userPowerUps.find(p => p.type === 'special_hint')?.uses || 0,
      });
    } catch (error) {
      console.error('Erro ao carregar power-ups:', error);
    }
  };

  const startQuiz = () => {
    setQuizStarted(true);
    setStartTime(Date.now());
    setCurrentQuestionIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setTimeRemaining(30);
    setTimerActive(true);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  };

  const handleNext = async (timeExpired = false) => {
    if (!timeExpired && selectedAnswer === null) {
      Alert.alert('Atenção', 'Por favor, selecione uma resposta');
      return;
    }

    setTimerActive(false);
    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = timeExpired ? false : (selectedAnswer === currentQuestion.correctAnswer);

    if (isCorrect) {
      setScore((prev) => prev + 10);
      setCorrectAnswers((prev) => prev + 1);
    }

    setShowResult(true);

    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
        setSelectedAnswer(null);
        setShowResult(false);
        setTimeRemaining(30);
        setTimerActive(true);
      } else {
        finishQuiz(isCorrect);
      }
    }, 2000);
  };

  const finishQuiz = async (lastAnswerCorrect: boolean) => {
    setTimerActive(false);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    const finalScore = score + (lastAnswerCorrect ? 10 : 0);
    const finalCorrectAnswers = correctAnswers + (lastAnswerCorrect ? 1 : 0);

    setSaving(true);
    try {
      if (user && userData) {
        await saveQuizScore(
          user.uid,
          userData.name,
          userData.photoURL,
          finalScore,
          questions.length,
          finalCorrectAnswers,
          timeSpent
        );
        await refreshUserData();
      }
    } catch (error) {
      console.error('Erro ao salvar pontuação:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleUsePowerUp = async (type: 'eliminate_option' | 'extra_time' | 'special_hint') => {
    if (!user || !userData) {
      Alert.alert('Erro', 'Você precisa estar logado para usar power-ups.');
      return;
    }
    if (powerUps[type] <= 0) {
      Alert.alert('Sem Power-ups', `Você não tem mais "${type.replace('_', ' ')}" disponíveis.`);
      return;
    }

    try {
      const powerUpsList = await getUserPowerUps(user.uid);
      const powerUp = powerUpsList.find(p => p.type === type);
      if (powerUp) {
        await usePowerUp(user.uid, powerUp.id);
        await loadPowerUps();
        await refreshUserData();

        if (type === 'eliminate_option') {
          Alert.alert('Power-up Ativado', 'Uma opção incorreta foi removida');
        } else if (type === 'extra_time') {
          setTimeRemaining(prev => prev + 15);
          Alert.alert('Power-up Ativado', 'Você ganhou 15 segundos extras!');
        } else if (type === 'special_hint') {
          Alert.alert('Power-up Ativado', 'Dica: A resposta está relacionada a um evento bíblico.');
        }
      }
    } catch (error: any) {
      console.error('Erro ao usar power-up:', error);
      Alert.alert('Erro', error.message || 'Não foi possível usar o power-up.');
    }
  };

  const resetQuiz = () => {
    loadQuestions();
    setQuizStarted(false);
    setPowerUps({ eliminate_option: 0, extra_time: 0, special_hint: 0 });
    loadPowerUps();
    setTimeRemaining(30);
    setTimerActive(false);
  };

  const styles = createStyles(colors);

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Carregando perguntas...</Text>
      </View>
    );
  }

  if (!quizStarted) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="book" size={100} color={colors.primary} />
        <Text style={[styles.welcomeTitle, { color: colors.text }]}>Bem-vindo ao Quiz Bíblico!</Text>
        <Text style={[styles.welcomeText, { color: colors.textSecondary }]}>
          Teste seus conhecimentos da Bíblia e ganhe moedas!
        </Text>
        <TouchableOpacity style={[styles.startButton, { backgroundColor: colors.primary }]} onPress={startQuiz}>
          <Text style={styles.startButtonText}>Começar Quiz</Text>
        </TouchableOpacity>
        {onShowRanking && (
          <TouchableOpacity style={styles.rankingButton} onPress={onShowRanking}>
            <Ionicons name="trophy" size={20} color={colors.primary} />
            <Text style={[styles.rankingButtonText, { color: colors.primary }]}>Ver Ranking</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (currentQuestionIndex >= questions.length) {
    const finalScore = score;
    const percentage = Math.round((correctAnswers / questions.length) * 100);
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <View style={styles.resultContainer}>
          <Ionicons
            name={percentage >= 70 ? 'trophy' : percentage >= 50 ? 'star' : 'book'}
            size={80}
            color={percentage >= 70 ? '#FFD700' : percentage >= 50 ? colors.primary : colors.textSecondary}
          />
          <Text style={[styles.resultTitle, { color: colors.text }]}>Quiz Finalizado!</Text>
          <Text style={[styles.resultScore, { color: colors.text }]}>Pontuação: {finalScore} pontos</Text>
          <Text style={[styles.resultText, { color: colors.textSecondary }]}>
            Você acertou {correctAnswers} de {questions.length} perguntas
          </Text>
          <Text style={[styles.resultPercentage, { color: colors.primary }]}>{percentage}% de acerto</Text>
          <Text style={[styles.resultTime, { color: colors.textSecondary }]}>
            Tempo: {Math.floor(timeSpent / 60)}min {timeSpent % 60}s
          </Text>

          {saving && (
            <View style={styles.savingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={[styles.savingText, { color: colors.textSecondary }]}>Salvando pontuação...</Text>
            </View>
          )}

          <View style={styles.resultButtons}>
            <TouchableOpacity style={[styles.restartButton, { backgroundColor: colors.primary }]} onPress={resetQuiz}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.restartButtonText}>Novo Quiz</Text>
            </TouchableOpacity>

            {onShowRanking && (
              <TouchableOpacity style={styles.rankingButtonResult} onPress={onShowRanking}>
                <Ionicons name="trophy" size={20} color={colors.primary} />
                <Text style={[styles.rankingButtonText, { color: colors.primary }]}>Ver Ranking</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
  const hasSelected = selectedAnswer !== null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.quizContainer}>
      <View style={styles.progressContainer}>
        <Text style={[styles.progressText, { color: colors.text }]}>
          Pergunta {currentQuestionIndex + 1} de {questions.length}
        </Text>
        <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.progressFill,
              { width: `${((currentQuestionIndex + 1) / questions.length) * 100}%`, backgroundColor: colors.primary },
            ]}
          />
        </View>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreText, { color: colors.text }]}>Pontuação: {score}</Text>
        <Text style={[styles.scoreText, { color: colors.text }]}>Acertos: {correctAnswers}/{currentQuestionIndex}</Text>
        <Text style={[styles.timerText, { color: colors.text }]}>Tempo: {timeRemaining}s</Text>
      </View>

      <View style={styles.questionContainer}>
        <Text style={[styles.questionText, { color: colors.text }]}>{currentQuestion.question}</Text>
        {currentQuestion.reference && (
          <Text style={[styles.referenceText, { color: colors.textSecondary }]}>{currentQuestion.reference}</Text>
        )}
      </View>

      <View style={styles.optionsContainer}>
        {currentQuestion.options.map((option, index) => {
          let optionStyle = [styles.option, { borderColor: colors.border }];
          let textStyle = [styles.optionText, { color: colors.text }];

          if (showResult) {
            if (index === currentQuestion.correctAnswer) {
              optionStyle = [styles.option, styles.optionCorrect, { backgroundColor: colors.success + '20' }];
              textStyle = [styles.optionText, styles.optionTextCorrect, { color: colors.success }];
            } else if (index === selectedAnswer && index !== currentQuestion.correctAnswer) {
              optionStyle = [styles.option, styles.optionIncorrect, { backgroundColor: colors.error + '20' }];
              textStyle = [styles.optionText, styles.optionTextIncorrect, { color: colors.error }];
            }
          } else if (selectedAnswer === index) {
            optionStyle = [styles.option, styles.optionSelected, { borderColor: colors.primary }];
          }

          return (
            <TouchableOpacity
              key={index}
              style={optionStyle}
              onPress={() => handleAnswerSelect(index)}
              disabled={showResult}
            >
              <Text style={textStyle}>{option}</Text>
              {showResult && index === currentQuestion.correctAnswer && (
                <Ionicons name="checkmark-circle" size={24} color={colors.success} />
              )}
              {showResult && index === selectedAnswer && index !== currentQuestion.correctAnswer && (
                <Ionicons name="close-circle" size={24} color={colors.error} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={styles.powerUpsContainer}>
        <TouchableOpacity
          style={[styles.powerUpButton, { borderColor: colors.primary }]}
          onPress={() => handleUsePowerUp('eliminate_option')}
          disabled={powerUps.eliminate_option <= 0 || showResult}
        >
          <Ionicons name="cut" size={20} color={powerUps.eliminate_option > 0 ? colors.primary : colors.textSecondary} />
          <Text style={[styles.powerUpButtonText, { color: powerUps.eliminate_option > 0 ? colors.primary : colors.textSecondary }]}>
            Eliminar ({powerUps.eliminate_option})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.powerUpButton, { borderColor: colors.success }]}
          onPress={() => handleUsePowerUp('extra_time')}
          disabled={powerUps.extra_time <= 0 || showResult}
        >
          <Ionicons name="time" size={20} color={powerUps.extra_time > 0 ? colors.success : colors.textSecondary} />
          <Text style={[styles.powerUpButtonText, { color: powerUps.extra_time > 0 ? colors.success : colors.textSecondary }]}>
            Tempo Extra ({powerUps.extra_time})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.powerUpButton, { borderColor: colors.warning }]}
          onPress={() => handleUsePowerUp('special_hint')}
          disabled={powerUps.special_hint <= 0 || showResult}
        >
          <Ionicons name="bulb" size={20} color={powerUps.special_hint > 0 ? colors.warning : colors.textSecondary} />
          <Text style={[styles.powerUpButtonText, { color: powerUps.special_hint > 0 ? colors.warning : colors.textSecondary }]}>
            Dica ({powerUps.special_hint})
          </Text>
        </TouchableOpacity>
      </View>

      {!showResult && hasSelected && (
        <TouchableOpacity style={[styles.nextButton, { backgroundColor: colors.primary }]} onPress={() => handleNext()}>
          <Text style={styles.nextButtonText}>Confirmar Resposta</Text>
        </TouchableOpacity>
      )}

      {showResult && (
        <View style={styles.feedbackContainer}>
          <Text style={[styles.feedbackText, isCorrect ? { color: colors.success } : { color: colors.error }]}>
            {isCorrect ? '✓ Resposta Correta!' : '✗ Resposta Incorreta'}
          </Text>
          {!isCorrect && (
            <Text style={[styles.correctAnswerText, { color: colors.textSecondary }]}>
              A resposta correta é: {currentQuestion.options[currentQuestion.correctAnswer]}
            </Text>
          )}
        </View>
      )}
    </ScrollView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centerContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 40,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: colors.textSecondary,
    },
    welcomeTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 20,
      textAlign: 'center',
    },
    welcomeText: {
      fontSize: 16,
      marginTop: 8,
      textAlign: 'center',
    },
    startButton: {
      paddingHorizontal: 32,
      paddingVertical: 16,
      borderRadius: 12,
      marginTop: 24,
    },
    startButtonText: {
      color: '#fff',
      fontSize: 18,
      fontWeight: 'bold',
    },
    rankingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 16,
      gap: 8,
    },
    rankingButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    contentContainer: {
      flexGrow: 1,
      justifyContent: 'center',
      padding: 20,
    },
    resultContainer: {
      alignItems: 'center',
    },
    resultTitle: {
      fontSize: 28,
      fontWeight: 'bold',
      marginTop: 20,
    },
    resultScore: {
      fontSize: 24,
      fontWeight: 'bold',
      marginTop: 12,
    },
    resultText: {
      fontSize: 16,
      marginTop: 8,
    },
    resultPercentage: {
      fontSize: 32,
      fontWeight: 'bold',
      marginTop: 12,
    },
    resultTime: {
      fontSize: 14,
      marginTop: 8,
    },
    savingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 20,
      gap: 8,
    },
    savingText: {
      fontSize: 14,
    },
    resultButtons: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 24,
    },
    restartButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      gap: 8,
    },
    restartButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
    rankingButtonResult: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: colors.primary,
      gap: 8,
    },
    quizContainer: {
      padding: 20,
    },
    progressContainer: {
      marginBottom: 20,
    },
    progressText: {
      fontSize: 14,
      marginBottom: 8,
    },
    progressBar: {
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
    },
    scoreContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: 20,
    },
    scoreText: {
      fontSize: 14,
      fontWeight: '600',
    },
    timerText: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    questionContainer: {
      marginBottom: 24,
    },
    questionText: {
      fontSize: 20,
      fontWeight: '600',
      marginBottom: 8,
    },
    referenceText: {
      fontSize: 14,
      fontStyle: 'italic',
    },
    optionsContainer: {
      marginBottom: 20,
    },
    option: {
      padding: 16,
      borderRadius: 12,
      borderWidth: 2,
      marginBottom: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    optionSelected: {
      borderWidth: 2,
    },
    optionCorrect: {
      borderWidth: 2,
    },
    optionIncorrect: {
      borderWidth: 2,
    },
    optionText: {
      fontSize: 16,
      flex: 1,
    },
    optionTextCorrect: {
      fontWeight: 'bold',
    },
    optionTextIncorrect: {
      fontWeight: 'bold',
    },
    powerUpsContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginTop: 20,
      marginBottom: 10,
      gap: 10,
    },
    powerUpButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
      borderRadius: 12,
      borderWidth: 2,
      backgroundColor: colors.surface,
    },
    powerUpButtonText: {
      fontSize: 12,
      fontWeight: '600',
    },
    nextButton: {
      paddingVertical: 16,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 20,
    },
    nextButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: 'bold',
    },
    feedbackContainer: {
      marginTop: 20,
      alignItems: 'center',
    },
    feedbackText: {
      fontSize: 18,
      fontWeight: 'bold',
    },
    correctAnswerText: {
      fontSize: 14,
      marginTop: 8,
      textAlign: 'center',
    },
  });

