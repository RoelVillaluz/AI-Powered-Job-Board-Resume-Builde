import { useMemo, useState } from "react";
import { useSkillSearchQuery } from "../../../../hooks/market/skills/useSkillQueries";
import { useDebounce } from "../../../../hooks/useDebounce";
import { DropdownField } from "../../../FormComponents/DropdownField";
import { SearchableSelect } from "../../../FormComponents/SearchableSelect";
import type { FormSkill } from "../../../../../types/forms/createJobForm.types";
import { useJobForm } from "../../../../contexts/JobFormContexts/JobPostingFormContext";
import type { SelectOption } from "../../../../hooks/createJobForm/useCreateJobFormData";
import { SkillsList } from "./SkillsList";

export const REQUIREMENT_LEVEL_OPTIONS = [
  { value: "Required",     label: "Required"     },
  { value: "Preferred",    label: "Preferred"    },
  { value: "Nice-to-Have", label: "Nice-to-Have" },
] as const satisfies { value: NonNullable<FormSkill["requirementLevel"]>; label: string }[];

const EMPTY_SKILL: FormSkill = { _id: "", name: "", requirementLevel: undefined };

export const SkillsFormGroup = () => {
    const { formData, setFormData } = useJobForm();

    const [skillsSearch, setSkillsSearch] = useState("");
    const [skillToAdd, setSkillToAdd] = useState<FormSkill>(EMPTY_SKILL);
    
    const debouncedSkill = useDebounce(skillsSearch, 300);

    const excludeIds = formData.skills
        .map(skill => skill._id)
        .filter((id): id is string => !!id);

    const { data: skills = [], isLoading } = useSkillSearchQuery(debouncedSkill, excludeIds);

    const skillOptions = useMemo(() => {
        const selectedKeys = new Set(
            formData.skills.map(s => (s._id ? `id:${s._id}` : `name:${s.name.toLowerCase()}`))
        );

        return skills
            .filter(s => {
            const key = s._id
                ? `id:${s._id.toString()}`
                : `name:${s.name.toLowerCase()}`;

            return !selectedKeys.has(key);
            })
            .map(s => ({
            _id: s._id.toString(),
            name: s.name,
            }));
    }, [skills, formData.skills]);
    
    // ─── Handlers ──────────────────────────────────────────────────────────────

    /** Step 1: user picks a skill from the searchable dropdown. */
    const handleSelectSkill = (option: SelectOption) => {
        setSkillToAdd((prev) => ({
        ...prev,
        _id: option._id ?? "",
        name: option.name,
        }));
        setSkillsSearch(option.name); // keep input in sync with selection
        // Dropdown closes automatically inside SearchableSelect after onSelect fires
    };

    /** Step 2: user picks a requirement level. Updates skillToAdd only. */
    const handleRequirementLevelChange = (
        e: React.ChangeEvent<HTMLSelectElement>
    ) => {
        setSkillToAdd((prev) => ({
        ...prev,
        requirementLevel: e.target.value as FormSkill["requirementLevel"],
        }));
    };

    /** Step 3: commit skillToAdd into formData.skills, then reset local state. */
    const addSkill = () => {
        if (!skillToAdd.name.trim()) return; // nothing selected yet

        setFormData((prev) => ({
        ...prev,
        skills: [...prev.skills, skillToAdd],
        }));

        setSkillToAdd(EMPTY_SKILL);
        setSkillsSearch("");
    };

    /** Remove a skill from formData by index. */
    const removeSkill = (index: number) => {
        setFormData((prev) => ({
        ...prev,
        skills: prev.skills.filter((_, i) => i !== index),
        }));
    };
    return (
        <div className="form-details flex flex-col gap-4 w-full">
        
            <div className="form-group w-full">
                <h4>Skills</h4>

                <div className="flex items-stretch w-full" style={{ gap: "0.5rem" }}>
                    <SearchableSelect
                        name="skills"
                        value={skillsSearch}
                        options={skillOptions}
                        onChange={setSkillsSearch}
                        onSelect={handleSelectSkill}
                        onClear={() => {
                            setSkillToAdd(EMPTY_SKILL);
                            setSkillsSearch("");
                        }}
                        isLoading={isLoading}
                        placeholder="Search skills..."
                    />

                    <DropdownField
                        label="Requirement Level"
                        name="requirementLevel"
                        // Read from skillToAdd, not formData — this belongs to the
                        // pending skill being built, not the committed form state
                        value={skillToAdd.requirementLevel}
                        options={REQUIREMENT_LEVEL_OPTIONS}
                        onChange={handleRequirementLevelChange}
                        allowUndefined
                    />

                    <button
                        type="button"
                        className="add-item-btn"
                        onClick={addSkill}
                        disabled={!skillToAdd.name.trim()}
                        aria-label="Add skill"
                    >
                    <i className="fa fa-plus" aria-hidden="true" />
                    </button>
                </div>

                {/* Added skills list */}
                <SkillsList skills={formData.skills} onRemove={removeSkill}/>
            </div>
        </div>
    )
}