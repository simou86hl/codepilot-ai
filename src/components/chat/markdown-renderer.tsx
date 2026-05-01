"use client";

import React, { useState, useMemo, useCallback } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface MarkdownRendererProps {
  content: string;
}

const LANG_MAP: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  rb: "ruby",
  sh: "bash",
  shell: "bash",
  yml: "yaml",
  jsx: "jsx",
  tsx: "tsx",
  rs: "rust",
  go: "go",
  java: "java",
  cpp: "cpp",
  c: "c",
  cs: "csharp",
  php: "php",
  swift: "swift",
  kt: "kotlin",
  sql: "sql",
  html: "html",
  css: "css",
  json: "json",
  xml: "xml",
  dockerfile: "docker",
  makefile: "makefile",
  toml: "toml",
  lua: "lua",
  r: "r",
  dart: "dart",
};

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  }, [text]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 left-2 h-7 w-7 opacity-70 hover:opacity-100 bg-transparent"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-green-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const components = useMemo(
    () => ({
      code({
        className,
        children,
        ...props
      }: React.HTMLAttributes<HTMLElement> & { inline?: boolean }) {
        const match = /language-(\w+)/.exec(className || "");
        const language = match ? LANG_MAP[match[1]] || match[1] : "";
        const codeString = String(children).replace(/\n$/, "");

        if (!className && !language) {
          return (
            <code
              className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono"
              {...props}
            >
              {children}
            </code>
          );
        }

        return (
          <div className="relative group my-3 rounded-lg overflow-hidden border border-border">
            {language && (
              <div className="flex items-center justify-between bg-[#282c34] px-4 py-2 border-b border-border">
                <span className="text-xs text-muted-foreground font-mono uppercase tracking-wider">
                  {language}
                </span>
                <CopyButton text={codeString} />
              </div>
            )}
            {!language && <CopyButton text={codeString} />}
            <SyntaxHighlighter
              style={oneDark}
              language={language || "text"}
              PreTag="div"
              customStyle={{
                margin: 0,
                padding: "1rem",
                fontSize: "0.8125rem",
                lineHeight: "1.6",
                background: "#282c34",
              }}
              showLineNumbers={codeString.split("\n").length > 3}
              lineNumberStyle={{
                color: "#555",
                fontSize: "0.75rem",
                paddingRight: "1rem",
                minWidth: "2.5rem",
              }}
              {...props}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      },
      p: ({ children }: React.HTMLAttributes<HTMLParagraphElement>) => (
        <p className="mb-3 leading-relaxed last:mb-0">{children}</p>
      ),
      ul: ({ children }: React.HTMLAttributes<HTMLUListElement>) => (
        <ul className="mb-3 list-disc list-inside space-y-1 marker:text-muted-foreground">
          {children}
        </ul>
      ),
      ol: ({ children }: React.HTMLAttributes<HTMLOListElement>) => (
        <ol className="mb-3 list-decimal list-inside space-y-1 marker:text-muted-foreground">
          {children}
        </ol>
      ),
      h1: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0">{children}</h1>
      ),
      h2: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h2 className="text-lg font-bold mb-2 mt-3 first:mt-0">{children}</h2>
      ),
      h3: ({ children }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h3 className="text-base font-bold mb-2 mt-3 first:mt-0">{children}</h3>
      ),
      blockquote: ({ children }: React.HTMLAttributes<HTMLQuoteElement>) => (
        <blockquote className="border-r-2 border-primary/30 pr-3 my-3 text-muted-foreground italic">
          {children}
        </blockquote>
      ),
      a: ({
        href,
        children,
      }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {children}
        </a>
      ),
      table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
        <div className="overflow-x-auto my-3">
          <table className="min-w-full border border-border rounded">
            {children}
          </table>
        </div>
      ),
      th: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
        <th className="border border-border bg-muted px-3 py-2 text-sm font-semibold text-right">
          {children}
        </th>
      ),
      td: ({ children }: React.HTMLAttributes<HTMLTableCellElement>) => (
        <td className="border border-border px-3 py-2 text-sm">{children}</td>
      ),
      strong: ({ children }: React.HTMLAttributes<HTMLElement>) => (
        <strong className="font-bold text-foreground">{children}</strong>
      ),
    }),
    []
  );

  return (
    <div className="markdown-content text-sm sm:text-base">
      <ReactMarkdown components={components}>{content}</ReactMarkdown>
    </div>
  );
}
