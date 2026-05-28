from dataclasses import dataclass, field
from typing import Dict, Any, Tuple

@dataclass
class SignalResult:
    triggered: bool = False
    strength: float = 0.0 # 0.0 to 1.0
    evidence: Dict[str, Any] = field(default_factory=dict)

# Primary Signal weights (Must sum to 1.0)
WEIGHTS = {
    "s01_price": 0.25,
    "s02_spec": 0.20,
    "s03_concentration": 0.20,
    "s04_single_bid": 0.15,
    "s05_window": 0.08,
    "s06_entity": 0.07,
    "s07_clustering": 0.05
}

# Bonus Multiplier signals (Each adds +20% to overall risk base score)
BONUS_SIGNALS = ["s08_linked", "s09_spec_copy", "s10_amendment"]

def calculate_confidence(signals: Dict[str, SignalResult]) -> Tuple[float, float]:
    """
    Weighted combination formula to compute overall fraud confidence score.
    Returns: (confidence_score, bonus_multiplier)
    """
    # 1. Base Score calculation (weighted sum of 7 primary signals)
    base_score = 0.0
    for key, weight in WEIGHTS.items():
        sig_result = signals.get(key, SignalResult())
        base_score += weight * sig_result.strength

    # 2. Bonus Multiplier calculation
    bonus_count = 0
    for key in BONUS_SIGNALS:
        sig_result = signals.get(key, SignalResult())
        if sig_result.triggered:
            bonus_count += 1
            
    multiplier = 1.0 + (bonus_count * 0.20)
    
    # 3. Final score calculated and capped at 100
    final_score = min(base_score * multiplier * 100.0, 100.0)
    
    return round(final_score, 2), round(multiplier, 2)
