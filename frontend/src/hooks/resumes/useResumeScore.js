import { useEffect, useState } from "react";
import axios from "axios";
import { BASE_API_URL } from "../../config/api";
import { useResumeStore } from "../../stores/resumeStore";

const messages = {
  0: {
    rating: "No Resume yet",
    message: "You don't have a resume yet. Please add a resume now."
  },
  0.25: {
    rating: "Poor",
    message: "Your resume needs significant improvement. Consider adding more details about your experience and skills.",
  },
  0.5: {
    rating: "Average",
    message: "Your resume is decent, but there’s room for improvement. Try refining your descriptions and adding measurable achievements.",
  },
  0.75: {
    rating: "Good",
    message: "Your resume is well-structured! A few tweaks and refinements could make it even stronger.",
  },
  0.9: {
    rating: "Great",
    message: "You're almost there, but filling out minor missing details could take it to the next level.",
  },
  1: {
    rating: "Excellent",
    message: "Nearly flawless! Your resume effectively presents your qualifications",
  },
};

export const useResumeScore = () => {
  const resume = useResumeStore(state => state.currentResume);

  const [progress, setProgress] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!resume?._id) return;

    const getResumeScore = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await axios.get(
          `${BASE_API_URL}/ai/resume-score/${resume._id}`
        );
        setProgress(data.score / 100);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    getResumeScore();
  }, [resume?._id]);

  return {
    progress,
    loading,
    error,
    messages,
  };
};
