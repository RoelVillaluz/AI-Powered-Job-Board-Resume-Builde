import { useEditJobForm } from "../../contexts/JobFormContexts/EditJobFormContext";
import type { CreateJobFormData } from "../../../types/forms/createJobForm.types";
import { setDeep } from "../../utils/forms/formUtils";
import { DropdownField } from "../FormComponents/DropdownField";
import { EDUCATION_LEVEL_OPTIONS } from "../../../constants/jobFormConstants";

export const EditJobRequirementsSection = () => {
    const { formData, setFormData, handleChange } = useEditJobForm();

    const setField = (name: string, value: any) => {
        setFormData((prev) => {
            if (!prev) return prev;
            return setDeep(prev, name, value) as CreateJobFormData;
        });
    };

    const certifications = formData?.requirements?.certifications ?? [];

    const handleCertificationChange = (index: number, value: string) => {
        const updated = certifications.map((cert, i) =>
            i === index ? value : cert
        );

        setField("requirements.certifications", updated);
    };

    const handleAddCertification = () => {
        setField("requirements.certifications", [
            ...certifications,
            ""
        ]);
    };

    const handleRemoveCertification = (index: number) => {
        const updated = certifications.filter((_, i) => i !== index);
        setField("requirements.certifications", updated);
    };

    return (
        <>
            <div className="editor-form__section-label">Requirements</div>

            {/* DESCRIPTION */}
            <div className="editor-form__field">
                <label className="editor-form__label">Description</label>
                <textarea
                    className="editor-form__textarea"
                    name="requirements.description"
                    placeholder="Describe the requirements..."
                    value={formData?.requirements?.description ?? ""}
                    onChange={(e) =>
                        setField("requirements.description", e.target.value)
                    }
                    rows={4}
                />
            </div>

            {/* EDUCATION + EXPERIENCE */}
            <div className="editor-form__row">
                <div className="editor-form__field">
                    <label className="editor-form__label">Education</label>
                    <DropdownField
                        label="Education"
                        name="requirements.education"
                        value={formData.requirements.education}
                        options={EDUCATION_LEVEL_OPTIONS}
                        onChange={handleChange}
                        allowUndefined
                    />
                </div>

                <div className="editor-form__field">
                    <label className="editor-form__label">
                        Years of experience
                    </label>
                    <input
                        className="editor-form__input"
                        type="number"
                        placeholder="e.g. 3"
                        min={0}
                        value={formData?.requirements?.yearsOfExperience ?? ""}
                        onChange={(e) =>
                            setField(
                                "requirements.yearsOfExperience",
                                e.target.value
                            )
                        }
                    />
                </div>
            </div>

            {/* CERTIFICATIONS */}
            <div className="editor-form__field">
                <label className="editor-form__label">Certifications</label>

                <div className="editor-form__array-list">
                    {certifications.map((cert, index) => (
                        <div key={index} className="editor-form__array-row">
                            <input
                                className="editor-form__input"
                                type="text"
                                placeholder="e.g. AWS Certified Developer"
                                value={cert}
                                onChange={(e) =>
                                    handleCertificationChange(
                                        index,
                                        e.target.value
                                    )
                                }
                            />

                            <button
                                type="button"
                                className="editor-form__array-remove"
                                onClick={() =>
                                    handleRemoveCertification(index)
                                }
                                aria-label="Remove certification"
                            >
                                ✕
                            </button>
                        </div>
                    ))}

                    <button
                        type="button"
                        className="editor-form__array-add"
                        onClick={handleAddCertification}
                    >
                        + Add certification
                    </button>
                </div>
            </div>
        </>
    );
};