import { describe, it, expect } from 'vitest';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkDirective from 'remark-directive';
import { remarkCustomDirectives } from './remark-custom-directives';
import type { Root, Node } from 'mdast';
import type { Processor } from 'unified';

describe('remarkCustomDirectives', () => {
    const getTransformer = (): Processor<Root, Root, Root, Root, string> => {
        return unified()
            .use(remarkParse)
            .use(remarkDirective)
            .use(remarkCustomDirectives) as unknown as Processor<Root, Root, Root, Root, string>;
    };

    const findNode = (node: any, type: string): any => {
        if (node.type === type) return node;
        if (node.children) {
            for (const child of node.children) {
                const found = findNode(child, type);
                if (found) return found;
            }
        }
        return null;
    };

    it('should transform :::message container directive', () => {
        const content = ':::message{type="warning"}\nWarning message\n:::';
        const tree = getTransformer().parse(content);
        const transformedTree = getTransformer().runSync(tree);

        const messageNode: any = transformedTree.children[0];
        expect(messageNode.type).toBe('containerDirective');
        expect(messageNode.data.hName).toBe('message');
        expect(messageNode.data.hProperties.type).toBe('warning');
        expect(messageNode.data.hProperties.className).toContain('custom-message-warning');
    });

    it('should transform ::youtube leaf directive', () => {
        const content = '::youtube{id="dQw4w9WgXcQ"}';
        const tree = getTransformer().parse(content);
        const transformedTree = getTransformer().runSync(tree);

        const youtubeNode = findNode(transformedTree, 'leafDirective');
        expect(youtubeNode).not.toBeNull();
        expect(youtubeNode.data.hName).toBe('youtube');
        expect(youtubeNode.data.hProperties.id).toBe('dQw4w9WgXcQ');
    });

    it('should transform shortcut @\\[youtube\\](id)', () => {
        const content = '@\\[youtube\\](dQw4w9WgXcQ)';
        const tree = getTransformer().parse(content);
        const transformedTree = getTransformer().runSync(tree);

        const youtubeNode: any = transformedTree.children[0];
        expect(youtubeNode.type).toBe('youtube');
        expect(youtubeNode.data.hName).toBe('youtube');
        expect(youtubeNode.data.hProperties.id).toBe('dQw4w9WgXcQ');
    });

    it('should transform auto-link cards', () => {
        const contentLink = '[https://example.com](https://example.com)';
        const tree = getTransformer().parse(contentLink);
        const transformedTree: any = getTransformer().runSync(tree);

        const pNode = transformedTree.children[0];
        expect(pNode.type).toBe('link-card');
        expect(pNode.data.hName).toBe('link-card');
        expect(pNode.data.hProperties.url).toBe('https://example.com');
    });

    it('should handle image resizing syntax', () => {
        const tree: any = {
            type: 'root',
            children: [
                {
                    type: 'paragraph',
                    children: [
                        {
                            type: 'image',
                            url: '/image.png =400',
                            alt: 'alt'
                        }
                    ]
                }
            ]
        };

        const transformedTree = getTransformer().runSync(tree);
        const imgNode = findNode(transformedTree, 'image');

        expect(imgNode).not.toBeNull();
        expect(imgNode.type).toBe('image');
        expect(imgNode.url).toBe('/image.png');
        expect(imgNode.data.hProperties.width).toBe('400');
    });
});
