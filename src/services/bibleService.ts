// Serviço para integração com API de Bíblia
// Usando ABíbliaDigital (https://www.abibliadigital.com.br/) como principal
// Bible-API (https://bible-api.com/) como fallback

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
const BIBLE_API_BACKUP = 'https://bible-api.com';
// API alternativa em português - endpoint direto sem autenticação
const API_BASE_URL_DIRECT = 'https://www.abibliadigital.com.br/api/verses';
const BIBLE_API_PT = 'https://bible-api.com';

// Token da API (defina EXPO_PUBLIC_BIBLE_API_TOKEN no seu ambiente)
const BIBLE_API_TOKEN = process.env.EXPO_PUBLIC_BIBLE_API_TOKEN;

const getRequestOptions = () => {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (BIBLE_API_TOKEN) {
    headers.Authorization = `Bearer ${BIBLE_API_TOKEN}`;
  }

  return { headers };
};

// Mapeamento de versões entre APIs
const versionMap: Record<string, string> = {
  // Português
  'nvi': 'nvi',
  'acf': 'acf',
  'ara': 'ara',
  'as21': 'as21',
  'nvt': 'nvi',
  // Inglês
  'kjv': 'kjv',
  'niv': 'niv',
  'esv': 'esv',
  'nlt': 'nlt',
  'nasb': 'nasb',
  // Espanhol
  'rv': 'rv',
  'nvi-es': 'nvi',
  'rv1960': 'rv1960',
  // Francês
  'lsg': 'lsg',
  'bds': 'bds',
  // Alemão
  'luth': 'luth',
  'elb': 'elb',
  // Italiano
  'cei': 'cei',
  'nvi-it': 'nvi',
  // Chinês
  'cuv': 'cuv',
  'cuvs': 'cuvs',
  // Japonês
  'jlb': 'jlb',
  // Coreano
  'krv': 'krv',
  // Árabe
  'nav': 'nav',
  // Russo
  'rst': 'rst',
  // Hindi
  'hin': 'hin',
  // Grego
  'sbl': 'sbl',
  // Hebraico
  'wlc': 'wlc',
};

// Mapeamento de livros para Bible-API (formato abreviado)
const bookMap: Record<string, string> = {
  'gn': 'gen',
  'genesis': 'gen',
  'gênesis': 'gen',
  'ex': 'exo',
  'exodo': 'exo',
  'êxodo': 'exo',
  'lv': 'lev',
  'levitico': 'lev',
  'levítico': 'lev',
  'nm': 'num',
  'numeros': 'num',
  'números': 'num',
  'dt': 'deu',
  'deuteronomio': 'deu',
  'deuteronômio': 'deu',
  'js': 'jos',
  'josue': 'jos',
  'josué': 'jos',
  'jz': 'jdg',
  'juizes': 'jdg',
  'juízes': 'jdg',
  'rt': 'rut',
  'rute': 'rut',
  '1sm': '1sa',
  '1samuel': '1sa',
  '2sm': '2sa',
  '2samuel': '2sa',
  '1rs': '1ki',
  '1reis': '1ki',
  '2rs': '2ki',
  '2reis': '2ki',
  '1cr': '1ch',
  '1cronicas': '1ch',
  '1crônicas': '1ch',
  '2cr': '2ch',
  '2cronicas': '2ch',
  '2crônicas': '2ch',
  'ed': 'ezr',
  'esdras': 'ezr',
  'ne': 'neh',
  'neemias': 'neh',
  'et': 'est',
  'ester': 'est',
  'job': 'job',
  'sl': 'psa',
  'salmos': 'psa',
  'pv': 'pro',
  'proverbios': 'pro',
  'provérbios': 'pro',
  'ec': 'ecc',
  'eclesiastes': 'ecc',
  'ct': 'sng',
  'cantares': 'sng',
  'is': 'isa',
  'isaias': 'isa',
  'isaías': 'isa',
  'jr': 'jer',
  'jeremias': 'jer',
  'lm': 'lam',
  'lamentacoes': 'lam',
  'lamentações': 'lam',
  'ez': 'ezk',
  'ezequiel': 'ezk',
  'dn': 'dan',
  'daniel': 'dan',
  'os': 'hos',
  'oseias': 'hos',
  'jl': 'jol',
  'joel': 'jol',
  'am': 'amo',
  'amos': 'amo',
  'ob': 'oba',
  'obadias': 'oba',
  'jn': 'jon',
  'jonas': 'jon',
  'mq': 'mic',
  'miqueias': 'mic',
  'na': 'nam',
  'naum': 'nam',
  'hc': 'hab',
  'habacuque': 'hab',
  'sf': 'zep',
  'sofonias': 'zep',
  'ag': 'hag',
  'ageu': 'hag',
  'zc': 'zec',
  'zacarias': 'zec',
  'ml': 'mal',
  'malaquias': 'mal',
  'mt': 'mat',
  'mateus': 'mat',
  'mc': 'mrk',
  'marcos': 'mrk',
  'lc': 'luk',
  'lucas': 'luk',
  'jo': 'jhn',
  'joao': 'jhn',
  'joão': 'jhn',
  'at': 'act',
  'atos': 'act',
  'rm': 'rom',
  'romanos': 'rom',
  '1co': '1co',
  '1corintios': '1co',
  '1coríntios': '1co',
  '2co': '2co',
  '2corintios': '2co',
  '2coríntios': '2co',
  'gl': 'gal',
  'galatas': 'gal',
  'gálatas': 'gal',
  'ef': 'eph',
  'efesios': 'eph',
  'efésios': 'eph',
  'fp': 'php',
  'filipenses': 'php',
  'cl': 'col',
  'colossenses': 'col',
  '1ts': '1th',
  '1tessalonicenses': '1th',
  '2ts': '2th',
  '2tessalonicenses': '2th',
  '1tm': '1ti',
  '1timoteo': '1ti',
  '1timóteo': '1ti',
  '2tm': '2ti',
  '2timoteo': '2ti',
  '2timóteo': '2ti',
  'tt': 'tit',
  'tito': 'tit',
  'fm': 'phm',
  'filemon': 'phm',
  'filemom': 'phm',
  'hb': 'heb',
  'hebreus': 'heb',
  'tg': 'jas',
  'tiago': 'jas',
  '1pe': '1pe',
  '1pedro': '1pe',
  '2pe': '2pe',
  '2pedro': '2pe',
  '1jo': '1jn',
  '1joao': '1jn',
  '1joão': '1jn',
  '2jo': '2jn',
  '2joao': '2jn',
  '2joão': '2jn',
  '3jo': '3jn',
  '3joao': '3jn',
  '3joão': '3jn',
  'jd': 'jud',
  'judas': 'jud',
  'ap': 'rev',
  'apocalipse': 'rev',
};

// Função auxiliar para mapear livro para Bible-API
const mapBookToBibleApi = (bookName: string, abbrev?: string): string => {
  const lower = bookName.toLowerCase();
  const abbrevLower = abbrev?.toLowerCase() || '';
  
  // Tenta pelo nome completo
  if (bookMap[lower]) return bookMap[lower];
  
  // Tenta pela abreviação
  if (abbrevLower && bookMap[abbrevLower]) return bookMap[abbrevLower];
  
  // Mapeamentos especiais
  if (lower.includes('joão') && !lower.includes('1') && !lower.includes('2') && !lower.includes('3')) return 'jhn';
  if (lower.includes('gênesis') || lower.includes('genesis')) return 'gen';
  if (lower.includes('mateus')) return 'mat';
  if (lower.includes('marcos')) return 'mrk';
  if (lower.includes('lucas')) return 'luk';
  
  // Fallback: usa as primeiras 3 letras
  return lower.substring(0, 3);
};

// Função auxiliar para converter formato da Bible-API para nosso formato
const convertBibleApiVerse = (data: any, bookAbbrev: string, chapter: number, verseNum: number): BibleVerse => {
  const bookName = data.book_name || data.reference?.split(' ')[0] || bookAbbrev;
  return {
    book: {
      abbrev: {
        pt: bookAbbrev,
        en: bookAbbrev,
      },
      name: bookName,
      author: '',
      group: '',
      version: data.translation_id || 'nvi',
    },
    chapter: chapter,
    number: verseNum,
    text: data.text || '',
  };
};

// Função auxiliar para converter capítulo da Bible-API
const convertBibleApiChapter = (data: any, bookAbbrev: string, chapter: number): BibleChapter => {
  const verses = data.verses || [];
  const bookName = data.book_name || data.reference?.split(' ')[0] || bookAbbrev;
  
  return {
    book: {
      abbrev: {
        pt: bookAbbrev,
        en: bookAbbrev,
      },
      name: bookName,
      author: '',
      group: '',
      version: data.translation_id || 'nvi',
    },
    chapter: {
      number: chapter,
      verses: verses.map((v: any) => ({
        number: v.verse || 0,
        text: v.text || '',
      })).filter((v: any) => v.number > 0),
    },
  };
};

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
      `${API_BASE_URL}/verses/${version}/${reference}`,
      getRequestOptions()
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro detalhado API Bíblia (verso):', errorText);
      throw new Error(`Erro ao buscar versículo: ${response.status} ${response.statusText}`);
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
  // Tenta primeiro a API principal
  try {
    const url = `${API_BASE_URL}/verses/${version}/${book}/${chapter}`;
    console.log(`Buscando capítulo na API principal: ${url}`);
    
    const response = await fetch(url, getRequestOptions());
    
    if (response.ok) {
      const data = await response.json();
      console.log(`Capítulo encontrado na API principal para versão: ${version}`);
      return data;
    } else {
      console.log(`API principal retornou status ${response.status} para versão ${version}, tentando fallback...`);
    }
  } catch (error) {
    console.log('API principal falhou, tentando API alternativa...', error);
  }

  // Fallback 1: Tentar API principal sem token (pode funcionar para algumas versões)
  if (['nvi', 'acf', 'ara', 'as21'].includes(version.toLowerCase())) {
    try {
      const url = `${API_BASE_URL_DIRECT}/${version}/${book}/${chapter}`;
      console.log(`Tentando API direta sem token: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`Capítulo encontrado na API direta para versão: ${version}`);
        return data;
      }
    } catch (error) {
      console.log('API direta falhou, tentando próxima alternativa...', error);
    }
  }

  // Fallback 2: Bible-API (principalmente para inglês, mas funciona como último recurso)
  try {
    const bookAbbrev = mapBookToBibleApi(book);
    
    // Mapear versão para o formato da Bible-API
    // Bible-API suporta: kjv, asv, basicenglish, darby, web, ylt, etc.
    // Para versões não suportadas, usar KJV como fallback
    const bibleApiVersionMap: Record<string, string> = {
      'kjv': 'kjv',
      'niv': 'niv',
      'nvi': 'kjv', // NVI não disponível, usar KJV
      'acf': 'kjv', // ACF não disponível, usar KJV
      'ara': 'kjv', // ARA não disponível, usar KJV
      'as21': 'kjv', // AS21 não disponível, usar KJV
      'nvt': 'kjv', // NVT não disponível, usar KJV
      'esv': 'kjv', // ESV não disponível, usar KJV
      'nlt': 'kjv', // NLT não disponível, usar KJV
      'nasb': 'kjv', // NASB não disponível, usar KJV
    };
    
    const versionCode = bibleApiVersionMap[version.toLowerCase()] || 'kjv';
    
    console.log(`Usando API alternativa (Bible-API) com versão: ${versionCode} (solicitada: ${version})`);
    
    const response = await fetch(
      `${BIBLE_API_BACKUP}/${bookAbbrev}+${chapter}?translation=${versionCode}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      const converted = convertBibleApiChapter(data, bookAbbrev, chapter);
      // Manter a versão solicitada no objeto retornado
      converted.book.version = version;
      return converted;
    }
  } catch (error) {
    console.error('Erro na API alternativa:', error);
  }

  throw new Error('Não foi possível buscar o capítulo. Tente novamente mais tarde.');
};

/**
 * Busca um versículo aleatório
 * @param version - Versão da bíblia (padrão: "nvi")
 */
export const getRandomVerse = async (
  version: string = 'nvi'
): Promise<BibleVerse> => {
  // Tenta primeiro a API principal
  try {
    const response = await fetch(
      `${API_BASE_URL}/verses/${version}/random`,
      getRequestOptions()
    );
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.log('API principal falhou, tentando API alternativa...', error);
  }

  // Fallback 1: Tentar API direta sem token para português
  if (['nvi', 'acf', 'ara', 'as21'].includes(version.toLowerCase())) {
    try {
      const books = await getBooks();
      const randomBook = books[Math.floor(Math.random() * books.length)];
      const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
      
      const url = `${API_BASE_URL_DIRECT}/${version}/${randomBook.abbrev.pt}/${randomChapter}`;
      console.log(`Tentando API direta para versículo aleatório: ${url}`);
      
      const response = await fetch(url, {
        headers: {
          Accept: 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // A API retorna um array de versículos, pegar um aleatório
        if (Array.isArray(data) && data.length > 0) {
          const randomVerse = data[Math.floor(Math.random() * data.length)];
          console.log(`Versículo aleatório encontrado na API direta para versão: ${version}`);
          return randomVerse;
        } else if (data.verses && Array.isArray(data.verses) && data.verses.length > 0) {
          const randomVerse = data.verses[Math.floor(Math.random() * data.verses.length)];
          return {
            book: {
              abbrev: { pt: randomBook.abbrev.pt, en: randomBook.abbrev.en },
              name: randomBook.name,
              author: randomBook.author || '',
              group: randomBook.group || '',
              version: version,
            },
            chapter: randomChapter,
            number: randomVerse.number || 1,
            text: randomVerse.text || '',
          };
        }
      }
    } catch (error) {
      console.log('API direta falhou, tentando próxima alternativa...', error);
    }
  }

  // Fallback 2: busca versículo aleatório da Bible-API
  try {
    const books = await getBooks();
    const randomBook = books[Math.floor(Math.random() * books.length)];
    const randomChapter = Math.floor(Math.random() * randomBook.chapters) + 1;
    
    // Mapeia o livro para a abreviação da Bible-API
    const bookAbbrev = mapBookToBibleApi(randomBook.name, randomBook.abbrev.pt);
    
    // Mapear versão para o formato da Bible-API
    const bibleApiVersionMap: Record<string, string> = {
      'kjv': 'kjv',
      'niv': 'niv',
      'nvi': 'kjv', // NVI não disponível, usar KJV
      'acf': 'kjv', // ACF não disponível, usar KJV
      'ara': 'kjv', // ARA não disponível, usar KJV
      'as21': 'kjv', // AS21 não disponível, usar KJV
      'nvt': 'kjv', // NVT não disponível, usar KJV
      'esv': 'kjv', // ESV não disponível, usar KJV
      'nlt': 'kjv', // NLT não disponível, usar KJV
      'nasb': 'kjv', // NASB não disponível, usar KJV
    };
    
    const versionCode = bibleApiVersionMap[version.toLowerCase()] || 'kjv';
    
    console.log(`Usando API alternativa (Bible-API) para versículo aleatório com versão: ${versionCode} (solicitada: ${version})`);
    
    const response = await fetch(
      `${BIBLE_API_BACKUP}/${bookAbbrev}+${randomChapter}?translation=${versionCode}`,
      {
        headers: {
          Accept: 'application/json',
        },
      }
    );
    
    if (response.ok) {
      const data = await response.json();
      const verses = data.verses || [];
      if (verses.length > 0) {
        const randomVerse = verses[Math.floor(Math.random() * verses.length)];
        const converted = convertBibleApiVerse(
          { 
            text: randomVerse.text, 
            reference: data.reference,
            book_name: data.book_name || randomBook.name,
            translation_id: versionCode
          },
          bookAbbrev,
          randomChapter,
          randomVerse.verse || 1
        );
        // Manter a versão solicitada no objeto retornado
        converted.book.version = version;
        return converted;
      }
    }
  } catch (error) {
    console.error('Erro na API alternativa:', error);
  }

  throw new Error('Não foi possível buscar versículo aleatório. Tente novamente mais tarde.');
};

/**
 * Busca o versículo do dia
 * @param version - Versão da bíblia (padrão: "nvi")
 */
export const getVerseOfTheDay = async (
  version: string = 'nvi'
): Promise<BibleVerse> => {
  try {
    // A API está retornando 404 para /verses/{version}/day.
    // Como fallback, usamos o endpoint de versículo aleatório.
    console.log('Buscando versículo do dia (fallback para random)...');
    const verse = await getRandomVerse(version);
    return verse;
  } catch (error) {
    console.error('Erro ao buscar versículo do dia:', error);
    throw error;
  }
};

/**
 * Lista todos os livros da bíblia
 */
export const getBooks = async (): Promise<any[]> => {
  // Tenta primeiro a API principal
  try {
    const response = await fetch(
      `${API_BASE_URL}/books`,
      getRequestOptions()
    );
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.log('API principal falhou, usando lista estática...', error);
  }

  // Fallback: lista estática de livros da Bíblia
  const staticBooks = [
    { abbrev: { pt: 'gn', en: 'gen' }, name: 'Gênesis', chapters: 50, group: 'pentateuco', author: 'Moisés' },
    { abbrev: { pt: 'ex', en: 'exo' }, name: 'Êxodo', chapters: 40, group: 'pentateuco', author: 'Moisés' },
    { abbrev: { pt: 'lv', en: 'lev' }, name: 'Levítico', chapters: 27, group: 'pentateuco', author: 'Moisés' },
    { abbrev: { pt: 'nm', en: 'num' }, name: 'Números', chapters: 36, group: 'pentateuco', author: 'Moisés' },
    { abbrev: { pt: 'dt', en: 'deu' }, name: 'Deuteronômio', chapters: 34, group: 'pentateuco', author: 'Moisés' },
    { abbrev: { pt: 'js', en: 'jos' }, name: 'Josué', chapters: 24, group: 'historicos', author: 'Josué' },
    { abbrev: { pt: 'jz', en: 'jdg' }, name: 'Juízes', chapters: 21, group: 'historicos', author: 'Samuel' },
    { abbrev: { pt: 'rt', en: 'rut' }, name: 'Rute', chapters: 4, group: 'historicos', author: 'Samuel' },
    { abbrev: { pt: '1sm', en: '1sa' }, name: '1 Samuel', chapters: 31, group: 'historicos', author: 'Samuel' },
    { abbrev: { pt: '2sm', en: '2sa' }, name: '2 Samuel', chapters: 24, group: 'historicos', author: 'Samuel' },
    { abbrev: { pt: '1rs', en: '1ki' }, name: '1 Reis', chapters: 22, group: 'historicos', author: 'Jeremias' },
    { abbrev: { pt: '2rs', en: '2ki' }, name: '2 Reis', chapters: 25, group: 'historicos', author: 'Jeremias' },
    { abbrev: { pt: '1cr', en: '1ch' }, name: '1 Crônicas', chapters: 29, group: 'historicos', author: 'Esdras' },
    { abbrev: { pt: '2cr', en: '2ch' }, name: '2 Crônicas', chapters: 36, group: 'historicos', author: 'Esdras' },
    { abbrev: { pt: 'ed', en: 'ezr' }, name: 'Esdras', chapters: 10, group: 'historicos', author: 'Esdras' },
    { abbrev: { pt: 'ne', en: 'neh' }, name: 'Neemias', chapters: 13, group: 'historicos', author: 'Neemias' },
    { abbrev: { pt: 'et', en: 'est' }, name: 'Ester', chapters: 10, group: 'historicos', author: 'Mardoqueu' },
    { abbrev: { pt: 'job', en: 'job' }, name: 'Jó', chapters: 42, group: 'poeticos', author: 'Desconhecido' },
    { abbrev: { pt: 'sl', en: 'psa' }, name: 'Salmos', chapters: 150, group: 'poeticos', author: 'Vários' },
    { abbrev: { pt: 'pv', en: 'pro' }, name: 'Provérbios', chapters: 31, group: 'poeticos', author: 'Salomão' },
    { abbrev: { pt: 'ec', en: 'ecc' }, name: 'Eclesiastes', chapters: 12, group: 'poeticos', author: 'Salomão' },
    { abbrev: { pt: 'ct', en: 'sng' }, name: 'Cantares', chapters: 8, group: 'poeticos', author: 'Salomão' },
    { abbrev: { pt: 'is', en: 'isa' }, name: 'Isaías', chapters: 66, group: 'profetas', author: 'Isaías' },
    { abbrev: { pt: 'jr', en: 'jer' }, name: 'Jeremias', chapters: 52, group: 'profetas', author: 'Jeremias' },
    { abbrev: { pt: 'lm', en: 'lam' }, name: 'Lamentações', chapters: 5, group: 'profetas', author: 'Jeremias' },
    { abbrev: { pt: 'ez', en: 'ezk' }, name: 'Ezequiel', chapters: 48, group: 'profetas', author: 'Ezequiel' },
    { abbrev: { pt: 'dn', en: 'dan' }, name: 'Daniel', chapters: 12, group: 'profetas', author: 'Daniel' },
    { abbrev: { pt: 'os', en: 'hos' }, name: 'Oséias', chapters: 14, group: 'profetas', author: 'Oséias' },
    { abbrev: { pt: 'jl', en: 'jol' }, name: 'Joel', chapters: 3, group: 'profetas', author: 'Joel' },
    { abbrev: { pt: 'am', en: 'amo' }, name: 'Amós', chapters: 9, group: 'profetas', author: 'Amós' },
    { abbrev: { pt: 'ob', en: 'oba' }, name: 'Obadias', chapters: 1, group: 'profetas', author: 'Obadias' },
    { abbrev: { pt: 'jn', en: 'jon' }, name: 'Jonas', chapters: 4, group: 'profetas', author: 'Jonas' },
    { abbrev: { pt: 'mq', en: 'mic' }, name: 'Miqueias', chapters: 7, group: 'profetas', author: 'Miqueias' },
    { abbrev: { pt: 'na', en: 'nam' }, name: 'Naum', chapters: 3, group: 'profetas', author: 'Naum' },
    { abbrev: { pt: 'hc', en: 'hab' }, name: 'Habacuque', chapters: 3, group: 'profetas', author: 'Habacuque' },
    { abbrev: { pt: 'sf', en: 'zep' }, name: 'Sofonias', chapters: 3, group: 'profetas', author: 'Sofonias' },
    { abbrev: { pt: 'ag', en: 'hag' }, name: 'Ageu', chapters: 2, group: 'profetas', author: 'Ageu' },
    { abbrev: { pt: 'zc', en: 'zec' }, name: 'Zacarias', chapters: 14, group: 'profetas', author: 'Zacarias' },
    { abbrev: { pt: 'ml', en: 'mal' }, name: 'Malaquias', chapters: 4, group: 'profetas', author: 'Malaquias' },
    { abbrev: { pt: 'mt', en: 'mat' }, name: 'Mateus', chapters: 28, group: 'evangelhos', author: 'Mateus' },
    { abbrev: { pt: 'mc', en: 'mrk' }, name: 'Marcos', chapters: 16, group: 'evangelhos', author: 'Marcos' },
    { abbrev: { pt: 'lc', en: 'luk' }, name: 'Lucas', chapters: 24, group: 'evangelhos', author: 'Lucas' },
    { abbrev: { pt: 'jo', en: 'jhn' }, name: 'João', chapters: 21, group: 'evangelhos', author: 'João' },
    { abbrev: { pt: 'at', en: 'act' }, name: 'Atos', chapters: 28, group: 'historicos', author: 'Lucas' },
    { abbrev: { pt: 'rm', en: 'rom' }, name: 'Romanos', chapters: 16, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: '1co', en: '1co' }, name: '1 Coríntios', chapters: 16, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: '2co', en: '2co' }, name: '2 Coríntios', chapters: 13, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: 'gl', en: 'gal' }, name: 'Gálatas', chapters: 6, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: 'ef', en: 'eph' }, name: 'Efésios', chapters: 6, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: 'fp', en: 'php' }, name: 'Filipenses', chapters: 4, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: 'cl', en: 'col' }, name: 'Colossenses', chapters: 4, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: '1ts', en: '1th' }, name: '1 Tessalonicenses', chapters: 5, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: '2ts', en: '2th' }, name: '2 Tessalonicenses', chapters: 3, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: '1tm', en: '1ti' }, name: '1 Timóteo', chapters: 6, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: '2tm', en: '2ti' }, name: '2 Timóteo', chapters: 6, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: 'tt', en: 'tit' }, name: 'Tito', chapters: 3, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: 'fm', en: 'phm' }, name: 'Filemon', chapters: 1, group: 'cartas', author: 'Paulo' },
    { abbrev: { pt: 'hb', en: 'heb' }, name: 'Hebreus', chapters: 13, group: 'cartas', author: 'Desconhecido' },
    { abbrev: { pt: 'tg', en: 'jas' }, name: 'Tiago', chapters: 5, group: 'cartas', author: 'Tiago' },
    { abbrev: { pt: '1pe', en: '1pe' }, name: '1 Pedro', chapters: 5, group: 'cartas', author: 'Pedro' },
    { abbrev: { pt: '2pe', en: '2pe' }, name: '2 Pedro', chapters: 5, group: 'cartas', author: 'Pedro' },
    { abbrev: { pt: '1jo', en: '1jn' }, name: '1 João', chapters: 5, group: 'cartas', author: 'João' },
    { abbrev: { pt: '2jo', en: '2jn' }, name: '2 João', chapters: 1, group: 'cartas', author: 'João' },
    { abbrev: { pt: '3jo', en: '3jn' }, name: '3 João', chapters: 1, group: 'cartas', author: 'João' },
    { abbrev: { pt: 'jd', en: 'jud' }, name: 'Judas', chapters: 1, group: 'cartas', author: 'Judas' },
    { abbrev: { pt: 'ap', en: 'rev' }, name: 'Apocalipse', chapters: 22, group: 'apocalipse', author: 'João' },
  ];

  return staticBooks;
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
  // Tenta primeiro a API principal
  try {
    const encodedSearch = encodeURIComponent(search);
    const response = await fetch(
      `${API_BASE_URL}/verses/${version}/search/${encodedSearch}`,
      getRequestOptions()
    );
    
    if (response.ok) {
      const data = await response.json();
      return data;
    }
  } catch (error) {
    console.log('API principal falhou, tentando busca alternativa...', error);
  }

  // Fallback: busca simples usando Bible-API (limitado)
  // A Bible-API não tem busca avançada, então retornamos alguns versículos populares
  try {
    const results: BibleVerse[] = [];
    const popularVerses = [
      { book: 'jhn', chapter: 3, verse: 16 },
      { book: 'rom', chapter: 8, verse: 28 },
      { book: 'php', chapter: 4, verse: 13 },
      { book: 'jer', chapter: 29, verse: 11 },
      { book: 'psa', chapter: 23, verse: 1 },
    ];

    const versionCode = versionMap[version] || 'nvi';
    
    for (const ref of popularVerses.slice(0, 3)) {
      try {
        const response = await fetch(
          `${BIBLE_API_BACKUP}/${ref.book}+${ref.chapter}?translation=${versionCode}`,
          {
            headers: {
              Accept: 'application/json',
            },
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const verses = data.verses || [];
          const verse = verses.find((v: any) => v.verse === ref.verse);
          if (verse && verse.text.toLowerCase().includes(search.toLowerCase())) {
            results.push(convertBibleApiVerse(verse, ref.book, ref.chapter, ref.verse));
          }
        }
      } catch (err) {
        // Continua para o próximo
      }
    }

    if (results.length > 0) {
      return results;
    }
  } catch (error) {
    console.error('Erro na busca alternativa:', error);
  }

  throw new Error('Não foi possível buscar versículos. Tente novamente mais tarde.');
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

