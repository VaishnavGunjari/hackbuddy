from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional

from app.ml.text_processing import clean_and_preprocess
from app.ml.naive_bayes import classifier
from app.ml.recommendation import recommender
from app.ml.rule_engine import rule_engine

router = APIRouter()

class TextRequest(BaseModel):
    text: str

class RecommendRequest(BaseModel):
    query: str
    top_n: int = 3

class RuleContextRequest(BaseModel):
    context: Dict[str, Any]

@router.post("/process-text")
def process_text_endpoint(req: TextRequest):
    """
    Cleans and preprocesses the given text.
    """
    cleaned = clean_and_preprocess(req.text)
    return {
        "original_text": req.text,
        "cleaned_text": cleaned
    }

@router.post("/classify")
def classify_endpoint(req: TextRequest):
    """
    Classifies a project idea into a domain using the Naive Bayes model.
    """
    prediction = classifier.predict(req.text)
    return {
        "input": req.text,
        "predicted_domain": prediction
    }

@router.post("/recommend")
def recommend_endpoint(req: RecommendRequest):
    """
    Recommends projects based on the user's query using TF-IDF and Cosine Similarity.
    """
    results = recommender.recommend_projects(req.query, req.top_n)
    return {
        "query": req.query,
        "recommendations": results
    }

@router.post("/rule-evaluate")
def rule_evaluate_endpoint(req: RuleContextRequest):
    """
    Evaluates rules based on a provided user context (e.g., skill_level, preferred_domain).
    """
    suggestions = rule_engine.evaluate(req.context)
    return {
        "context": req.context,
        "suggestions": suggestions
    }
