"""
ML-based content moderation service for Hackbuddy.
Uses scikit-learn TF-IDF + Logistic Regression trained on a lightweight
rule-based labeled dataset of toxic/spam text patterns.
"""
import re
from typing import Tuple, List
import joblib
import os
from pathlib import Path

# ─── Lightweight rule-based & ML pipeline ─────────────────────────────────────
# We train the model on startup with a small seed dataset.
# In production, replace with a pre-trained model loaded from disk.

_MODEL_PATH = Path(__file__).parent / "moderation_model.pkl"

_TOXIC_PATTERNS = [
    r"\b(idiot|stupid|dumb|moron|loser|trash|garbage|hate you|kill yourself|kys)\b",
    r"\b(spam|buy now|click here|free money|earn \$|limited offer|act now)\b",
    r"\b(fuck|shit|bitch|ass|bastard|damn)\b",
]

def _rule_based_check(text: str) -> Tuple[bool, List[str]]:
    """Fast rule-based pre-check before ML inference."""
    text_lower = text.lower()
    reasons = []
    for pattern in _TOXIC_PATTERNS:
        if re.search(pattern, text_lower):
            if "spam" in pattern or "buy" in pattern or "click" in pattern:
                reasons.append("spam_detected")
            elif "fuck" in pattern or "shit" in pattern or "bitch" in pattern:
                reasons.append("profanity")
            else:
                reasons.append("toxic_language")
    return len(reasons) > 0, reasons


def _build_ml_model():
    """Build and return a simple TF-IDF + LogisticRegression pipeline."""
    from sklearn.pipeline import Pipeline
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression

    import json

    dataset_path = Path(__file__).parent / "moderation_dataset.json"
    if dataset_path.exists():
        with open(dataset_path, "r", encoding="utf-8") as f:
            dataset = json.load(f)
            texts = [item["text"] for item in dataset]
            labels = [item["label"] for item in dataset]
    else:
        # Seed training data fallback
        texts = [
            "Hey team, great work on the project!",
            "Can we sync up tomorrow at 10 AM?",
            "you idiot stop sending stupid messages",
            "this is trash code written by a moron",
            "what the fuck is wrong with this code"
        ]
        labels = [0, 0, 1, 1, 1]

    model = Pipeline([
        ("tfidf", TfidfVectorizer(ngram_range=(1, 2), max_features=5000)),
        ("clf", LogisticRegression(max_iter=1000, C=5.0, class_weight='balanced'))
    ])
    model.fit(texts, labels)
    return model

def _get_model():
    """Load or create the moderation model (singleton)."""
    global _cached_model
    try:
        return _cached_model
    except NameError:
        pass
    if _MODEL_PATH.exists():
        try:
            _cached_model = joblib.load(_MODEL_PATH)
            return _cached_model
        except Exception:
            pass
    _cached_model = _build_ml_model()
    try:
        joblib.dump(_cached_model, _MODEL_PATH)
    except Exception:
        pass
    return _cached_model

def moderate_message(text: str) -> dict:
    """
    Checks a message for toxicity/spam.
    Returns: { is_toxic: bool, confidence: float, reasons: list[str] }
    """
    # 1. Quick rule-based check
    rule_hit, rule_reasons = _rule_based_check(text)
    if rule_hit:
        return {
            "is_toxic": True,
            "confidence": 0.95,
            "reasons": rule_reasons
        }

    # 2. ML classification
    try:
        model = _get_model()
        proba = model.predict_proba([text])[0]
        toxic_proba = float(proba[1])
        is_toxic = toxic_proba >= 0.70
        return {
            "is_toxic": is_toxic,
            "confidence": toxic_proba if is_toxic else 1 - toxic_proba,
            "reasons": ["ml_classified_toxic"] if is_toxic else []
        }
    except Exception:
        # Fall back gracefully
        return {"is_toxic": False, "confidence": 0.5, "reasons": []}
