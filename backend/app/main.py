# app/main.py

from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from PyPDF2 import PdfReader
from .resume_analyzer import analyze_resume

app = FastAPI(title="Resume Analyzer API", version="1.0.0")

# Adjust origin for your React app later (e.g., http://localhost:5173)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AnalyzeRequest(BaseModel):
    resume_text: str
    job_description: str


@app.post("/analyze-text")
async def analyze_text(payload: AnalyzeRequest):
    result = analyze_resume(payload.resume_text, payload.job_description)
    return result


@app.post("/analyze-pdf")
async def analyze_pdf(
    file: UploadFile = File(...),
    job_description: str = Form(...)
):
    # Extract text from PDF
    reader = PdfReader(file.file)
    text_chunks = []
    for page in reader.pages:
        text_chunks.append(page.extract_text() or "")
    resume_text = "\n".join(text_chunks)

    result = analyze_resume(resume_text, job_description)
    return {
        "resume_text_excerpt": resume_text[:500],
        **result,
    }


@app.get("/")
async def root():
    return {"message": "Resume Analyzer API is running"}
