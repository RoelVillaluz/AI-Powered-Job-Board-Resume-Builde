# **AI‑Powered Job Board Website with Resume Maker**

A full‑stack job board platform designed to streamline the entire job application lifecycle — from discovery and matching to resume creation and interviews. The platform combines modern web technologies with AI‑driven features to help job seekers make smarter, faster career decisions.

At its core, the system enables users to search and apply for jobs, automatically generate professional resumes, and communicate directly with employers — all within a single, cohesive application.

---

## ✨ Key Highlights

* End‑to‑end job application platform (search → match → apply → interview)
* Built‑in resume generator with customizable templates
* AI‑powered insights for matching, scoring, salary estimation, and skill growth
* Real‑time video chat to reduce friction between candidates and employers

---

## 🚀 Features

### 1. AI Job Matching

Recommends relevant job postings by analyzing a user’s resume and saved preferences (e.g., job type, salary range, experience level).

* Uses vector similarity to compare user skills against job requirements
* Applies preference‑based weighting for more personalized results
* Outputs a transparent match score (0–100%) for each job posting

---

### 2. AI Resume Scorer

Evaluates resumes across two critical dimensions:

* **Completeness** — how thoroughly each section of the resume is filled out
* **Relevance** — how well experience and content align with the listed skills

The result is a realistic, actionable score that reflects both structure and substance, helping users understand where improvements are needed.

---

### 3. AI Salary Predictor

Generates an estimated salary range based on the user’s resume and similar job postings.

* Leverages semantic similarity between resumes and job descriptions
* Produces personalized, data‑driven salary expectations
* Helps users benchmark offers and negotiate more confidently

---

### 4. AI Personalized Skill Recommendations

Identifies skill gaps and suggests high‑impact skills to learn based on saved job postings.

**How it works:**

* Extracts current skills from the user’s uploaded resume
* Aggregates required skills from saved job listings
* Uses a neural network model to detect missing but commonly required skills
* Returns targeted recommendations to improve employability

---

### 5. Integrated Video Chat

Enables direct communication between candidates and employers without leaving the platform.

* Supports initial screenings, follow‑up interviews, and ongoing discussions
* Reduces dependency on third‑party tools
* Creates a seamless transition from job application to interview

---

## 🛠️ Technologies Used

### Frontend

* React.js
* CSS

### Backend

* Node.js
* Express.js
* Python

### AI / Machine Learning

* Scikit‑learn
* K‑Means Clustering
* PyTorch (Torch)
* Sentence Transformers (`all-mpnet-base-v2`)

### Data & Utilities

* NumPy
* Pandas

### Database

* MongoDB

### Validation & Security
- Joi – Request payload validation
- JWT – Authentication and authorization
- bcrypt – Password hashing

### Testing
- Jest – Unit and integration testing
- Supertest – API endpoint testing


---

## 🎯 Project Goal

Traditional job search platforms primarily focus on listing job openings, often leaving candidates uncertain about how well they match a role, how to improve their applications, or how to move efficiently through the hiring process.

The goal of this project is to address these gaps by transforming the job search experience from a passive browsing process into an informed, guided, and end-to-end workflow.

This platform aims to:
- Clearly show how well a candidate matches a specific job through transparent, data-driven match scores
- Help users understand *why* they are (or aren’t) a good fit for a role
- Provide actionable guidance on how to tailor and improve resumes for specific job opportunities
- Reduce uncertainty around salary expectations and required skills using AI-driven insights
- Enable direct interview scheduling within the platform, eliminating the need for back-and-forth emails or external scheduling tools
- Centralize the entire job application lifecycle — from discovery and application to interview and communication — in a single web application

By combining AI-powered analysis, an integrated resume builder, interview scheduling, and real-time communication tools, the platform empowers job seekers to make informed decisions, improve their employability, and move through the hiring process more efficiently.
