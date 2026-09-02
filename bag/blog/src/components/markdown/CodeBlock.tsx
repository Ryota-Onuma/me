'use client';

import React, { memo } from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyButton } from './CopyButton';

// Register languages for PrismLight (required for syntax highlighting)
import javascript from 'react-syntax-highlighter/dist/esm/languages/prism/javascript';
import typescript from 'react-syntax-highlighter/dist/esm/languages/prism/typescript';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import jsx from 'react-syntax-highlighter/dist/esm/languages/prism/jsx';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import scss from 'react-syntax-highlighter/dist/esm/languages/prism/scss';
import json from 'react-syntax-highlighter/dist/esm/languages/prism/json';
import markdown from 'react-syntax-highlighter/dist/esm/languages/prism/markdown';
import bash from 'react-syntax-highlighter/dist/esm/languages/prism/bash';
import python from 'react-syntax-highlighter/dist/esm/languages/prism/python';
import go from 'react-syntax-highlighter/dist/esm/languages/prism/go';
import rust from 'react-syntax-highlighter/dist/esm/languages/prism/rust';
import java from 'react-syntax-highlighter/dist/esm/languages/prism/java';
import c from 'react-syntax-highlighter/dist/esm/languages/prism/c';
import cpp from 'react-syntax-highlighter/dist/esm/languages/prism/cpp';
import sql from 'react-syntax-highlighter/dist/esm/languages/prism/sql';
import yaml from 'react-syntax-highlighter/dist/esm/languages/prism/yaml';
import docker from 'react-syntax-highlighter/dist/esm/languages/prism/docker';
import graphql from 'react-syntax-highlighter/dist/esm/languages/prism/graphql';
import kotlin from 'react-syntax-highlighter/dist/esm/languages/prism/kotlin';

SyntaxHighlighter.registerLanguage('javascript', javascript);
SyntaxHighlighter.registerLanguage('js', javascript);
SyntaxHighlighter.registerLanguage('typescript', typescript);
SyntaxHighlighter.registerLanguage('ts', typescript);
SyntaxHighlighter.registerLanguage('tsx', tsx);
SyntaxHighlighter.registerLanguage('jsx', jsx);
SyntaxHighlighter.registerLanguage('css', css);
SyntaxHighlighter.registerLanguage('scss', scss);
SyntaxHighlighter.registerLanguage('json', json);
SyntaxHighlighter.registerLanguage('markdown', markdown);
SyntaxHighlighter.registerLanguage('md', markdown);
SyntaxHighlighter.registerLanguage('bash', bash);
SyntaxHighlighter.registerLanguage('shell', bash);
SyntaxHighlighter.registerLanguage('sh', bash);
SyntaxHighlighter.registerLanguage('python', python);
SyntaxHighlighter.registerLanguage('py', python);
SyntaxHighlighter.registerLanguage('go', go);
SyntaxHighlighter.registerLanguage('rust', rust);
SyntaxHighlighter.registerLanguage('rs', rust);
SyntaxHighlighter.registerLanguage('java', java);
SyntaxHighlighter.registerLanguage('c', c);
SyntaxHighlighter.registerLanguage('cpp', cpp);
SyntaxHighlighter.registerLanguage('sql', sql);
SyntaxHighlighter.registerLanguage('yaml', yaml);
SyntaxHighlighter.registerLanguage('yml', yaml);
SyntaxHighlighter.registerLanguage('docker', docker);
SyntaxHighlighter.registerLanguage('dockerfile', docker);
SyntaxHighlighter.registerLanguage('graphql', graphql);
SyntaxHighlighter.registerLanguage('kotlin', kotlin);
SyntaxHighlighter.registerLanguage('kt', kotlin);

interface CodeBlockProps {
    language: string;
    filename?: string;
    highlightLines?: string;
    code: string;
}

const shouldHighlightLine = (lineNumber: number, highlightLines: string | undefined): boolean => {
    if (!highlightLines) return false;
    const ranges = highlightLines.split(',').map(r => r.trim());
    return ranges.some(range => {
        if (range.includes('-')) {
            const [start, end] = range.split('-').map(Number);
            return lineNumber >= start && lineNumber <= end;
        }
        return Number(range) === lineNumber;
    });
};

const CodeBlockInner: React.FC<CodeBlockProps> = ({ language, filename, highlightLines, code }) => {
    const codeString = code.replace(/\n$/, '');

    return (
        <div className="retro-code-block">
            <div className="retro-code-header">
                <div>
                    <span>{language}</span>
                    {filename && (
                        <span> / {filename}</span>
                    )}
                </div>
                <CopyButton text={codeString} />
            </div>
            <SyntaxHighlighter
                style={prism as Record<string, React.CSSProperties>}
                language={language}
                PreTag="div"
                showLineNumbers={true}
                lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: '#808080', textAlign: 'right', userSelect: 'none' }}
                wrapLines={true}
                lineProps={(lineNumber) => ({
                    style: {
                        display: 'block',
                        backgroundColor: shouldHighlightLine(lineNumber, highlightLines) ? '#ffffcc' : 'transparent',
                        borderLeft: shouldHighlightLine(lineNumber, highlightLines) ? '2px solid #800000' : '2px solid transparent',
                        paddingRight: '1em'
                    } as React.CSSProperties
                })}
                customStyle={{ margin: 0, padding: '12px', background: 'transparent', fontSize: '13px' }}
            >
                {codeString}
            </SyntaxHighlighter>
        </div>
    );
};

// Memoize to prevent re-renders when parent re-renders (e.g., scroll progress)
export const CodeBlock = memo(CodeBlockInner);
