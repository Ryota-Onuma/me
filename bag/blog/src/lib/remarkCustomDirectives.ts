import { visit } from 'unist-util-visit';
import type { Root, Paragraph, Text, Image, Table, Parent } from 'mdast';
import type { Plugin } from 'unified';
import type { Node, Data } from 'unist';

/**
 * Directive node types from remark-directive
 */
export interface DirectiveData extends Data {
    hName?: string;
    hProperties?: Record<string, string | number | boolean>;
}

export interface DirectiveNode extends Node {
    name: string;
    attributes?: Record<string, string | null | undefined> | null;
    children?: Node[];
    data?: DirectiveData;
}

// Type guard to check if a node is a directive-like node
function isDirectiveNode(node: Node): node is DirectiveNode {
    return 'name' in node && typeof (node as DirectiveNode).name === 'string';
}

// Extended paragraph node for custom modifications (using intersection with Omit to allow type reassignment)
type ExtendedParagraph = Omit<Paragraph, 'type'> & {
    type: string;
    data?: DirectiveData;
};

// Extended image node with data
export interface ExtendedImage extends Image {
    data?: DirectiveData;
}

/**
 * Remark plugin to handle custom markdown directives and shortcuts.
 * Transforms specific syntax into data that can be used by React components.
 */
export const remarkCustomDirectives: Plugin<[], Root> = () => {
    return (tree) => {
        // 1. Handle Container Directives (:::message, :::details)
        visit(tree, 'containerDirective', (node: Node) => {
            if (!isDirectiveNode(node)) return;

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
        visit(tree, 'leafDirective', (node: Node) => {
            if (!isDirectiveNode(node)) return;

            const { name, attributes } = node;

            const supportedEmbeds = [
                'youtube', 'twitter', 'github', 'gist', 'codepen',
                'slideshare', 'speakerdeck', 'docswell', 'jsfiddle',
                'codesandbox', 'stackblitz', 'figma'
            ];

            if (supportedEmbeds.includes(name)) {
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
        visit(tree, 'paragraph', (node: Paragraph) => {
            if (node.children.length === 1) {
                const child = node.children[0];

                // Case: Auto-Link Card (Bare link on its own line)
                if (child.type === 'link' && child.children.length === 1 && child.children[0].type === 'text') {
                    const textNode = child.children[0] as Text;
                    if (textNode.value === child.url) {
                        const url = child.url;
                        const extendedNode = node as ExtendedParagraph;
                        extendedNode.type = 'link-card';
                        extendedNode.data = {
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
                        const [, embedName, embedId] = match;
                        const extendedNode = node as ExtendedParagraph;
                        extendedNode.type = embedName;
                        extendedNode.data = {
                            hName: embedName,
                            hProperties: { id: embedId }
                        };
                        return;
                    }
                }
            }
        });

        // 4. Handle Image Resizing (![alt](/url =width))
        visit(tree, 'image', (node: Image) => {
            const url = node.url || '';
            const match = url.match(/=([0-9]+)$/);
            if (match) {
                const width = match[1];
                node.url = url.replace(/ =([0-9]+)$/, '').replace(/=([0-9]+)$/, '');
                const extendedNode = node as ExtendedImage;
                extendedNode.data = extendedNode.data || {};
                extendedNode.data.hProperties = extendedNode.data.hProperties || {};
                extendedNode.data.hProperties.width = width;
                extendedNode.data.hProperties.style = `width: ${width}px; max-width: 100%; height: auto;`;
            }
        });

        // 5. Wrap Tables in a scrollable container for horizontal overflow
        visit(tree, 'table', (node: Table, index: number | undefined, parent: Parent | undefined) => {
            if (parent && typeof index === 'number') {
                // Create wrapper node
                const wrapper = {
                    type: 'tableWrapper',
                    data: {
                        hName: 'div',
                        hProperties: {
                            className: 'table-wrapper',
                        },
                    },
                    children: [node],
                };
                // Replace table with wrapped version
                parent.children[index] = wrapper as unknown as Table;
            }
        });
    };
};

