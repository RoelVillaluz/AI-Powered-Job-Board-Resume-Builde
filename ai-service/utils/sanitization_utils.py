import html
import re


def strip_html(text: str) -> str:
    """
    Strip HTML tags from rich-text description fields before embedding.

    The frontend now stores job/requirements descriptions as TipTap HTML
    (e.g. headings, lists, blockquotes). Embedding the raw markup would
    pollute the vectors with tag noise, so only the visible text is kept.

    Args:
        text: Possibly HTML-formatted string.

    Returns:
        Plain text with tags removed and entities decoded, whitespace collapsed.
    """
    text = re.sub(r"<[^>]+>", " ", text)
    text = html.unescape(text)
    return re.sub(r"\s+", " ", text).strip()
