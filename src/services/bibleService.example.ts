/**
 * Exemplos de uso do BibleService
 * 
 * Este arquivo demonstra como usar as funções do bibleService.ts
 */

import {
  getVerse,
  getChapter,
  getRandomVerse,
  getVerseOfTheDay,
  getBooks,
  searchVerses,
  formatVerseReference,
  formatVerseText,
} from './bibleService';

// Exemplo 1: Buscar um versículo específico
export const exemploBuscarVersiculo = async () => {
  try {
    // Buscar João 3:16
    const versiculo = await getVerse('joao/3/16');
    console.log('Versículo:', formatVerseText(versiculo));
    // Saída: "João 3:16\n\nPorque Deus amou o mundo..."
  } catch (error) {
    console.error('Erro:', error);
  }
};

// Exemplo 2: Buscar um capítulo completo
export const exemploBuscarCapitulo = async () => {
  try {
    // Buscar João capítulo 3
    const capitulo = await getChapter('joao', 3);
    console.log('Capítulo:', capitulo.chapter.verses.length, 'versículos');
    capitulo.chapter.verses.forEach(verse => {
      console.log(`${verse.number}: ${verse.text}`);
    });
  } catch (error) {
    console.error('Erro:', error);
  }
};

// Exemplo 3: Buscar versículo aleatório
export const exemploVersiculoAleatorio = async () => {
  try {
    const versiculo = await getRandomVerse();
    console.log('Versículo aleatório:', formatVerseText(versiculo));
  } catch (error) {
    console.error('Erro:', error);
  }
};

// Exemplo 4: Buscar versículo do dia
export const exemploVersiculoDoDia = async () => {
  try {
    const versiculo = await getVerseOfTheDay();
    console.log('Versículo do dia:', formatVerseText(versiculo));
  } catch (error) {
    console.error('Erro:', error);
  }
};

// Exemplo 5: Listar todos os livros
export const exemploListarLivros = async () => {
  try {
    const livros = await getBooks();
    console.log('Total de livros:', livros.length);
    livros.forEach(livro => {
      console.log(`${livro.name} (${livro.abbrev.pt})`);
    });
  } catch (error) {
    console.error('Erro:', error);
  }
};

// Exemplo 6: Buscar versículos por palavra-chave
export const exemploBuscarPorPalavra = async () => {
  try {
    const versiculos = await searchVerses('amor');
    console.log('Encontrados', versiculos.length, 'versículos');
    versiculos.slice(0, 5).forEach(verse => {
      console.log(formatVerseReference(verse), '-', verse.text.substring(0, 50) + '...');
    });
  } catch (error) {
    console.error('Erro:', error);
  }
};

// Exemplo 7: Usar em um componente React Native
/*
import React, { useState, useEffect } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { getVerseOfTheDay, formatVerseText } from '../services/bibleService';

export const VersiculoDoDiaComponent = () => {
  const [versiculo, setVersiculo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const carregarVersiculo = async () => {
      try {
        const v = await getVerseOfTheDay();
        setVersiculo(v);
      } catch (error) {
        console.error('Erro ao carregar versículo:', error);
      } finally {
        setLoading(false);
      }
    };

    carregarVersiculo();
  }, []);

  if (loading) {
    return <ActivityIndicator />;
  }

  if (!versiculo) {
    return <Text>Erro ao carregar versículo</Text>;
  }

  return (
    <View>
      <Text style={{ fontWeight: 'bold' }}>
        {formatVerseReference(versiculo)}
      </Text>
      <Text>{versiculo.text}</Text>
    </View>
  );
};
*/

