import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

function WorkExperience({ formData, setFormData, handleDrag, handleRemove }) {
    const [jobTitle, setJobTitle] = useState('');
    const [company, setCompany] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [responsibilities, setResponsibilities] = useState('');

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();

            if (!jobTitle.trim() || !company.trim() || !startDate || !endDate || !responsibilities.trim()) {
                return;
            }

            const newExperience = { jobTitle, company, startDate, endDate, responsibilities };

            handleAddWorkExperience(newExperience); // Call the function passed from the parent

            // Reset input fields
            setJobTitle('');
            setCompany('');
            setStartDate('');
            setEndDate('');
            setResponsibilities('');
        }
    };

    const handleAddWorkExperience = (newExperience) => {
        setFormData(prev => ({
            ...prev,
            workExperience: [...(prev.workExperience || []), newExperience] // Append new entry
        }));
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
            <ul className="work-exp-list">
            <DragDropContext onDragEnd={(result) => handleDrag("workExperience", result, setFormData)}>
                <Droppable droppableId="work-exp-list">
                    {(provided) => (
                        <ul className="added-work-exp" 
                            {...provided.droppableProps}
                            ref={provided.innerRef}
                        >   
                            {(formData.workExperience ?? []).length > 0 && (formData.workExperience ?? []).some(exp => exp.jobTitle.trim()) ? (
                                formData.workExperience.map((exp, index) => (
                                    <Draggable key={exp.jobTitle} draggableId={exp.jobTitle} index={index}>
                                        {(provided) => (
                                            <li 
                                                ref={provided.innerRef}
                                                {...provided.draggableProps}
                                                {...provided.dragHandleProps}
                                                className="draggable-work-experience"
                                            >
                                                <span>{exp.jobTitle} at {exp.company}</span>
                                                <i className="fa-solid fa-xmark" onClick={() => handleRemove("workExperience", index)}></i>
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
            </ul>
        </section>
    );
}

export default WorkExperience;
