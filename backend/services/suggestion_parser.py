"""
Extracts actionable suggestions from LLM response text.
Turns "If you want, I can also..." blocks into clickable chips.
"""

import re


def _clean_markdown(text: str) -> str:
    """Strip markdown formatting from suggestion text."""
    # Remove bold/italic markers
    text = re.sub(r"\*{1,3}(.+?)\*{1,3}", r"\1", text)
    # Remove backticks
    text = re.sub(r"`(.+?)`", r"\1", text)
    # Remove leading "or " / "and "
    text = re.sub(r"^(?:or|and)\s+", "", text, flags=re.IGNORECASE)
    return text.strip()


def _truncate(text: str, max_len: int) -> str:
    if len(text) <= max_len:
        return text
    return text[:max_len - 1].rsplit(" ", 1)[0] + "..."


def extract_suggestions(text: str) -> list[dict]:
    """
    Parse LLM response for suggestion/offer patterns and return
    structured suggestions the user can click to act on.
    """
    suggestions = []

    # Find the "If you want..." or "I can also..." block
    # Match everything from the offer phrase to the end of the bulleted list
    offer_patterns = [
        # "If you want, I can also provide/produce a more X version that:" + bullets
        r"If you (?:want|like|prefer|need),?\s*I can (?:also\s+)?(?:provide|produce|create|build|refine|add|make)\b[^:.\n]*[:\s]*\n?((?:\s*[-\u2022\u2013*]\s*.+\n?)+)",
        # "I can also refine/update this..." + bullets
        r"I can also (?:refine|update|modify|enhance)\b[^:.\n]*[:\s]*\n?((?:\s*[-\u2022\u2013*]\s*.+\n?)+)",
        # Generic: "If you want, I can also:" + bullets
        r"If you (?:want|like),?\s*I can also\b[^:.\n]*[:\s]*\n?((?:\s*[-\u2022\u2013*]\s*.+\n?)+)",
    ]

    for pattern in offer_patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            items_text = match.group(1)
            # Extract individual bullet items
            items = re.findall(r"[-\u2022\u2013*]\s*(.+)", items_text)
            for item in items:
                cleaned = _clean_markdown(item.strip().rstrip(",."))
                if len(cleaned) > 10:
                    # Capitalize first letter
                    label = cleaned[0].upper() + cleaned[1:] if cleaned else cleaned
                    suggestions.append({
                        "label": _truncate(label, 200),
                        "prompt": f"Yes, please update the workflow to: {cleaned}",
                    })
            break

    # Fallback: single-sentence suggestions without bullets
    if not suggestions:
        single_patterns = [
            r"If you (?:want|like|prefer),?\s*I can (?:also\s+)?(?:provide|produce|create|build) a (?:version|workflow) that (.+?)(?:\.|$)",
            r"I can also (?:add|include|create) (.+?)(?:\.|$)",
        ]
        for pattern in single_patterns:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                cleaned = _clean_markdown(match.group(1).strip().rstrip(",."))
                if len(cleaned) > 10:
                    label = cleaned[0].upper() + cleaned[1:] if cleaned else cleaned
                    suggestions.append({
                        "label": _truncate(label, 200),
                        "prompt": f"Yes, please update the workflow to: {cleaned}",
                    })
                break

    return suggestions
