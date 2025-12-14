#!/usr/bin/env node

/**
 * Script para atualizar o app via Git + OTA
 * 
 * Uso:
 *   npm run update:ota "Descrição da atualização"
 *   npm run update:ota "Corrige bug na tela de login"
 */

const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  const message = process.argv[2] || 'Atualização automática';
  const branch = process.argv[3] || 'preview';

  console.log('🚀 Iniciando atualização via Git + OTA...\n');

  try {
    // 1. Verificar se há mudanças
    console.log('📋 Verificando mudanças...');
    const status = execSync('git status --porcelain', { encoding: 'utf-8' });
    
    if (!status.trim()) {
      console.log('⚠️  Nenhuma mudança detectada. Nada para atualizar.');
      rl.close();
      return;
    }

    console.log('✅ Mudanças detectadas:\n');
    console.log(status);

    // 2. Perguntar se deseja continuar
    const answer = await question('\n❓ Deseja continuar com a atualização? (s/n): ');
    
    if (answer.toLowerCase() !== 's' && answer.toLowerCase() !== 'sim') {
      console.log('❌ Atualização cancelada.');
      rl.close();
      return;
    }

    // 3. Adicionar arquivos
    console.log('\n📦 Adicionando arquivos ao Git...');
    execSync('git add .', { stdio: 'inherit' });

    // 4. Fazer commit
    console.log(`\n💾 Fazendo commit: "${message}"`);
    execSync(`git commit -m "${message}"`, { stdio: 'inherit' });

    // 5. Push para Git
    console.log('\n⬆️  Enviando para o Git...');
    execSync('git push', { stdio: 'inherit' });

    // 6. Publicar atualização OTA
    console.log(`\n🌐 Publicando atualização OTA no canal "${branch}"...`);
    execSync(`eas update --branch ${branch} --message "${message}"`, { stdio: 'inherit' });

    console.log('\n✅ Atualização concluída com sucesso!');
    console.log('📱 Os usuários receberão a atualização automaticamente ao abrir o app.');

  } catch (error) {
    console.error('\n❌ Erro durante a atualização:', error.message);
    process.exit(1);
  } finally {
    rl.close();
  }
}

main();

