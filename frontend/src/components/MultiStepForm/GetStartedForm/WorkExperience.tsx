import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import type { DropResult } from "react-beautiful-dnd";
import { useGetStartedForm } from "../../../contexts/GetStartedFormContext";

function WorkExperience() {
  const { formData, setFormData, handleDragEnd, handleRemoveListItem } = useGetStartedForm();

  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  // Change local state from string to string[]
  const [responsibilities, setResponsibilities] = useState<string[]>([]);
  const [responsibilityInput, setResponsibilityInput] = useState(""); // raw text input

  const isJobseeker = formData?.role === "jobseeker";
  const workExperience = isJobseeker ? formData!.data.workExperience || [] : [];

  const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key !== "Enter") return;
        e.preventDefault();
        if (!jobTitle.trim() || !company.trim() || !startDate || !endDate || !responsibilityInput.trim()) return;

        handleAddWorkExperience({
            jobTitle,
            company,
            startDate,
            endDate,
            responsibilities: responsibilityInput.split("\n").map((r) => r.trim()).filter(Boolean),
        });

        setJobTitle("");
        setCompany("");
        setStartDate("");
        setEndDate("");
        setResponsibilityInput("");
    };

    const handleAddWorkExperience = (newExperience: {
    jobTitle: string;
    company: string;
    startDate: string;
    endDate: string;
    responsibilities: string[]; // ← now matches WorkExperience type
    }) => {
    if (!isJobseeker) return;
        setFormData((prev) => {
            if (!prev || prev.role !== "jobseeker") return prev;
            return {
            ...prev,
            data: {
                ...prev.data,
                workExperience: [...(prev.data.workExperience || []), newExperience],
            },
            };
        });
    };

  const handleDragEndLocal = (result: DropResult) => {
    if (!isJobseeker) return;
    handleDragEnd("workExperience", result);
  };

  return (
    <section className="work-experience">
      <header>
        <h3>Highlight Your Experience</h3>
        <p>Showcase your professional journey and the skills you've developed along the way.</p>
      </header>
      <div className="form-details">
        <div className="work-exp-entry">
          <div className="form-group">
            <label>Company</label>
            <input type="text" value={company} onChange={(e) => setCompany(e.target.value)} onKeyDown={handleKeyDown} />
          </div>
          <div className="form-group">
            <label>Job Title</label>
            <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} onKeyDown={handleKeyDown} />
          </div>
          <div className="wrapper">
            <div className="form-group">
              <label>Start Date</label>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} onKeyDown={handleKeyDown} />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} onKeyDown={handleKeyDown} />
            </div>
          </div>
          <div className="form-group">
            <label>Responsibilities</label>
            <textarea
                value={responsibilityInput}
                onChange={(e) => setResponsibilityInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Enter each responsibility on a new line"
            />
          </div>
        </div>
      </div>

      <DragDropContext onDragEnd={handleDragEndLocal}>
        <Droppable droppableId="work-exp-list">
          {(provided) => (
            <ul className="added-work-exp" {...provided.droppableProps} ref={provided.innerRef}>
              {workExperience.length > 0 && workExperience.some((exp) => exp.jobTitle.trim()) ? (
                workExperience.map((exp, index) => (
                  <Draggable key={`${exp.jobTitle}-${index}`} draggableId={`${exp.jobTitle}-${index}`} index={index}>
                    {(provided) => (
                      <li
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="draggable-work-experience"
                      >
                        <span>{exp.jobTitle} at {exp.company}</span>
                        <i className="fa-solid fa-xmark" onClick={() => handleRemoveListItem("workExperience", index)} />
                      </li>
                    )}
                  </Draggable>
                ))
              ) : (
                <p>No work experience added yet.</p>
              )}
              {provided.placeholder}
            </ul>
          )}
        </Droppable>
      </DragDropContext>
    </section>
  );
}

export default WorkExperience;