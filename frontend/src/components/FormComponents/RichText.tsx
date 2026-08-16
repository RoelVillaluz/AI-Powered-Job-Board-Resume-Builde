import DOMPurify from "dompurify";

interface RichTextProps {
  content?: string | null;
  className?: string;
}

// Loose check: any tag-looking fragment means the value is HTML (TipTap
// output). Legacy records stored plain text with no tags — render those as
// ordinary paragraphs instead of raw text-with-tags.
const HTML_TAG_REGEX = /<\/?[a-z][\s\S]*>/i;

/**
 * RichText
 * --------
 * Renders a rich-text description field. Values produced by `RichTextEditor`
 * are HTML and are rendered as such (sanitized via DOMPurify). Legacy
 * plain-text values are rendered as a normal paragraph so old job postings
 * stay readable.
 */
export function RichText({ content, className }: RichTextProps) {
  const text = content ?? "";

  if (!text.trim()) return null;

  if (HTML_TAG_REGEX.test(text)) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(text) }}
      />
    );
  }

  return <p className={className}>{text}</p>;
}
