import { useJobForm } from "../../../../contexts/JobFormContexts/JobPostingFormContext"
import { TagList } from "../../../FormComponents/TagList";

export const CertificationList = () => {
    const { formData, setFormData } = useJobForm();

    const certifications = formData.requirements.certifications ?? [];

    const removeCertification = (index: number) => {
    setFormData((prev) => ({
        ...prev,
            requirements: {
            ...prev.requirements,
            certifications: (prev.requirements.certifications ?? []).filter(
                (_, i) => i !== index
            ),
            },
        }));
    };

    return (
        <TagList
            items={certifications}
            itemName="Certifications"
            getLabel={(c) => c}
            onRemove={removeCertification}
            emptyText="No certifications added yet"
        />
    )
}