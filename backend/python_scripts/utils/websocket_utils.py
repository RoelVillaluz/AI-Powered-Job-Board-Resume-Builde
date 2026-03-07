import sys
import json

import sys
import json


def emit_progress(event: str, progress: int, message: str) -> None:
    """
    Write a real-time progress event to stdout for the Node.js pythonRunner to consume.

    The line is immediately flushed so the JS process receives it without waiting
    for the Python process to finish. The runner checks for "type": "progress" to
    distinguish these lines from the final result payload.

    Args:
        event (str): Socket event name to emit on the client
                     (e.g. "embedding:progress", "score:progress").
        progress (int): Progress percentage, 0–100, representing position within
                        the current Python command's execution (not the full pipeline).
        message (str): Human-readable status message shown in the UI
                       (e.g. "Analyzing your skills...").

    Example:
        emit_progress("embedding:progress", 38, "Analyzing your skills...")
        # Writes: {"type": "progress", "event": "embedding:progress", "progress": 38, "message": "Analyzing your skills..."}
    """
    line = json.dumps({
        "type": "progress",
        "event": event,
        "progress": progress,
        "message": message
    })
    print(line, flush=True)