"""Unit tests for HTML stripping in embedding extraction."""

from utils.embedding_utils import strip_html


def test_strip_html_removes_tags_and_entities() -> None:
    text = (
        "<h3>Responsibilities</h3><ul><li>Build APIs</li><li>Ship features</li></ul>"
        "<p>Team of 5 &amp; a budget of $100k.</p>"
    )
    assert strip_html(text) == (
        "Responsibilities Build APIs Ship features Team of 5 & a budget of $100k."
    )


def test_strip_html_collapses_whitespace() -> None:
    text = "<p>Hello\n  world</p>\n<p>next</p>"
    assert strip_html(text) == "Hello world next"


def test_strip_html_empty_and_plain() -> None:
    assert strip_html("") == ""
    assert strip_html("plain text") == "plain text"
