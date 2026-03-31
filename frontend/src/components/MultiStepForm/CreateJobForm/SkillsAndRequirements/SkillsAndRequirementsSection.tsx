import { SkillsFormGroup } from "./SkillsFormGroup";
import { RequirementsFormGroup } from "./RequirementsFormGroup";


/**
 * SkillsAndRequirementsSection
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
export const SkillsAndRequirementsSection = () => {
  

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <section>
        <header className="w-full border-b border-gray-200 pb-6 mb-6">
            <h3 className="text-xl md:text-2xl font-semibold">Skills and Requirements</h3>
        </header>

        <SkillsFormGroup/>

        <RequirementsFormGroup/>

    </section>
  );
};