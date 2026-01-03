/**
 * Process custom directives and other markdown enhancements
 */
export function processMarkdownContent(content: string): string {
    let processedContent = content;

    // 1. Convert :::message alert to :::message{type="alert"}
    processedContent = processedContent.replace(/:::message\s+alert\s*([\s\S]*?):::/g, ':::message{type="alert"}\n$1\n:::');

    // 2. Convert :::details Title to :::details{title="Title"}
    processedContent = processedContent.replace(/:::details\s+(.*?)\n([\s\S]*?):::/g, ':::details{title="$1"}\n$2\n:::');

    // 3. Convert @[type](id) to ::type{id="id"} (leaf directive)
    const embedTypes = ['youtube', 'twitter', 'github', 'gist', 'codepen', 'slideshare', 'speakerdeck', 'docswell', 'jsfiddle', 'codesandbox', 'stackblitz', 'figma'];
    const embedRegex = new RegExp(`@\\[(${embedTypes.join('|')})\\]\\(([^)]+)\\)`, 'g');
    processedContent = processedContent.replace(embedRegex, '::$1{id="$2"}');

    // 4. Convert standalone URLs to ::link-card{url="url"}
    processedContent = processedContent.replace(/^(https?:\/\/[^\s]+)\s*$/gm, '::link-card{url="$1"}');

    // 5. Handle image resize syntax ![alt](url "title" =width) or ![alt](url =width)
    processedContent = processedContent.replace(/!\[(.*?)\]\((.*?)\s+(?:("(.*?)")\s+)?=(.*?)\)/g, (_, alt, url, titleFull, __, width) => {
        const titlePart = titleFull ? ` ${titleFull}` : '';
        return `![${alt}](${url}#width=${width}${titlePart})`;
    });

    return processedContent.trim();
}
