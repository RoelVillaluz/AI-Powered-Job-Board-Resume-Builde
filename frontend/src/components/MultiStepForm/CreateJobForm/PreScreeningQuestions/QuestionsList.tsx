import { useJobForm } from "../../../../contexts/JobPostingFormContext"
import { TagList } from "../../../FormComponents/TagList"

export const QuestionsList = () => {
    const { formData, setFormData } = useJobForm();

    const questions = formData.preScreeningQuestions ?? [];

    const removeQuestion = (index: number) => {
        setFormData((prev) => ({
            ...prev,
            preScreeningQuestions: prev.preScreeningQuestions.filter((_, i) => i !== index)
        }));
    };

    return (
        <TagList
            items={questions}
            itemName="Pre-screening Questions"
            getLabel={(q) => 
                `${q.question} - ${q.required}`
            }
            onRemove={removeQuestion}
            emptyText="No questions added yet."
        />
    )
}