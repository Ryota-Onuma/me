import React from 'react';
import { PrismLight as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { CopyButton } from './CopyButton';

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
