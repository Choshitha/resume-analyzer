# app/resume_analyzer.py

from typing import List, Dict
import re
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
from collections import Counter
import string

STOPWORDS = set("""
a an the and or but if while with without to from in on at for of by as is are was were be been being this that these those 
you your their our my i they he she it we them his her its
""".split())

# Load once at startup
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")


def clean_text(text: str) -> str:
    text = text.replace("\n", " ")
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def tokenize(text: str) -> List[str]:
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = text.split()
    tokens = [t for t in tokens if t not in STOPWORDS and len(t) > 2]
    return tokens


def extract_keywords(text: str, top_k: int = 25) -> List[str]:
    tokens = tokenize(text)
    freq = Counter(tokens)
    # Most common tokens as "keywords"
    keywords = [w for w, _ in freq.most_common(top_k)]
    return keywords


def analyze_resume(resume_text: str, jd_text: str) -> Dict:
    resume_text = clean_text(resume_text)
    jd_text = clean_text(jd_text)

    # Embedding-based similarity
    embeddings = model.encode([resume_text, jd_text])
    sim = cosine_similarity([embeddings[0]], [embeddings[1]])[0][0]
    match_score = float(sim) * 100  # percentage

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

    # Simple summary
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
        "skills_missing": skills_missing[:15],  # limit to top 15 missing
        "jd_keywords": jd_keywords,
        "model_name": "sentence-transformers/all-MiniLM-L6-v2",
    }
