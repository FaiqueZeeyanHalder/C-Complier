import { DevelopmentSandboxService } from './SandboxService.ts';
import { CompilerService } from './CompilerService.ts';
import { ExecutionService } from './ExecutionService.ts';
import { ExecutionSessionService } from './ExecutionSessionService.ts';
import { TerminalService } from './TerminalService.ts';
import { AIService } from './AIService.ts';

export const sandboxService = new DevelopmentSandboxService();
export const compilerService = new CompilerService(sandboxService);
export const executionService = new ExecutionService(sandboxService);
export const sessionService = new ExecutionSessionService(sandboxService, compilerService);
export const terminalService = new TerminalService(sandboxService);
export const aiService = new AIService();
