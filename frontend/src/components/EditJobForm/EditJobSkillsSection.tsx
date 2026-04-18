import { REQUIREMENT_LEVEL_OPTIONS } from "../../../constants/jobFormConstants";
import type { FormSkill } from "../../../types/forms/createJobForm.types";
import { useEditJobForm } from "../../contexts/JobFormContexts/EditJobFormContext";
import { DropdownField } from "../FormComponents/DropdownField";

export const EditJobSkillsSection = () => {
    const { formData, setFormData } = useEditJobForm();

    const handleSkillChange = (
        index: number,
        field: keyof FormSkill,
        value: string
    ) => {
        setFormData(prev => {
            if (!prev) return prev;

            const updatedSkills = prev.skills.map((skill, i) =>
                i === index ? { ...skill, [field]: value } : skill
            );

            return {
                ...prev,
                skills: updatedSkills,
            };
        });
    };

    const handleAddSkill = () => {
        setFormData(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                skills: [
                    ...prev.skills,
                    { name: "", requirementLevel: undefined },
                ],
            };
        });
    };

    const handleRemoveSkill = (index: number) => {
        setFormData(prev => {
            if (!prev) return prev;

            return {
                ...prev,
                skills: prev.skills.filter((_, i) => i !== index),
            };
        });
    };

    return (
        <>
            <div className="editor-form__section-label">Skills</div>

            <div className="editor-form__array-list">
                {(formData?.skills ?? []).map((skill, index) => (
                    <div key={index} className="editor-form__array-row">
                        <div style={{ flex: '2' }}>
                            <input
                                className="editor-form__input"
                                type="text"
                                placeholder="Skill name"
                                value={skill.name}
                                onChange={(e) =>
                                    handleSkillChange(index, "name", e.target.value)
                                }
                            />
                        </div>

                        <div style={{ flex: '1' }}>
                            <DropdownField
                                label="Requirement Level"
                                name="requirementLevel"
                                // Read from skillToAdd, not formData — this belongs to the
                                // pending skill being built, not the committed form state
                                value={skill.requirementLevel}
                                options={REQUIREMENT_LEVEL_OPTIONS}
                                onChange={(e) =>
                                    handleSkillChange(
                                        index,
                                        "requirementLevel",
                                        e.target.value
                                    )
                                }
                                allowUndefined
                            />
                        </div>

                        <button
                            type="button"
                            className="editor-form__array-remove"
                            onClick={() => handleRemoveSkill(index)}
                        >
                            ✕
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    className="editor-form__array-add"
                    onClick={handleAddSkill}
                >
                    + Add skill
                </button>
            </div>
        </>
    );
};