import { ClaudeCodeManager } from '../src';

async function main() {
  const manager = new ClaudeCodeManager();

  console.log('🔄 Starting Ralph-compatible loop execution...\n');

  const result = await manager.executeLoop({
    taskFile: './examples/test-prd.json',
    maxIterations: 10,
    mode: 'code',
    progressFile: './examples/progress.txt',
    onIteration: (iter) => {
      console.log(`\n${'='.repeat(50)}`);
      console.log(`📍 Iteration ${iter.iteration}`);
      console.log(`📋 Task: ${iter.taskId}`);
      console.log(`✓  Success: ${iter.success}`);
      console.log(`⏱  Duration: ${iter.duration}ms`);

      if (iter.commits?.length) {
        console.log(`📝 Commits: ${iter.commits.join(', ')}`);
      }
    }
  });

  if (result.completed) {
    console.log('\n✅ All tasks completed!');
    console.log(`Total iterations: ${result.iterations.length}`);
    console.log(`Duration: ${result.totalDuration}ms`);
  } else {
    console.log('\n⚠️ Loop ended before completion');
    console.log(`Completed: ${result.finalState.tasksCompleted}/${result.finalState.tasksTotal}`);
  }
}

main().catch(console.error);
