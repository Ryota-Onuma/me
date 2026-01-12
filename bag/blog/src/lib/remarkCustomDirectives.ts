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

// Supported embed types
const SUPPORTED_EMBEDS = [
    'youtube', 'twitter', 'github', 'gist', 'codepen',
    'slideshare', 'speakerdeck', 'docswell', 'jsfiddle',
    'codesandbox', 'stackblitz', 'figma'
] as const;

// Embed shortcut pattern: @[type](id)
const EMBED_SHORTCUT_PATTERN = /^@\[(youtube|twitter|github)\]\(([^)]+)\)$/;

// Image width pattern: =123
const IMAGE_WIDTH_PATTERN = /=([0-9]+)$/;

/**
 * Handler for container directives (:::message, :::details)
 */
function handleContainerDirective(node: Node): void {
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
}

/**
 * Handler for leaf directives (::youtube{id=""}, ::link-card{url=""}, etc.)
 */
function handleLeafDirective(node: Node): void {
    if (!isDirectiveNode(node)) return;

    const { name, attributes } = node;

    if (SUPPORTED_EMBEDS.includes(name as typeof SUPPORTED_EMBEDS[number])) {
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
}

/**
 * Handler for auto-link cards (bare URLs on their own line)
 */
function handleAutoLinkCard(node: Paragraph): boolean {
    if (node.children.length !== 1) return false;

    const child = node.children[0];
    if (child.type !== 'link' || child.children.length !== 1) return false;
    if (child.children[0].type !== 'text') return false;

    const textNode = child.children[0] as Text;
    if (textNode.value !== child.url) return false;

    const extendedNode = node as ExtendedParagraph;
    extendedNode.type = 'link-card';
    extendedNode.data = {
        hName: 'link-card',
        hProperties: { url: child.url }
    };

    return true;
}

/**
 * Handler for embed shortcuts (@[youtube](id))
 */
function handleEmbedShortcut(node: Paragraph): boolean {
    if (node.children.length !== 1) return false;

    const child = node.children[0];
    if (child.type !== 'text') return false;

    const text = child.value.trim();
    const match = text.match(EMBED_SHORTCUT_PATTERN);
    if (!match) return false;

    const [, embedName, embedId] = match;
    const extendedNode = node as ExtendedParagraph;
    extendedNode.type = embedName;
    extendedNode.data = {
        hName: embedName,
        hProperties: { id: embedId }
    };

    return true;
}

/**
 * Handler for paragraph shortcuts (auto-link cards and embed shortcuts)
 */
function handleParagraphShortcuts(node: Paragraph): void {
    // Try auto-link card first
    if (handleAutoLinkCard(node)) return;

    // Try embed shortcut
    handleEmbedShortcut(node);
}

/**
 * Handler for image resizing (![alt](/url =width))
 */
function handleImageResize(node: Image): void {
    const url = node.url || '';
    const match = url.match(IMAGE_WIDTH_PATTERN);

    if (!match) return;

    const width = match[1];
    node.url = url.replace(/ =([0-9]+)$/, '').replace(/=([0-9]+)$/, '');

    const extendedNode = node as ExtendedImage;
    extendedNode.data = extendedNode.data || {};
    extendedNode.data.hProperties = extendedNode.data.hProperties || {};
    extendedNode.data.hProperties.width = width;
    extendedNode.data.hProperties.style = `width: ${width}px; max-width: 100%; height: auto;`;
}

/**
 * Handler for table wrapping (adds scrollable container)
 */
function handleTableWrapper(node: Table, index: number | undefined, parent: Parent | undefined): void {
    if (!parent || typeof index !== 'number') return;

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

    parent.children[index] = wrapper as unknown as Table;
}

/**
 * Remark plugin to handle custom markdown directives and shortcuts.
 * Transforms specific syntax into data that can be used by React components.
 */
export const remarkCustomDirectives: Plugin<[], Root> = () => {
    return (tree) => {
        // 1. Handle Container Directives (:::message, :::details)
        visit(tree, 'containerDirective', handleContainerDirective);

        // 2. Handle Leaf Directives (::youtube{id=""}, etc.)
        visit(tree, 'leafDirective', handleLeafDirective);

        // 3. Handle Text-based Shortcuts (@[youtube](id)) and Auto-Link Cards
        visit(tree, 'paragraph', handleParagraphShortcuts);

        // 4. Handle Image Resizing (![alt](/url =width))
        visit(tree, 'image', handleImageResize);

        // 5. Wrap Tables in a scrollable container for horizontal overflow
        visit(tree, 'table', handleTableWrapper);
    };
};

