import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import type { DropResult } from "react-beautiful-dnd";
import type { GetStartedFormData, UserRole, JobseekerFormData } from "../../../../types/forms/getStartedForm.types";

interface SkillsSectionProps {
    selectedRole: UserRole;
    formData: GetStartedFormData;
    setFormData: React.Dispatch<React.SetStateAction<GetStartedFormData | null>>;
    handleChange: (e: { target: { name: string; value: any } }) => void;
    handleDrag: <K extends keyof JobseekerFormData>(
        name: K,
        result: DropResult
    ) => void;
    handleRemove: <K extends keyof JobseekerFormData>(name: K, index: number) => void;
}

function SkillsSection({
    selectedRole,
    setFormData,
    formData,
    handleChange,
    handleRemove,
}: SkillsSectionProps) {
    const [skillInput, setSkillInput] = useState("");
    const [levelInput, setLevelInput] = useState("Beginner");

    const skillLevels = ["Level", "Beginner", "Intermediate", "Advanced"];

    // Type guard
    const isJobseeker = formData.role === "jobseeker";
    const skills = isJobseeker ? formData.data.skills || [] : [];

    const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && skillInput.trim() && isJobseeker) {
            e.preventDefault();

            const currentSkills = formData.data.skills || [];

            handleChange({
                target: {
                    name: "skills",
                    value: [...currentSkills, { name: skillInput.trim(), level: levelInput }],
                },
            });

            setSkillInput("");
            setLevelInput("Beginner");
        }
    };

    const handleDragEnd = (result: DropResult) => {
        if (!result.destination || !isJobseeker) return;

        const reorderedSkills = [...(formData.data.skills || [])];
        const [movedSkill] = reorderedSkills.splice(result.source.index, 1);
        reorderedSkills.splice(result.destination.index, 0, movedSkill);

        handleChange({
            target: { name: "skills", value: reorderedSkills },
        });
    };

    return (
        <section className="user-skills">
            <header>
                <h3>
                    {selectedRole === "jobseeker"
                        ? "Showcase Your Skills!"
                        : "What Skills Are You Looking For?"}
                </h3>
                <p>
                    {selectedRole === "jobseeker"
                        ? "Highlight your key skills to stand out to potential employers."
                        : "Specify the skills required for the roles you're hiring for."}
                </p>
            </header>
            <div className="form-details">
                <div className="form-group">
                    <label htmlFor="skills">Skills (Minimum of 3)</label>
                    <div className="wrapper" style={{ alignItems: "stretch" }}>
                        <input
                            type="text"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyDown={handleAddSkill}
                            placeholder="Type skill and press Enter"
                        />
                        <select
                            className="skill-select"
                            value={levelInput}
                            onChange={(e) => setLevelInput(e.target.value)}
                        >
                            {skillLevels.map((level) => (
                                <option key={level} value={level === "Level" ? "" : level}>
                                    {level}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="skills-list">
                        {(provided) => (
                            <ul
                                className="added"
                                {...provided.droppableProps}
                                ref={provided.innerRef}
                            >
                                {skills.length > 0 ? (
                                    skills.map((skill, index) => (
                                        <Draggable
                                            key={`${skill.name}-${index}`}
                                            draggableId={`${skill.name}-${index}`}
                                            index={index}
                                        >
                                            {(provided) => (
                                                <li
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    {...provided.dragHandleProps}
                                                    className="draggable-skill"
                                                >
                                                    <span>
                                                        {skill.name}
                                                        {skill.level && skill.level !== "Level"
                                                            ? ` - ${skill.level}`
                                                            : ""}
                                                    </span>
                                                    <i
                                                        className="fa-solid fa-xmark"
                                                        onClick={() => handleRemove("skills", index)}
                                                    ></i>
                                                </li>
                                            )}
                                        </Draggable>
                                    ))
                                ) : (
                                    <p>No skills added yet.</p>
                                )}
                                {provided.placeholder}
                            </ul>
                        )}
                    </Droppable>
                </DragDropContext>
            </div>
        </section>
    );
}

export default SkillsSection;