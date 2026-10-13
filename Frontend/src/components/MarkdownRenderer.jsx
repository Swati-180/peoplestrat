import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Safe, responsive Markdown renderer for AI Assistant messages.
 * Prevents raw HTML rendering/script injection and validates link protocols.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content || typeof content !== 'string') return null;

  return (
    <div className={`prose-sm max-w-full overflow-hidden text-slate-800 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ node, ...props }) => (
            <h1 className="text-base font-bold text-slate-900 mt-3 mb-1.5 leading-snug" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="text-sm font-bold text-slate-900 mt-2.5 mb-1 leading-snug" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="text-xs font-bold text-slate-900 mt-2 mb-1 uppercase tracking-wider" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="text-xs font-semibold text-slate-800 mt-1.5 mb-0.5" {...props} />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-2 last:mb-0 leading-relaxed text-sm" {...props} />
          ),
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-sm leading-relaxed" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-sm leading-relaxed" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
          strong: ({ node, ...props }) => (
            <strong className="font-semibold text-slate-900" {...props} />
          ),
          em: ({ node, ...props }) => (
            <em className="italic" {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-blue-400 pl-3 py-1 my-2 text-slate-600 bg-slate-50/70 rounded-r text-sm italic" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="w-full max-w-full my-3 overflow-x-auto rounded-lg border border-slate-200 shadow-sm bg-white">
              <table className="w-full text-xs text-left border-collapse min-w-[320px]" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => (
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200" {...props} />
          ),
          th: ({ node, ...props }) => (
            <th className="px-3 py-2 border-r border-slate-200 last:border-r-0 whitespace-nowrap font-semibold" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3 py-2 border-b border-slate-100 border-r border-slate-100 last:border-r-0 align-top" {...props} />
          ),
          tr: ({ node, ...props }) => (
            <tr className="hover:bg-slate-50/80 transition-colors last:border-b-0" {...props} />
          ),
          code: ({ node, inline, ...props }) => (
            inline
              ? <code className="bg-slate-100 text-pink-600 px-1 py-0.5 rounded text-xs font-mono" {...props} />
              : <pre className="bg-slate-900 text-slate-100 p-3 rounded-lg overflow-x-auto my-2 text-xs font-mono"><code {...props} /></pre>
          ),
          hr: ({ node, ...props }) => (
            <hr className="my-3 border-slate-200" {...props} />
          ),
          a: ({ node, href, ...props }) => {
            const isSafe = href && (
              href.startsWith('http://') ||
              href.startsWith('https://') ||
              href.startsWith('#') ||
              href.startsWith('/')
            );
            if (!isSafe) {
              return <span {...props} />;
            }
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800 transition-colors"
                {...props}
              />
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
