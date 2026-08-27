import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import Greeting from '../components/Greeting';
import Metrics from '../components/Metrics';
import RecentScans from '../components/RecentScans';
import SkillChecklist from '../components/SkillChecklist';
import ProfileSettings from '../components/ProfileSettings';
import '../styles/DashboardLayout.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

const WORKSPACE_CONFIG = {
  ats_checker: {
    eyebrow: '01 ATS Checker',
    title: 'ATS Resume Checker',
    uploadLabel: 'Dedicated PDF Upload',
    uploadHelp: 'Upload the resume PDF you want to check against ATS formatting and keyword rules.',
    actionLabel: 'Run ATS Checker',
    resultTitle: 'ATS Checker Complete',
    scoreLabel: 'ATS Compatibility Score'
  },
  job_match: {
    eyebrow: '02 Job Match',
    title: 'Job Match Analysis',
    uploadLabel: 'Dedicated PDF Upload',
    uploadHelp: 'Upload the resume PDF for this job match analysis.',
    jobDescriptionLabel: 'Required Job Description',
    jobDescriptionPlaceholder: 'Paste the target job description here...',
    requiresJobDescription: true,
    actionLabel: 'Run Job Match Analysis',
    resultTitle: 'Job Match Analysis Complete',
    scoreLabel: 'Job Match Score'
  },
  tech_interview: {
    eyebrow: '03 Tech Interview',
    title: 'Tech Interview Practice',
    uploadLabel: 'Dedicated PDF Upload for Technical Interview',
    uploadHelp: 'Upload the resume PDF you want to use for technical interview preparation.',
    jobDescriptionLabel: 'Optional Target Job Description',
    jobDescriptionPlaceholder: 'Paste a target tech job description for more focused questions...',
    actionLabel: 'Start Interactive Tech Interview',
    resultTitle: 'Technical Mock Interview Started',
    interviewType: 'tech'
  },
  hr_interview: {
    eyebrow: '04 HR Interview',
    title: 'HR & Behavioral Interview Practice',
    uploadLabel: 'Dedicated PDF Upload for HR Interview',
    uploadHelp: 'Upload the resume PDF you want to use for HR and behavioral interview preparation.',
    jobDescriptionLabel: 'Optional Target Job Description',
    jobDescriptionPlaceholder: 'Paste a target job description for more role-aware HR questions...',
    actionLabel: 'Start Interactive HR Interview',
    resultTitle: 'HR Mock Interview Started',
    interviewType: 'hr'
  }
};

const INITIAL_WORKSPACE_STATE = {
  file: null,
  error: '',
  jobDescription: '',
  result: '',
  score: null,
  details: [],
  questions: [],
  interviewMode: 'written',
  currentQuestionIndex: 0,
  currentAnswer: '',
  answers: [],
  lastFeedback: null,
  finalReport: null,
  showSampleAnswer: false,
  isListening: false,
  isRunning: false
};

const HR_QUESTIONS = [
  'Can you briefly introduce yourself and tell me about your background?',
  'What motivated you to choose AI/ML or software development as your career direction?',
  'Pick one important project from your resume. What motivated you to choose it?',
  'What was your personal role in that project?',
  'Tell me about a time you worked with others or handled feedback during a project.',
  'What would you say is your biggest strength?',
  'What is one area you are currently working to improve?',
  'How do you handle pressure or tight deadlines?',
  'Where do you see yourself in the next few years?',
  'Why should we hire you for this role?'
];

const HR_INTERVIEW_PROMPT = `You are a professional human HR interviewer. Use the uploaded resume as background context, but do not run a fixed questionnaire and do not force every question to depend on the previous answer. Mix relevant follow-ups with natural topic transitions, roughly 60% follow-ups and 40% transitions. Cover introduction, background, motivation, projects, strengths, weaknesses, teamwork, leadership, pressure handling, failure, adaptability, communication, career goals, why this role/company, and why we should hire you. Project questions must stay high-level and HR-oriented. Ask exactly one question at a time. Do not ask technical implementation questions or evaluate the candidate after every answer.`;

const TECH_INTERVIEW_PROMPT = `You are an experienced technical interviewer conducting a realistic software engineering / AI-ML technical interview. Use the uploaded resume as the primary source. If a target job description is provided, prioritize role-relevant questions. Ask exactly one question at a time, wait for the answer, then decide whether to ask a follow-up, clarification, or move to the next topic. Evaluate correctness, depth, relevance, problem solving, and communication only in speaking mode. Keep scoring hidden until the final report.`;

const answerKeywords = [
  'architecture', 'api', 'database', 'model', 'algorithm', 'complexity', 'security',
  'latency', 'scal', 'cache', 'validation', 'error', 'testing', 'deployment',
  'trade-off', 'debug', 'monitor', 'performance', 'backend', 'frontend'
];

const hrAnswerKeywords = [
  'motivated', 'goal', 'problem', 'learn', 'challenge', 'team', 'communicat',
  'lead', 'responsible', 'ownership', 'pressure', 'adapt', 'feedback',
  'improve', 'strength', 'weakness', 'career', 'role', 'collaborat', 'because'
];

const scoreInterviewAnswer = (answer, mode, interviewType = 'tech') => {
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const lowerAnswer = answer.toLowerCase();
  const activeKeywords = interviewType === 'hr' ? hrAnswerKeywords : answerKeywords;
  const keywordHits = activeKeywords.filter(keyword => lowerAnswer.includes(keyword)).length;
  const lengthScore = Math.min(10, Math.round(words.length / 9));
  const technicalScore = Math.min(10, Math.max(2, lengthScore + Math.min(4, keywordHits)));
  const depthScore = Math.min(10, Math.max(2, Math.round(words.length / 12) + Math.min(3, keywordHits)));
  const relevanceScore = words.length < 12 ? 4 : Math.min(10, 6 + Math.min(4, keywordHits));
  const reasoningPattern = interviewType === 'hr'
    ? /because|so that|learned|handled|managed|improved|decided|result|feedback/
    : /because|so that|if|then|first|next|finally|trade|debug|check/;
  const problemSolvingScore = lowerAnswer.match(reasoningPattern) ? Math.min(10, technicalScore) : Math.max(3, technicalScore - 2);
  const communicationScore = mode === 'speaking' ? Math.min(10, words.length < 15 ? 5 : 7 + (lowerAnswer.includes('first') || lowerAnswer.includes('then') ? 1 : 0)) : null;

  return {
    technicalScore,
    depthScore,
    relevanceScore,
    problemSolvingScore,
    communicationScore,
    needsFollowUp: words.length < 28 || keywordHits < 2
  };
};

const buildFollowUpQuestion = (question, answer) => {
  const lowerAnswer = answer.toLowerCase();
  if (lowerAnswer.includes('fastapi') || lowerAnswer.includes('api')) {
    return 'You mentioned the API layer. Can you explain how request validation, error handling, and response formatting work in that flow?';
  }
  if (lowerAnswer.includes('sql') || lowerAnswer.includes('database') || lowerAnswer.includes('postgres')) {
    return 'You mentioned the database. How would you prevent unsafe queries and optimize the slowest query in this project?';
  }
  if (lowerAnswer.includes('model') || lowerAnswer.includes('ml') || lowerAnswer.includes('llm')) {
    return 'You mentioned the model or AI part. How would you evaluate its output quality and handle incorrect predictions or hallucinations?';
  }
  if (lowerAnswer.includes('react') || lowerAnswer.includes('frontend')) {
    return 'You mentioned the frontend. How does the UI state change from loading to success or error, and how would you avoid unnecessary re-renders?';
  }
  return `Let's go one level deeper on your last answer: for "${question}", what exact implementation decision did you make, and why was it better than one alternative?`;
};

const buildAdaptiveNextQuestion = ({ question, answer, scores, currentTopic, nextPlanned }) => {
  const lowerAnswer = answer.toLowerCase();
  const plannedQuestion = typeof nextPlanned === 'string' ? nextPlanned : nextPlanned?.question;
  const plannedTopic = typeof nextPlanned === 'string' ? 'Interview' : nextPlanned?.topic;

  if (lowerAnswer.includes('fastapi')) {
    if (lowerAnswer.includes('fast') && !lowerAnswer.match(/asgi|async|validation|pydantic/)) {
      return {
        topic: 'FastAPI Follow-up',
        difficulty: 'Clarification',
        question: "Right, but saying FastAPI is fast is a bit general. What specifically about FastAPI made it useful for your application?"
      };
    }
    return {
      topic: 'FastAPI Follow-up',
      difficulty: scores.technicalScore >= 8 ? 'Advanced' : 'Intermediate',
      question: "You mentioned FastAPI. How does one request move through your endpoint, including validation, business logic, and error handling?"
    };
  }

  if (lowerAnswer.includes('llm') || lowerAnswer.includes('ollama') || lowerAnswer.includes('prompt')) {
    return {
      topic: 'LLM Follow-up',
      difficulty: scores.technicalScore >= 8 ? 'Advanced' : 'Intermediate',
      question: "You mentioned the LLM part. What if it generates a syntactically valid but unsafe or incorrect SQL query?"
    };
  }

  if (lowerAnswer.includes('sql') || lowerAnswer.includes('postgres') || lowerAnswer.includes('database')) {
    return {
      topic: 'Database Follow-up',
      difficulty: scores.technicalScore >= 8 ? 'Advanced' : 'Intermediate',
      question: "You mentioned the database layer. How exactly would you validate queries and prevent destructive operations like DROP, DELETE, or UPDATE?"
    };
  }

  if (lowerAnswer.includes('accuracy') || lowerAnswer.match(/\b\d{2,3}%\b/)) {
    return {
      topic: 'Resume Claim Challenge',
      difficulty: 'Advanced',
      question: "You mentioned a performance number. How did you calculate it, and how did you make sure it was not caused by overfitting or data leakage?"
    };
  }

  if (scores.depthScore <= 5) {
    return {
      topic: currentTopic || 'Clarification',
      difficulty: 'Clarification',
      question: "You're on the right track, but I'd like you to be more specific. Can you give one concrete implementation example from your project?"
    };
  }

  if (scores.technicalScore >= 8) {
    return {
      topic: 'Production Challenge',
      difficulty: 'Advanced',
      question: "Good, that's a solid explanation. Now suppose this system has to support 10,000 concurrent users. What would you change first?"
    };
  }

  if (plannedQuestion) {
    return {
      topic: plannedTopic || 'Topic Transition',
      difficulty: 'Intermediate',
      question: `That covers ${currentTopic || 'that part'} for now. ${plannedQuestion}`
    };
  }

  return {
    topic: 'Follow-up',
    difficulty: 'Adaptive',
    question: buildFollowUpQuestion(question, answer)
  };
};

const getHrTopicTransition = (coveredTopics) => {
  const transitions = [
    {
      topic: 'Career Motivation',
      difficulty: 'Behavioral',
      question: 'Moving from your background to motivation, what made you choose AI/ML or software development as a career direction?'
    },
    {
      topic: 'Strengths',
      difficulty: 'Behavioral',
      question: "Let's talk a little about your strengths. What would you say is your biggest strength?"
    },
    {
      topic: 'Weaknesses',
      difficulty: 'Behavioral',
      question: 'What is one area you are currently working to improve?'
    },
    {
      topic: 'Teamwork',
      difficulty: 'Behavioral',
      question: "Let's talk about teamwork. Tell me about a time you worked with others to complete something important."
    },
    {
      topic: 'Handling Pressure',
      difficulty: 'Behavioral',
      question: 'How do you usually handle pressure or tight deadlines?'
    },
    {
      topic: 'Failure',
      difficulty: 'Behavioral',
      question: 'Tell me about a setback or failure you experienced and what you learned from it.'
    },
    {
      topic: 'Career Goals',
      difficulty: 'Behavioral',
      question: 'Moving on to your career goals, where do you see yourself in the next few years?'
    },
    {
      topic: 'Role Interest',
      difficulty: 'Behavioral',
      question: 'What interests you most about this role?'
    },
    {
      topic: 'Hiring Fit',
      difficulty: 'Behavioral',
      question: 'Why should we hire you for this role?'
    }
  ];

  return transitions.find(item => !coveredTopics.includes(item.topic)) || transitions[transitions.length - 1];
};

const buildHrAdaptiveNextQuestion = ({ answer, currentTopic, nextPlanned, answeredTopics, answerCount }) => {
  const lowerAnswer = answer.toLowerCase();
  const plannedQuestion = typeof nextPlanned === 'string' ? nextPlanned : nextPlanned?.question;
  const plannedTopic = typeof nextPlanned === 'string' ? 'HR' : nextPlanned?.topic;
  const coveredTopics = [...new Set([...(answeredTopics || []), currentTopic].filter(Boolean))];
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const shouldTransition = answerCount > 1 && answerCount % 3 === 0;

  if (shouldTransition) {
    return getHrTopicTransition(coveredTopics);
  }

  if (lowerAnswer.match(/learn|new|quick|fastapi|react|python|ai|ml|machine learning|technology/)) {
    return {
      topic: 'Learning Attitude',
      difficulty: 'Behavioral',
      question: 'That is a good example of learning something new. How would you describe your ability to learn new technologies?'
    };
  }

  if (lowerAnswer.match(/challenge|difficult|issue|problem|stuck|fail|error|pressure/)) {
    return {
      topic: 'Handling Challenges',
      difficulty: 'Behavioral',
      question: 'When you faced that situation, what was your first step and what did you learn from the experience?'
    };
  }

  if (lowerAnswer.match(/team|friend|group|mentor|guide|college|classmate|we /)) {
    return {
      topic: 'Teamwork',
      difficulty: 'Behavioral',
      question: 'How did you communicate with the people involved, especially when there were different opinions or priorities?'
    };
  }

  if (lowerAnswer.match(/lead|managed|owner|responsible|decision|initiative/)) {
    return {
      topic: 'Ownership',
      difficulty: 'Behavioral',
      question: 'What does that example say about your leadership style or the way you take ownership?'
    };
  }

  if (lowerAnswer.match(/motivated|interest|curious|career|role|job|future|ai|software/)) {
    return {
      topic: 'Motivation',
      difficulty: 'Behavioral',
      question: 'What about that experience made you more interested in AI/ML or software development as a career?'
    };
  }

  if (answer.trim().split(/\s+/).filter(Boolean).length < 25) {
    return {
      topic: currentTopic || 'Clarification',
      difficulty: 'Clarification',
      question: 'Can you give me one specific example so I can understand that better?'
    };
  }

  if (plannedQuestion && !coveredTopics.includes(plannedTopic)) {
    return {
      topic: plannedTopic || 'HR',
      difficulty: 'Behavioral',
      question: plannedQuestion
    };
  }

  return words.length > 45
    ? getHrTopicTransition(coveredTopics)
    : {
        topic: currentTopic || 'Follow-up',
        difficulty: 'Behavioral',
        question: 'What did that experience teach you about the way you work?'
      };
};

const buildSampleAnswer = (question, answer) => {
  const context = `${question} ${answer}`.toLowerCase();

  if (context.includes('ai sql') || context.includes('llm') || context.includes('natural language') || context.includes('sql')) {
    return 'One of my main projects is an AI SQL Assistant. It helps users who may not know SQL ask questions in natural language and get database results. The flow is: the user enters a question, the backend sends that question with table/schema context to the LLM, the LLM generates a SQL query, then the backend validates the query before execution. My contribution was mainly the AI/LLM part, including prompt design, connecting the model with the backend flow, and improving how natural-language questions are converted into SQL. I chose an LLM because it handles flexible user questions better than fixed rules, but the limitation is that it can generate incorrect or unsafe SQL, so validation like allowing only SELECT queries is important.';
  }

  if (context.includes('fastapi') || context.includes('api') || context.includes('endpoint')) {
    return 'In my project, FastAPI works as the backend layer between the frontend and the core logic. A request comes from the UI, the endpoint validates the input, passes it to the service or AI logic, handles errors, and returns a structured response. I would choose FastAPI because it supports clean API design, request validation with models, automatic documentation, and async request handling when useful. I would also add exception handling so invalid input or model/database failures return clear error responses instead of crashing.';
  }

  if (context.includes('database') || context.includes('postgres')) {
    return 'For the database layer, I would structure data using clear tables, columns, and relationships based on the project needs. When generated SQL is involved, I would validate the query before execution, allow only safe read operations like SELECT, block DROP/DELETE/UPDATE, check that table and column names are allowed, and use limited database permissions. If queries become slow, I would inspect the query plan, add indexes on frequently filtered columns, reduce unnecessary joins, and paginate large results.';
  }

  if (context.includes('scale') || context.includes('10000') || context.includes('concurrent') || context.includes('performance')) {
    return 'If the project had to support many users, I would first identify the bottleneck: frontend, API, model call, or database. I would add request logging and metrics, optimize slow database queries, use caching for repeated results, move heavy work to background jobs, and scale the backend horizontally behind a load balancer. For AI calls, I would also control latency with prompt size limits, timeouts, retries, and possibly queueing.';
  }

  return 'A strong answer should start with the problem, then explain your approach, implementation, trade-off, and result. For example: this project solves a specific user problem, I implemented the main flow using the selected technology stack, one important design decision was chosen because it fit the project requirements, and one limitation was handled through validation, error handling, testing, or monitoring.';
};

const buildHrFeedback = (question, answer, mode) => {
  const lowerAnswer = answer.toLowerCase();
  const words = answer.trim().split(/\s+/).filter(Boolean);
  const good = [];
  const improvements = [];

  if (lowerAnswer.match(/because|motivated|wanted|problem|goal/)) {
    good.push('You explained some motivation behind your work.');
  }
  if (lowerAnswer.match(/learn|improve|feedback|challenge|handled|managed/)) {
    good.push('You connected the answer to growth or problem handling.');
  }
  if (lowerAnswer.match(/team|communicat|support|mentor|collaborat|responsible/)) {
    good.push('You gave the interviewer a signal about teamwork or ownership.');
  }

  if (!lowerAnswer.match(/specific|example|when|during|project|moment/)) {
    improvements.push('Add one specific project moment instead of answering generally.');
  }
  if (!lowerAnswer.match(/because|so|therefore|that taught|i learned/)) {
    improvements.push('Explain the reason behind your action and what you learned.');
  }
  if (words.length < 25) {
    improvements.push('Give a fuller answer with context, action, and result.');
  }
  if (mode === 'speaking') {
    improvements.push('Keep your verbal answer calm and structured: context, action, result, learning.');
  }

  return {
    question,
    answer,
    good: good.length ? good.slice(0, 2).join(' ') : 'You answered the question and gave the interviewer a starting point.',
    needsImprovement: improvements[0] || 'Good answer. Continue supporting your points with real examples.',
    incorrect: [],
    improvements: improvements.length ? improvements.slice(0, 4) : ['Keep connecting each answer to motivation, ownership, and learning.'],
    sampleAnswer: '',
    communication: mode === 'speaking'
      ? (words.length >= 25 ? 'Your spoken answer has enough detail. Keep it concise and natural.' : 'Add a little more context so the interviewer can understand the situation.')
      : null
  };
};

const buildInterviewerFeedback = (question, answer, mode, scores) => {
  const lowerAnswer = answer.toLowerCase();
  const correctPoints = [];
  const missingPoints = [];
  const improvements = [];
  const incorrectPoints = [];

  if (lowerAnswer.includes('api') || lowerAnswer.includes('endpoint')) {
    correctPoints.push('You connected the answer to the API/request flow.');
  }
  if (lowerAnswer.includes('database') || lowerAnswer.includes('sql') || lowerAnswer.includes('postgres')) {
    correctPoints.push('You mentioned the data storage or query layer.');
  }
  if (lowerAnswer.includes('model') || lowerAnswer.includes('llm') || lowerAnswer.includes('machine learning')) {
    correctPoints.push('You identified the AI/model component involved.');
  }
  if (lowerAnswer.includes('because') || lowerAnswer.includes('trade')) {
    correctPoints.push('You attempted to explain reasoning instead of only naming tools.');
  }

  if (correctPoints.length === 0) {
    correctPoints.push('You attempted the question and gave the interviewer a starting point.');
  }

  if (!lowerAnswer.match(/architecture|flow|component|module|service/)) {
    missingPoints.push('Explain the architecture or request flow more clearly.');
  }
  if (!lowerAnswer.match(/why|because|trade|alternative|instead/)) {
    missingPoints.push('Add the reason behind your technical choice and compare one alternative.');
  }
  if (!lowerAnswer.match(/error|edge|fail|debug|exception|validation/)) {
    missingPoints.push('Mention failure cases, validation, or debugging steps.');
  }
  if (!lowerAnswer.match(/security|auth|permission|injection|sanitize|safe/)) {
    missingPoints.push('Connect the answer to security where relevant.');
  }
  if (!lowerAnswer.match(/scale|latency|performance|cache|index|optimi/)) {
    missingPoints.push('Mention performance or scalability trade-offs.');
  }

  if (lowerAnswer.includes('fastapi is faster because python')) {
    incorrectPoints.push('FastAPI performance is mainly related to ASGI and async handling, not Python code becoming faster.');
  }
  if (lowerAnswer.includes('sql injection is not possible')) {
    incorrectPoints.push('SQL injection can still be possible without strict validation, parameterization, and permission boundaries.');
  }

  improvements.push('Use a structured answer: problem, approach, implementation, trade-off, result.');
  if (missingPoints[0]) improvements.push(missingPoints[0]);
  if (missingPoints[1]) improvements.push(missingPoints[1]);
  if (scores.depthScore <= 5) improvements.push('Give one concrete example from your actual project instead of staying at definition level.');
  if (mode === 'speaking') improvements.push('Speak in clear steps so the interviewer can follow your reasoning without interruption.');

  const needsImprovement = incorrectPoints.length
    ? `Your understanding is partially correct, but one point needs correction: ${incorrectPoints[0]}`
    : missingPoints.length
      ? `Your answer is on the right track, but it needs more depth. ${missingPoints[0]}`
      : 'Good answer. Now the interviewer can challenge a deeper trade-off or failure case.';

  return {
    question,
    answer,
    good: correctPoints.slice(0, 2).join(' '),
    needsImprovement,
    incorrect: incorrectPoints,
    improvements: improvements.slice(0, 4),
    sampleAnswer: buildSampleAnswer(question, answer),
    communication: mode === 'speaking'
      ? (scores.communicationScore >= 7
          ? 'Your verbal structure is understandable. Keep using clear sequencing.'
          : 'Your technical idea may be understandable, but organize it as problem, approach, implementation, result.')
      : null
  };
};

const buildFinalInterviewReport = (answers, mode, interviewType = 'tech') => {
  const scoredAnswers = answers.map(item => ({ ...item, scores: item.scores || scoreInterviewAnswer(item.answerText, mode, interviewType) }));
  const average = (key) => Math.round(scoredAnswers.reduce((sum, item) => sum + (item.scores[key] || 0), 0) / Math.max(scoredAnswers.length, 1) * 10);
  const technical = average('technicalScore');
  const depth = average('depthScore');
  const relevance = average('relevanceScore');
  const problemSolving = average('problemSolvingScore');
  const communication = mode === 'speaking' ? average('communicationScore') : null;
  const scoreParts = [technical, depth, relevance, problemSolving, communication].filter(score => score !== null);
  const overallScore = Math.round(scoreParts.reduce((sum, score) => sum + score, 0) / scoreParts.length);
  const struggled = scoredAnswers.filter(item => item.scores.technicalScore <= 5 || item.scores.depthScore <= 5);

  if (interviewType === 'hr') {
    return {
      overallScore,
      level: overallScore >= 85 ? 'Excellent HR Readiness' : overallScore >= 72 ? 'Strong HR Readiness' : overallScore >= 58 ? 'Developing HR Readiness' : 'Needs More Practice',
      categories: [
        { label: 'Communication', score: communication || depth },
        { label: 'Motivation', score: relevance },
        { label: 'Ownership', score: problemSolving },
        { label: 'Learning Attitude', score: depth },
        { label: 'Teamwork', score: Math.round((relevance + problemSolving) / 2) },
        { label: 'Project Reflection', score: Math.round((depth + relevance) / 2) }
      ],
      strongAreas: scoredAnswers.length ? ['Project reflection', 'Willingness to share examples'] : [],
      weakAreas: struggled.length ? ['Add more specific situations, actions, results, and learning points.'] : ['Keep connecting your examples to the role and your career goals.'],
      struggledQuestions: struggled.map(item => ({ question: item.question, reason: 'Answer needed a clearer example, motivation, action, or learning outcome.' })),
      recommendedTopics: ['Project motivation', 'Strengths and weaknesses', 'Teamwork examples', 'Handling pressure', 'Career goals']
    };
  }

  return {
    overallScore,
    level: overallScore >= 85 ? 'Advanced' : overallScore >= 72 ? 'Strong Intermediate' : overallScore >= 58 ? 'Intermediate' : 'Beginner',
    categories: [
      { label: 'Technical Knowledge', score: technical },
      { label: 'Project Knowledge', score: relevance },
      { label: 'Problem Solving', score: problemSolving },
      { label: 'Answer Depth', score: depth },
      { label: 'Resume Credibility', score: Math.round((relevance + depth) / 2) },
      { label: 'JD Match', score: relevance },
      ...(mode === 'speaking' ? [{ label: 'Communication', score: communication }] : [])
    ],
    strongAreas: scoredAnswers.length ? ['Resume project explanation', 'Willingness to attempt implementation details'] : [],
    weakAreas: struggled.length ? ['Add more exact architecture, trade-offs, edge cases, and debugging steps.'] : ['Keep strengthening low-level implementation details.'],
    struggledQuestions: struggled.map(item => ({ question: item.question, reason: 'Answer needed more technical depth or concrete implementation detail.' })),
    recommendedTopics: ['Project architecture', 'API debugging', 'Database optimization', 'Security validation', 'Time and space complexity']
  };
};

const getDashboardStorageKey = (email) => `resuintel_dashboard_${(email || 'guest').toLowerCase()}`;

const loadDashboardData = (email) => {
  try {
    const savedData = JSON.parse(localStorage.getItem(getDashboardStorageKey(email)) || '{}');
    return savedData && typeof savedData === 'object' ? savedData : {};
  } catch {
    return {};
  }
};

const saveDashboardData = (email, data) => {
  localStorage.setItem(getDashboardStorageKey(email), JSON.stringify(data));
};

function DedicatedWorkspacePanel({ config, state, onStateChange, onRun, onCompleteInterview }) {
  const inputId = `${config.eyebrow.toLowerCase().replace(/\W+/g, '-')}-resume`;
  const canRun = state.file && (!config.requiresJobDescription || state.jobDescription.trim());
  const isInterviewPanel = config.interviewType;
  const currentQuestion = state.questions[state.currentQuestionIndex];
  const SpeechRecognition = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const canUseSpeech = Boolean(SpeechRecognition);

  const updateState = (updates) => {
    onStateChange({ ...state, ...updates });
  };

  const clearSessionState = {
    result: '',
    score: null,
    details: [],
    questions: [],
    currentQuestionIndex: 0,
    currentAnswer: '',
    answers: [],
    lastFeedback: null,
    finalReport: null,
    isListening: false,
    isRunning: false
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      updateState({ file: null, error: 'Please upload a PDF resume for this section.', ...clearSessionState });
      return;
    }

    updateState({ file, error: '', ...clearSessionState });
  };

  const handleRemoveFile = () => {
    updateState({ file: null, error: '', ...clearSessionState });
  };

  const handleModeChange = (interviewMode) => {
    updateState({ interviewMode, currentAnswer: '', isListening: false, lastFeedback: null });
  };

  const handleVoiceAnswer = () => {
    if (!canUseSpeech || state.isListening) return;

    const recognition = new SpeechRecognition();
    const baseAnswer = state.currentAnswer.trim();
    let finalTranscript = '';
    let latestAnswer = baseAnswer;
    recognition.lang = 'en-IN';
    recognition.interimResults = true;
    recognition.continuous = false;
    recognition.onstart = () => updateState({ isListening: true });
    recognition.onresult = (event) => {
      let interimTranscript = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) {
          finalTranscript = `${finalTranscript} ${transcript}`.trim();
        } else {
          interimTranscript = `${interimTranscript} ${transcript}`.trim();
        }
      }

      const transcript = [finalTranscript, interimTranscript].filter(Boolean).join(' ');
      latestAnswer = [baseAnswer, transcript].filter(Boolean).join(' ').trim();
      updateState({
        currentAnswer: latestAnswer,
        isListening: true
      });
    };
    recognition.onerror = () => updateState({
      currentAnswer: latestAnswer,
      isListening: false,
      error: 'Microphone transcription failed. You can continue in written mode.'
    });
    recognition.onend = () => updateState({
      currentAnswer: latestAnswer,
      isListening: false
    });
    recognition.start();
  };

  const handleSubmitInterviewAnswer = () => {
    if (!currentQuestion || !state.currentAnswer.trim()) return;

    const questionText = typeof currentQuestion === 'string' ? currentQuestion : currentQuestion.question;
    const currentTopic = typeof currentQuestion === 'string' ? 'Interview' : currentQuestion.topic;
    const isHrInterview = config.interviewType === 'hr';
    const scores = scoreInterviewAnswer(state.currentAnswer, state.interviewMode, config.interviewType);
    const feedback = isHrInterview
      ? buildHrFeedback(questionText, state.currentAnswer, state.interviewMode)
      : buildInterviewerFeedback(questionText, state.currentAnswer, state.interviewMode, scores);
    const nextAnswers = [
      ...state.answers,
      {
        question: questionText,
        answerText: state.currentAnswer.trim(),
        topic: currentTopic,
        mode: state.interviewMode,
        scores,
        feedback
      }
    ];
    const nextPlanned = state.questions[state.currentQuestionIndex + 1];
    const adaptiveNextQuestion = isHrInterview
      ? buildHrAdaptiveNextQuestion({
          answer: state.currentAnswer,
          currentTopic,
          nextPlanned,
          answeredTopics: nextAnswers.map(item => item.topic).filter(Boolean),
          answerCount: nextAnswers.length
        })
      : buildAdaptiveNextQuestion({
          question: questionText,
          answer: state.currentAnswer,
          scores,
          currentTopic,
          nextPlanned
        });
    const nextQuestions = state.currentQuestionIndex >= state.questions.length - 1
      ? [...state.questions, adaptiveNextQuestion]
      : [
          ...state.questions.slice(0, state.currentQuestionIndex + 1),
          adaptiveNextQuestion,
          ...state.questions.slice(state.currentQuestionIndex + 2)
        ];

    if (nextAnswers.length >= 8) {
      const finalReport = buildFinalInterviewReport(nextAnswers, state.interviewMode, config.interviewType);
      updateState({
        answers: nextAnswers,
        questions: nextQuestions,
        currentAnswer: '',
        finalReport,
        lastFeedback: feedback,
        score: finalReport.overallScore,
        result: `Interview complete. Final level: ${finalReport.level}.`
      });
      if (onCompleteInterview) {
        onCompleteInterview({
          id: Date.now(),
          role: config.title,
          date: new Date().toISOString().split('T')[0],
          score: finalReport.overallScore,
          mode: state.interviewMode,
          finalReport,
          answersList: nextAnswers
        });
      }
      return;
    }

    updateState({
      answers: nextAnswers,
      questions: nextQuestions,
      currentQuestionIndex: state.currentQuestionIndex + 1,
      currentAnswer: '',
      lastFeedback: feedback,
      finalReport: null
    });
  };

  return (
    <section className="workspace-panel animate-fade-in">
      <div className="workspace-panel-header">
        <span className="workspace-eyebrow">{config.eyebrow}</span>
        <h3 className="workspace-title">{config.title}</h3>
      </div>

      <div className="workspace-upload-block">
        <div>
          <h4 className="workspace-section-title">{config.uploadLabel}</h4>
          <p className="workspace-section-text">{config.uploadHelp}</p>
        </div>

        <label className="workspace-upload-zone" htmlFor={inputId}>
          <input
            id={inputId}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            hidden
          />
          <span className="workspace-upload-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
          </span>
          <span className="workspace-upload-title">
            {state.file ? state.file.name : 'Choose or drop resume PDF'}
          </span>
          <span className="workspace-upload-meta">
            {state.file ? 'Click to change PDF' : 'PDF only'}
          </span>
        </label>

        {state.file && (
          <button type="button" className="btn-danger-outline workspace-remove-btn" onClick={handleRemoveFile}>
            Remove PDF
          </button>
        )}

        {state.error && <div className="workspace-error">{state.error}</div>}
      </div>

      {config.jobDescriptionLabel && (
        <div className="workspace-field-block">
          <label className="form-label">{config.jobDescriptionLabel}</label>
          <textarea
            className="form-input workspace-textarea"
            value={state.jobDescription}
            onChange={(event) => updateState({ jobDescription: event.target.value, ...clearSessionState })}
            placeholder={config.jobDescriptionPlaceholder}
            rows="5"
          />
        </div>
      )}

      {isInterviewPanel && (
        <div className="interview-mode-card">
          <label className="form-label">Interview Answer Mode</label>
          <div className="interview-mode-toggle" role="group" aria-label="Interview answer mode">
            <button
              type="button"
              className={state.interviewMode === 'written' ? 'active' : ''}
              onClick={() => handleModeChange('written')}
            >
              Written
            </button>
            <button
              type="button"
              className={state.interviewMode === 'speaking' ? 'active' : ''}
              onClick={() => handleModeChange('speaking')}
            >
              Speaking
            </button>
          </div>
        </div>
      )}

      <button className="btn-primary workspace-action-btn" onClick={onRun} disabled={!canRun || state.isRunning}>
        {state.isRunning ? (config.runningLabel || 'Analyzing...') : config.actionLabel}
      </button>

      {state.result && (
        <div className="workspace-result-card">
          <h4>{config.resultTitle}</h4>
          <p>{state.result}</p>
          {state.score !== null && (
            <div className="workspace-score-row">
              <span className="workspace-score-value">{state.score}%</span>
              <span className="workspace-score-label">{config.scoreLabel || 'Score'}</span>
            </div>
          )}
          {state.details.length > 0 && (
            <div className="workspace-detail-grid">
              {state.details.map((detail) => (
                <div className="workspace-detail-card" key={detail.title}>
                  <span className={`workspace-detail-status ${detail.status}`}>
                    {detail.statusLabel}
                  </span>
                  <h5>{detail.title}</h5>
                  <p>{detail.message}</p>
                </div>
              ))}
            </div>
          )}
          {isInterviewPanel && currentQuestion && !state.finalReport && (
            <div className="interview-session-card">
              {state.lastFeedback && (
                <div className="interviewer-feedback-card">
                  <div className="feedback-block">
                    <span className="feedback-label">Previous Question</span>
                    <p>{state.lastFeedback.question}</p>
                  </div>
                  <div className="feedback-block">
                    <span className="feedback-label">Your Answer</span>
                    <p>{state.lastFeedback.answer}</p>
                  </div>
                  <div className="feedback-grid">
                    <div className="feedback-block">
                      <span className="feedback-label good">Good</span>
                      <p>{state.lastFeedback.good}</p>
                    </div>
                    <div className="feedback-block">
                      <span className="feedback-label improve">Needs Improvement</span>
                      <p>{state.lastFeedback.needsImprovement}</p>
                    </div>
                  </div>
                  <div className="feedback-block">
                    <span className="feedback-label">What You Should Improve</span>
                    <ul className="feedback-list">
                      {state.lastFeedback.improvements.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  {state.lastFeedback.communication && (
                    <div className="feedback-block">
                      <span className="feedback-label">Communication Feedback</span>
                      <p>{state.lastFeedback.communication}</p>
                    </div>
                  )}
                  {state.lastFeedback.sampleAnswer && (
                    <>
                      <button
                        type="button"
                        className="btn-secondary sample-answer-toggle"
                        onClick={() => updateState({ showSampleAnswer: !state.showSampleAnswer })}
                      >
                        {state.showSampleAnswer ? 'Hide Sample Answer' : 'Show Sample Answer'}
                      </button>
                      {state.showSampleAnswer && (
                        <div className="sample-answer-card">
                          <span className="feedback-label good">Sample Answer</span>
                          <p>{state.lastFeedback.sampleAnswer}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
              <div className="interview-progress-row">
                <span className="badge badge-primary">
                  Question {state.currentQuestionIndex + 1}
                </span>
                <span className="badge badge-warning">
                  {typeof currentQuestion === 'string' ? 'Interview' : currentQuestion.topic}
                </span>
              </div>
              {state.lastFeedback && <span className="interview-next-label">Next Interview Question</span>}
              <h5 className="interview-question">
                {typeof currentQuestion === 'string' ? currentQuestion : currentQuestion.question}
              </h5>
              <textarea
                className="form-input interview-answer-box"
                value={state.currentAnswer}
                onChange={(event) => updateState({ currentAnswer: event.target.value })}
                placeholder={state.interviewMode === 'speaking' ? 'Use microphone or edit the transcribed answer here...' : 'Type your answer here...'}
                rows="6"
              />
              <div className="interview-action-row">
                {state.interviewMode === 'speaking' && (
                  <button type="button" className="btn-secondary" onClick={handleVoiceAnswer} disabled={!canUseSpeech || state.isListening}>
                    {state.isListening ? 'Listening...' : 'Speak Answer'}
                  </button>
                )}
                <button type="button" className="btn-primary" onClick={handleSubmitInterviewAnswer} disabled={!state.currentAnswer.trim()}>
                  {state.currentQuestionIndex >= state.questions.length - 1 ? 'Finish Interview' : 'Save & Next'}
                </button>
              </div>
              {state.interviewMode === 'speaking' && !canUseSpeech && (
                <p className="interview-note">Speech recognition is not available in this browser. Written mode will still work.</p>
              )}
            </div>
          )}
          {isInterviewPanel && state.finalReport && (
            <div className="interview-report-card">
              <div className="workspace-score-row">
                <span className="workspace-score-value">{state.finalReport.overallScore}%</span>
                <span className="workspace-score-label">{state.finalReport.level}</span>
              </div>
              <div className="interview-category-grid">
                {state.finalReport.categories.map(category => (
                  <div className="interview-category-item" key={category.label}>
                    <span>{category.label}</span>
                    <strong>{category.score}%</strong>
                  </div>
                ))}
              </div>
              <div className="interview-report-section">
                <h5>Recommended Topics</h5>
                <p>{state.finalReport.recommendedTopics.join(', ')}</p>
              </div>
            </div>
          )}
          {!isInterviewPanel && state.questions.length > 0 && (
            <ol className="workspace-question-list">
              {state.questions.map((question) => (
                <li key={question}>{question}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </section>
  );
}

export default function DashboardLayout({ user, onLogout }) {
  const savedDashboardData = loadDashboardData(user.email);
  const [activeTab, setActiveTab] = useState('overview'); // 11 tabs possible
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [isAnalyzed, setIsAnalyzed] = useState(Boolean(savedDashboardData.isAnalyzed));

  // Dashboard Data States
  const [scans, setScans] = useState(savedDashboardData.scans || []);
  const [interviews, setInterviews] = useState(savedDashboardData.interviews || []);
  const [skillChecklist, setSkillChecklist] = useState(savedDashboardData.skillChecklist || []);
  const [currentUser, setCurrentUser] = useState(savedDashboardData.currentUser || user);
  const [workspaceStates, setWorkspaceStates] = useState({
    ats_checker: { ...INITIAL_WORKSPACE_STATE },
    job_match: { ...INITIAL_WORKSPACE_STATE },
    tech_interview: { ...INITIAL_WORKSPACE_STATE },
    hr_interview: { ...INITIAL_WORKSPACE_STATE }
  });

  const selectedFile =
    workspaceStates.ats_checker.file ||
    workspaceStates.job_match.file ||
    workspaceStates.tech_interview.file ||
    workspaceStates.hr_interview.file;

  useEffect(() => {
    saveDashboardData(user.email, {
      scans,
      interviews,
      skillChecklist,
      currentUser,
      isAnalyzed
    });
  }, [user.email, scans, interviews, skillChecklist, currentUser, isAnalyzed]);

  const updateWorkspaceState = (tab, nextState) => {
    setWorkspaceStates(prev => ({
      ...prev,
      [tab]: nextState
    }));
  };

  const handleWorkspaceRun = async (tab) => {
    const state = workspaceStates[tab];
    if (!state.file) {
      updateWorkspaceState(tab, {
        ...state,
        error: 'Please upload a resume PDF first.',
        result: '',
        score: null,
        details: [],
        questions: [],
        isRunning: false
      });
      return;
    }

    if (tab === 'ats_checker') {
      updateWorkspaceState(tab, { ...state, error: '', result: '', score: null, details: [], questions: [], isRunning: true });

      const formData = new FormData();
      formData.append('file', state.file);

      try {
        const response = await fetch(`${API_URL}/analyze/ats`, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'ATS analysis failed.');
        }

        setIsAnalyzed(true);
        setScans(prev => [{
          id: Date.now(),
          filename: state.file.name,
          role: WORKSPACE_CONFIG[tab].title,
          date: new Date().toISOString().split('T')[0],
          score: data.score
        }, ...prev]);
        updateWorkspaceState(tab, {
          ...state,
          error: '',
          result: data.summary,
          score: data.score,
          details: data.details || [],
          questions: [],
          isRunning: false
        });
      } catch (error) {
        updateWorkspaceState(tab, {
          ...state,
          error: `${error.message} Start the backend API on port 8000 to analyze the actual PDF.`,
          result: '',
          score: null,
          details: [],
          questions: [],
          isRunning: false
        });
      }
      return;
    }

    if (tab === 'job_match') {
      updateWorkspaceState(tab, { ...state, error: '', result: '', score: null, details: [], questions: [], isRunning: true });

      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('job_description', state.jobDescription);

      try {
        const response = await fetch(`${API_URL}/analyze/job-match`, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Job match analysis failed.');
        }

        const missingSkills = (data.missingSkills || []).map((item, index) => ({
          id: Date.now() + index,
          ...item
        }));

        setIsAnalyzed(true);
        setScans(prev => [{
          id: Date.now(),
          filename: state.file.name,
          role: WORKSPACE_CONFIG[tab].title,
          date: new Date().toISOString().split('T')[0],
          score: data.score
        }, ...prev]);
        setSkillChecklist(missingSkills);
        updateWorkspaceState(tab, {
          ...state,
          error: '',
          result: data.summary,
          score: data.score,
          details: data.details || [],
          questions: [],
          isRunning: false
        });
      } catch (error) {
        updateWorkspaceState(tab, {
          ...state,
          error: `${error.message} Start the backend API on port 8000 to compare the actual resume and JD.`,
          result: '',
          score: null,
          details: [],
          questions: [],
          isRunning: false
        });
      }
      return;
    }

    if (tab === 'tech_interview') {
      updateWorkspaceState(tab, { ...state, error: '', result: '', score: null, details: [], questions: [], answers: [], lastFeedback: null, finalReport: null, currentQuestionIndex: 0, currentAnswer: '', isRunning: true });

      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('job_description', state.jobDescription);

      try {
        const response = await fetch(`${API_URL}/interview/tech/start`, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'Technical interview setup failed.');
        }

        setIsAnalyzed(true);
        updateWorkspaceState(tab, {
          ...state,
          error: '',
          result: data.summary,
          score: null,
          details: [
            {
              title: 'Interview Prompt',
              status: 'pass',
              statusLabel: 'Active',
              message: TECH_INTERVIEW_PROMPT
            },
            {
              title: 'Resume Signals',
              status: 'pass',
              statusLabel: 'Detected',
              message: data.candidateSignals?.technologies?.length ? data.candidateSignals.technologies.join(', ') : 'Resume text extracted for project-based questioning.'
            }
          ],
          questions: data.questions || [],
          currentQuestionIndex: 0,
          currentAnswer: '',
          answers: [],
          lastFeedback: null,
          finalReport: null,
          isRunning: false
        });
      } catch (error) {
        updateWorkspaceState(tab, {
          ...state,
          error: `${error.message} Start the backend API on port 8000 to prepare resume-based interview questions.`,
          result: '',
          score: null,
          details: [],
          questions: [],
          answers: [],
          lastFeedback: null,
          finalReport: null,
          isRunning: false
        });
      }
      return;
    }

    if (tab === 'hr_interview') {
      updateWorkspaceState(tab, { ...state, error: '', result: '', score: null, details: [], questions: [], answers: [], lastFeedback: null, finalReport: null, currentQuestionIndex: 0, currentAnswer: '', isRunning: true });

      const formData = new FormData();
      formData.append('file', state.file);
      formData.append('job_description', state.jobDescription);

      try {
        const response = await fetch(`${API_URL}/interview/hr/start`, {
          method: 'POST',
          body: formData
        });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.detail || 'HR interview setup failed.');
        }

        setIsAnalyzed(true);
        updateWorkspaceState(tab, {
          ...state,
          error: '',
          result: data.summary,
          score: null,
          details: [
            {
              title: 'Interview Prompt',
              status: 'pass',
              statusLabel: 'Active',
              message: HR_INTERVIEW_PROMPT
            },
            {
              title: 'Resume Signals',
              status: 'pass',
              statusLabel: 'Detected',
              message: data.candidateSignals?.projects?.length ? data.candidateSignals.projects.join(', ') : 'Resume text extracted for behavioral and project-based questioning.'
            }
          ],
          questions: data.questions || HR_QUESTIONS.map(question => ({ topic: 'HR', difficulty: 'Behavioral', question })),
          currentQuestionIndex: 0,
          currentAnswer: '',
          answers: [],
          lastFeedback: null,
          finalReport: null,
          isRunning: false
        });
      } catch (error) {
        setIsAnalyzed(true);
        updateWorkspaceState(tab, {
          ...state,
          error: '',
          result: `${error.message} Using built-in HR interview questions instead.`,
          score: null,
          details: [
            {
              title: 'Interview Prompt',
              status: 'pass',
              statusLabel: 'Active',
              message: HR_INTERVIEW_PROMPT
            }
          ],
          questions: HR_QUESTIONS.map(question => ({ topic: 'HR', difficulty: 'Behavioral', question })),
          currentQuestionIndex: 0,
          currentAnswer: '',
          answers: [],
          lastFeedback: null,
          finalReport: null,
          isRunning: false
        });
      }
    }
  };

  const handleToggleSkill = (id) => {
    setSkillChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleDeleteSkill = (id) => {
    setSkillChecklist(prev => prev.filter(item => item.id !== id));
  };

  const handleDeleteScan = (scanId) => {
    setScans(prev => prev.filter(scan => scan.id !== scanId));
  };

  const handleCompleteInterview = (sessionResult) => {
    setInterviews(prev => [sessionResult, ...prev]);
    setScans(prev => [{
      id: Date.now(),
      filename: workspaceStates[activeTab]?.file?.name || 'Interview session',
      role: sessionResult.role,
      date: sessionResult.date,
      score: sessionResult.score
    }, ...prev]);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="db-grid animate-fade-in">
            <RecentScans recentScans={scans} onDeleteScan={handleDeleteScan} />
            {skillChecklist.length > 0 && (
              <SkillChecklist
                skillChecklist={skillChecklist}
                onToggleSkill={handleToggleSkill}
                onDeleteSkill={handleDeleteSkill}
              />
            )}
          </div>
        );
      case 'ats_checker':
      case 'job_match':
      case 'tech_interview':
      case 'hr_interview':
        return (
          <DedicatedWorkspacePanel
            config={WORKSPACE_CONFIG[activeTab]}
            state={workspaceStates[activeTab]}
            onStateChange={(nextState) => updateWorkspaceState(activeTab, nextState)}
            onRun={() => handleWorkspaceRun(activeTab)}
            onCompleteInterview={handleCompleteInterview}
          />
        );
      case 'settings':
        return <ProfileSettings user={currentUser} onUpdateUser={setCurrentUser} />;
      default:
        return <div className="text-left">Section loading...</div>;
    }
  };

  return (
    <div className="db-layout">
      <Sidebar
        isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen}
        activeTab={activeTab} setActiveTab={setActiveTab}
        user={currentUser} onLogout={onLogout}
      />
      <div className="db-main-panel">
        <Header activeTab={activeTab} isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <main className="db-content">
          <Greeting user={currentUser} selectedFile={selectedFile} isAnalyzed={isAnalyzed} />
          {activeTab === 'overview' && (
            <Metrics scans={scans} interviews={interviews} skillChecklist={skillChecklist} />
          )}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
