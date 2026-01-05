/**
 * Exhaustive check utility for TypeScript.
 * Use this in the default case of a switch statement or at the end of an if/else chain
 * to ensure all cases of a union type are handled.
 * 
 * @example
 * switch (type) {
 *   case 'A': ...
 *   case 'B': ...
 *   default: assertNever(type);
 * }
 */
export function assertNever(x: never): never {
    throw new Error(`Unexpected object: ${x}`);
}
