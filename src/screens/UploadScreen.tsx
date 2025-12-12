import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video } from 'expo-av';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { uploadVideo, uploadPhoto, uploadText } from '../services/oracaoService';
import { ORACAO_TAGS, OracaoTag } from '../types';
import { isUserVerified, isUserBlocked } from '../services/adminService';

export const UploadScreen: React.FC = () => {
  const { colors } = useTheme();
  const { user, userData } = useAuth();
  const [type, setType] = useState<'video' | 'photo' | 'text'>('text');
  const [content, setContent] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPedidoOracao, setIsPedidoOracao] = useState(false);

  const pickVideo = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar seus vídeos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
      setType('video');
    }
  };

  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permissão necessária', 'Precisamos de permissão para acessar suas fotos');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setType('photo');
    }
  };

  const handleUpload = async () => {
    if (!user || !userData) {
      Alert.alert('Erro', 'Você precisa estar logado');
      return;
    }

    const verified = await isUserVerified(user.uid);
    const blocked = await isUserBlocked(user.uid);

    if (blocked) {
      Alert.alert('Bloqueado', 'Você está bloqueado e não pode postar conteúdo');
      return;
    }

    if (!verified) {
      Alert.alert('Verificação necessária', 'Apenas usuários verificados podem postar conteúdo');
      return;
    }

    if (!content.trim() && type === 'text') {
      Alert.alert('Erro', 'Digite o conteúdo da oração');
      return;
    }

    if (type === 'video' && !videoUri) {
      Alert.alert('Erro', 'Selecione um vídeo');
      return;
    }

    if (type === 'photo' && !photoUri) {
      Alert.alert('Erro', 'Selecione uma foto');
      return;
    }

    setUploading(true);
    try {
      if (type === 'video' && videoUri) {
        await uploadVideo(user.uid, userData.name, userData.photoURL, videoUri, content, selectedTags, isPedidoOracao);
      } else if (type === 'photo' && photoUri) {
        await uploadPhoto(user.uid, userData.name, userData.photoURL, photoUri, content, selectedTags, isPedidoOracao);
      } else {
        await uploadText(user.uid, userData.name, userData.photoURL, content, selectedTags, isPedidoOracao);
      }

      Alert.alert('Sucesso', 'Oração publicada com sucesso!');
      setContent('');
      setVideoUri(null);
      setPhotoUri(null);
      setSelectedTags([]);
      setIsPedidoOracao(false);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao publicar oração');
    } finally {
      setUploading(false);
    }
  };

  const toggleTag = (tag: OracaoTag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const styles = createStyles(colors);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, type === 'text' && { backgroundColor: colors.primary }]}
          onPress={() => setType('text')}
        >
          <Ionicons name="text" size={24} color={type === 'text' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.typeButtonText, type === 'text' && { color: '#fff' }]}>Texto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, type === 'photo' && { backgroundColor: colors.primary }]}
          onPress={pickPhoto}
        >
          <Ionicons name="image" size={24} color={type === 'photo' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.typeButtonText, type === 'photo' && { color: '#fff' }]}>Foto</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, type === 'video' && { backgroundColor: colors.primary }]}
          onPress={pickVideo}
        >
          <Ionicons name="videocam" size={24} color={type === 'video' ? '#fff' : colors.textSecondary} />
          <Text style={[styles.typeButtonText, type === 'video' && { color: '#fff' }]}>Vídeo</Text>
        </TouchableOpacity>
      </View>

      {videoUri && (
        <View style={styles.mediaPreview}>
          <Video
            source={{ uri: videoUri }}
            style={styles.videoPreview}
            useNativeControls
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.removeMedia}
            onPress={() => setVideoUri(null)}
          >
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      {photoUri && (
        <View style={styles.mediaPreview}>
          <Image source={{ uri: photoUri }} style={styles.imagePreview} />
          <TouchableOpacity
            style={styles.removeMedia}
            onPress={() => setPhotoUri(null)}
          >
            <Ionicons name="close-circle" size={24} color={colors.error} />
          </TouchableOpacity>
        </View>
      )}

      <TextInput
        style={[styles.textInput, { color: colors.text, borderColor: colors.border }]}
        placeholder="Escreva sua oração..."
        placeholderTextColor={colors.textSecondary}
        value={content}
        onChangeText={setContent}
        multiline
        numberOfLines={6}
        textAlignVertical="top"
      />

      <View style={styles.tagsSection}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags (opcional)</Text>
        <View style={styles.tagsContainer}>
          {ORACAO_TAGS.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={[
                styles.tag,
                selectedTags.includes(tag) && { backgroundColor: colors.primary },
              ]}
              onPress={() => toggleTag(tag)}
            >
              <Text
                style={[
                  styles.tagText,
                  { color: selectedTags.includes(tag) ? '#fff' : colors.text },
                ]}
              >
                {tag}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.checkbox, { borderColor: colors.border }]}
        onPress={() => setIsPedidoOracao(!isPedidoOracao)}
      >
        <Ionicons
          name={isPedidoOracao ? 'checkbox' : 'checkbox-outline'}
          size={24}
          color={isPedidoOracao ? colors.primary : colors.textSecondary}
        />
        <Text style={[styles.checkboxText, { color: colors.text }]}>
          Marcar como Pedido de Oração
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.uploadButton, { backgroundColor: colors.primary }]}
        onPress={handleUpload}
        disabled={uploading}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.uploadButtonText}>Publicar Oração</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
};

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      padding: 16,
    },
    typeSelector: {
      flexDirection: 'row',
      gap: 12,
      marginBottom: 20,
    },
    typeButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      borderRadius: 12,
      backgroundColor: colors.surface,
      gap: 8,
    },
    typeButtonText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.textSecondary,
    },
    mediaPreview: {
      position: 'relative',
      marginBottom: 16,
      borderRadius: 12,
      overflow: 'hidden',
    },
    videoPreview: {
      width: '100%',
      height: 200,
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: 12,
    },
    removeMedia: {
      position: 'absolute',
      top: 8,
      right: 8,
      backgroundColor: 'rgba(0,0,0,0.5)',
      borderRadius: 15,
    },
    textInput: {
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      fontSize: 16,
      minHeight: 120,
      marginBottom: 16,
    },
    tagsSection: {
      marginBottom: 16,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 12,
    },
    tagsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },
    tag: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tagText: {
      fontSize: 12,
      fontWeight: '600',
    },
    checkbox: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: 20,
      gap: 12,
    },
    checkboxText: {
      fontSize: 14,
      flex: 1,
    },
    uploadButton: {
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
    },
    uploadButtonText: {
      color: '#fff',
      fontSize: 16,
      fontWeight: '600',
    },
  });

