import {
    SUPPORTED_EMBED_TYPES,
    MESSAGE_DIRECTIVE_PATTERN,
    DETAILS_DIRECTIVE_PATTERN,
    STANDALONE_URL_PATTERN,
    IMAGE_RESIZE_SYNTAX_PATTERN,
} from './constants';

/**
 * Process custom directives and other markdown enhancements
 */
export function processMarkdownContent(content: string): string {
    let processedContent = content;

    // 1. Convert :::message [type] to :::message{type="[type]"}
    processedContent = processedContent.replace(MESSAGE_DIRECTIVE_PATTERN, ':::message{type="$1"}\n$2\n:::');

    // 2. Convert :::details Title to :::details{title="Title"}
    processedContent = processedContent.replace(DETAILS_DIRECTIVE_PATTERN, ':::details{title="$1"}\n$2\n:::');

    // 3. Convert @[type](id) to ::type{id="id"} (leaf directive)
    const embedRegex = new RegExp(`@\\[(${SUPPORTED_EMBED_TYPES.join('|')})\\]\\(([^)]+)\\)`, 'g');
    processedContent = processedContent.replace(embedRegex, '::$1{id="$2"}');

    // 4. Convert standalone URLs to ::link-card{url="url"}
    processedContent = processedContent.replace(STANDALONE_URL_PATTERN, '::link-card{url="$1"}');

    // 5. Handle image resize syntax ![alt](url "title" =width) or ![alt](url =width)
    processedContent = processedContent.replace(IMAGE_RESIZE_SYNTAX_PATTERN, (_, alt, url, titleFull, __, width) => {
        const titlePart = titleFull ? ` ${titleFull}` : '';
        return `![${alt}](${url}#width=${width}${titlePart})`;
    });

    return processedContent.trim();
}
