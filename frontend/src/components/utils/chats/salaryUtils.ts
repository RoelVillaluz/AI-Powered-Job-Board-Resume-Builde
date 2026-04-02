import type { CreateJobFormData } from "../../../../types/forms/createJobForm.types"

export const formatSalary = (salary: CreateJobFormData['salary']) => {
    return `${salary.currency}${salary.min} - ${salary.currency}${salary.max} per ${salary.frequency}`
}