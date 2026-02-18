import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import type { DropResult } from "react-beautiful-dnd";
import type { GetStartedFormData, JobseekerFormData } from "../../../../types/forms/getStartedForm.types";

interface WorkExperienceProps {
    formData: GetStartedFormData;
    setFormData: React.Dispatch<React.SetStateAction<GetStartedFormData | null>>;
    handleDrag: <K extends keyof JobseekerFormData>(
        name: K,
        result: DropResult
    ) => void;
    handleRemove: <K extends keyof JobseekerFormData>(name: K, index: number) => void;
}

function WorkExperience({ formData, setFormData, handleDrag, handleRemove }: WorkExperienceProps) {
    const [jobTitle, setJobTitle] = useState("");
    const [company, setCompany] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [responsibilities, setResponsibilities] = useState("");

    // Type guard
    const isJobseeker = formData.role === "jobseeker";
    const workExperience = isJobseeker ? formData.data.workExperience || [] : [];

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();

            if (
                !jobTitle.trim() ||
                !company.trim() ||
                !startDate ||
                !endDate ||
                !responsibilities.trim()
            ) {
                return;
            }

            const newExperience = { jobTitle, company, startDate, endDate, responsibilities };

            handleAddWorkExperience(newExperience);

            // Reset input fields
            setJobTitle("");
            setCompany("");
            setStartDate("");
            setEndDate("");
            setResponsibilities("");
        }
    };

    const handleAddWorkExperience = (newExperience: {
        jobTitle: string;
        company: string;
        startDate: string;
        endDate: string;
        responsibilities: string;
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

    const handleDragEnd = (result: DropResult) => {
        if (!isJobseeker) return;
        handleDrag("workExperience", result);
    };

    return (
        <section className="work-experience">
            <header>
                <h3>Highlight Your Experience</h3>
                <p>
                    Showcase your professional journey and the skills you've developed along the
                    way.
                </p>
            </header>
            <div className="form-details">
                <div className="work-exp-entry">
                    <div className="form-group">
                        <label htmlFor="company">Company</label>
                        <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="jobTitle">Job Title</label>
                        <input
                            type="text"
                            value={jobTitle}
                            onChange={(e) => setJobTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <div className="wrapper">
                        <div className="form-group">
                            <label htmlFor="startDate">Start Date</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="endDate">End Date</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                onKeyDown={handleKeyDown}
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label htmlFor="responsibilities">Responsibilities</label>
                        <textarea
                            value={responsibilities}
                            onChange={(e) => setResponsibilities(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                </div>
            </div>
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="work-exp-list">
                    {(provided) => (
                        <ul
                            className="added-work-exp"
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >
                            {workExperience.length > 0 &&
                            workExperience.some((exp) => exp.jobTitle.trim()) ? (
                                workExperience.map((exp, index) => (
                                    <Draggable
                                        key={`${exp.jobTitle}-${index}`}
                                        draggableId={`${exp.jobTitle}-${index}`}
                                        index={index}
                                    >
                                        {(provided) => (
                                            <li
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="draggable-work-experience"
                                            >
                                                <span>
                                                    {exp.jobTitle} at {exp.company}
                                                </span>
                                                <i
                                                    className="fa-solid fa-xmark"
                                                    onClick={() => handleRemove("workExperience", index)}
                                                ></i>
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