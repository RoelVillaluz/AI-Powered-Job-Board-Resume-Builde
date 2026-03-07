# **AI‑Powered Job Board Website with Resume Maker**
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?logo=pytorch&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)
![Supertest](https://img.shields.io/badge/Supertest-000000?style=flat&logoColor=white)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)

A full‑stack job board platform designed to streamline the entire job application lifecycle — from discovery and matching to resume creation and interviews. The platform combines modern web technologies with AI‑driven features to help job seekers make smarter, faster career decisions.

At its core, the system enables users to search and apply for jobs, automatically generate professional resumes, and communicate directly with employers — all within a single, cohesive application.

---

## ✨ Key Highlights

* End‑to‑end job application platform (search → match → apply → interview)
* AI‑powered insights for matching, scoring, salary estimation, and skill growth

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

### 5. Integrated Video Chat (Upcoming)

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

## 🛠️ Setup and Configuration
Follow these steps to get the project up and running on your local machine.


### 1. Clone the Repository

First, clone the repository to your local machine:

```bash
git clone https://github.com/your-username/job-board.git
cd job-board
```

### 2. Install Backend and Frontend Dependencies

2.1. Install Backend Dependencies (Node.js + Express):
Navigate to the backend directory and install the required npm packages:
```bash
cd backend
npm install
```
Note: If you need to freeze the backend dependencies (for production or sharing purposes), you can use npm install --save for specific dependencies.

2.2. Install Frontend Dependencies (React.js):
Navigate to the frontend directory and install the required npm packages:
```bash
cd frontend
npm install
```
Note: Similarly, freeze frontend dependencies using npm install --save.

### 3. Create Environment Configuration File
Create a .env file in the root directory to store your environment variables.

3.1. Example .env Configuration:
```bash
# MongoDB URI
MONGO_URI=mongodb://localhost:27017/job_board

# Email credentials (for email notifications)
EMAIL_USER=fakeemail@email.com
EMAIL_PASS=fakepassword123

# JWT secret for authentication
JWT_SECRET=your_jwt_secret_key

# Node environment (e.g., development, production)
NODE_ENV=development
LOG_LEVEL=debug

# Client URL (frontend URL)
CLIENT_URL=http://localhost:5173

# Server port
PORT=5000

# Redis configuration (optional, for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```
Note: Replace the placeholder values in .env with your actual credentials and create your own mongoDb database (e.g., MongoDB URI, JWT Secret, etc.). Ensure that the JWT_SECRET is strong and unique.

3.2. Create .env from .env.example
```
cp .env.example .env
```

### 4. Running the Project
Once the setup is complete, you can run the project locally.

4.1. Start Redis (Optional for caching)
You need to run Redis to use the caching functionality. Start Redis using WSL and the redis-cli:
Open WSL terminal.
Run redis-server to start Redis.
Use redis-cli to connect to Redis and ensure it's working by running:
```
redis-cli
ping (should return PONG if connected)
```
4.2. Start the Backend Server
Navigate to the backend directory and start the server:
```
cd backend
npm run server
```
This will start the backend server, typically on http://localhost:5000.

4.3. Start the Frontend Server
Navigate to the frontend directory and start the React development server:
```
cd frontend
npm run dev
```
This will start the frontend server, typically on http://localhost:5173.

4.4. Run Both Backend and Frontend Simultaneously (Development Mode)
You can run both the backend and frontend servers simultaneously using the following command:
```
npm run dev
```
This will use concurrently to run both the server and client scripts in parallel.

### 5. Running Tests
The project includes unit and integration tests. You can run the tests with the following commands:

5.1. Run Tests Once
To run the tests once, use:
```
npm test
```

5.2. Run Tests in Watch Mode
To run the tests in watch mode (automatically re-run tests on file changes), use:
```
npm run test:watch
```

