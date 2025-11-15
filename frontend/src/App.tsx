// src/App.tsx

import { useState } from "react";

type AnalysisResult = {
  match_score: number;
  summary: string;
  skills_present: string[];
  skills_missing: string[];
  jd_keywords: string[];
  model_name: string;
  resume_text_excerpt?: string;
};

function App() {
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const API_BASE = "https://resume-analyzer-vu6r.onrender.com";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleAnalyze = async () => {
    setError(null);
    setResult(null);

    if (!jobDescription.trim()) {
      setError("Please paste a job description.");
      return;
    }

    try {
      setLoading(true);
      let response: Response;

      if (file) {
        // Analyze PDF
        const formData = new FormData();
        formData.append("file", file);
        formData.append("job_description", jobDescription);

        response = await fetch(`${API_BASE}/analyze-pdf`, {
          method: "POST",
          body: formData,
        });
      } else if (resumeText.trim()) {
        // Analyze raw text
        response = await fetch(`${API_BASE}/analyze-text`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            resume_text: resumeText,
            job_description: jobDescription,
          }),
        });
      } else {
        setError("Please either upload a resume PDF or paste resume text.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error("API error");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please check backend and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              ResumeMatch<span className="text-sky-400">AI</span>
            </h1>
            <p className="text-sm text-slate-400">
              Upload your resume, paste a JD, and get an AI-powered match score.
            </p>
          </div>
          <span className="text-xs text-slate-500">
            Built with React · FastAPI · Transformers
          </span>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[1.2fr,1fr]">
        {/* Left: Inputs */}
        <section className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-slate-950/50">
            <h2 className="text-lg font-semibold mb-2">1. Job Description</h2>
            <p className="text-xs text-slate-400 mb-2">
              Paste the job ad or key responsibilities. The AI will use this as
              the target profile.
            </p>
            <textarea
              className="w-full h-40 bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
              placeholder="Paste the job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
            />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-slate-950/50 space-y-3">
            <h2 className="text-lg font-semibold">2. Resume</h2>
            <p className="text-xs text-slate-400">
              Either <span className="font-semibold">upload a PDF</span> or
              paste your resume text. If a file is uploaded, it will be used.
            </p>

            <label className="flex items-center gap-3 bg-slate-950/80 border border-dashed border-slate-700 rounded-xl px-3 py-2 text-sm cursor-pointer hover:border-sky-500">
              <div className="flex flex-col">
                <span className="font-medium">
                  {file ? file.name : "Choose PDF resume"}
                </span>
                <span className="text-xs text-slate-500">
                  PDF only · Max a few MB recommended
                </span>
              </div>
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>

            <div className="flex items-center gap-2">
              <div className="h-px flex-1 bg-slate-700" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-slate-500">
                or
              </span>
              <div className="h-px flex-1 bg-slate-700" />
            </div>

            <textarea
              className="w-full h-36 bg-slate-950/80 border border-slate-700 rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 resize-none"
              placeholder="Paste your resume text here if you don't want to upload a PDF..."
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading}
            className="inline-flex items-center justify-center px-4 py-2 rounded-xl text-sm font-semibold bg-sky-500 hover:bg-sky-400 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/40 transition-colors"
          >
            {loading ? "Analyzing..." : "Analyze Resume Match"}
          </button>

          {error && (
            <div className="text-xs text-red-400 bg-red-950/40 border border-red-800 rounded-xl px-3 py-2">
              {error}
            </div>
          )}
        </section>

        {/* Right: Results */}
        <section className="space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-slate-950/50 min-h-[180px] flex flex-col">
            <h2 className="text-lg font-semibold mb-3">Match Overview</h2>

            {!result && (
              <p className="text-sm text-slate-500">
                Run an analysis to see your match score, summary, and skills
                breakdown.
              </p>
            )}

            {result && (
              <div className="space-y-3">
                {/* Score indicator */}
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center">
                    <span className="text-2xl font-bold">
                      {result.match_score.toFixed(0)}%
                    </span>
                    <span className="absolute text-[10px] text-slate-500 bottom-2">
                      match
                    </span>
                  </div>
                  <p className="text-sm text-slate-200">{result.summary}</p>
                </div>

                {result.resume_text_excerpt && (
                  <div className="text-xs text-slate-500">
                    <span className="font-semibold text-slate-300">
                      Resume preview:
                    </span>{" "}
                    {result.resume_text_excerpt}
                    {result.resume_text_excerpt.length === 500 && "…"}
                  </div>
                )}
              </div>
            )}
          </div>

          {result && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 shadow-lg shadow-slate-950/50 space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">
                  Skills Present (from JD)
                </h3>
                {result.skills_present.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    No clear overlaps detected yet.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {result.skills_present.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 rounded-full text-[11px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/40"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold mb-1">
                  Missing / Low-Visibility Skills
                </h3>
                {result.skills_missing.length === 0 ? (
                  <p className="text-xs text-slate-500">
                    Great! Your resume seems to cover most JD keywords.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1">
                    {result.skills_missing.map((skill) => (
                      <span
                        key={skill}
                        className="px-2 py-1 rounded-full text-[11px] bg-amber-500/10 text-amber-300 border border-amber-500/30"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <p className="text-[10px] text-slate-500">
                Model: {result.model_name}
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default App;
