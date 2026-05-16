"""
currency_normalizer.py
──────────────────────
Resolves exchange rates and converts salary amounts to the base currency.
 
Exchange rates are always passed in via payload — this module never
fetches them. Node is responsible for supplying current rates.
 
Supported currency symbols match the schema enum across all models:
    ['$', '₱', '€', '¥', '£']
"""
 
from __future__ import annotations
 
import logging
 
from .base import BaseNormalizer
from .constants import BASE_CURRENCY, SUPPORTED_CURRENCIES
 
logger = logging.getLogger(__name__)

class CurrencyNormalizer(BaseNormalizer):
    """
    Resolves exchange rates and converts amounts to base currency (USD).
 
    Static-only — no instantiation needed.
 
    exchange_rates payload format (Node provides this):
        { "$": 1.0, "₱": 0.017, "€": 1.08, "¥": 0.0065, "£": 1.27 }
        Keys are currency symbols from your schema enum.
        Values are the multiplier TO base currency.
    """

    # ── Rate resolution ───────────────────────────────────────────────────
    def resolve_rate(
        currency: str,
        exchange_rates: dict[str, float]
    ) -> float:
        """
        Look up the exchange rate for a currency symbol.
 
        Falls back to 1.0 (no conversion) with a warning when:
            - currency is already BASE_CURRENCY
            - currency is missing from exchange_rates
 
        Never crashes — a missing rate produces a wrong number, which is
        recoverable; an exception in a scoring pipeline is not.
        """
        if currency == BASE_CURRENCY:
            return 1.0
 
        rate = exchange_rates.get(currency)
 
        if rate is None:
            logger.warning(
                f"[CurrencyNormalizer] No exchange rate for '{currency}' — "
                f"falling back to 1.0. Add this currency to the rates payload."
            )
            return 1.0
 
        return rate
 
    @staticmethod
    def is_supported(currency: str) -> bool:
        """Return True if the currency symbol is in the schema enum."""
        return currency in SUPPORTED_CURRENCIES
    

    # ── Conversion ────────────────────────────────────────────────────────

    @staticmethod
    def convert(
        amount: float,
        currency: str,
        exchange_rates: dict[str, float]
    ) -> tuple[float, float]:
        """
        Convert an amount to base currency.
 
        Returns:
            (converted_amount, exchange_rate_used)
 
        Separating the rate lookup from the multiplication lets callers
        store the rate on the result for provenance without calling
        resolve_rate twice.
        """
        rate = CurrencyNormalizer.resolve_rate(currency, exchange_rates)

        return round(amount * rate, 2), rate    
