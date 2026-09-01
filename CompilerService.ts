import { spawn, execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { ISandbox } from './SandboxService.ts';
import { ProblemItem, CHeaderInfo, CompilerEnvironmentInfo } from '../../shared/types.ts';

export interface CompilationResult {
  success: boolean;
  binaryPath?: string;
  compilerOutput: string;
  problems: ProblemItem[];
  command: string;
}

export interface CompileOptions {
  standard?: 'c11' | 'c17' | 'c23';
  customFlags?: string[];
  activeFileName?: string;
  entryFile?: string;
}

const KNOWN_HEADERS: Array<{
  name: string;
  category: 'standard' | 'posix' | 'system';
  description: string;
  commonFunctions: string[];
}> = [
  {
    name: 'stdio.h',
    category: 'standard',
    description: 'Standard Input/Output functions such as printf(), scanf(), fopen(), fclose(), fgets(), puts()',
    commonFunctions: ['printf', 'scanf', 'fopen', 'fclose', 'fgets', 'fputs', 'getchar', 'putchar', 'sscanf', 'sprintf', 'snprintf'],
  },
  {
    name: 'stdlib.h',
    category: 'standard',
    description: 'General utilities including dynamic memory management (malloc, calloc, free), conversions (atoi, strtol), pseudo-random generation (rand, srand), sorting (qsort), and process termination (exit, abort)',
    commonFunctions: ['malloc', 'calloc', 'realloc', 'free', 'atoi', 'atof', 'strtol', 'rand', 'srand', 'exit', 'qsort', 'bsearch', 'abs'],
  },
  {
    name: 'string.h',
    category: 'standard',
    description: 'String manipulation and raw buffer memory operations such as strlen(), strcpy(), strcmp(), memcpy(), memset()',
    commonFunctions: ['strlen', 'strcpy', 'strncpy', 'strcmp', 'strncmp', 'strcat', 'strncat', 'strchr', 'strstr', 'strtok', 'memcpy', 'memmove', 'memset', 'memcmp'],
  },
  {
    name: 'math.h',
    category: 'standard',
    description: 'Common mathematical functions and floating-point computations such as sqrt(), pow(), sin(), cos(), tan(), log(), ceil(), floor() [requires linking -lm]',
    commonFunctions: ['sqrt', 'pow', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'log10', 'exp', 'ceil', 'floor', 'round', 'fabs', 'fmod'],
  },
  {
    name: 'ctype.h',
    category: 'standard',
    description: 'Character classification and ASCII case conversion utilities such as isalpha(), isdigit(), isspace(), toupper(), tolower()',
    commonFunctions: ['isalpha', 'isdigit', 'isalnum', 'isspace', 'ispunct', 'isupper', 'islower', 'toupper', 'tolower'],
  },
  {
    name: 'time.h',
    category: 'standard',
    description: 'System calendar time, epoch timestamps, formatted date strings, and CPU execution clock monitoring (time, strftime, localtime, clock)',
    commonFunctions: ['time', 'clock', 'difftime', 'strftime', 'localtime', 'gmtime', 'mktime', 'asctime'],
  },
  {
    name: 'stdbool.h',
    category: 'standard',
    description: 'Standard Boolean type definition (bool, true, false) and boolean macros introduced in ISO C99',
    commonFunctions: ['bool', 'true', 'false'],
  },
  {
    name: 'stdint.h',
    category: 'standard',
    description: 'Exact-width integer types with guaranteed bit widths such as int8_t, int16_t, int32_t, int64_t, uint8_t, uint32_t, uint64_t',
    commonFunctions: ['int8_t', 'int16_t', 'int32_t', 'int64_t', 'uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'intptr_t', 'uintptr_t'],
  },
  {
    name: 'stddef.h',
    category: 'standard',
    description: 'Standard definitions and fundamental macros such as size_t, ptrdiff_t, NULL, and offsetof()',
    commonFunctions: ['size_t', 'ptrdiff_t', 'NULL', 'offsetof'],
  },
  {
    name: 'limits.h',
    category: 'standard',
    description: 'Constants specifying the implementation limits and value ranges for integer types (INT_MAX, INT_MIN, CHAR_BIT, LONG_MAX)',
    commonFunctions: ['INT_MAX', 'INT_MIN', 'UINT_MAX', 'CHAR_BIT', 'CHAR_MAX', 'SHRT_MAX', 'LONG_MAX', 'LLONG_MAX'],
  },
  {
    name: 'float.h',
    category: 'standard',
    description: 'Constants specifying machine characteristics and precision limits of floating-point representations (FLT_MAX, DBL_MAX, DBL_EPSILON)',
    commonFunctions: ['FLT_MAX', 'FLT_MIN', 'DBL_MAX', 'DBL_MIN', 'DBL_EPSILON', 'FLT_EPSILON'],
  },
  {
    name: 'assert.h',
    category: 'standard',
    description: 'Diagnostic macro assert() for validating program preconditions and runtime invariants during development and testing',
    commonFunctions: ['assert', 'static_assert'],
  },
  {
    name: 'errno.h',
    category: 'standard',
    description: 'System error code macros and thread-local errno indicator used by library calls to signal failure conditions',
    commonFunctions: ['errno', 'EDOM', 'ERANGE', 'EINVAL', 'ENOMEM', 'EACCES', 'ENOENT'],
  },
  {
    name: 'locale.h',
    category: 'standard',
    description: 'Localization rules, country-specific numeric conventions, and currency formatting (setlocale, struct lconv)',
    commonFunctions: ['setlocale', 'localeconv'],
  },
  {
    name: 'signal.h',
    category: 'standard',
    description: 'Signal handling facilities and software interrupt dispatching routines (signal, raise, SIGINT, SIGTERM, SIGSEGV)',
    commonFunctions: ['signal', 'raise', 'SIGINT', 'SIGTERM', 'SIGSEGV', 'SIGABRT', 'SIGFPE'],
  },
  {
    name: 'setjmp.h',
    category: 'standard',
    description: 'Non-local jumps across function frames and control-flow context save/restoration (setjmp, longjmp, jmp_buf)',
    commonFunctions: ['setjmp', 'longjmp', 'jmp_buf'],
  },
  {
    name: 'stdarg.h',
    category: 'standard',
    description: 'Variable argument list macros for implementing custom variadic functions (va_list, va_start, va_arg, va_end, va_copy)',
    commonFunctions: ['va_list', 'va_start', 'va_arg', 'va_end', 'va_copy'],
  },
  {
    name: 'inttypes.h',
    category: 'standard',
    description: 'Format specifier macros for printf/scanf with exact-width integers (PRId64, PRIu32, SCNd32) and greatest-width math',
    commonFunctions: ['PRId8', 'PRId16', 'PRId32', 'PRId64', 'PRIu32', 'PRIu64', 'PRIx64', 'imaxabs', 'imaxdiv'],
  },
  {
    name: 'complex.h',
    category: 'standard',
    description: 'Complex number arithmetic, imaginary numbers, and complex trigonometry functions (creal, cimag, cabs, csqrt)',
    commonFunctions: ['creal', 'cimag', 'cabs', 'carg', 'conj', 'cproj', 'csqrt', 'cexp', 'clog'],
  },
  {
    name: 'fenv.h',
    category: 'standard',
    description: 'Floating-point environment access, rounding mode control, and IEEE-754 exception flags handling',
    commonFunctions: ['feclearexcept', 'feraiseexcept', 'fetestexcept', 'fegetround', 'fesetround'],
  },
  {
    name: 'tgmath.h',
    category: 'standard',
    description: 'Type-generic mathematical macros that automatically dispatch to float, double, or complex variants based on operand types',
    commonFunctions: ['sqrt', 'pow', 'sin', 'cos', 'exp', 'log', 'fabs'],
  },
  {
    name: 'iso646.h',
    category: 'standard',
    description: 'Alternative operator spellings for readable logical and bitwise operations (and, or, not, xor, bitand, bitor)',
    commonFunctions: ['and', 'or', 'not', 'xor', 'bitand', 'bitor', 'compl', 'and_eq', 'or_eq'],
  },
  {
    name: 'wctype.h',
    category: 'standard',
    description: 'Wide character classification and unicode/multibyte mapping utilities (iswalpha, iswdigit, towupper, towlower)',
    commonFunctions: ['iswalpha', 'iswdigit', 'iswspace', 'towupper', 'towlower', 'wctype', 'iswctype'],
  },
  {
    name: 'wchar.h',
    category: 'standard',
    description: 'Wide string manipulation and formatted wide I/O functions (wprintf, wscanf, wcslen, wcscpy, wcscmp)',
    commonFunctions: ['wprintf', 'wscanf', 'wcslen', 'wcscpy', 'wcscmp', 'wcstok', 'wmemchr'],
  },
  {
    name: 'unistd.h',
    category: 'posix',
    description: 'POSIX standard operating system API providing low-level file I/O, process management, sleeping, and pipes',
    commonFunctions: ['read', 'write', 'close', 'lseek', 'pipe', 'sleep', 'usleep', 'getpid', 'access'],
  },
  {
    name: 'sys/types.h',
    category: 'posix',
    description: 'POSIX system primitive data type definitions (pid_t, off_t, mode_t, ssize_t, time_t, uid_t, gid_t)',
    commonFunctions: ['pid_t', 'off_t', 'mode_t', 'ssize_t', 'time_t', 'uid_t', 'gid_t'],
  },
  {
    name: 'sys/stat.h',
    category: 'posix',
    description: 'POSIX file metadata, file permissions, inode examination, and directory creation (stat, fstat, lstat, mkdir, chmod)',
    commonFunctions: ['stat', 'fstat', 'lstat', 'mkdir', 'chmod', 'struct stat', 'S_ISREG', 'S_ISDIR'],
  },
  {
    name: 'fcntl.h',
    category: 'posix',
    description: 'File control operations, open flags, non-blocking descriptors, and locking (open, fcntl, creat, O_RDONLY, O_WRONLY)',
    commonFunctions: ['open', 'fcntl', 'creat', 'O_RDONLY', 'O_WRONLY', 'O_RDWR', 'O_CREAT', 'O_APPEND'],
  },
  {
    name: 'pthread.h',
    category: 'posix',
    description: 'POSIX Threads API for multi-threaded programming, mutex locks, condition variables, and thread joins [linked with -pthread]',
    commonFunctions: ['pthread_create', 'pthread_join', 'pthread_exit', 'pthread_mutex_init', 'pthread_mutex_lock', 'pthread_mutex_unlock'],
  },
  {
    name: 'dirent.h',
    category: 'posix',
    description: 'POSIX directory stream access and filesystem folder entry traversal (opendir, readdir, closedir, struct dirent)',
    commonFunctions: ['opendir', 'readdir', 'closedir', 'rewinddir', 'struct dirent'],
  },
];

export class CompilerService {
  private sandbox: ISandbox;
  private cachedEnvInfo: CompilerEnvironmentInfo | null = null;

  constructor(sandbox: ISandbox) {
    this.sandbox = sandbox;
  }

  /**
   * Probe and verify the actual GCC compiler environment on the system.
   * Real check ensures no fake headers are reported.
   */
  public async getCompilerEnvironment(): Promise<CompilerEnvironmentInfo> {
    if (this.cachedEnvInfo) {
      return this.cachedEnvInfo;
    }

    let versionStr = 'GCC Toolchain';
    let fullVersion = '';
    try {
      fullVersion = execSync('gcc --version', { timeout: 2000, encoding: 'utf8' }).trim();
      versionStr = fullVersion.split('\n')[0] || 'GCC Available';
    } catch (e: any) {
      versionStr = `GCC Probing Error: ${e.message}`;
    }

    // Detect supported standard flags dynamically
    const supportedStandards: Array<'c11' | 'c17' | 'c23'> = ['c11', 'c17'];
    try {
      execSync('echo "int main(){return 0;}" | gcc -std=c23 -x c - -o /dev/null > /dev/null 2>&1', { timeout: 1500 });
      supportedStandards.push('c23');
    } catch {
      // Check if -std=c2x is supported (GCC 12 C23 draft)
      try {
        execSync('echo "int main(){return 0;}" | gcc -std=c2x -x c - -o /dev/null > /dev/null 2>&1', { timeout: 1500 });
        supportedStandards.push('c23');
      } catch {
        // c23 not supported on this older gcc
      }
    }

    // Actually check each header using GCC preprocessor probe
    const availableHeaders: CHeaderInfo[] = [];

    for (const h of KNOWN_HEADERS) {
      let isAvailable = false;
      try {
        execSync(`echo "#include <${h.name}>" | gcc -E -x c - > /dev/null 2>&1`, { timeout: 1000 });
        isAvailable = true;
      } catch {
        isAvailable = false;
      }

      availableHeaders.push({
        name: h.name,
        category: h.category,
        description: h.description,
        commonFunctions: h.commonFunctions,
        available: isAvailable,
      });
    }

    this.cachedEnvInfo = {
      compiler: 'gcc',
      version: versionStr,
      fullVersion,
      defaultStandard: 'c17',
      supportedStandards,
      availableHeaders,
      linkerFlags: ['-lm', '-pthread'],
    };

    return this.cachedEnvInfo;
  }

  /**
   * Parse GCC diagnostic output into structured problems for Monaco editor markers
   */
  public parseDiagnostics(stderr: string): ProblemItem[] {
    const problems: ProblemItem[] = [];
    const lines = stderr.split('\n');

    // Typical GCC format: file.c:10:5: error: expected ';' before 'return'
    // or: file.c:12:15: warning: implicit declaration of function 'foo' [-Wimplicit-function-declaration]
    const regex = /^([^:]+):(\d+):(?:(\d+):)?\s*(error|warning|note|fatal error):\s*(.+)$/i;

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const match = trimmed.match(regex);
      if (match) {
        const [, file, lineStr, colStr, typeStr, message] = match;
        const lineNum = parseInt(lineStr, 10);
        const colNum = colStr ? parseInt(colStr, 10) : 1;
        const normalizedType = typeStr.toLowerCase().includes('error') ? 'error' : (typeStr.toLowerCase().includes('warning') ? 'warning' : 'info');

        problems.push({
          type: normalizedType as 'error' | 'warning' | 'info',
          file: path.basename(file),
          line: isNaN(lineNum) ? undefined : lineNum,
          column: isNaN(colNum) ? undefined : colNum,
          message: message.trim(),
          raw: trimmed,
        });
      } else if (trimmed.includes('undefined reference to') || trimmed.includes('collect2: error: ld returned')) {
        problems.push({
          type: 'error',
          message: trimmed,
          raw: trimmed,
        });
      }
    }

    return problems;
  }

  /**
   * Scan source code content across all files in workspace to detect if math or pthread library linking is required.
   */
  private detectRequiredLinkerFlags(workspacePath: string, cFiles: string[]): string[] {
    const flags: string[] = [];
    let needsMath = false;
    let needsPthread = false;

    // Common math functions in math.h
    const mathPattern = /#include\s*<math\.h>|\b(sqrt|pow|sin|cos|tan|asin|acos|atan|atan2|sinh|cosh|tanh|exp|log|log10|log2|ceil|floor|round|trunc|fmod|remainder|fabs|hypot|cbrt)\s*\(/;
    const pthreadPattern = /#include\s*<pthread\.h>|\bpthread_(create|join|mutex|exit|detach|self)\b/;

    for (const file of cFiles) {
      try {
        const content = fs.readFileSync(path.join(workspacePath, file), 'utf8');
        if (mathPattern.test(content)) {
          needsMath = true;
        }
        if (pthreadPattern.test(content)) {
          needsPthread = true;
        }
      } catch {
        // ignore read error
      }
    }

    if (needsMath) flags.push('-lm');
    if (needsPthread) flags.push('-pthread');

    return flags;
  }

  /**
   * Compiles C code within the given workspace directory using GCC.
   * Supports:
   *  - Single-file and Multi-file C compilation (.c files and .h headers in workspace)
   *  - Local headers: #include "myheader.h" (-I.)
   *  - Modern C Standards: c11, c17, c23 (mapped appropriately)
   *  - Intelligent linking: adds -lm for math operations / math.h
   */
  public async compile(
    workspacePath: string,
    options: CompileOptions | string[] = {}
  ): Promise<CompilationResult> {
    const config = this.sandbox.getConfig();
    const outputPath = path.join(workspacePath, 'program_bin');

    let standard: 'c11' | 'c17' | 'c23' = 'c17';
    let customFlags: string[] = [];
    let activeFileName: string | undefined;
    let entryFile: string | undefined;

    if (Array.isArray(options)) {
      customFlags = options;
      const stdFlag = customFlags.find((f) => f.startsWith('-std='));
      if (stdFlag) {
        if (stdFlag.includes('c23') || stdFlag.includes('c2x')) standard = 'c23';
        else if (stdFlag.includes('c11')) standard = 'c11';
        else if (stdFlag.includes('c17') || stdFlag.includes('c18')) standard = 'c17';
      }
    } else if (typeof options === 'object') {
      if (options.standard) standard = options.standard;
      if (options.customFlags) customFlags = options.customFlags;
      if (options.activeFileName) activeFileName = options.activeFileName;
      if (options.entryFile) entryFile = options.entryFile;
    }

    // Discover all .c files in the workspace
    const entries = await fs.promises.readdir(workspacePath);
    const cFiles = entries.filter((file) => file.endsWith('.c'));

    if (cFiles.length === 0) {
      return {
        success: false,
        compilerOutput: 'Compilation Error: No .c source files found in workspace.',
        problems: [{ type: 'error', message: 'No .c source files found in project workspace', raw: 'No .c source files' }],
        command: 'gcc',
      };
    }

    // Inspect which .c files define a main() function
    const mainPattern = /(?:^|\s)(?:int|void)?\s*main\s*\(/m;
    const filesWithMain: string[] = [];
    const helperFiles: string[] = [];

    for (const file of cFiles) {
      try {
        const content = await fs.promises.readFile(path.join(workspacePath, file), 'utf8');
        if (mainPattern.test(content)) {
          filesWithMain.push(file);
        } else {
          helperFiles.push(file);
        }
      } catch {
        helperFiles.push(file);
      }
    }

    // Determine target files to compile
    let sourceArgs: string[] = [];
    if (filesWithMain.length <= 1) {
      // Standard single-file or multi-file project with at most one main()
      sourceArgs = [...cFiles];
    } else {
      // Multiple files with their own main() (e.g. main.c, new.c, untitled.c)
      let activeTarget = entryFile || activeFileName;
      if (activeTarget && !activeTarget.endsWith('.c')) {
        activeTarget = `${activeTarget}.c`;
      }

      let chosenMain = '';
      if (activeTarget && cFiles.includes(activeTarget)) {
        chosenMain = activeTarget;
      } else if (filesWithMain.includes('main.c')) {
        chosenMain = 'main.c';
      } else {
        chosenMain = filesWithMain[0];
      }

      // Compile chosen main file + any helper files without a main() function
      const helpersToInclude = helperFiles.filter((f) => f !== chosenMain);
      sourceArgs = [chosenMain, ...helpersToInclude];
    }

    // Map standard to the appropriate GCC flag
    let standardFlag = '-std=c17';
    if (standard === 'c11') {
      standardFlag = '-std=c11';
    } else if (standard === 'c23') {
      // Test if -std=c23 or -std=c2x is supported on this GCC
      try {
        execSync('echo "int main(){return 0;}" | gcc -std=c23 -x c - -o /dev/null > /dev/null 2>&1', { timeout: 1000 });
        standardFlag = '-std=c23';
      } catch {
        standardFlag = '-std=c2x'; // GCC 12 draft alias
      }
    }

    // Base compilation flags: modern standard, diagnostics, include current workspace directory
    const compilerFlags = [standardFlag, '-I.', '-Wall', '-Wextra', '-Wno-unused-result', '-O2', '-fmax-errors=100'];

    // Intelligent auto-detection for math library (-lm) and pthread (-pthread)
    const autoLinkFlags = this.detectRequiredLinkerFlags(workspacePath, sourceArgs);
    for (const flag of autoLinkFlags) {
      if (!compilerFlags.includes(flag)) {
        compilerFlags.push(flag);
      }
    }

    // Append safe user custom flags
    for (const f of customFlags) {
      if (config.allowedCompilerFlags.includes(f) && !compilerFlags.includes(f) && !f.startsWith('-std=')) {
        compilerFlags.push(f);
      }
    }

    // Put -lm and -pthread at the end for proper GCC linking order
    const nonLinkerFlags = compilerFlags.filter((f) => f !== '-lm' && f !== '-pthread');
    const linkerFlags = compilerFlags.filter((f) => f === '-lm' || f === '-pthread');

    const args = [...sourceArgs, ...nonLinkerFlags, '-o', 'program_bin', ...linkerFlags];
    const commandStr = `gcc ${args.join(' ')}`;

    return new Promise((resolve) => {
      const sanitizedEnv = this.sandbox.getSanitizedEnv();

      const gccProcess = spawn('gcc', args, {
        cwd: workspacePath,
        env: sanitizedEnv,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let stdout = '';
      let stderr = '';

      gccProcess.stdout?.on('data', (chunk) => {
        if (stdout.length < config.maxOutputBytes) {
          stdout += chunk.toString();
        }
      });

      gccProcess.stderr?.on('data', (chunk) => {
        if (stderr.length < config.maxOutputBytes) {
          stderr += chunk.toString();
        }
      });

      const timer = setTimeout(() => {
        try {
          gccProcess.kill('SIGKILL');
        } catch {
          // ignore
        }
        resolve({
          success: false,
          compilerOutput: 'Compilation timed out after 45 seconds.',
          problems: [{ type: 'error', message: 'Compilation timed out after 45 seconds', raw: 'Compilation timed out' }],
          command: commandStr,
        });
      }, 45000);

      gccProcess.on('close', (code) => {
        clearTimeout(timer);
        const combinedOutput = (stdout + '\n' + stderr).trim();
        const problems = this.parseDiagnostics(stderr);
        const binaryExists = fs.existsSync(outputPath);

        if (code === 0 && binaryExists) {
          resolve({
            success: true,
            binaryPath: outputPath,
            compilerOutput: combinedOutput,
            problems,
            command: commandStr,
          });
        } else {
          resolve({
            success: false,
            compilerOutput: combinedOutput || `Compilation failed with exit code ${code}`,
            problems: problems.length > 0 ? problems : [{ type: 'error', message: combinedOutput || `Exit code ${code}`, raw: combinedOutput }],
            command: commandStr,
          });
        }
      });

      gccProcess.on('error', (err) => {
        clearTimeout(timer);
        resolve({
          success: false,
          compilerOutput: `Failed to spawn GCC: ${err.message}`,
          problems: [{ type: 'error', message: err.message, raw: err.message }],
          command: commandStr,
        });
      });
    });
  }
}
