import { SkillsFormGroup } from "./SkillsFormGroup";
import { RequirementsFormGroup } from "../Requirements/RequirementsFormGroup";
import { SuggestedSkillsModal } from "./SuggestedSkillsModal";
import { useState } from "react";
import { useJobForm } from "../../../../contexts/JobFormContexts/JobPostingFormContext";
import type { FormSkill } from "../../../../../types/forms/createJobForm.types";

export type TopSkill = {
  _id?: string | undefined;
  skillName: string;
    requirementLevel?: 'Required' | 'Preferred' | 'Nice-to-Have' | undefined;
}

const mapTopSkillToFormSkill = (skill: TopSkill): FormSkill => ({
  _id: skill._id ?? "",
  name: skill.skillName,
  requirementLevel: skill.requirementLevel ?? 'Required' // default to Required
});

/**
 * SkillsSection
 * -----------------------------
 * Step 2 of the Create Job multi-step form.
 *
 * ## Skill add flow
 * 1. User searches and selects a skill → `skillToAdd` local state is updated,
 *    the search input shows the selected name, dropdown closes.
 * 2. User picks a requirement level → `skillToAdd.requirementLevel` is updated.
 *    `formData` is not touched yet.
 * 3. User clicks Add → `skillToAdd` is pushed into `formData.skills`,
 *    local state resets to empty.
 *
 * `formData` is only written to on step 3, not on search or select.
 */
export const SkillsSection = () => {
  const { formData, setFormData } = useJobForm();
  const [isModalOpen, setIsModalOpen] = useState<boolean>(true);

  const addedSkillIds = new Set(
    formData.skills
      .map((s) => s._id)
      .filter((id): id is string => !!id)
  )

  const handleCloseModal = () => {
    setIsModalOpen((prev) => !prev)
  }

  const handleAddSkill = (skill: TopSkill) => {
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, mapTopSkillToFormSkill(skill)],
    }));
  };

  const handleRemoveSkill = (skill: TopSkill) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.filter((s) => s._id !== skill._id)
    }))
  }

  const handleAddAllSkills = (allSkills: TopSkill[]) => {
    const mappedSkills = allSkills.map(mapTopSkillToFormSkill);
    setFormData((prev) => ({
      ...prev,
      skills: [...prev.skills, ...mappedSkills],
    }));
    handleCloseModal();
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <section>
        <header className="w-full border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-xl md:text-2xl font-semibold">Skills</h3>
            <p>Add the key skills required for this role and specify the expected proficiency level for each.</p>
        </header>

        <SkillsFormGroup/>

        {isModalOpen && (
          <SuggestedSkillsModal
            jobTitle={formData.title}
            onClose={handleCloseModal}
            onAdd={handleAddSkill}
            onRemove={handleRemoveSkill}
            onAddAll={handleAddAllSkills}
            addedSkillIds={addedSkillIds}
          />
        )}

    </section>
  );
};