import { useState } from "react";
import type { CreateJobFormData } from "../../../../../types/forms/createJobForm.types";
import { DropdownField } from "../../../FormComponents/DropdownField";
import { InputField } from "../../../FormComponents/InputField";
import { useJobForm } from "../../../../contexts/JobPostingFormContext";

export const EDUCATION_LEVEL_OPTIONS = [
  { value: '', label: 'Select education level' },
  { value: 'High School', label: 'High School' },
  { value: 'Associate', label: 'Associate' },
  { value: 'Bachelor', label: 'Bachelor' },
  { value: 'Master', label: 'Master' },
  { value: 'PhD', label: 'PhD' },
  { value: 'None Required', label: 'None Required' },
] as const satisfies {
  value: CreateJobFormData['requirements']['education'] | '';
  label: string;
}[];

export const RequirementsFormGroup = () => {
    const { formData, setFormData, handleChange } = useJobForm();
    
    const [certificationToAdd, setCertificationToAdd] = useState('');
    
    const addCertification = () => {
        if (!certificationToAdd.trim()) return;
        setFormData((prev) => ({
            ...prev,
            requirements: {
                ...prev.requirements,
                certifications: [
                    ...(prev.requirements.certifications ?? []),
                    certificationToAdd.trim()
                ],
            },
        }));
        setCertificationToAdd('');
    }

    const removeCertification = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            requirements: {
            ...prev.requirements,
            certifications: prev.requirements.certifications?.filter((_, i) => i !== index) ?? [],
            },
        }));
    };

    return (
        <div className="form-group w-full" style={{ marginTop: '1rem' }}>
            <h4>Requirements</h4>
            <textarea 
                name="requirements.description"
                value={formData.requirements.description}
                onChange={handleChange} 
                id="requirements-textarea"
                placeholder="Description"
            />
            <div className="flex items-center w-full" style={{ gap: '0.5rem' }}>

                <div className="form-group flex-1">
                    <input 
                        type="number" 
                        name="requirements.yearsOfExperience"
                        value={formData.requirements.yearsOfExperience}
                        onChange={handleChange} 
                        id="" 
                        placeholder="No. of years of experience"
                        min={0}
                    />
                </div>
                <div className="form-group flex-1">
                    <DropdownField
                        label="Education"
                        name="requirements.education"
                        value={formData.requirements.education}
                        options={EDUCATION_LEVEL_OPTIONS}
                        onChange={handleChange}
                        allowUndefined
                    />
                </div>
                
            </div>

            <div className="form-group w-full">
                <h4>Certifications</h4>
                <div className="flex items-stretch w-full" style={{ gap: "0.5rem" }}>
                    <InputField
                        name="requirements.certifications"
                        value={certificationToAdd}
                        onChange={(e) => setCertificationToAdd(e.target.value)}
                    />
                    <button
                        type="button"
                        className="add-item-btn"
                        onClick={addCertification}
                        disabled={!certificationToAdd.trim()}
                        aria-label="Add certification"
                    >
                        <i className="fa fa-plus"></i>
                    </button>
                </div>
            </div>

        </div>
    )
}