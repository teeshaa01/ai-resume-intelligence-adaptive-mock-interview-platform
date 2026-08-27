from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import io
import os
import re
import pdfplumber

app = FastAPI(title="AI Resume & Mock Interview API")

cors_origins_env = os.getenv("CORS_ORIGINS", "*")
origins = [origin.strip() for origin in cors_origins_env.split(",") if origin.strip()]

# Allow React frontend to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"message": "AI Resume & Mock Interview API is running!"}


@app.get("/health")
def health_check():
    return {"status": "ok", "database": "connected"}


def build_ats_report(text: str, filename: str):
    lower_text = text.lower()
    word_count = len(re.findall(r"\b\w+\b", text))

    section_names = ["experience", "skills", "education", "projects"]
    found_sections = [section.title() for section in section_names if section in lower_text]
    keyword_terms = [
        "python", "javascript", "react", "sql", "api", "fastapi", "node",
        "aws", "docker", "git", "machine learning", "database", "html", "css"
    ]
    found_keywords = [term for term in keyword_terms if term in lower_text]
    has_numbers = bool(re.search(r"\d+%|\b\d+\+?\b", text))
    has_contact = bool(re.search(r"[\w.+-]+@[\w-]+\.[\w.-]+", text))

    score = 45
    score += min(len(found_sections), 4) * 8
    score += min(len(found_keywords), 8) * 3
    score += 8 if has_numbers else 0
    score += 6 if has_contact else 0
    score += 8 if word_count >= 250 else 0
    score = min(score, 96)

    details = [
        {
            "title": "File Readability",
            "status": "pass" if word_count > 80 else "warning",
            "statusLabel": "Pass" if word_count > 80 else "Improve",
            "message": f"Extracted approximately {word_count} words from {filename}."
        },
        {
            "title": "Resume Structure",
            "status": "pass" if len(found_sections) >= 3 else "warning",
            "statusLabel": "Pass" if len(found_sections) >= 3 else "Improve",
            "message": f"Detected sections: {', '.join(found_sections) if found_sections else 'none found'}."
        },
        {
            "title": "Keyword Density",
            "status": "pass" if len(found_keywords) >= 5 else "warning",
            "statusLabel": "Pass" if len(found_keywords) >= 5 else "Improve",
            "message": f"Matched keywords: {', '.join(found_keywords[:8]) if found_keywords else 'none from the built-in ATS list'}."
        },
        {
            "title": "Impact Statements",
            "status": "pass" if has_numbers else "warning",
            "statusLabel": "Pass" if has_numbers else "Improve",
            "message": "Numeric impact was found in the resume." if has_numbers else "Add measurable outcomes such as percentages, counts, revenue, time saved, or performance gains."
        },
        {
            "title": "Contact Detection",
            "status": "pass" if has_contact else "warning",
            "statusLabel": "Pass" if has_contact else "Improve",
            "message": "Email contact was detected." if has_contact else "Add a clear email address near the top of the resume."
        }
    ]

    return {
        "score": score,
        "summary": f"ATS analysis completed for {filename}. This score is calculated from extracted resume text, section detection, keywords, measurable impact, and contact readability.",
        "details": details
    }


def extract_pdf_text(contents: bytes):
    try:
        with pdfplumber.open(io.BytesIO(contents)) as pdf:
            text = "\n".join(page.extract_text() or "" for page in pdf.pages)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Could not read text from this PDF.") from exc

    if not text.strip():
        raise HTTPException(status_code=400, detail="No selectable resume text found. Please upload a text-based PDF instead of a scanned image.")

    return text


def normalize_terms(text: str):
    canonical_terms = {
        "python": ["python"],
        "java": ["java"],
        "c++": ["c++", "cpp"],
        "r": [" r ", " r,", " r."],
        "pytorch": ["pytorch", "torch"],
        "tensorflow": ["tensorflow"],
        "keras": ["keras"],
        "scikit-learn": ["scikit-learn", "sklearn"],
        "machine learning": ["machine learning", "ml algorithms", " ml "],
        "deep learning": ["deep learning", "neural network"],
        "linear algebra": ["linear algebra"],
        "probability": ["probability"],
        "statistics": ["statistics"],
        "data pipelines": ["data pipeline", "data pipelines", "etl"],
        "mlops": ["mlops", "model ops", "model operations"],
        "deployment": ["deployment", "deploy", "production"],
        "monitoring": ["monitoring", "model health", "performance metrics"],
        "cloud": ["aws", "gcp", "azure", "cloud"],
        "aws": ["aws", "amazon web services"],
        "gcp": ["gcp", "google cloud"],
        "azure": ["azure"],
        "rest api": ["rest api", "rest apis", "api"],
        "containerization": ["docker", "container", "containerization"],
        "scalability": ["scalable", "scalability"],
        "low latency": ["low latency", "latency"],
        "collaboration": ["collaboration", "stakeholder", "product manager", "software developer"]
    }
    padded = f" {text.lower()} "
    return {
        term
        for term, variants in canonical_terms.items()
        if any(variant in padded for variant in variants)
    }


def build_job_match_report(resume_text: str, job_description: str, filename: str):
    resume_terms = normalize_terms(resume_text)
    jd_terms = normalize_terms(job_description)
    matched_terms = sorted(resume_terms & jd_terms)
    missing_terms = sorted(jd_terms - resume_terms)
    extra_resume_terms = sorted(resume_terms - jd_terms)

    if not jd_terms:
        raise HTTPException(status_code=400, detail="The job description is too short or does not include recognizable role requirements.")

    match_ratio = len(matched_terms) / len(jd_terms)
    score = round(35 + (match_ratio * 60))
    score = max(35, min(score, 96))

    priority_missing = missing_terms[:8]
    recommendations = [
        f"Add truthful evidence for {term} if you have that experience." for term in priority_missing[:5]
    ]
    if not recommendations:
        recommendations = [
            "Add more measurable project outcomes to make the strong match easier for recruiters to verify.",
            "Mirror the job title and core AI/ML language from the JD in your summary section."
        ]

    details = [
        {
            "title": "Match Summary",
            "status": "pass" if score >= 75 else "warning",
            "statusLabel": "Strong" if score >= 75 else "Improve",
            "message": f"Matched {len(matched_terms)} of {len(jd_terms)} detected job requirements from the JD."
        },
        {
            "title": "Matched Keywords",
            "status": "pass" if matched_terms else "warning",
            "statusLabel": "Found" if matched_terms else "Missing",
            "message": ", ".join(matched_terms[:10]) if matched_terms else "No major JD keywords were found in the resume text."
        },
        {
            "title": "Missing Keywords",
            "status": "warning" if missing_terms else "pass",
            "statusLabel": "Improve" if missing_terms else "Good",
            "message": ", ".join(priority_missing) if priority_missing else "No major detected JD keywords are missing."
        },
        {
            "title": "Resume-Only Strengths",
            "status": "pass",
            "statusLabel": "Context",
            "message": ", ".join(extra_resume_terms[:8]) if extra_resume_terms else "Most detected resume skills are directly related to this JD."
        },
        {
            "title": "Recommended Fixes",
            "status": "warning" if missing_terms else "pass",
            "statusLabel": "Next Steps",
            "message": " ".join(recommendations)
        }
    ]

    return {
        "score": score,
        "summary": f"Job match completed for {filename}. The score is based on actual extracted resume text compared with detected requirements in the pasted job description.",
        "details": details,
        "missingSkills": [
            {
                "skill": term.title(),
                "priority": "High" if index < 3 else "Medium",
                "source": "Target JD",
                "completed": False
            }
            for index, term in enumerate(priority_missing[:6], start=1)
        ]
    }


def extract_resume_signals(resume_text: str, job_description: str = ""):
    combined_text = f"{resume_text}\n{job_description}"
    lower_text = combined_text.lower()
    tech_terms = [
        "python", "java", "c++", "javascript", "react", "node", "fastapi", "flask",
        "django", "sql", "postgresql", "mysql", "mongodb", "docker", "kubernetes",
        "azure", "aws", "gcp", "machine learning", "deep learning", "tensorflow",
        "pytorch", "scikit-learn", "keras", "llm", "rag", "api", "rest api"
    ]
    technologies = []
    for term in tech_terms:
        if term in lower_text and term.title() not in technologies:
            technologies.append(term.upper() if term in ["sql", "llm", "rag", "api"] else term.title())

    project_lines = []
    for line in resume_text.splitlines():
      cleaned = re.sub(r"\s+", " ", line).strip(" -•\t")
      if 4 <= len(cleaned) <= 90 and any(token in cleaned.lower() for token in ["project", "assistant", "system", "app", "platform", "prediction", "detection", "analysis"]):
          project_lines.append(cleaned)

    projects = []
    for line in project_lines:
        if line not in projects:
            projects.append(line)

    candidate_name = "candidate"
    first_line = next((line.strip() for line in resume_text.splitlines() if line.strip()), "")
    if first_line and len(first_line.split()) <= 4 and not any(char.isdigit() for char in first_line):
        candidate_name = first_line.split()[0]

    return {
        "candidateName": candidate_name,
        "projects": projects[:4],
        "technologies": technologies[:10]
    }


def build_technical_interview(resume_text: str, job_description: str, filename: str):
    signals = extract_resume_signals(resume_text, job_description)
    candidate_name = signals["candidateName"].title() if signals["candidateName"] != "candidate" else "there"
    primary_project = signals["projects"][0] if signals["projects"] else "the strongest technical project on your resume"
    technologies = signals["technologies"]
    primary_tech = technologies[0] if technologies else "your main technology stack"
    database_tech = next((tech for tech in technologies if tech.lower() in ["postgresql", "mysql", "mongodb", "sql"]), "your database")
    ai_tech = next((tech for tech in technologies if tech.lower() in ["machine learning", "deep learning", "tensorflow", "pytorch", "scikit-learn", "llm", "rag"]), None)
    cloud_tech = next((tech for tech in technologies if tech.lower() in ["azure", "aws", "gcp", "docker", "kubernetes"]), None)

    questions = [
        {
            "topic": "Project Understanding",
            "difficulty": "Warm-up",
            "question": f"I was going through your resume and noticed {primary_project}. Could you briefly explain what you built, what problem it solves, and what your contribution was?"
        },
        {
            "topic": "Implementation",
            "difficulty": "Intermediate",
            "question": f"In {primary_project}, explain one core feature end to end. What happens from the user action or input until the final output is returned?"
        },
        {
            "topic": "Technology Choice",
            "difficulty": "Intermediate",
            "question": f"You mention {primary_tech}. Why was it a good choice for this project, and what trade-offs did it introduce?"
        },
        {
            "topic": "Backend/API",
            "difficulty": "Intermediate",
            "question": "If one API endpoint in this project starts returning a 500 error in production, what exact debugging steps would you take before changing code?"
        },
        {
            "topic": "Database",
            "difficulty": "Intermediate",
            "question": f"How did you structure, store, or retrieve data in this project? If {database_tech} queries became slow, how would you identify and fix the bottleneck?"
        },
        {
            "topic": "Security",
            "difficulty": "Advanced",
            "question": "What user input in this project could be unsafe, and how would you validate it so the backend, database, and APIs remain protected?"
        },
        {
            "topic": "Performance",
            "difficulty": "Advanced",
            "question": "Imagine 10,000 users start using this application in one day. Which part would break first, and how would you scale it?"
        },
        {
            "topic": "DSA/CS",
            "difficulty": "Intermediate",
            "question": "Pick one data structure or algorithm that fits this project. Why does it fit, and what are its time and space complexity trade-offs?"
        }
    ]

    if ai_tech:
        questions.insert(5, {
            "topic": "AI/ML",
            "difficulty": "Advanced",
            "question": f"You used or referenced {ai_tech}. How would you evaluate whether the model or AI component is producing reliable results, and what would you do when it fails?"
        })

    if cloud_tech:
        questions.insert(7, {
            "topic": "Cloud/Deployment",
            "difficulty": "Advanced",
            "question": f"Where would {cloud_tech} fit in your deployment plan, and how would you monitor logs, latency, and failures after release?"
        })

    system_prompt = (
        "You are an experienced technical interviewer. Ask exactly one resume-based question at a time. "
        "After each answer, follow this cycle: evaluate the answer, show short interviewer feedback, explain what to improve, "
        "then ask a follow-up or the next connected question. "
        "Evaluate technical correctness, depth, relevance, problem solving, and communication only for speaking mode. "
        "Do not reveal a perfect model answer unless the candidate explicitly asks for it. Keep scoring hidden until the final report."
    )

    return {
        "summary": f"Interactive technical mock interview prepared from extracted resume text in {filename}.",
        "systemPrompt": system_prompt,
        "candidateSignals": signals,
        "questions": questions[:8]
    }


def build_hr_interview(resume_text: str, job_description: str, filename: str):
    signals = extract_resume_signals(resume_text, job_description)
    primary_project = signals["projects"][0] if signals["projects"] else "one important project from your resume"

    questions = [
        {
            "topic": "Introduction",
            "difficulty": "Behavioral",
            "question": "Can you briefly introduce yourself and tell me about your background?"
        },
        {
            "topic": "Career Motivation",
            "difficulty": "Behavioral",
            "question": "What motivated you to choose AI/ML or software development as your career direction?"
        },
        {
            "topic": "Project Motivation",
            "difficulty": "Behavioral",
            "question": f"I noticed {primary_project} on your resume. What motivated you to work on it?"
        },
        {
            "topic": "Project Ownership",
            "difficulty": "Behavioral",
            "question": f"What was your personal role in {primary_project}?"
        },
        {
            "topic": "Project Challenge",
            "difficulty": "Behavioral",
            "question": "What was the biggest challenge you faced while working on that project?"
        },
        {
            "topic": "Learning Attitude",
            "difficulty": "Behavioral",
            "question": "What did you learn from that project?"
        },
        {
            "topic": "Teamwork",
            "difficulty": "Behavioral",
            "question": "Tell me about a time you worked with others or handled feedback during a project."
        },
        {
            "topic": "Strengths",
            "difficulty": "Behavioral",
            "question": "What would you say is your biggest strength?"
        },
        {
            "topic": "Weaknesses",
            "difficulty": "Behavioral",
            "question": "What is one area you are currently working to improve?"
        },
        {
            "topic": "Role Interest",
            "difficulty": "Behavioral",
            "question": "What interests you most about this role?"
        }
    ]

    system_prompt = (
        "You are a professional human HR interviewer. Ask exactly one question at a time. "
        "Use the resume as background context, not as a fixed script. Mix relevant follow-ups with natural topic transitions. "
        "Cover introduction, background, motivation, projects, strengths, weaknesses, teamwork, leadership, pressure handling, "
        "failure, adaptability, communication, career goals, role interest, company interest, and hiring fit naturally. "
        "Keep project questions HR-oriented and high level. Do not ask technical implementation questions or evaluate every answer."
    )

    return {
        "summary": f"Interactive HR mock interview prepared from extracted resume text in {filename}.",
        "systemPrompt": system_prompt,
        "candidateSignals": signals,
        "questions": questions[:8]
    }


@app.post("/analyze/ats")
async def analyze_ats_resume(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF resume.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")

    text = extract_pdf_text(contents)

    return build_ats_report(text, file.filename)


@app.post("/analyze/job-match")
async def analyze_job_match(
    job_description: str = Form(...),
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF resume.")
    if len(job_description.strip()) < 80:
        raise HTTPException(status_code=400, detail="Please paste a detailed job description.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")

    text = extract_pdf_text(contents)
    return build_job_match_report(text, job_description, file.filename)


@app.post("/interview/tech/start")
async def start_technical_interview(
    job_description: str = Form(""),
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF resume.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")

    text = extract_pdf_text(contents)
    return build_technical_interview(text, job_description, file.filename)


@app.post("/interview/hr/start")
async def start_hr_interview(
    job_description: str = Form(""),
    file: UploadFile = File(...)
):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF resume.")

    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded PDF is empty.")

    text = extract_pdf_text(contents)
    return build_hr_interview(text, job_description, file.filename)
