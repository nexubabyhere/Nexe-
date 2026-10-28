import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Download, FileCode } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'text', value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy code:', err);
    }
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      javascript: 'js',
      typescript: 'ts',
      jsx: 'jsx',
      tsx: 'tsx',
      python: 'py',
      html: 'html',
      css: 'css',
      json: 'json',
      sql: 'sql',
      bash: 'sh',
      sh: 'sh',
      rust: 'rs',
      go: 'go',
      java: 'java',
      cpp: 'cpp',
      c: 'c',
    };
    const ext = extMap[language.toLowerCase()] || 'txt';
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `code-snippet.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative my-4 rounded-xl border border-zinc-700/60 bg-zinc-950 overflow-hidden shadow-md">
      <div className="flex items-center justify-between px-4 py-2 bg-zinc-900/90 border-b border-zinc-800 text-xs font-mono text-zinc-400">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-indigo-400" />
          <span className="uppercase font-semibold tracking-wider text-zinc-300">
            {language || 'code'}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            id={`btn-download-code-${Math.random().toString(36).substring(2, 7)}`}
            onClick={handleDownload}
            title="Download Code"
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            id={`btn-copy-code-${Math.random().toString(36).substring(2, 7)}`}
            onClick={handleCopy}
            title="Copy Code"
            className="p-1.5 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-xs font-sans">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span className="text-xs font-sans">Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="p-4 overflow-x-auto font-mono text-sm leading-relaxed text-zinc-200 bg-zinc-950 selection:bg-indigo-900/50">
        <pre className="m-0 font-mono">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-invert max-w-none text-zinc-200 leading-relaxed break-words space-y-3">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-zinc-800 text-indigo-300 font-mono text-xs border border-zinc-700/50"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock
                language={match ? match[1] : ''}
                value={String(children).replace(/\n$/, '')}
              />
            );
          },
          p({ children }) {
            return <p className="mb-3 text-[15px] leading-7 text-zinc-200 last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 my-2 space-y-1.5 text-zinc-200">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 my-2 space-y-1.5 text-zinc-200">{children}</ol>;
          },
          li({ children }) {
            return <li className="text-[15px] leading-relaxed text-zinc-200">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-2xl font-bold text-white mt-5 mb-2 pb-1 border-b border-zinc-800">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-xl font-bold text-zinc-100 mt-4 mb-2">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-lg font-semibold text-zinc-200 mt-3 mb-1.5">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-indigo-500 pl-4 py-1 my-3 italic text-zinc-300 bg-indigo-950/20 rounded-r-md">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4 rounded-lg border border-zinc-800 bg-zinc-900/50">
                <table className="w-full text-left text-sm text-zinc-300 divide-y divide-zinc-800">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-zinc-800/70 text-zinc-200 font-semibold">{children}</thead>;
          },
          th({ children }) {
            return <th className="px-4 py-2.5 font-medium">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2 border-t border-zinc-800/60">{children}</td>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-indigo-400 hover:text-indigo-300 underline underline-offset-2 transition-colors inline-flex items-center gap-1"
              >
                {children}
              </a>
            );
          },
          hr() {
            return <hr className="my-4 border-zinc-800" />;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
