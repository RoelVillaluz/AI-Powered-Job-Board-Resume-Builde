# **AI‑Powered Job Board Website with Resume Maker**

![CI/CD](https://github.com/RoelVillaluz/AI-Powered-Job-Board-Resume-Builde/actions/workflows/ci-cd.yml/badge.svg)
![Coverage](https://img.shields.io/badge/coverage-85%25-brightgreen)
![Status](https://img.shields.io/badge/Status-In%20Development-yellow)



![Node.js](https://img.shields.io/badge/Node.js-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?logo=express&logoColor=white)
![React](https://img.shields.io/badge/React-61DAFB?logo=react&logoColor=black)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?logo=python&logoColor=white)
![PyTorch](https://img.shields.io/badge/PyTorch-EE4C2C?logo=pytorch&logoColor=white)
![Jest](https://img.shields.io/badge/Jest-C21325?logo=jest&logoColor=white)
![Supertest](https://img.shields.io/badge/Supertest-000000?style=flat&logoColor=white)

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

# 🛠️ System Architecture & Performance Engineering Case Study

This platform implements a highly optimized, decoupled, event-driven, multi-cloud architecture designed to minimize client-to-AI latency, isolate computing bottlenecks, and eliminate cloud infrastructure waste under heavy production scaling.

---

## 📡 End-to-End Ingestion & Processing Pipeline

The system separates high-volume, I/O-bound web traffic from resource-intensive machine learning inference loops across localized cloud spaces to guarantee system availability.



### The Data Lifecycle Journey

1. **Stage 1: Inbound Client Payload:** The client submits raw text profiles or documents (e.g., resumes, job descriptions).
2. **Stage 2: Asynchronous API Gateway (Render Tier):** A Node.js/Express gateway ingests the payload, sanitizes it, instantly fires an HTTP `202 Accepted` response back to the client to release the socket connection, and routes the work payload downstream.
3. **Stage 3: Distributed Ingestion Buffer (BullMQ / Redis):** Acting as the architecture's shock absorber, this stateful layer ingest-throttles the system. It enqueues heavy tasks sequentially, protecting downstream microservices from concurrent traffic spikes.
4. **Stage 4: Persistent Inference & Write-Time Caching Engine (AWS EC2 Tier):** A Python FastAPI service maintains an in-memory model state. It processes queued extraction requests via pre-loaded model memory arrays and writes the final vector calculations straight to database indexes.
5. **Stage 5: Vector Index Lookup Space (Pinecone Serverless):** Operates as a purely mathematical matrix space, performing lightning-fast sub-100ms vector distance scans across high-dimensional coordinates.

---

## 🏎️ Performance Refactoring & Technical Comparison

Through rigorous end-to-end **k6 synthetic stress testing**, major infrastructure blocks were isolated and re-engineered. This shifted the system from stateful disk-allocation loops to stateless persistent serving and write-time caching, dropping latency from **20+ seconds down to a sub-100ms response envelope**.

| Stage / Component | The Legacy Bottleneck | The Optimized Architecture | Engineering Impact |
| :--- | :--- | :--- | :--- |
| **Stage 2: API Gateway** *(Render)* | Node.js held client connections open for 20s+ waiting on child scripts, exhausting event loop buffers under concurrent traffic. | Immediate handoff to asynchronous background queues; instant `202 Accepted` client response. | **Eliminated connection timeouts.** Lowered runtime memory overhead, keeping the Node layer on a cheap baseline tier. |
| **Stage 3: Message Queue** *(Redis)* | Non-existent queueing. Synchronous multi-field requests slammed the compute layer simultaneously, causing CPU starvation. | Integrated **BullMQ + Redis** to ingest, serialize, and buffer incoming high-volume write spikes. | **Isolated downstream compute.** Converted volatile, erratic traffic spikes into a smooth, predictable processing line. |
| **Stage 4: Inference Engine** *(AWS EC2)* | Spawned a new Python child process *per request*, forcing a 420MB `all-mpnet` disk read and PyTorch initialization loop. | Implemented **Persistent Model Serving**. The embedding model is loaded into RAM exactly once at application startup. | **Halted CPU & Memory Thrashing.** Swapped heavy, expensive instances for cheap, auto-scaled **AWS EC2 Spot Instances**. |
| **Stage 4: Data Lifecycle** *(Pinecone)* | Dynamic generation of vector embeddings for static fields (*Skills, Job Titles, Locations*) on the fly during lookup. | Shifted embedding generations entirely to **document write-time**, persisting pre-computed vectors directly in the DB. | **Zero Runtime Inference.** Reduced runtime lookup overhead down to a pure, mathematical $O(\log N)$ distance scan. |

---

## 💰 End-to-End Cost Optimization Model (USD)

The financial translation of this refactoring tracks the infrastructure sizing required to handle scaling traffic milestones without suffering Out-Of-Memory (OOM) failures. By replacing stateful disk-allocation loops with stateless persistent in-memory serving and write-time caching, **projected peak operational overhead drops by 90%**.



| Monthly User Scale | Render Cost (Old vs. New) | AWS EC2 Cost (Old vs. New) | **Total Multi-Cloud Savings** |
| :--- | :--- | :--- | :--- |
| **100 Users** | $7 / mo $\rightarrow$ $7 / mo <br>*(Both stay on starter tiers)* | $45 / mo $\rightarrow$ $8 / mo <br>*(Dropped from high-compute to micro)* | **$37 / month** <br>*(82% savings)* |
| **1,000 Users** | $32 / mo $\rightarrow$ $7 / mo <br>*(Avoided connection timeouts)* | $110 / mo $\rightarrow$ $12 / mo <br>*(Eliminated CPU serialization loops)* | **$123 / month** <br>*(86% savings)* |
| **10,000 Users** | $180 / mo $\rightarrow$ $15 / mo <br>*(Massive connection pooling drop)* | $420 / mo $\rightarrow$ $45 / mo <br>*(Using EC2 Spot instances safely)* | **$540 / month** <br>*(90% savings)* |

### Cost Improvement Financial Breakdown for Interviews

* **The Render Breakdown:** In the legacy design, holding HTTP connections open for 20+ seconds per request caused active request buffers to scale linearly with traffic. To prevent Render from dropping connections or triggering a `502 Bad Gateway`, a migration to premium **Team or Enterprise containers ($25–$180/mo)** would be required. In the optimized model, Node.js performs lightweight, asynchronous I/O and terminates connections immediately, permanently locking Render fees to the basic entry-level tier (**$7–$15/mo**).
* **The AWS Breakdown:** Spawning a process that reloads a 420MB model while generating embeddings for multiple fields on the fly requires ~1.5GB of RAM instantly for just 3 concurrent users. This thrashing cycle forces the use of a heavy **t3.medium** or **t3.large** instance alongside aggressive horizontal auto-scaling rules **($45–$420/mo)** to survive traffic spikes. By keeping the model resident in memory and offloading static field math to write-time, RAM utilization lines remain completely flat. This allows the system to run safely on low-cost, auto-scaled **AWS EC2 Spot Instances ($8–$45/mo)**, yielding a **90% reduction in production cloud spend**.

---

## 📊 Observability & System Telemetry

To ensure robust system health monitoring and verify system boundaries without manual oversight, the microservice layer is instrumented with an automated telemetry stack.



* **Prometheus Instrumentation:** Embedded within the FastAPI application framework to expose an automated `/metrics` scraper gateway. It instruments system hooks tracking active memory distribution, cumulative network transaction rates, and execution latency percentiles ($p50, p95, p99$).
* **Grafana Visualization Infrastructure:** Aggregates Prometheus telemetric streams into custom-constructed dashboards. This allows the system to trace runtime execution health, pinpoint computational degradations down to the millisecond, and proactively isolate infrastructure resource leaks before system crashes occur.