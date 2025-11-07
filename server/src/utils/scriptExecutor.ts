import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

export class ScriptExecutor {
  private scriptsDir: string;
  private projectRoot: string;

  constructor() {
    // When running from src/, go up to server/, then up to project root
    // When running from dist/, go up to server/, then up to project root
    this.projectRoot = path.join(__dirname, '../../..');
    this.scriptsDir = path.join(this.projectRoot, 'scripts');
  }

  async executeScript(
    scriptName: string,
    env: Record<string, string> = {}
  ): Promise<{ stdout: string; stderr: string }> {
    const scriptPath = path.join(this.scriptsDir, scriptName);
    
    console.log(`[ScriptExecutor] Executing: ${scriptPath}`);
    console.log(`[ScriptExecutor] Project Root: ${this.projectRoot}`);
    console.log(`[ScriptExecutor] Scripts Dir: ${this.scriptsDir}`);
    
    // Create a clean environment, inheriting from process.env but removing script-specific vars
    // that might conflict with the script's own defaults
    const cleanEnv = { ...process.env };
    
    // Remove variables that the scripts should define themselves
    delete cleanEnv.FAUCET_SCRIPT;
    delete cleanEnv.EXTRACT_TX_SCRIPT;
    delete cleanEnv.PROGRAM_SOURCE;
    delete cleanEnv.WITNESS_FILE;
    delete cleanEnv.INTERNAL_KEY;
    
    try {
      const { stdout, stderr } = await execAsync(`bash "${scriptPath}"`, {
        env: {
          ...cleanEnv,
          ...env,
          NO_PAUSE: '1', // Skip interactive pauses
          PATH: process.env.PATH || '/usr/local/bin:/usr/bin:/bin',
          HOME: process.env.HOME || '',
        },
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        cwd: this.projectRoot,
      });

      return { stdout, stderr };
    } catch (error: any) {
      console.error(`[ScriptExecutor] Error executing ${scriptName}:`, error.message);
      throw new Error(`Script execution failed: ${error.message}\nStderr: ${error.stderr}`);
    }
  }

  parseJsonFromOutput(output: string): any {
    // Try to extract JSON from the output
    // Scripts output JSON lines, we need to find them
    const lines = output.split('\n');
    
    // Look for lines that look like JSON
    for (let i = lines.length - 1; i >= 0; i--) {
      const line = lines[i].trim();
      if (line.startsWith('{') && line.endsWith('}')) {
        try {
          return JSON.parse(line);
        } catch {
          continue;
        }
      }
    }
    
    throw new Error('No valid JSON found in script output');
  }

  extractKeyValuePairs(output: string): Record<string, string> {
    const result: Record<string, string> = {};
    const lines = output.split('\n');
    
    for (const line of lines) {
      const match = line.match(/^(\w+)\s*=\s*(.+)$/);
      if (match) {
        result[match[1]] = match[2].trim();
      }
    }
    
    return result;
  }
}
