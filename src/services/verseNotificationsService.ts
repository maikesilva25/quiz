import * as Notifications from 'expo-notifications';
import { getRandomVerse, getVerseOfTheDay } from './bibleService';
import { Platform } from 'react-native';

// Configurar como as notificações devem ser tratadas quando o app está em foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Solicita permissão para enviar notificações
 */
export const requestNotificationPermissions = async (): Promise<boolean> => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      console.log('Permissão de notificações negada');
      return false;
    }
    
    // Configurar canal de notificação para Android
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('verse-notifications', {
        name: 'Versículos Bíblicos',
        description: 'Notificações diárias com versículos da Bíblia',
        importance: Notifications.AndroidImportance.HIGH,
        sound: true,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#667eea',
      });
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao solicitar permissão de notificações:', error);
    return false;
  }
};

/**
 * Agenda uma notificação com versículo bíblico
 */
export const scheduleVerseNotification = async (
  hour: number = 8,
  minute: number = 0,
  version: string = 'nvi'
): Promise<string | null> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return null;
    }

    // Buscar versículo do dia
    let verse;
    try {
      verse = await getVerseOfTheDay(version);
    } catch (error) {
      console.log('Erro ao buscar versículo do dia, tentando versículo aleatório...', error);
      // Fallback para versículo aleatório
      verse = await getRandomVerse(version);
    }

    if (!verse) {
      console.error('Não foi possível obter versículo');
      return null;
    }

    // Formatar texto da notificação
    const reference = `${verse.book.name} ${verse.chapter}:${verse.number}`;
    const title = `📖 ${reference}`;
    const body = verse.text.length > 100 
      ? `${verse.text.substring(0, 100)}...` 
      : verse.text;

    // Calcular próxima data/hora
    const now = new Date();
    const scheduledDate = new Date();
    scheduledDate.setHours(hour, minute, 0, 0);
    
    // Se já passou o horário de hoje, agendar para amanhã
    if (scheduledDate.getTime() <= now.getTime()) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    // Agendar notificação diária
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: {
          type: 'verse',
          reference,
          book: verse.book.name,
          chapter: verse.chapter,
          verse: verse.number,
          version,
        },
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    console.log(`Notificação de versículo agendada para ${hour}:${minute.toString().padStart(2, '0')}`);
    return notificationId;
  } catch (error) {
    console.error('Erro ao agendar notificação de versículo:', error);
    return null;
  }
};

/**
 * Agenda múltiplas notificações de versículos ao longo do dia
 */
export const scheduleMultipleVerseNotifications = async (
  times: Array<{ hour: number; minute: number }> = [
    { hour: 8, minute: 0 },   // Manhã
    { hour: 12, minute: 0 },  // Meio-dia
    { hour: 18, minute: 0 },  // Tarde
  ],
  version: string = 'nvi'
): Promise<string[]> => {
  const notificationIds: string[] = [];
  
  for (const time of times) {
    const id = await scheduleVerseNotification(time.hour, time.minute, version);
    if (id) {
      notificationIds.push(id);
    }
  }
  
  return notificationIds;
};

/**
 * Cancela todas as notificações de versículos agendadas
 */
export const cancelAllVerseNotifications = async (): Promise<void> => {
  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    const verseNotifications = allNotifications.filter(
      notification => notification.content.data?.type === 'verse'
    );
    
    for (const notification of verseNotifications) {
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
    }
    
    console.log(`Canceladas ${verseNotifications.length} notificações de versículos`);
  } catch (error) {
    console.error('Erro ao cancelar notificações de versículos:', error);
  }
};

/**
 * Obtém todas as notificações de versículos agendadas
 */
export const getScheduledVerseNotifications = async (): Promise<Notifications.NotificationRequest[]> => {
  try {
    const allNotifications = await Notifications.getAllScheduledNotificationsAsync();
    return allNotifications.filter(
      notification => notification.content.data?.type === 'verse'
    );
  } catch (error) {
    console.error('Erro ao buscar notificações agendadas:', error);
    return [];
  }
};

/**
 * Envia uma notificação de versículo imediatamente (para teste)
 */
export const sendVerseNotificationNow = async (version: string = 'nvi'): Promise<void> => {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) {
      return;
    }

    let verse;
    try {
      verse = await getVerseOfTheDay(version);
    } catch (error) {
      verse = await getRandomVerse(version);
    }

    if (!verse) {
      return;
    }

    const reference = `${verse.book.name} ${verse.chapter}:${verse.number}`;
    const title = `📖 ${reference}`;
    const body = verse.text.length > 100 
      ? `${verse.text.substring(0, 100)}...` 
      : verse.text;

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        data: {
          type: 'verse',
          reference,
          book: verse.book.name,
          chapter: verse.chapter,
          verse: verse.number,
          version,
        },
      },
      trigger: null, // Enviar imediatamente
    });
  } catch (error) {
    console.error('Erro ao enviar notificação de versículo:', error);
  }
};

