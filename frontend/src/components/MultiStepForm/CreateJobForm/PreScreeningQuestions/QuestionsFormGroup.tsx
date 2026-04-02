import { useState } from "react";
import { useJobForm } from "../../../../contexts/JobFormContexts/JobPostingFormContext";
import type { FormQuestion } from "../../../../../types/forms/createJobForm.types";
import { InputField } from "../../../FormComponents/InputField";
import { DropdownField } from "../../../FormComponents/DropdownField";
import { QuestionsList } from "./QuestionsList";

const EMPTY_QUESTION: FormQuestion = { question: '', required: false };

// Use string values for dropdown since DropdownField expects string
const booleanOptions = [
  { label: "Required", value: "true" },
  { label: "Optional", value: "false" },
] as const;

const parseBoolean = (str: string) => str === "true";

export const QuestionsFormGroup = () => {
  const { formData, setFormData } = useJobForm();
  const [questionToAdd, setQuestionToAdd] = useState<FormQuestion>(EMPTY_QUESTION);

  console.log(formData)

  const addQuestion = () => {
    if (!questionToAdd.question.trim()) return;
    setFormData((prev) => ({
      ...prev,
      preScreeningQuestions: [...prev.preScreeningQuestions, questionToAdd],
    }));
    setQuestionToAdd(EMPTY_QUESTION);
  };

  return (
    <div className="form-details flex flex-col gap-4 w-full">
      <div className="form-group w-full">
        <div className="flex items-stretch w-full" style={{ gap: "0.5rem" }}>
            <InputField
                name="preScreeningQuestions.question"
                value={questionToAdd.question}
                onChange={(e) =>
                    setQuestionToAdd((prev) => ({
                    ...prev,
                    question: e.target.value,
                    }))
                }
                placeholder="Enter a question"
                />
                <DropdownField
                label="Required"
                name="preScreeningQuestions.required"
                value={String(questionToAdd.required)}
                options={booleanOptions}
                onChange={(e) =>
                    setQuestionToAdd((prev) => ({
                    ...prev,
                    required: parseBoolean(e.target.value),
                    }))
                }
            />
            <button
                type="button"
                className="add-item-btn"
                onClick={addQuestion}
                disabled={!questionToAdd.question.trim()}
                aria-label="Add question"
            >
                <i className="fa fa-plus" aria-hidden="true" />
            </button>
        </div>
        <QuestionsList/>
      </div>
    </div>
  );
};