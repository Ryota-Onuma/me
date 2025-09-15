import { TemplateContext } from './types.js';
import { validateTemplateArguments } from './errors.js';
import { logger } from './logger.js';

export function renderTemplate(
  template: string,
  positionalArgs: string[] = [],
  namedArgs: Record<string, string> = {},
  strict: boolean = false
): string {
  const context: TemplateContext = {
    positionalArgs,
    namedArgs,
    strict,
  };

  const variables = extractTemplateVariables(template);
  
  const missingPositional: number[] = [];
  const missingNamed: string[] = [];

  for (const pos of variables.positional) {
    if (!positionalArgs[pos - 1]) {
      missingPositional.push(pos);
    }
  }

  for (const name of variables.named) {
    if (!(name in namedArgs) || namedArgs[name] === undefined) {
      missingNamed.push(name);
    }
  }

  if (missingPositional.length > 0 || missingNamed.length > 0) {
    const errors: string[] = [];
    
    if (missingPositional.length > 0) {
      errors.push(`Missing positional arguments: ${missingPositional.map(n => `$${n}`).join(', ')}`);
    }
    
    if (missingNamed.length > 0) {
      errors.push(`Missing named arguments: ${missingNamed.map(n => `{{${n}}}`).join(', ')}`);
    }

    throw new Error(`Template arguments required: ${errors.join('; ')}. Please provide all required arguments to use this prompt.`);
  }

  if (strict) {
    validateTemplateArguments(template, positionalArgs, namedArgs, strict);
  }

  let result = template;

  result = replacePositionalArgs(result, context);
  result = replaceNamedArgs(result, context);

  return result;
}

function replacePositionalArgs(template: string, context: TemplateContext): string {
  // Handle escaped positional args first ($$1 -> $1)
  let result = template.replace(/\$\$(\d+)/g, '\u0001ESCAPED_DOLLAR$1\u0001');

  // Replace actual positional args ($1 -> value)
  result = result.replace(/\$(\d+)/g, (match, num) => {
    const index = parseInt(num) - 1; // $1 corresponds to index 0

    if (index >= 0 && index < context.positionalArgs.length) {
      return context.positionalArgs[index] || '';
    }

    // In strict mode, this should have been caught by validation
    if (context.strict) {
      logger.warn(`Unresolved positional argument: ${match}`);
    }

    return match; // Keep placeholder if not found and not in strict mode
  });

  // Restore escaped dollar signs
  result = result.replace(/\u0001ESCAPED_DOLLAR(\d+)\u0001/g, '$$$1');

  return result;
}

function replaceNamedArgs(template: string, context: TemplateContext): string {
  // Handle triple braces first (escape mechanism: {{{name}}} -> {{name}})
  let result = template.replace(/\{\{\{(\w+)\}\}\}/g, '\u0002ESCAPED_BRACE$1\u0002');

  // Replace actual named args ({{name}} -> value)
  result = result.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    if (name in context.namedArgs) {
      return context.namedArgs[name] || '';
    }

    // In strict mode, this should have been caught by validation
    if (context.strict) {
      logger.warn(`Unresolved named argument: ${match}`);
    }

    return match; // Keep placeholder if not found and not in strict mode
  });

  // Restore escaped braces
  result = result.replace(/\u0002ESCAPED_BRACE(\w+)\u0002/g, '{{$1}}');

  return result;
}

export function extractTemplateVariables(template: string): {
  positional: number[];
  named: string[];
} {
  const positional: number[] = [];
  const named: string[] = [];

  // Find positional variables ($1, $2, etc.) - exclude escaped ones
  const positionalMatches = template.match(/(?<!\$)\$(\d+)/g) || [];
  for (const match of positionalMatches) {
    const num = parseInt(match.slice(1));
    if (!positional.includes(num)) {
      positional.push(num);
    }
  }

  // Find named variables ({{name}}) - exclude triple-braced ones
  const namedMatches = template.match(/(?<!\{)\{\{(\w+)\}\}(?!\})/g) || [];
  for (const match of namedMatches) {
    const name = match.slice(2, -2);
    if (!named.includes(name)) {
      named.push(name);
    }
  }

  return {
    positional: positional.sort((a, b) => a - b),
    named: named.sort(),
  };
}

export function validateTemplate(template: string): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  try {
    // Check for unmatched braces
    const openBraces = (template.match(/\{\{/g) || []).length;
    const closeBraces = (template.match(/\}\}/g) || []).length;

    if (openBraces !== closeBraces) {
      errors.push(`Unmatched braces: ${openBraces} opening, ${closeBraces} closing`);
    }

    // Check for invalid positional argument syntax
    const invalidPositional = template.match(/\$[^0-9$]/g);
    if (invalidPositional) {
      errors.push(`Invalid positional argument syntax: ${invalidPositional.join(', ')}`);
    }

    // Check for invalid named argument syntax
    const invalidNamed = template.match(/\{\{[^}]*[^a-zA-Z0-9_][^}]*\}\}/g);
    if (invalidNamed) {
      errors.push(
        `Invalid named argument syntax (only alphanumeric and underscore allowed): ${invalidNamed.join(', ')}`
      );
    }

    // Extract variables to check for validity
    extractTemplateVariables(template);
  } catch (error) {
    errors.push(
      `Template parsing error: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function previewTemplate(
  template: string,
  samplePositionalArgs?: string[],
  sampleNamedArgs?: Record<string, string>
): string {
  const variables = extractTemplateVariables(template);

  // Generate sample arguments if not provided
  const positionalArgs = samplePositionalArgs || variables.positional.map(num => `<arg${num}>`);
  const namedArgs =
    sampleNamedArgs || Object.fromEntries(variables.named.map(name => [name, `<${name}>`]));

  return renderTemplate(template, positionalArgs, namedArgs, false);
}

export function hasTemplateVariables(template: string): boolean {
  const variables = extractTemplateVariables(template);
  return variables.positional.length > 0 || variables.named.length > 0;
}

export function createTemplateFromArgs(content: string, argumentNames: string[]): string {
  // Simple heuristic to insert template variables
  // This is a basic implementation - could be made more sophisticated
  let template = content;

  for (const [index, name] of argumentNames.entries()) {
    const placeholder = `{{${name}}}`;
    const positionalPlaceholder = `$${index + 1}`;

    // Try to find a good place to insert the placeholder
    // This is a very basic implementation
    if (!template.includes(placeholder) && !template.includes(positionalPlaceholder)) {
      template += `\n\n${name}: ${placeholder}`;
    }
  }

  return template;
}
