# app/resume_analyzer.py

from typing import List, Dict
import re
import string
from collections import Counter

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Simple stopword list to clean tokens
STOPWORDS = set("""
a an the and or but if while with without to from in on at for of by as is are was were be been being this that these those 
you your their our my i they he she it we them his her its
""".split())


def clean_text(text: str) -> str:
    """Basic cleanup: remove extra spaces, newlines, etc."""
    if not text:
        return ""
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def tokenize(text: str) -> List[str]:
    """Lowercase, remove punctuation and stopwords, split into tokens."""
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = text.split()
    tokens = [t for t in tokens if t not in STOPWORDS and len(t) > 2]
    return tokens


def extract_keywords(text: str, top_k: int = 25) -> List[str]:
    """Naive keyword extraction by frequency."""
    tokens = tokenize(text)
    if not tokens:
        return []
    freq = Counter(tokens)
    keywords = [w for w, _ in freq.most_common(top_k)]
    return keywords


def compute_semantic_match(resume_text: str, jd_text: str) -> float:
    """
    Use TF-IDF + cosine similarity as a lightweight proxy
    for semantic similarity between resume and job description.
    """
    corpus = [resume_text, jd_text]
    vectorizer = TfidfVectorizer(stop_words="english")
    tfidf_matrix = vectorizer.fit_transform(corpus)  # shape (2, n_features)
    sim = cosine_similarity(tfidf_matrix[0], tfidf_matrix[1])[0][0]
    return float(sim)


def analyze_resume(resume_text: str, jd_text: str) -> Dict:
    resume_text = clean_text(resume_text)
    jd_text = clean_text(jd_text)

    if not resume_text or not jd_text:
        return {
            "match_score": 0.0,
            "summary": "Missing resume or job description text.",
            "skills_present": [],
            "skills_missing": [],
            "jd_keywords": [],
            "model_name": "TF-IDF cosine similarity (lightweight)",
        }

    # Lightweight similarity
    sim = compute_semantic_match(resume_text, jd_text)
    match_score = sim * 100.0

    # Keyword-based skill presence
    jd_keywords = extract_keywords(jd_text, top_k=30)
    resume_lower = resume_text.lower()
    skills_present = []
    skills_missing = []

    for kw in jd_keywords:
        if kw in resume_lower:
            skills_present.append(kw)
        else:
            skills_missing.append(kw)

    # Simple human-readable summary
    if match_score >= 80:
        summary = "Excellent match – your resume is highly aligned with this job."
    elif match_score >= 60:
        summary = "Good match – with a few improvements, this resume will be strong."
    elif match_score >= 40:
        summary = "Partial match – you are missing several key skills from the job description."
    else:
        summary = "Low match – consider tailoring your resume significantly to this role."

    return {
        "match_score": round(match_score, 2),
        "summary": summary,
        "skills_present": skills_present,
        "skills_missing": skills_missing[:15],
        "jd_keywords": jd_keywords,
        "model_name": "TF-IDF cosine similarity (lightweight)",
    }
