import { createContext, useContext } from "react";
import type { GetStartedFormData, JobseekerFormData, UserRole } from "../../types/forms/getStartedForm.types";
import type { DropResult } from "react-beautiful-dnd";
import type { SelectOption } from "../hooks/createJobForm/useCreateJobFormData";

type InputEvent = React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;

type GetStartedFormContextValue = {
  formData: GetStartedFormData | null;
  setFormData: React.Dispatch<React.SetStateAction<GetStartedFormData | null>>;
  handleChange: (e: InputEvent | { target: { name: string; value: any } }) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  handleRemoveListItem: <K extends keyof JobseekerFormData>(name: K, index: number) => void;
  handleDragEnd: <K extends keyof JobseekerFormData>(name: K, result: DropResult) => void;
  selectedRole: UserRole | null;
  setSelectedRole: (role: UserRole | null) => void;
  handleSelect: (field: "jobTitle" | "location", option: SelectOption) => void;
  handleClearSelection: (field: "jobTitle" | "location") => void;
};

const GetStartedFormContext = createContext<GetStartedFormContextValue | null>(null);

export const GetStartedFormProvider = GetStartedFormContext.Provider;

export function useGetStartedForm(): GetStartedFormContextValue {
  const ctx = useContext(GetStartedFormContext);
  if (!ctx) throw new Error("useGetStartedForm must be used within a GetStartedFormProvider");
  return ctx;
}