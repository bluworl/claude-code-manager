#!/usr/bin/env ts-node
/**
 * Playground per testare claude-code-manager
 *
 * Esegui con: npx ts-node playground.ts
 */

import { ClaudeCodeManager, PRD, ProgressTracker } from './src';
import { z } from 'zod';
import * as path from 'path';
import * as os from 'os';

async function main() {
  console.log('🎮 Claude Code Manager Playground\n');

  const manager = new ClaudeCodeManager({
    tempDir: path.join(os.tmpdir(), 'playground-test')
  });

  // Test 1: Create PRD
  console.log('📝 Test 1: Creazione PRD');
  console.log('─'.repeat(50));

  const prd = PRD.create({
    project: 'Test Project',
    branchName: 'feature/test',
    description: 'Progetto di test per playground',
    userStories: [
      {
        id: 'US-001',
        title: 'Prima user story',
        description: 'Test story 1',
        acceptanceCriteria: ['Criterio 1', 'Criterio 2'],
        priority: 1,
        estimatedComplexity: 3,
        passes: false
      },
      {
        id: 'US-002',
        title: 'Seconda user story',
        description: 'Test story 2',
        acceptanceCriteria: ['Criterio A', 'Criterio B'],
        priority: 2,
        estimatedComplexity: 2,
        passes: false
      }
    ]
  });

  console.log('✅ PRD creato:');
  console.log(`   Project: ${prd.getProject()}`);
  console.log(`   Branch: ${prd.getBranchName()}`);
  console.log(`   Stories: ${prd.getUserStories().length}`);

  const nextStory = prd.getNextStory();
  console.log(`   Next story: ${nextStory?.id} - ${nextStory?.title}`);

  // Salva PRD
  const prdPath = path.join(os.tmpdir(), 'test-prd.json');
  await prd.save(prdPath);
  console.log(`   Salvato in: ${prdPath}`);

  // Test 2: Progress Tracking
  console.log('\n📊 Test 2: Progress Tracking');
  console.log('─'.repeat(50));

  const progressPath = path.join(os.tmpdir(), 'test-progress.txt');
  await ProgressTracker.initialize(progressPath);
  console.log('✅ Progress file inizializzato');

  await ProgressTracker.append(progressPath, {
    storyId: 'US-001',
    summary: 'Implementata prima feature',
    filesChanged: ['src/feature1.ts', 'tests/feature1.test.ts'],
    learnings: [
      'Usare pattern X per questo tipo di problema',
      'Ricordarsi di aggiungere tests'
    ]
  });
  console.log('✅ Entry aggiunta al progress');

  const progress = await ProgressTracker.read(progressPath);
  console.log(`   Entries: ${progress.entries.length}`);
  console.log(`   Learnings: ${progress.learnings.length}`);

  // Test 3: Schema Validation
  console.log('\n🔍 Test 3: Schema Validation');
  console.log('─'.repeat(50));

  const componentSchema = z.object({
    name: z.string(),
    props: z.array(z.object({
      name: z.string(),
      type: z.string(),
      required: z.boolean()
    })),
    code: z.string()
  });

  const validData = {
    name: 'Button',
    props: [
      { name: 'label', type: 'string', required: true },
      { name: 'onClick', type: '() => void', required: true }
    ],
    code: 'export const Button = () => { ... }'
  };

  // Importa direttamente per testare
  const { SchemaValidator } = await import('./src/validation/schema');

  const validationResult = SchemaValidator.validate(validData, componentSchema);
  console.log(`✅ Validazione: ${validationResult.success ? 'SUCCESSO' : 'FALLITA'}`);

  if (validationResult.success) {
    console.log(`   Componente: ${validationResult.data.name}`);
    console.log(`   Props: ${validationResult.data.props.length}`);
  }

  // Test con dati invalidi
  const invalidData = {
    name: 'Button',
    props: 'not-an-array', // Errore: dovrebbe essere array
    code: 123 // Errore: dovrebbe essere string
  };

  const invalidResult = SchemaValidator.validate(invalidData, componentSchema);
  console.log(`✅ Validazione dati invalidi: ${invalidResult.success ? 'SUCCESSO' : 'FALLITA (come previsto)'}`);

  if (!invalidResult.success) {
    console.log(`   Errori trovati: ${invalidResult.error.issues.length}`);
  }

  // Test 4: File Manager
  console.log('\n📁 Test 4: File Manager');
  console.log('─'.repeat(50));

  const { FileManager } = await import('./src/files/file-manager');
  const fileManager = new FileManager(path.join(os.tmpdir(), 'test-tasks'));

  const taskDir = await fileManager.createTaskDir('test-123');
  console.log(`✅ Task directory creata: ${taskDir}`);

  await fileManager.writeTaskSpec(taskDir, {
    prompt: 'Test task',
    variables: { framework: 'React' }
  });
  console.log('✅ Task spec scritta');

  await fileManager.writeSchema(taskDir, {
    type: 'object',
    properties: {
      result: { type: 'string' }
    }
  });
  console.log('✅ Schema scritto');

  // Test 5: Manager Configuration
  console.log('\n⚙️  Test 5: Manager Configuration');
  console.log('─'.repeat(50));

  const customManager = new ClaudeCodeManager({
    claudeCodePath: '/custom/path/claude',
    tempDir: '/tmp/custom-tasks',
    cleanupOnExit: false,
    hooks: {
      beforeExecute: async (options) => {
        console.log(`   🔵 Hook beforeExecute: ${options.prompt.substring(0, 50)}...`);
      },
      afterExecute: async (result) => {
        console.log(`   🔵 Hook afterExecute: success=${result.success}`);
      }
    }
  });

  console.log('✅ Manager configurato con:');
  console.log(`   - Custom Claude path`);
  console.log(`   - Custom temp dir`);
  console.log(`   - Lifecycle hooks`);

  // Riepilogo
  console.log('\n' + '═'.repeat(50));
  console.log('🎉 Playground completato!');
  console.log('═'.repeat(50));
  console.log('\n✅ Funzionalità testate:');
  console.log('   1. ✓ Creazione e gestione PRD');
  console.log('   2. ✓ Progress tracking');
  console.log('   3. ✓ Schema validation (Zod)');
  console.log('   4. ✓ File manager');
  console.log('   5. ✓ Manager configuration');

  console.log('\n⚠️  Nota:');
  console.log('   - execute() richiede Claude Code installato');
  console.log('   - executeLoop() è in sviluppo (TODO)');

  console.log('\n📚 Per testare execute(), vedi: examples/single-shot.ts');
  console.log('📚 Per testare loop, vedi: examples/loop-basic.ts');

  console.log('\n🧪 Test files salvati in:');
  console.log(`   - ${prdPath}`);
  console.log(`   - ${progressPath}`);
  console.log(`   - ${taskDir}`);
}

// Gestione errori
main().catch((error) => {
  console.error('❌ Errore nel playground:', error);
  process.exit(1);
});
