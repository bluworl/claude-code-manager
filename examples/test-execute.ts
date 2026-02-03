#!/usr/bin/env ts-node
/**
 * Test execute() - Single shot execution
 *
 * Questo esempio testa l'esecuzione reale di Claude Code
 * RICHIEDE: claude installato nel sistema
 */

import { ClaudeCodeManager } from '../src';
import { z } from 'zod';
import * as path from 'path';
import * as os from 'os';

// Schema per il risultato
const GreetingSchema = z.object({
  message: z.string(),
  timestamp: z.string(),
  language: z.string()
});

async function main() {
  console.log('🧪 Test Execute - Single Shot\n');
  console.log('═'.repeat(50));

  // Verifica che claude sia installato
  console.log('🔍 Verificando installazione di claude...');
  const { execSync } = require('child_process');

  try {
    const version = execSync('claude --version', { encoding: 'utf-8' });
    console.log(`✅ Claude trovato: ${version.trim()}`);
  } catch (error) {
    console.error('❌ Claude non trovato nel PATH');
    console.error('   Installa Claude Code da: https://claude.ai/download');
    process.exit(1);
  }

  console.log('\n📦 Inizializzando manager...');
  const manager = new ClaudeCodeManager({
    tempDir: path.join(os.tmpdir(), 'claude-test-execute'),
    hooks: {
      beforeExecute: async (options) => {
        console.log('   🔵 Hook: Esecuzione in partenza...');
        console.log(`   📝 Prompt: "${options.prompt.substring(0, 60)}..."`);
      },
      afterExecute: async (result) => {
        console.log('   🔵 Hook: Esecuzione completata');
        console.log(`   ✓ Success: ${result.success}`);
        console.log(`   ⏱  Duration: ${result.duration}ms`);
      }
    }
  });

  console.log('✅ Manager pronto\n');

  // Test 1: Simple greeting
  console.log('📝 Test 1: Simple Greeting');
  console.log('─'.repeat(50));

  try {
    console.log('   ⏳ Eseguendo task...');

    const result = await manager.execute({
      prompt: 'Generate a greeting message in Italian with the current timestamp',
      schema: GreetingSchema,
      variables: {
        language: 'Italian',
        style: 'friendly'
      },
      timeout: 60000 // 1 minuto
    });

    if (result.success) {
      console.log('\n   ✅ Task completato!');
      console.log(`   📂 Output dir: ${result.outputDir}`);
      console.log(`   ⏱  Durata: ${result.duration}ms`);

      if (result.data) {
        console.log('\n   📦 Dati ricevuti:');
        console.log(`      Message: ${result.data.message}`);
        console.log(`      Timestamp: ${result.data.timestamp}`);
        console.log(`      Language: ${result.data.language}`);
      }

      if (result.artifacts && result.artifacts.length > 0) {
        console.log(`\n   📎 Artifacts: ${result.artifacts.length}`);
        result.artifacts.forEach((artifact) => {
          console.log(`      - ${artifact}`);
        });
      }

      console.log('\n   📋 Logs:');
      const logLines = result.logs.split('\n');
      logLines.slice(0, 10).forEach((line) => {
        if (line.trim()) {
          console.log(`      ${line}`);
        }
      });
      if (logLines.length > 10) {
        console.log(`      ... (${logLines.length - 10} more lines)`);
      }
    } else {
      console.error('\n   ❌ Task fallito');
      console.error(`   Error: ${result.error?.message}`);
    }

  } catch (error) {
    console.error('\n   ❌ Errore durante esecuzione:');
    console.error(`   ${error}`);
  }

  // Test 2: Con skill custom (se installato)
  console.log('\n\n📝 Test 2: Con Skill Custom');
  console.log('─'.repeat(50));
  console.log('   ℹ️  Questo test richiede lo skill installato');
  console.log('   💡 Esegui: npm run install-skills');
  console.log('   ⏭  Saltando per ora...\n');

  // Cleanup suggestion
  console.log('═'.repeat(50));
  console.log('🎉 Test completato!\n');
  console.log('🧹 Per ripulire i file di test:');
  console.log(`   rm -rf ${path.join(os.tmpdir(), 'claude-test-execute')}\n`);
}

main().catch((error) => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});
