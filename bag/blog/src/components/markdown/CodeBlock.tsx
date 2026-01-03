'use client';

import React from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
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

export const CodeBlock: React.FC<CodeBlockProps> = ({ language, filename, highlightLines, code }) => {
    const codeString = code.replace(/\n$/, '');

    return (
        <div className="relative group/code bg-[#1e1e1e] border border-white/5 rounded-xl overflow-hidden my-8 shadow-2xl transition-all duration-300">
            <div className="flex items-center justify-between px-4 py-2.5 bg-white/10 border-b border-white/5">
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{language}</span>
                    {filename && (
                        <span className="text-xs font-bold text-white font-mono bg-accent/40 px-2.5 py-0.5 rounded border border-accent/50">{filename}</span>
                    )}
                </div>
                <CopyButton text={codeString} />
            </div>
            <SyntaxHighlighter
                style={vscDarkPlus as Record<string, React.CSSProperties>}
                language={language}
                PreTag="div"
                showLineNumbers={true}
                lineNumberStyle={{ minWidth: '3em', paddingRight: '1em', color: 'rgba(255,255,255,0.2)', textAlign: 'right', userSelect: 'none' }}
                wrapLines={true}
                lineProps={(lineNumber) => ({
                    style: {
                        display: 'block',
                        backgroundColor: shouldHighlightLine(lineNumber, highlightLines) ? 'rgba(255,255,255,0.05)' : 'transparent',
                        borderLeft: shouldHighlightLine(lineNumber, highlightLines) ? '2px solid rgba(255,255,255,0.3)' : '2px solid transparent',
                        paddingRight: '1em'
                    } as React.CSSProperties
                })}
                className="!bg-transparent !m-0 !p-6 !pt-4 !text-sm md:!text-base"
            >
                {codeString}
            </SyntaxHighlighter>
        </div>
    );
};
