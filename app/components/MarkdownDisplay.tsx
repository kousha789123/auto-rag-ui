import React, { Suspense, lazy } from "react";

// Dynamically import ReactMarkdown
const LazyReactMarkdown = lazy(() => import("react-markdown"));

// Dynamically import remarkGfm plugin
const lazyLoadRemarkGfm = async () => {
  const mod = await import("remark-gfm");
  return mod.default;
};

interface MarkdownDisplayProps {
  markdown: string;
}

// Helper component to load the plugin and render markdown
const MarkdownRenderer = ({ markdown }: MarkdownDisplayProps) => {
  const [remarkGfm, setRemarkGfm] = React.useState<any>(null);

  React.useEffect(() => {
    lazyLoadRemarkGfm().then((plugin) => setRemarkGfm(() => plugin));
  }, []);

  if (!remarkGfm) {
    // Show simple text or loading state while plugin loads
    // Using whitespace-pre-wrap to maintain basic formatting
    return (
      <div className="whitespace-pre-wrap markdown-content">{markdown}</div>
    );
  }

  return (
    <div className="markdown-content">
      <LazyReactMarkdown remarkPlugins={[remarkGfm]}>
        {markdown}
      </LazyReactMarkdown>
    </div>
  );
};

// Main exported component with Suspense boundary
export function MarkdownDisplay({ markdown }: MarkdownDisplayProps) {
  // Provide a fallback while ReactMarkdown itself is loading
  // Using whitespace-pre-wrap to maintain basic formatting during load
  const fallback = (
    <div className="whitespace-pre-wrap markdown-content">{markdown}</div>
  );

  return (
    <Suspense fallback={fallback}>
      <MarkdownRenderer markdown={markdown} />
    </Suspense>
  );
}
