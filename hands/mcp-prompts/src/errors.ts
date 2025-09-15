import { ErrorCode, PromptsError } from './types.js';
import { logger } from './logger.js';
import * as path from 'path';

export class PromptsErrorImpl extends Error implements PromptsError {
  constructor(
    public code: ErrorCode,
    message: string,
    public hint?: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'PromptsError';
  }
}

export function createError(
  code: ErrorCode,
  message: string,
  hint?: string,
  details?: Record<string, unknown>
): PromptsError {
  return new PromptsErrorImpl(code, message, hint, details);
}

export function mapSystemError(error: Error, filePath?: string): PromptsError {
  if (error instanceof PromptsErrorImpl) {
    return error;
  }

  const nodeError = error as NodeJS.ErrnoException;

  switch (nodeError.code) {
    case 'ENOENT':
      return createError(
        'NotFound',
        `File not found: ${filePath || 'unknown'}`,
        'Check if the file exists and is accessible',
        { originalError: nodeError.code, path: filePath }
      );

    case 'EACCES':
    case 'EPERM':
      return createError(
        'Forbidden',
        `Permission denied: ${filePath || 'unknown'}`,
        'Check file permissions',
        { originalError: nodeError.code, path: filePath }
      );

    case 'EISDIR':
      return createError(
        'InvalidRequest',
        `Expected file but found directory: ${filePath || 'unknown'}`,
        'Specify a file path, not a directory',
        { originalError: nodeError.code, path: filePath }
      );

    default:
      return createError(
        'InternalError',
        `System error: ${error.message}`,
        'Check system logs for more details',
        { originalError: nodeError.code, path: filePath }
      );
  }
}

export function validatePathSecurity(requestedPath: string, rootPath: string): void {
  // Normalize paths to handle '..' and '.' components
  // path imported at top of file
  const normalizedRoot = path.resolve(rootPath);
  const normalizedRequested = path.resolve(rootPath, requestedPath);

  // Check if the requested path is within the root directory
  if (
    !normalizedRequested.startsWith(normalizedRoot + path.sep) &&
    normalizedRequested !== normalizedRoot
  ) {
    throw createError(
      'Forbidden',
      'Access denied: path outside root directory',
      'Ensure the path is within the allowed directory',
      { requestedPath, rootPath }
    );
  }
}

export function handlePromptError(error: unknown, context?: string): PromptsError {
  if (error instanceof PromptsErrorImpl) {
    logger.error(`Prompt error in ${context || 'unknown context'}`, {
      code: error.code,
      message: error.message,
      hint: error.hint,
      details: error.details,
    });
    return error;
  }

  if (error instanceof Error) {
    const mappedError = mapSystemError(error);
    logger.error(`Mapped system error in ${context || 'unknown context'}`, {
      code: mappedError.code,
      message: mappedError.message,
      originalMessage: error.message,
    });
    return mappedError;
  }

  const unknownError = createError(
    'InternalError',
    `Unknown error: ${String(error)}`,
    'Check system logs for more details',
    { context, originalError: String(error) }
  );

  logger.error(`Unknown error in ${context || 'unknown context'}`, {
    error: String(error),
  });

  return unknownError;
}

export function isPromptNotApplicable(
  targets: string[] | undefined,
  currentClient: string
): boolean {
  if (!targets || targets.length === 0) {
    return false;
  }

  return !targets.includes(currentClient);
}


export function validateTemplateArguments(
  template: string,
  positionalArgs: string[],
  namedArgs: Record<string, string>,
  strict: boolean
): void {
  if (!strict) {
    return;
  }

  // Find all positional placeholders
  const positionalMatches = template.match(/\$(\d+)/g) || [];
  const maxPositional = Math.max(0, ...positionalMatches.map(match => parseInt(match.slice(1))));

  if (maxPositional > positionalArgs.length) {
    throw createError(
      'InvalidArguments',
      `Missing positional arguments: expected at least ${maxPositional}, got ${positionalArgs.length}`,
      'Provide all required positional arguments or disable strict mode',
      {
        expectedMinimum: maxPositional,
        provided: positionalArgs.length,
        missingArgs: Array.from(
          { length: maxPositional - positionalArgs.length },
          (_, i) => `$${positionalArgs.length + i + 1}`
        ),
      }
    );
  }

  // Find all named placeholders
  const namedMatches = template.match(/\{\{(\w+)\}\}/g) || [];
  const requiredNamed = namedMatches.map(match => match.slice(2, -2));
  const missingNamed = requiredNamed.filter(name => !(name in namedArgs));

  if (missingNamed.length > 0) {
    throw createError(
      'InvalidArguments',
      `Missing named arguments: ${missingNamed.join(', ')}`,
      'Provide all required named arguments or disable strict mode',
      { missingArgs: missingNamed, providedArgs: Object.keys(namedArgs) }
    );
  }
}

export function createFrontmatterError(filePath: string, parseError: Error): PromptsError {
  return createError(
    'InvalidPromptFormat',
    `Failed to parse frontmatter in '${filePath}': ${parseError.message}`,
    'Check YAML/TOML syntax in the frontmatter section',
    { filePath, parseError: parseError.message }
  );
}
