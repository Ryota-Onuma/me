/**
 * Custom error types for content loading
 * Re-exported from centralized types
 */

import type { ContentType } from '@/types';

export { ContentLoadError, FrontmatterParseError } from '@/types';

/**
 * Safely log error and return null (for graceful degradation)
 */
export function handleContentError(error: unknown, fileName: string, contentType: ContentType): null {
  // Check for custom error types by name since they may be from different imports
  if (error instanceof Error && (error.name === 'ContentLoadError' || error.name === 'FrontmatterParseError')) {
    console.error(error.message);
  } else {
    console.error(`Unexpected error loading ${contentType} ${fileName}:`, error);
  }
  return null;
}
