# **AI Powered Job Board Website with Resume Maker**

This project is a comprehensive job board platform that allows users to search for job listings, 
apply for positions, and create professional resumes using the built-in resume maker. 
The goal is to streamline the job application process and provide job seekers with the necessary tools to build their careers.

The platform automatically generates resumes for users once they create an account and allows them to choose a template,
making the process more convenient for those who do not have a resume yet.

In addition to the resume maker, the platform also offers video chat functionality, enabling users to directly engage with potential employers without the need to switch to another platform. 
This feature streamlines communication, providing a seamless experience from job search to interview. Whether it's for an initial conversation, a follow-up interview, 
or ongoing discussions, video chatting makes the platform a one-stop solution for all job-seeking needs.

## Features

### 1. AI Job Matching
This feature intelligently recommends job postings to users by analyzing their resumes and saved preferences (like job type, salary expectations, and experience level). It compares the user's skills to the required job skills using vector similarity and boosts the score based on preference alignment. Each job is given a similarity score from 0% to 100%, so the user can clearly see how well a job matches their skills and preferences.

### 2. AI Resume Scorer
This feature intelligently evaluates a candidate’s resume by analyzing two main dimensions: completeness (how well the resume is filled out) and relevance (how closely the work experience and other sections align with the stated skills). The goal is to produce a realistic and actionable resume score that reflects both form and substance.

### 3. AI Salary Predictor
This feature estimates an expected salary for a user based on the content of their resume and a list of similar job postings. It uses semantic similarity between the user's background and the job descriptions to make a personalized, data-driven prediction.

### 4. AI Personalized Skill Recommendations
This feature helps users identify new skills to learn by analyzing the difference between the skills listed in their resume and the required skills from the jobs they’ve saved.

Here’s how it works:

 - It extracts the user’s current skills from their uploaded resumes.

 - It gathers skill requirements from saved job postings.

 - It then uses a neural network model to determine which skills are missing but commonly required in saved jobs.

 - Finally, it returns a list of recommended skills that could improve the user's chances of landing their desired roles.

# Technologies Used
- MongoDB
- Express.js
- React.js
- Node.js
- CSS
- Python

