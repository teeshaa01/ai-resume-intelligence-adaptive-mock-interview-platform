from fastapi import Depends, FastAPI, File, Form, Header, HTTPException, Request, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import Base, SessionLocal, engine
from models import User
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import io
import json
import os
import re
import zipfile
import xml.etree.ElementTree as ET
import base64
import hashlib
import hmac
import secrets
from datetime import datetime, timezone

import pdfplumber
from dotenv import load_dotenv
from groq import Groq


# ============================================================
# ENVIRONMENT
# ============================================================

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "openai/gpt-oss-120b"
)

CORS_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173"
)
AUTH_SECRET = os.getenv("AUTH_SECRET", "resuintel-development-secret")


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title="AI Resume Intelligence & Mock Interview API",
    version="2.0.0"
)

origins = [
    origin.strip()
    for origin in CORS_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(RequestValidationError)
async def request_validation_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(status_code=422, content={"detail": "Invalid interview request. Please record an answer and try again."})


@app.on_event("startup")
def ensure_database_schema():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 120000)
    return f"pbkdf2_sha256$120000${base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, stored: str) -> bool:
    try:
        algorithm, rounds, encoded_salt, encoded_digest = stored.split("$", 3)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.urlsafe_b64decode(encoded_salt.encode())
        expected = base64.urlsafe_b64decode(encoded_digest.encode())
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, int(rounds))
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def create_auth_token(user: User) -> str:
    payload = f"{user.id}:{int(datetime.now(timezone.utc).timestamp())}"
    signature = hmac.new(AUTH_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return base64.urlsafe_b64encode(f"{payload}:{signature}".encode()).decode()


def get_current_user(authorization: str = Header(""), db: Session = Depends(get_db)) -> User:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authentication is required.")
    try:
        decoded = base64.urlsafe_b64decode(authorization[7:].encode()).decode()
        user_id, issued_at, signature = decoded.rsplit(":", 2)
        payload = f"{user_id}:{issued_at}"
        expected = hmac.new(AUTH_SECRET.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError
        if int(datetime.now(timezone.utc).timestamp()) - int(issued_at) > 86400:
            raise ValueError
    except (ValueError, TypeError, UnicodeDecodeError):
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.status != "active":
        raise HTTPException(status_code=401, detail="User account is not active.")
    return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access is required.")
    return user


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
def root():
    return {
        "message": "AI Resume Intelligence & Mock Interview API is running!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "llm_configured": bool(GROQ_API_KEY),
        "model": GROQ_MODEL
    }


@app.post("/auth/signup")
def signup(full_name: str = Form(...), email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    normalized_email = email.strip().lower()
    if len(password) < 6 or not full_name.strip():
        raise HTTPException(status_code=400, detail="Full name and a password of at least 6 characters are required.")
    if db.query(User).filter(func.lower(User.email) == normalized_email).first():
        raise HTTPException(status_code=409, detail="This email already has an account.")
    first_user_is_admin = db.query(func.count(User.id)).scalar() == 0
    user = User(full_name=full_name.strip(), email=normalized_email, hashed_password=hash_password(password), role="admin" if first_user_is_admin else "candidate", status="active")
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"token": create_auth_token(user), "user": {"id": str(user.id), "name": user.full_name, "email": user.email, "role": user.role, "status": user.status}}


@app.post("/auth/login")
def login(email: str = Form(...), password: str = Form(...), db: Session = Depends(get_db)):
    user = db.query(User).filter(func.lower(User.email) == email.strip().lower()).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if user.status != "active":
        raise HTTPException(status_code=403, detail="This account is suspended.")
    return {"token": create_auth_token(user), "user": {"id": str(user.id), "name": user.full_name, "email": user.email, "role": user.role, "status": user.status}}


def serialize_user(user: User):
    return {"id": str(user.id), "name": user.full_name, "email": user.email, "role": user.role, "status": user.status, "scansCount": user.scans_count or 0, "interviewsCount": user.interviews_count or 0, "createdAt": user.created_at.isoformat() if user.created_at else None}


@app.get("/api/admin/users")
def admin_users(search: str = "", role: str = "all", status: str = "all", _: User = Depends(require_admin), db: Session = Depends(get_db)):
    query = db.query(User)
    if search.strip():
        term = f"%{search.strip().lower()}%"
        query = query.filter((func.lower(User.full_name).like(term)) | (func.lower(User.email).like(term)))
    if role != "all":
        query = query.filter(User.role == role)
    if status != "all":
        query = query.filter(User.status == status)
    return [serialize_user(user) for user in query.order_by(User.created_at.desc()).all()]


@app.get("/api/admin/stats")
def admin_stats(_: User = Depends(require_admin), db: Session = Depends(get_db)):
    return {
        "totalUsers": db.query(func.count(User.id)).scalar() or 0,
        "activeUsers": db.query(func.count(User.id)).filter(User.status == "active").scalar() or 0,
        "adminUsers": db.query(func.count(User.id)).filter(User.role == "admin").scalar() or 0,
        "suspendedUsers": db.query(func.count(User.id)).filter(User.status == "suspended").scalar() or 0
    }


@app.post("/api/admin/users")
def admin_create_user(full_name: str = Form(...), email: str = Form(...), password: str = Form(...), role: str = Form("candidate"), status: str = Form("active"), _: User = Depends(require_admin), db: Session = Depends(get_db)):
    normalized_email = email.strip().lower()
    if role not in {"candidate", "admin"} or status not in {"active", "suspended"}:
        raise HTTPException(status_code=400, detail="Invalid role or status.")
    if db.query(User).filter(func.lower(User.email) == normalized_email).first():
        raise HTTPException(status_code=409, detail="This email already has an account.")
    user = User(full_name=full_name.strip(), email=normalized_email, hashed_password=hash_password(password), role=role, status=status)
    db.add(user)
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@app.put("/api/admin/users/{user_id}")
def admin_update_user(user_id: str, full_name: str = Form(...), _: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if not full_name.strip():
        raise HTTPException(status_code=400, detail="Full name is required.")
    user.full_name = full_name.strip()
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@app.put("/api/admin/users/{user_id}/status")
def admin_update_status(user_id: str, status: str = Form(...), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if status not in {"active", "suspended"}:
        raise HTTPException(status_code=400, detail="Invalid account status.")
    if user.id == admin.id and status != "active":
        raise HTTPException(status_code=400, detail="You cannot suspend your own account.")
    user.status = status
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@app.put("/api/admin/users/{user_id}/role")
def admin_update_role(user_id: str, role: str = Form(...), admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if role not in {"candidate", "admin"}:
        raise HTTPException(status_code=400, detail="Invalid role.")
    if user.id == admin.id and role != "admin":
        raise HTTPException(status_code=400, detail="You cannot remove your own admin role.")
    user.role = role
    db.commit()
    db.refresh(user)
    return serialize_user(user)


@app.delete("/api/admin/users/{user_id}")
def admin_delete_user(user_id: str, admin: User = Depends(require_admin), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if user.id == admin.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
    db.delete(user)
    db.commit()
    return {"message": "User deleted."}


@app.put("/api/admin/users/{user_id}/password")
def admin_reset_password(user_id: str, new_password: str = Form(...), _: User = Depends(require_admin), db: Session = Depends(get_db)):
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters.")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    user.hashed_password = hash_password(new_password)
    db.commit()
    return {"message": "Password updated."}


# ============================================================
# GROQ CLIENT
# ============================================================

def get_llm_client():

    if not GROQ_API_KEY:
        raise HTTPException(
            status_code=500,
            detail=(
                "GROQ_API_KEY is missing. "
                "Add GROQ_API_KEY to your .env file."
            )
        )

    return Groq(
        api_key=GROQ_API_KEY
    )


# ============================================================
# TEXT EXTRACTION
# ============================================================

def extract_resume_text(
    contents: bytes,
    filename: str
):

    filename_lower = filename.lower()

    # --------------------------------------------------------
    # DOCX
    # --------------------------------------------------------

    if filename_lower.endswith(".docx"):

        try:

            with zipfile.ZipFile(
                io.BytesIO(contents)
            ) as document:

                xml_content = document.read(
                    "word/document.xml"
                )

            root = ET.fromstring(
                xml_content
            )

            namespaces = {
                "word":
                "http://schemas.openxmlformats.org/wordprocessingml/2006/main"
            }

            paragraphs = []

            for paragraph in root.findall(
                ".//word:p",
                namespaces
            ):

                words = [
                    node.text
                    for node in paragraph.findall(
                        ".//word:t",
                        namespaces
                    )
                    if node.text
                ]

                if words:
                    paragraphs.append(
                        "".join(words)
                    )

            text = "\n".join(
                paragraphs
            )

        except (
            KeyError,
            ET.ParseError,
            zipfile.BadZipFile
        ) as exc:

            raise HTTPException(
                status_code=400,
                detail="Could not read this DOCX file."
            ) from exc

    # --------------------------------------------------------
    # PDF
    # --------------------------------------------------------

    else:

        try:

            with pdfplumber.open(
                io.BytesIO(contents)
            ) as pdf:

                pages = []

                for page in pdf.pages:

                    page_text = (
                        page.extract_text()
                        or ""
                    )

                    pages.append(
                        page_text
                    )

                text = "\n".join(
                    pages
                )

        except Exception as exc:

            raise HTTPException(
                status_code=400,
                detail="Could not read this PDF file."
            ) from exc

    # --------------------------------------------------------
    # Clean text
    # --------------------------------------------------------

    text = re.sub(
        r"\n{3,}",
        "\n\n",
        text
    ).strip()

    if not text:

        raise HTTPException(
            status_code=400,
            detail=(
                "No readable text found. "
                "Please upload a text-based PDF or DOCX."
            )
        )

    if len(text) < 80:

        raise HTTPException(
            status_code=400,
            detail=(
                "The document contains too little text "
                "for reliable analysis."
            )
        )

    return text


# ============================================================
# RESUME SECTIONS
# ============================================================

RESUME_SECTIONS = [

    "summary",
    "professional summary",
    "career summary",
    "objective",
    "career objective",
    "profile",

    "skills",
    "technical skills",
    "core skills",
    "technical competencies",

    "experience",
    "work experience",
    "professional experience",
    "employment",
    "work history",

    "education",
    "academic background",

    "projects",
    "academic projects",
    "personal projects",

    "certifications",
    "certificates",

    "achievements",
    "accomplishments",

    "internship",
    "internships"
]


# ============================================================
# TECH SKILLS
# ============================================================

TECH_SKILLS = [

    "python",
    "java",
    "c++",
    "javascript",
    "typescript",

    "react",
    "angular",
    "vue",

    "node.js",
    "nodejs",

    "fastapi",
    "flask",
    "django",

    "sql",
    "postgresql",
    "mysql",
    "mongodb",

    "docker",
    "kubernetes",

    "aws",
    "azure",
    "gcp",

    "machine learning",
    "deep learning",

    "tensorflow",
    "pytorch",
    "scikit-learn",

    "pandas",
    "numpy",

    "llm",
    "rag",

    "rest api",
    "api",

    "git",
    "github",

    "html",
    "css",

    "linux",

    "data analysis",
    "data science",

    "statistics",

    "communication",
    "leadership"
]


# ============================================================
# DEFINITELY NOT RESUME
# ============================================================

NON_RESUME_TERMS = [

    "tax invoice",
    "invoice number",
    "gst invoice",
    "purchase order",

    "udyam registration",
    "registration certificate",

    "certificate of completion",
    "certificate of participation",
    "certificate of appreciation",

    "driving licence",
    "driving license",

    "aadhaar card",
    "aadhar card",

    "pan card",

    "passport",

    "bank statement",

    "fee receipt",
    "payment receipt",

    "medical report",
    "laboratory report",
    "lab report",

    "mark sheet",
    "marksheet",

    "question paper",
    "admit card",

    "application form",

    "research paper",
    "journal article",

    "government of"
]


# ============================================================
# RESUME SIGNAL EXTRACTION
# ============================================================

def get_resume_signals(
    text: str
):

    lower_text = text.lower()

    word_count = len(
        re.findall(
            r"\b\w+\b",
            text
        )
    )

    sections = []

    for section in RESUME_SECTIONS:

        pattern = (
            r"(?<!\w)"
            + re.escape(section)
            + r"(?!\w)"
        )

        if re.search(
            pattern,
            lower_text
        ):

            sections.append(
                section
            )

    skills = []

    for skill in TECH_SKILLS:

        pattern = (
            r"(?<!\w)"
            + re.escape(skill)
            + r"(?!\w)"
        )

        if re.search(
            pattern,
            lower_text
        ):

            skills.append(
                skill
            )

    has_email = bool(
        re.search(
            r"\b[A-Za-z0-9._%+-]+"
            r"@[A-Za-z0-9.-]+\."
            r"[A-Za-z]{2,}\b",
            text
        )
    )

    has_phone = bool(
        re.search(
            r"\b\d{10}\b",
            re.sub(
                r"\D",
                "",
                text
            )
        )
    )

    has_linkedin = (
        "linkedin.com"
        in lower_text
    )

    has_github = (
        "github.com"
        in lower_text
    )

    action_verbs = [

        "built",
        "developed",
        "designed",
        "implemented",
        "created",
        "managed",
        "deployed",
        "optimized",
        "automated",
        "engineered",
        "improved",
        "led",
        "architected",
        "integrated"
    ]

    action_count = 0

    for verb in action_verbs:

        if re.search(
            r"\b"
            + re.escape(verb)
            + r"\b",
            lower_text
        ):

            action_count += 1

    metric_patterns = [

        r"\b\d+%\b",

        r"\b\d+\+\s*(users|clients|projects|"
        r"years|members|requests|downloads)?\b",

        r"\$\d+[\d,]*",

        r"\b\d+\s*(ms|seconds|hours|days)\b"
    ]

    metric_count = 0

    for pattern in metric_patterns:

        metric_count += len(
            re.findall(
                pattern,
                lower_text
            )
        )

    non_resume_terms = [

        term

        for term in NON_RESUME_TERMS

        if term in lower_text
    ]

    return {

        "word_count":
            word_count,

        "sections":
            list(set(sections)),

        "skills":
            list(set(skills)),

        "has_email":
            has_email,

        "has_phone":
            has_phone,

        "has_linkedin":
            has_linkedin,

        "has_github":
            has_github,

        "action_count":
            action_count,

        "metric_count":
            metric_count,

        "non_resume_terms":
            non_resume_terms
    }


# ============================================================
# BASIC RESUME GATE
# ============================================================

def passes_basic_resume_gate(
    signals: dict
):

    if signals["non_resume_terms"]:
        return False

    section_count = len(
        signals["sections"]
    )

    skill_count = len(
        signals["skills"]
    )

    contact_count = sum([
        signals["has_email"],
        signals["has_phone"],
        signals["has_linkedin"],
        signals["has_github"]
    ])

    # Strong resume
    if (
        section_count >= 3
        and skill_count >= 2
    ):
        return True

    # Fresher resume
    if (
        section_count >= 2
        and skill_count >= 3
    ):
        return True

    # Resume with contact details
    if (
        section_count >= 2
        and contact_count >= 1
        and skill_count >= 2
    ):
        return True

    return False


# ============================================================
# LLM RESUME CLASSIFICATION
# ============================================================

def classify_resume_with_llm(
    text: str
):

    client = get_llm_client()

    prompt = f"""
You are a strict resume/CV document classifier.

Determine whether the following document is a genuine person's
resume/CV.

A genuine resume normally contains several of these:

- candidate name
- contact information
- education
- skills
- projects
- internships
- work experience
- professional summary
- certifications
- achievements

Documents such as:

- invoices
- certificates
- marksheets
- research papers
- government documents
- receipts
- question papers
- application forms

are NOT resumes.

IMPORTANT:

A fresher resume does NOT need work experience.

Do not reject a resume simply because experience is missing.

Return ONLY valid JSON:

{{
    "is_resume": true,
    "confidence": 95,
    "reason": "This is a candidate resume containing education, skills and projects."
}}

Confidence must be between 0 and 100.

DOCUMENT:

{text[:18000]}
"""

    try:

        completion = client.chat.completions.create(

            model=GROQ_MODEL,

            messages=[

                {
                    "role": "system",
                    "content": (
                        "You classify documents as resume or "
                        "not-resume. Return JSON only."
                    )
                },

                {
                    "role": "user",
                    "content": prompt
                }
            ],

            temperature=0,

            response_format={
                "type": "json_object"
            }
        )

        raw = (
            completion
            .choices[0]
            .message
            .content
        )

        result = json.loads(
            raw
        )

        is_resume = bool(
            result.get(
                "is_resume",
                False
            )
        )

        confidence = int(
            result.get(
                "confidence",
                0
            )
        )

        confidence = max(
            0,
            min(
                100,
                confidence
            )
        )

        return {

            "is_resume":
                is_resume,

            "confidence":
                confidence,

            "reason":
                str(
                    result.get(
                        "reason",
                        ""
                    )
                ).strip()
        }

    except Exception as exc:

        print(
            "LLM resume classification failed:",
            repr(exc)
        )

        # VERY IMPORTANT:
        # Return None instead of automatically
        # rejecting the resume.

        return None


# ============================================================
# COMPLETE RESUME VALIDATION
# ============================================================

def validate_resume(
    text: str
):

    signals = get_resume_signals(
        text
    )

    # ========================================================
    # STEP 1
    # OBVIOUS NON-RESUME
    # ========================================================

    if signals["non_resume_terms"]:

        return {

            "valid":
                False,

            "reason":
                (
                    "The document appears to be an invoice, "
                    "certificate, official document, receipt, "
                    "or another non-resume document."
                ),

            "signals":
                signals,

            "classification":
                {

                    "is_resume":
                        False,

                    "confidence":
                        100,

                    "reason":
                        "Obvious non-resume document."
                }
        }

    # ========================================================
    # STEP 2
    # BASIC STRUCTURE
    # ========================================================

    basic_resume = passes_basic_resume_gate(
        signals
    )

    # ========================================================
    # STEP 3
    # AI CLASSIFICATION
    # ========================================================

    llm_result = classify_resume_with_llm(
        text
    )

    # ========================================================
    # CASE 1
    # LLM WORKED
    # ========================================================

    if llm_result is not None:

        # AI confidently says resume
        if (
            llm_result["is_resume"]
            and
            llm_result["confidence"] >= 60
        ):

            return {

                "valid":
                    True,

                "reason":
                    (
                        "Document verified as a candidate resume."
                    ),

                "signals":
                    signals,

                "classification":
                    llm_result
            }

        # AI confidently says NOT resume
        if (
            not llm_result["is_resume"]
            and
            llm_result["confidence"] >= 75
        ):

            return {

                "valid":
                    False,

                "reason":
                    (
                        llm_result["reason"]
                        or
                        "AI determined that this document is not a resume."
                    ),

                "signals":
                    signals,

                "classification":
                    llm_result
            }

        # AI uncertain
        # Basic structure gets final decision.

        if basic_resume:

            return {

                "valid":
                    True,

                "reason":
                    (
                        "Document contains sufficient resume structure."
                    ),

                "signals":
                    signals,

                "classification":
                    llm_result
            }

        return {

            "valid":
                False,

            "reason":
                (
                    llm_result["reason"]
                    or
                    "The document does not contain sufficient resume structure."
                ),

            "signals":
                signals,

            "classification":
                llm_result
        }

    # ========================================================
    # CASE 2
    # LLM FAILED
    # ========================================================
    #
    # DON'T AUTOMATICALLY RETURN FALSE
    #
    # Use local resume structure.
    # ========================================================

    if basic_resume:

        return {

            "valid":
                True,

            "reason":
                (
                    "Resume verified using document structure."
                ),

            "signals":
                signals,

            "classification":
                {

                    "is_resume":
                        True,

                    "confidence":
                        70,

                    "reason":
                        (
                            "AI verification was unavailable, "
                            "but the document has strong resume structure."
                        )
                }
        }

    return {

        "valid":
            False,

        "reason":
            (
                "The document could not be verified as a resume."
            ),

        "signals":
            signals,

        "classification":
            {

                "is_resume":
                    False,

                "confidence":
                    30,

                "reason":
                    (
                        "Insufficient resume structure and "
                        "AI verification unavailable."
                    )
            }
    }


# ============================================================
# NOT A RESUME RESPONSE
# ============================================================

def not_a_resume_response(
    filename: str,
    reason: str
):

    return {

        "score":
            0,

        "resume_quality_score":
            0,

        "job_match_score":
            None,

        "is_resume":
            False,

        "score_label":
            "Not a Resume",

        "summary":
            (
                f"{filename} was rejected because "
                f"it does not appear to be a genuine resume."
            ),

        "section_scores":
            {},

        "strengths":
            [],

        "improvements":
            [
                "Upload a genuine candidate resume/CV.",
                "Use a text-readable PDF or DOCX.",
                "Include Skills, Education, Projects, Experience or Summary."
            ],

        "matched_skills":
            [],

        "missing_skills":
            [],

        "details":
            [

                {

                    "title":
                        "Document Classification",

                    "status":
                        "warning",

                    "statusLabel":
                        "Not a Resume",

                    "message":
                        reason
                }
            ],

        "llm_used":
            True
    }


# ============================================================
# ATS SCORE LABEL
# ============================================================

def get_score_label(
    score: int
):

    if score >= 90:
        return "Excellent"

    if score >= 80:
        return "Strong"

    if score >= 70:
        return "Good"

    if score >= 60:
        return "Needs Improvement"

    return "Weak"


# ============================================================
# ATS SECTION DETAILS
# ============================================================

ATS_MAXIMUMS = {

    "Contact Information":
        10,

    "Professional Summary":
        10,

    "Skills":
        15,

    "Work Experience":
        20,

    "Education":
        10,

    "Projects":
        15,

    "Certifications":
        5,

    "Achievements":
        5,

    "ATS Formatting":
        10
}


def build_ats_details(
    section_scores: dict
):

    details = []

    for title, maximum in ATS_MAXIMUMS.items():

        value = section_scores.get(
            title,
            0
        )

        try:

            value = float(
                value
            )

        except Exception:

            value = 0

        ratio = (
            value / maximum
            if maximum
            else 0
        )

        status = (
            "pass"
            if ratio >= 0.7
            else "warning"
        )

        details.append(

            {

                "title":
                    title,

                "status":
                    status,

                "statusLabel":
                    f"{round(value)}/{maximum}",

                "message":
                    (
                        f"AI evaluated the "
                        f"{title.lower()} section."
                    )
            }
        )

    return details


# ============================================================
# ATS LLM ANALYSIS
# ============================================================

def analyze_resume_with_llm(
    text: str,
    filename: str
):

    client = get_llm_client()

    prompt = f"""
You are an expert ATS resume evaluator.

Analyze ONLY the actual candidate resume below.

Your score must depend on the content of THIS resume.

Return JSON ONLY:

{{
    "resume_quality_score": 0,

    "section_scores": {{
        "Contact Information": 0,
        "Professional Summary": 0,
        "Skills": 0,
        "Work Experience": 0,
        "Education": 0,
        "Projects": 0,
        "Certifications": 0,
        "Achievements": 0,
        "ATS Formatting": 0
    }},

    "strengths": [],

    "improvements": [],

    "matched_skills": [],

    "missing_or_weak_skills": [],

    "summary": ""
}}

SCORING:

Contact Information = 10
Professional Summary = 10
Skills = 15
Work Experience = 20
Education = 10
Projects = 15
Certifications = 5
Achievements = 5
ATS Formatting = 10

TOTAL = 100

IMPORTANT RULES:

1. Score ONLY what is actually present.
2. Never invent experience.
3. Never invent skills.
4. Never assume missing information.
5. Different resumes should receive different scores.
6. Never use a default score.
7. Never give every resume 70.
8. Never give every resume 80.
9. Never give every resume 90.
10. Fresher resumes can score well without work experience.
11. Reward strong projects.
12. Reward measurable achievements.
13. Reward specific technical skills.
14. Reward action verbs.
15. Penalize vague statements.
16. Penalize missing sections.
17. Penalize irrelevant information.
18. Evaluate ATS readability.
19. Base every score on actual evidence.
20. Do not score the filename.
21. Do not score the fact that the file is a PDF.
22. Evaluate the candidate's actual content.

Filename:

{filename}

RESUME:

{text[:22000]}
"""

    try:

        completion = client.chat.completions.create(

            model=GROQ_MODEL,

            messages=[

                {

                    "role":
                        "system",

                    "content":
                        (
                            "You are an expert ATS evaluator. "
                            "Return valid JSON only."
                        )
                },

                {

                    "role":
                        "user",

                    "content":
                        prompt
                }
            ],

            temperature=0,

            response_format={
                "type":
                    "json_object"
            }
        )

        result = json.loads(

            completion
            .choices[0]
            .message
            .content
        )

        score = result.get(
            "resume_quality_score"
        )

        if not isinstance(
            score,
            (int, float)
        ):

            raise ValueError(
                "Invalid ATS score."
            )

        score = round(

            max(
                0,
                min(
                    100,
                    score
                )
            )
        )

        section_scores = result.get(
            "section_scores",
            {}
        )

        if not isinstance(
            section_scores,
            dict
        ):

            section_scores = {}

        cleaned_section_scores = {}

        for key, value in section_scores.items():

            try:

                cleaned_section_scores[
                    str(key)
                ] = round(
                    max(
                        0,
                        float(value)
                    )
                )

            except Exception:

                continue

        def clean_list(value):

            if not isinstance(
                value,
                list
            ):

                return []

            return [

                str(item).strip()

                for item
                in value

                if str(item).strip()

            ][:10]

        strengths = clean_list(
            result.get(
                "strengths"
            )
        )

        improvements = clean_list(
            result.get(
                "improvements"
            )
        )

        matched_skills = clean_list(
            result.get(
                "matched_skills"
            )
        )

        missing_skills = clean_list(
            result.get(
                "missing_or_weak_skills"
            )
        )

        summary = str(
            result.get(
                "summary",
                ""
            )
        ).strip()

        return {

            "score":
                score,

            "resume_quality_score":
                score,

            "job_match_score":
                None,

            "is_resume":
                True,

            "score_label":
                get_score_label(
                    score
                ),

            "summary":
                summary
                or
                "AI ATS analysis completed.",

            "section_scores":
                cleaned_section_scores,

            "strengths":
                strengths,

            "improvements":
                improvements,

            "matched_skills":
                matched_skills,

            "missing_skills":
                missing_skills,

            "details":
                build_ats_details(
                    cleaned_section_scores
                ),

            "llm_used":
                True
        }

    except Exception as exc:

        print(
            "ATS analysis error:",
            repr(exc)
        )

        raise HTTPException(
            status_code=502,
            detail=(
                "AI ATS analysis failed. "
                "Check GROQ_API_KEY, GROQ_MODEL, "
                "and your internet connection."
            )
        )


# ============================================================
# ATS ENDPOINT
# ============================================================

@app.post("/analyze/ats")
async def analyze_ats_resume(
    file: UploadFile = File(...)
):

    if not file.filename.lower().endswith(
        (".pdf", ".docx")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF or DOCX resume."
        )

    contents = await file.read()

    if not contents:

        raise HTTPException(
            status_code=400,
            detail="The uploaded file is empty."
        )

    text = extract_resume_text(
        contents,
        file.filename
    )

    # ========================================================
    # VALIDATE FIRST
    # ========================================================

    validation = validate_resume(
        text
    )

    if not validation["valid"]:

        return not_a_resume_response(
            file.filename,
            validation["reason"]
        )

    # ========================================================
    # REAL RESUME
    # ========================================================

    report = analyze_resume_with_llm(
        text,
        file.filename
    )

    classification = validation.get(
        "classification",
        {}
    )

    report[
        "document_classification"
    ] = {

        "is_resume":
            True,

        "confidence":
            classification.get(
                "confidence",
                70
            ),

        "reason":
            classification.get(
                "reason",
                ""
            )
    }

    return report


# ============================================================
# ROLE REQUIREMENTS
# ============================================================

ROLE_REQUIREMENTS = {

    "software engineer":
        """
Software Engineer requiring programming,
software development, algorithms,
databases, APIs, testing, Git,
debugging and problem solving.
""",

    "ai/ml engineer":
        """
AI/ML Engineer requiring Python,
machine learning, deep learning,
statistics, SQL, model deployment,
APIs and cloud technologies.
""",

    "data scientist":
        """
Data Scientist requiring Python, SQL,
statistics, data analysis,
machine learning, Pandas,
visualization and experimentation.
""",

    "data analyst":
        """
Data Analyst requiring SQL, Python,
Excel, statistics, data analysis,
dashboards and visualization.
""",

    "backend developer":
        """
Backend Developer requiring Python or Java,
APIs, databases, REST APIs,
testing, Git, scalability and cloud.
""",

    "frontend developer":
        """
Frontend Developer requiring JavaScript,
React, HTML, CSS, APIs, Git,
responsive design and testing.
""",

    "full stack developer":
        """
Full Stack Developer requiring JavaScript,
React, backend development,
APIs, databases, testing,
Git and cloud.
"""
}


# ============================================================
# JOB MATCH LLM
# ============================================================

def analyze_job_match_with_llm(
    resume_text: str,
    job_description: str
):

    client = get_llm_client()

    prompt = f"""
You are a strict professional hiring analyst.

Compare the candidate resume with the job description.

Return JSON ONLY:

{{
    "job_match_score": 0,
    "matched_skills": [],
    "missing_skills": [],
    "strengths": [],
    "recommendations": [],
    "reason": ""
}}

RULES:

1. Score job compatibility from 0 to 100.
2. Do not score general resume quality.
3. Use actual evidence.
4. Never invent experience.
5. Never invent skills.
6. Understand reasonable synonyms.
7. Prioritize important job requirements.
8. Missing important requirements reduce the score.
9. Different resumes should produce different scores.
10. Never use a default score.
11. Do not assume a skill just because another related skill exists.

RESUME:

{resume_text[:18000]}

JOB DESCRIPTION:

{job_description[:14000]}
"""

    try:

        completion = client.chat.completions.create(

            model=GROQ_MODEL,

            messages=[

                {

                    "role":
                        "system",

                    "content":
                        (
                            "You are a precise job matching engine. "
                            "Return JSON only."
                        )
                },

                {

                    "role":
                        "user",

                    "content":
                        prompt
                }
            ],

            temperature=0,

            response_format={
                "type":
                    "json_object"
            }
        )

        result = json.loads(

            completion
            .choices[0]
            .message
            .content
        )

        score = result.get(
            "job_match_score"
        )

        if not isinstance(
            score,
            (int, float)
        ):

            raise ValueError(
                "Invalid job match score."
            )

        score = round(
            max(
                0,
                min(
                    100,
                    score
                )
            )
        )

        def clean_list(value):

            if not isinstance(
                value,
                list
            ):

                return []

            return [

                str(item).strip()

                for item
                in value

                if str(item).strip()

            ][:10]

        return {

            "job_match_score":
                score,

            "matched_skills":
                clean_list(
                    result.get(
                        "matched_skills"
                    )
                ),

            "missing_skills":
                clean_list(
                    result.get(
                        "missing_skills"
                    )
                ),

            "strengths":
                clean_list(
                    result.get(
                        "strengths"
                    )
                ),

            "recommendations":
                clean_list(
                    result.get(
                        "recommendations"
                    )
                ),

            "reason":
                str(
                    result.get(
                        "reason",
                        ""
                    )
                ).strip(),

            "llm_used":
                True
        }

    except Exception as exc:

        print(
            "Job match error:",
            repr(exc)
        )

        raise HTTPException(
            status_code=502,
            detail="AI job matching failed."
        )


# ============================================================
# JOB MATCH ENDPOINT
# ============================================================

@app.post("/analyze/job-match")
async def analyze_job_match(

    job_description: str = Form(""),

    target_role: str = Form(""),

    file: UploadFile = File(...)
):

    if not file.filename.lower().endswith(
        (".pdf", ".docx")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF or DOCX resume."
        )

    # --------------------------------------------------------
    # Role fallback
    # --------------------------------------------------------

    if (
        len(job_description.strip()) < 80
        and target_role.strip()
    ):

        normalized_role = (
            target_role
            .strip()
            .lower()
        )

        job_description = ROLE_REQUIREMENTS.get(

            normalized_role,

            (
                f"{target_role.strip()} role requiring "
                "programming, problem solving, APIs, "
                "databases, testing and communication."
            )
        )

    if len(
        job_description.strip()
    ) < 80:

        raise HTTPException(
            status_code=400,
            detail="Please provide a detailed job description."
        )

    contents = await file.read()

    if not contents:

        raise HTTPException(
            status_code=400,
            detail="The uploaded resume file is empty."
        )

    text = extract_resume_text(
        contents,
        file.filename
    )

    # ========================================================
    # VALIDATE RESUME FIRST
    # ========================================================

    validation = validate_resume(
        text
    )

    if not validation["valid"]:

        return {

            "score":
                0,

            "resume_quality_score":
                0,

            "job_match_score":
                0,

            "score_label":
                "Not a Resume",

            "is_resume":
                False,

            "summary":
                (
                    f"{file.filename} is not a "
                    "valid candidate resume."
                ),

            "details":
                [

                    {

                        "title":
                            "Document Classification",

                        "status":
                            "warning",

                        "statusLabel":
                            "Not a Resume",

                        "message":
                            validation[
                                "reason"
                            ]
                    }
                ],

            "missingSkills":
                [],

            "matchedSkills":
                [],

            "ai_analysis":
                {

                    "llm_used":
                        True,

                    "message":
                        validation[
                            "reason"
                        ]
                }
        }

    # ========================================================
    # JOB MATCH
    # ========================================================

    result = analyze_job_match_with_llm(

        text,

        job_description
    )

    score = result[
        "job_match_score"
    ]

    missing_skills = result[
        "missing_skills"
    ]

    matched_skills = result[
        "matched_skills"
    ]

    return {

        "score":
            score,

        "job_match_score":
            score,

        "resume_quality_score":
            None,

        "score_label":
            get_score_label(
                score
            ),

        "is_resume":
            True,

        "summary":
            result[
                "reason"
            ]
            or
            "AI job matching completed.",

        "matchedSkills":
            matched_skills,

        "missingSkills":
            [

                {

                    "skill":
                        skill,

                    "priority":
                        (
                            "High"
                            if index < 3
                            else "Medium"
                        ),

                    "source":
                        "AI Job Match",

                    "completed":
                        False
                }

                for index, skill
                in enumerate(
                    missing_skills
                )
            ],

        "details":
            [

                {

                    "title":
                        "Semantic Match",

                    "status":
                        (
                            "pass"
                            if score >= 70
                            else "warning"
                        ),

                    "statusLabel":
                        "AI Reviewed",

                    "message":
                        result[
                            "reason"
                        ]
                        or
                        "Resume and job description were compared using AI."
                },

                {

                    "title":
                        "Matched Skills",

                    "status":
                        (
                            "pass"
                            if matched_skills
                            else "warning"
                        ),

                    "statusLabel":
                        f"{len(matched_skills)} Found",

                    "message":
                        (
                            ", ".join(
                                matched_skills
                            )
                            if matched_skills
                            else
                            "No strong matching skills found."
                        )
                },

                {

                    "title":
                        "Missing Skills",

                    "status":
                        (
                            "warning"
                            if missing_skills
                            else "pass"
                        ),

                    "statusLabel":
                        f"{len(missing_skills)} Missing",

                    "message":
                        (
                            ", ".join(
                                missing_skills
                            )
                            if missing_skills
                            else
                            "No major missing skills detected."
                        )
                },

                {

                    "title":
                        "AI Recommendations",

                    "status":
                        (
                            "warning"
                            if result[
                                "recommendations"
                            ]
                            else "pass"
                        ),

                    "statusLabel":
                        "Next Steps",

                    "message":
                        (
                            " ".join(
                                result[
                                    "recommendations"
                                ]
                            )
                            if result[
                                "recommendations"
                            ]
                            else
                            "Resume is well aligned with this role."
                        )
                }
            ],

        "ai_analysis":
            result,

        "document_classification":
            {

                "is_resume":
                    True,

                "confidence":
                    validation[
                        "classification"
                    ].get(
                        "confidence",
                        70
                    ),

                "reason":
                    validation[
                        "classification"
                    ].get(
                        "reason",
                        ""
                    )
            }
    }


# ============================================================
# INTERVIEW SIGNALS
# ============================================================

def extract_resume_signals_for_interview(
    resume_text: str
):

    lower_text = resume_text.lower()

    tech_terms = [

        "python",
        "java",
        "c++",
        "javascript",
        "typescript",

        "react",
        "node.js",
        "nodejs",

        "fastapi",
        "flask",
        "django",

        "sql",
        "postgresql",
        "mysql",
        "mongodb",

        "docker",
        "kubernetes",

        "aws",
        "azure",
        "gcp",

        "machine learning",
        "deep learning",

        "tensorflow",
        "pytorch",

        "scikit-learn",

        "pandas",
        "numpy",

        "llm",
        "rag",

        "rest api",
        "api"
    ]

    technologies = []

    for term in tech_terms:

        if term in lower_text:

            display = term

            if term in [
                "sql",
                "api",
                "llm",
                "rag"
            ]:

                display = term.upper()

            elif term == "c++":

                display = "C++"

            else:

                display = term.title()

            if display not in technologies:

                technologies.append(
                    display
                )

    project_lines = []

    for line in resume_text.splitlines():

        cleaned = re.sub(
            r"\s+",
            " ",
            line
        ).strip(
            " -•\t"
        )

        if (
            4 <= len(cleaned) <= 100
            and any(
                keyword in cleaned.lower()

                for keyword in [
                    "project",
                    "assistant",
                    "system",
                    "application",
                    "app",
                    "platform",
                    "prediction",
                    "detection",
                    "analysis"
                ]
            )
        ):

            project_lines.append(
                cleaned
            )

    projects = []

    for project in project_lines:

        if project not in projects:

            projects.append(
                project
            )

    first_line = next(

        (
            line.strip()

            for line
            in resume_text.splitlines()

            if line.strip()
        ),

        ""
    )

    candidate_name = "candidate"

    if (
        first_line
        and len(first_line.split()) <= 5
        and not any(
            char.isdigit()
            for char in first_line
        )
    ):

        candidate_name = first_line

    return {

        "candidateName":
            candidate_name,

        "projects":
            projects[:5],

        "technologies":
            technologies[:15]
    }


# ============================================================
# INTERVIEW GENERATOR
# ============================================================

def generate_interview_with_llm(
    resume_text: str,
    job_description: str,
    interview_type: str
):
    """Generate a small set of natural, fresher-friendly starting questions.
    Follow-up questions are generated after each answer by /interview/evaluate.
    """
    client = get_llm_client()

    if interview_type.lower() == "technical":
        focus = """
Ask fresher/entry-level software interview questions.
Focus on:
- resume projects
- technologies explicitly present in the resume
- basic programming and OOP
- basic SQL/databases
- APIs and backend/frontend basics when present
- simple debugging
- explaining project decisions
- basic AI/ML concepts only when present in the resume
Do NOT ask advanced system design, distributed systems, Kubernetes architecture,
10,000-user scaling scenarios, research-level theory, or senior-level questions.
"""
    else:
        focus = """
Ask fresher-level HR/behavioral questions.
Focus on:
- tell me about yourself
- education and why Computer Science
- career motivation
- projects and personal contribution
- strengths and weaknesses
- teamwork
- handling challenges and deadlines
- learning from mistakes
- career goals
- why this role/company
Do NOT use unnecessarily formal or academic wording.
Do NOT ask deep technical implementation questions.
"""

    prompt = f"""
You are a friendly human interviewer conducting a fresher-level {interview_type} interview.

Create exactly 6 STARTING questions. These are only the initial questions. After the
candidate answers each question, another AI endpoint will generate the next question
using the candidate's previous answer.

{focus}

IMPORTANT:
1. Use only facts supported by the actual resume.
2. Never invent projects, technologies, internships, experience, achievements, or skills.
3. Use simple, natural English that a real fresher interviewer would use.
4. Start easy and gradually move to easy-medium/medium.
5. The first question should normally be an easy introduction/project question.
6. At least 2 questions should refer to actual resume details when possible.
7. Do not make every question a generic question.
8. Do not ask senior-level questions.
9. Do not combine multiple questions into one question.
10. Return JSON only.

JSON FORMAT:
{{
  "summary": "short interview introduction",
  "questions": [
    {{
      "topic": "",
      "difficulty": "Easy|Easy-Medium|Medium",
      "question": ""
    }}
  ]
}}

RESUME:
{resume_text[:18000]}

JOB DESCRIPTION:
{job_description[:8000]}
"""

    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a friendly fresher-level interviewer. Return JSON only."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.35,
            response_format={"type": "json_object"}
        )

        result = json.loads(completion.choices[0].message.content)
        questions = result.get("questions", [])
        cleaned = []

        if isinstance(questions, list):
            for item in questions:
                if not isinstance(item, dict):
                    continue
                q = str(item.get("question", "")).strip()
                if not q:
                    continue
                cleaned.append({
                    "topic": str(item.get("topic", "General")).strip() or "General",
                    "difficulty": str(item.get("difficulty", "Easy")).strip() or "Easy",
                    "question": q
                })

        if len(cleaned) < 4:
            raise ValueError("Not enough interview questions generated.")

        return {
            "summary": str(result.get("summary", "")).strip() or "Your personalized mock interview is ready.",
            "questions": cleaned[:6],
            "llm_used": True
        }
    except Exception as exc:
        print("Interview generation error:", repr(exc))
        raise HTTPException(status_code=502, detail="AI interview generation failed.")


def evaluate_answer_and_generate_next_question(
    resume_text: str,
    job_description: str,
    interview_type: str,
    current_question: str,
    current_topic: str,
    answer: str,
    previous_qa: list,
    question_number: int,
):
    """Evaluate one answer and generate the next question using conversation context."""
    client = get_llm_client()

    if interview_type.lower() == "technical":
        evaluation_focus = "technical correctness, relevance, basic understanding, project knowledge, reasoning, and clarity"
        level_rule = "Keep questions at fresher level: Easy -> Easy-Medium -> Medium. Never jump to senior/system-design questions."
    else:
        evaluation_focus = "communication, clarity, confidence, motivation, ownership, teamwork, learning attitude, and role fit"
        level_rule = "Keep questions natural and fresher-friendly. Avoid complicated behavioral theory or formal wording."

    history = "\n".join(
        f"Q{i+1}: {item.get('question','')}\nA{i+1}: {item.get('answer','')}"
        for i, item in enumerate(previous_qa[-6:])
    ) or "No previous answers."

    prompt = f"""
You are a realistic human {interview_type} interviewer for a fresher candidate.

You must evaluate the candidate's CURRENT answer and then decide the NEXT question.
The next question MUST use the current answer or an important detail from the
conversation whenever a natural follow-up is possible. Do not simply pick a random
question from a fixed list.

CURRENT QUESTION:
{current_question}

CURRENT TOPIC:
{current_topic}

CURRENT ANSWER:
{answer}

PREVIOUS CONVERSATION:
{history}

RESUME:
{resume_text[:14000]}

JOB DESCRIPTION:
{job_description[:6000]}

INTERVIEW QUESTION NUMBER:
{question_number}

Evaluate: {evaluation_focus}.

{level_rule}

FOLLOW-UP RULES:
- If the answer is strong: ask a slightly deeper but still fresher-level connected question.
- If the answer is partially correct: ask a simple clarification connected to the same topic.
- If the answer is wrong: do not embarrass the candidate; ask an easier related question.
- If the answer is very short: ask "Can you give me a simple example?" or a specific follow-up.
- If the answer mentions a project, technology, challenge, team, or decision, use that detail in the next question.
- Do not ask a question about something absent from the resume unless it is a normal general HR question.
- Never invent facts about the candidate.
- Ask exactly ONE next question.
- Do not reveal the perfect answer.

Return JSON ONLY:
{{
  "score": 0,
  "verdict": "Excellent|Good|Partial|Needs Improvement|Incorrect|Not Relevant",
  "feedback": "2-3 natural sentences for the candidate",
  "good_points": [""],
  "improvements": [""],
  "next_question": {{
    "topic": "",
    "difficulty": "Easy|Easy-Medium|Medium",
    "question": ""
  }}
}}

Score the CURRENT answer from 0 to 10. Do not use answer length alone as the score.
Judge whether the answer actually answers the question.
"""

    try:
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a fair fresher interviewer and evaluator. Return JSON only."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.25,
            response_format={"type": "json_object"}
        )
        result = json.loads(completion.choices[0].message.content)

        score = max(0, min(10, int(float(result.get("score", 0)))))
        next_q = result.get("next_question", {})
        if not isinstance(next_q, dict) or not str(next_q.get("question", "")).strip():
            raise ValueError("LLM did not return a next question.")

        def clean_list(value):
            if not isinstance(value, list):
                return []
            return [str(x).strip() for x in value if str(x).strip()][:5]

        return {
            "score": score,
            "verdict": str(result.get("verdict", "Needs Improvement")),
            "feedback": str(result.get("feedback", "Your answer was reviewed.")).strip(),
            "good_points": clean_list(result.get("good_points")),
            "improvements": clean_list(result.get("improvements")),
            "next_question": {
                "topic": str(next_q.get("topic", "Follow-up")).strip() or "Follow-up",
                "difficulty": str(next_q.get("difficulty", "Easy-Medium")).strip() or "Easy-Medium",
                "question": str(next_q.get("question", "")).strip()
            },
            "llm_used": True
        }
    except Exception as exc:
        print("Interview answer evaluation error:", repr(exc))
        raise HTTPException(status_code=502, detail="AI interview answer evaluation failed.")


# ============================================================
# TECHNICAL INTERVIEW
# ============================================================

@app.post("/interview/tech/start")
async def start_technical_interview(

    job_description: str = Form(""),

    file: UploadFile = File(...)
):

    if not file.filename.lower().endswith(
        (".pdf", ".docx")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF or DOCX resume."
        )

    contents = await file.read()

    if not contents:

        raise HTTPException(
            status_code=400,
            detail="The uploaded resume is empty."
        )

    text = extract_resume_text(
        contents,
        file.filename
    )

    validation = validate_resume(
        text
    )

    if not validation["valid"]:

        return {

            "is_resume":
                False,

            "summary":
                (
                    "Interview cannot start because "
                    "the uploaded document is not a valid resume."
                ),

            "reason":
                validation[
                    "reason"
                ],

            "questions":
                []
        }

    if len(
        job_description.strip()
    ) < 80:

        job_description = """
General software engineering role involving
programming, problem solving, databases,
APIs, software development and debugging.
"""

    report = generate_interview_with_llm(

        text,

        job_description,

        "technical"
    )

    signals = extract_resume_signals_for_interview(
        text
    )

    return {

        "is_resume":
            True,

        "summary":
            report[
                "summary"
            ]
            or
            "Technical mock interview prepared.",

        "systemPrompt":
            """
You are an experienced technical interviewer.

Ask one question at a time.

After each candidate answer:

1. Evaluate technical correctness.
2. Evaluate depth.
3. Evaluate relevance.
4. Give short interviewer feedback.
5. Ask a relevant follow-up question.

Do not reveal the perfect answer unless explicitly requested.

Keep the final score hidden until the interview ends.
""",

        "candidateSignals":
            signals,

        "resumeContext": text[:14000],

        "questions":
            report[
                "questions"
            ],

        "llm_used":
            True
    }


# ============================================================
# HR INTERVIEW
# ============================================================

@app.post("/interview/hr/start")
async def start_hr_interview(

    job_description: str = Form(""),

    file: UploadFile = File(...)
):

    if not file.filename.lower().endswith(
        (".pdf", ".docx")
    ):

        raise HTTPException(
            status_code=400,
            detail="Please upload a PDF or DOCX resume."
        )

    contents = await file.read()

    if not contents:

        raise HTTPException(
            status_code=400,
            detail="The uploaded resume is empty."
        )

    text = extract_resume_text(
        contents,
        file.filename
    )

    validation = validate_resume(
        text
    )

    if not validation["valid"]:

        return {

            "is_resume":
                False,

            "summary":
                (
                    "Interview cannot start because "
                    "the uploaded document is not a valid resume."
                ),

            "reason":
                validation[
                    "reason"
                ],

            "questions":
                []
        }

    if len(
        job_description.strip()
    ) < 80:

        job_description = """
General professional role requiring communication,
teamwork, adaptability, ownership and motivation.
"""

    report = generate_interview_with_llm(

        text,

        job_description,

        "HR"
    )

    signals = extract_resume_signals_for_interview(
        text
    )

    return {

        "is_resume":
            True,

        "summary":
            report[
                "summary"
            ]
            or
            "HR mock interview prepared.",

        "systemPrompt":
            """
You are a professional human HR interviewer.

Ask one question at a time.

Use the candidate's resume as background.

Keep the conversation natural.

Evaluate:

- communication
- confidence
- clarity
- motivation
- teamwork
- adaptability
- career goals
- role fit

Do not ask deep technical implementation questions
during the HR interview.
""",

        "candidateSignals":
            signals,

        "resumeContext": text[:14000],

        "questions":
            report[
                "questions"
            ],

        "llm_used":
            True
    }


# ============================================================
# INTERVIEW ANSWER EVALUATION + ADAPTIVE NEXT QUESTION
# ============================================================

class InterviewEvaluationRequest(BaseModel):
    interview_type: str = "technical"
    resume_context: str = ""
    job_description: str = ""
    current_question: str
    current_topic: str = "Interview"
    answer: str
    previous_qa: list = []
    question_number: int = 1


@app.post("/interview/evaluate")
async def evaluate_interview_answer(request: InterviewEvaluationRequest):
    if not request.answer.strip():
        raise HTTPException(status_code=400, detail="Please provide an answer.")

    if request.interview_type.lower() not in {"technical", "hr"}:
        raise HTTPException(status_code=400, detail="interview_type must be technical or hr.")

    result = evaluate_answer_and_generate_next_question(
        resume_text=request.resume_context,
        job_description=request.job_description,
        interview_type=request.interview_type,
        current_question=request.current_question,
        current_topic=request.current_topic,
        answer=request.answer,
        previous_qa=request.previous_qa,
        question_number=request.question_number,
    )
    return result


# ============================================================
# START SERVER
# ============================================================

if __name__ == "__main__":

    import uvicorn

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )