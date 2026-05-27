"""
V2 entry point.
All handler logic lives in handlers/. Import them here so their
@register decorators fire and REGISTRY is fully populated.
"""
import logging, sys

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stderr)],
)

import handlers  # noqa: F401 — side-effect: populates REGISTRY
from handlers.base_handler import REGISTRY  # re-export for routers