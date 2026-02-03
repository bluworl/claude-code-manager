import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { FileManager } from '../files/file-manager';
import { SchemaValidator } from '../validation/schema';
import { ProcessRunner } from '../process/runner';
import { ExecuteOptions, ExecuteResult } from '../types';
import { ProcessError, ValidationError } from '../errors';

interface SingleShotConfig {
  claudeCodePath: string;
  tempDir: string;
}

export class SingleShotExecutor {
  private fileManager: FileManager;
  private processRunner: ProcessRunner;

  constructor(private config: SingleShotConfig) {
    this.fileManager = new FileManager(config.tempDir);
    this.processRunner = new ProcessRunner();
  }

  async prepareTask<T extends z.ZodType>(
    options: ExecuteOptions<T>
  ): Promise<string> {
    const taskId = uuidv4();
    const taskDir = await this.fileManager.createTaskDir(taskId);

    // Write instructions
    await this.fileManager.writeTaskSpec(taskDir, {
      prompt: options.prompt,
      variables: options.variables || {}
    });

    // Write schema
    const jsonSchema = SchemaValidator.toJsonSchema(options.schema);
    await this.fileManager.writeSchema(taskDir, jsonSchema);

    return taskDir;
  }

  async execute<T extends z.ZodType>(
    options: ExecuteOptions<T>
  ): Promise<ExecuteResult<T>> {
    const startTime = Date.now();

    try {
      const taskDir = await this.prepareTask(options);

      // Build Claude Code command
      const prompt = this.buildPrompt(taskDir);
      const args = [prompt];

      if (options.skill) {
        args.unshift('--skill', options.skill);
      }

      // Execute Claude Code
      const result = await this.processRunner.run({
        command: this.config.claudeCodePath,
        args,
        cwd: taskDir,
        timeout: options.timeout
      });

      if (result.exitCode !== 0) {
        throw new ProcessError(
          `Claude Code exited with code ${result.exitCode}: ${result.error}`,
          result.exitCode ?? null,
          result.signal
        );
      }

      // Read logs
      const logs = result.output + (result.error ? '\nERRORS:\n' + result.error : '');

      // Read and validate result
      const resultData = await this.fileManager.readResult(taskDir);
      const validation = SchemaValidator.validate(resultData, options.schema);

      if (!validation.success) {
        throw new ValidationError('Result validation failed', validation.error);
      }

      // List artifacts
      const artifacts = await this.fileManager.listArtifacts(taskDir);

      return {
        success: true,
        outputDir: taskDir,
        logs,
        duration: Date.now() - startTime,
        data: validation.data,
        artifacts
      };
    } catch (error) {
      return {
        success: false,
        outputDir: '',
        logs: '',
        duration: Date.now() - startTime,
        error: error as Error
      };
    }
  }

  private buildPrompt(taskDir: string): string {
    return `Execute the task described in ${taskDir}/instructions.json following the schema in ${taskDir}/schema.json. Write the result to ${taskDir}/result.json and logs to ${taskDir}/logs.txt. Place any artifacts in ${taskDir}/artifacts/.`;
  }
}
