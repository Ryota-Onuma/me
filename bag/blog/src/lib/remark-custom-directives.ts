import { visit } from 'unist-util-visit';
import type { Root, Link, Paragraph, Text, Image } from 'mdast';
import type { Plugin } from 'unified';
import type { Node } from 'unist';

/**
 * Custom node interface to handle properties added by remark-directive
 * and for mapping to React components.
 */
interface CustomNode extends Node {
    name?: string;
    attributes?: Record<string, string | null | undefined>;
    children?: any[];
    data?: {
        hName?: string;
        hProperties?: Record<string, any>;
        [key: string]: any;
    };
    [key: string]: any;
}

/**
 * Remark plugin to handle custom markdown directives and shortcuts.
 * Transforms specific syntax into data that can be used by React components.
 */
export const remarkCustomDirectives: Plugin<[], Root> = () => {
    return (tree) => {
        // 1. Handle Container Directives (:::message, :::details)
        visit(tree as any, 'containerDirective', (node: CustomNode) => {
            const { name, attributes } = node;

            if (name === 'message') {
                node.data = {
                    hName: 'message',
                    hProperties: {
                        type: attributes?.type || 'info',
                        className: `custom-message custom-message-${attributes?.type || 'info'}`,
                    },
                };
            } else if (name === 'details') {
                node.data = {
                    hName: 'details',
                    hProperties: {
                        title: attributes?.title || '',
                        className: 'custom-details',
                    },
                };
            }
        });

        // 2. Handle Leaf Directives (::youtube[id], etc.)
        visit(tree as any, 'leafDirective', (node: CustomNode) => {
            const { name, attributes } = node;

            const supportedEmbeds = [
                'youtube', 'twitter', 'github', 'gist', 'codepen',
                'slideshare', 'speakerdeck', 'docswell', 'jsfiddle',
                'codesandbox', 'stackblitz', 'figma'
            ];

            if (supportedEmbeds.includes(name || '')) {
                node.data = {
                    hName: name,
                    hProperties: {
                        id: attributes?.id || attributes?.v || '',
                    },
                };
            } else if (name === 'link-card') {
                node.data = {
                    hName: 'link-card',
                    hProperties: {
                        url: attributes?.url || '',
                    },
                };
            }
        });

        // 3. Handle Text-based Shortcuts (@[youtube](id)) and Auto-Link Cards
        visit(tree as any, 'paragraph', (node: Paragraph) => {
            if (node.children.length === 1) {
                const child = node.children[0];

                // Case: Auto-Link Card (Bare link on its own line)
                if (child.type === 'link' && child.children.length === 1 && child.children[0].type === 'text') {
                    const textNode = child.children[0] as Text;
                    if (textNode.value === child.url) {
                        const url = child.url;
                        const customNode = node as any;
                        customNode.type = 'link-card';
                        customNode.data = {
                            hName: 'link-card',
                            hProperties: { url }
                        };
                        return;
                    }
                }

                // Case: Embed Shortcut (@[youtube](id))
                if (child.type === 'text') {
                    const text = child.value.trim();
                    const match = text.match(/^@\[(youtube|twitter|github)\]\(([^)]+)\)$/);
                    if (match) {
                        const [, name, id] = match;
                        const customNode = node as any;
                        customNode.type = name;
                        customNode.data = {
                            hName: name,
                            hProperties: { id }
                        };
                        return;
                    }
                }
            }
        });

        // 4. Handle Image Resizing (![alt](/url =width))
        visit(tree as any, 'image', (node: Image & { data?: any }) => {
            const url = node.url || '';
            const match = url.match(/=([0-9]+)$/);
            if (match) {
                const width = match[1];
                node.url = url.replace(/ =([0-9]+)$/, '').replace(/=([0-9]+)$/, '');
                node.data = node.data || {};
                node.data.hProperties = node.data.hProperties || {};
                node.data.hProperties.width = width;
                node.data.hProperties.style = `width: ${width}px; max-width: 100%; height: auto;`;
            }
        });
    };
};
