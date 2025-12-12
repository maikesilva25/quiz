// Serviço para integração com API de Bíblia
// Usando ABíbliaDigital (https://www.abibliadigital.com.br/)

export interface BibleVerse {
  book: {
    abbrev: {
      pt: string;
      en: string;
    };
    name: string;
    author: string;
    group: string;
    version: string;
  };
  chapter: number;
  number: number;
  text: string;
}

export interface BibleChapter {
  book: {
    abbrev: {
      pt: string;
      en: string;
    };
    name: string;
    author: string;
    group: string;
    version: string;
  };
  chapter: {
    number: number;
    verses: Array<{
      number: number;
      text: string;
    }>;
  };
}

const API_BASE_URL = 'https://www.abibliadigital.com.br/api';

/**
 * Busca um versículo específico por referência
 * @param reference - Referência bíblica (ex: "joao/3/16", "genesis/1/1")
 * @param version - Versão da bíblia (padrão: "nvi")
 */
export const getVerse = async (
  reference: string,
  version: string = 'nvi'
): Promise<BibleVerse> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/verses/${version}/${reference}`
    );
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar versículo: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar versículo:', error);
    throw error;
  }
};

/**
 * Busca um capítulo completo da bíblia
 * @param book - Nome do livro (ex: "joao", "genesis")
 * @param chapter - Número do capítulo
 * @param version - Versão da bíblia (padrão: "nvi")
 */
export const getChapter = async (
  book: string,
  chapter: number,
  version: string = 'nvi'
): Promise<BibleChapter> => {
  try {
    const response = await fetch(
      `${API_BASE_URL}/verses/${version}/${book}/${chapter}`
    );
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar capítulo: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar capítulo:', error);
    throw error;
  }
};

/**
 * Busca um versículo aleatório
 * @param version - Versão da bíblia (padrão: "nvi")
 */
export const getRandomVerse = async (
  version: string = 'nvi'
): Promise<BibleVerse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/verses/${version}/random`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar versículo aleatório: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar versículo aleatório:', error);
    throw error;
  }
};

/**
 * Busca o versículo do dia
 * @param version - Versão da bíblia (padrão: "nvi")
 */
export const getVerseOfTheDay = async (
  version: string = 'nvi'
): Promise<BibleVerse> => {
  try {
    const response = await fetch(`${API_BASE_URL}/verses/${version}/day`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar versículo do dia: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar versículo do dia:', error);
    throw error;
  }
};

/**
 * Lista todos os livros da bíblia
 */
export const getBooks = async (): Promise<any[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/books`);
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar livros: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar livros:', error);
    throw error;
  }
};

/**
 * Busca versículos por palavra-chave
 * @param search - Palavra ou frase para buscar
 * @param version - Versão da bíblia (padrão: "nvi")
 */
export const searchVerses = async (
  search: string,
  version: string = 'nvi'
): Promise<BibleVerse[]> => {
  try {
    const encodedSearch = encodeURIComponent(search);
    const response = await fetch(
      `${API_BASE_URL}/verses/${version}/search/${encodedSearch}`
    );
    
    if (!response.ok) {
      throw new Error(`Erro ao buscar versículos: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao buscar versículos:', error);
    throw error;
  }
};

/**
 * Formata referência bíblica para exibição
 * @param verse - Objeto do versículo
 */
export const formatVerseReference = (verse: BibleVerse): string => {
  return `${verse.book.name} ${verse.chapter}:${verse.number}`;
};

/**
 * Formata versículo completo para exibição
 * @param verse - Objeto do versículo
 */
export const formatVerseText = (verse: BibleVerse): string => {
  return `${formatVerseReference(verse)}\n\n${verse.text}`;
};

