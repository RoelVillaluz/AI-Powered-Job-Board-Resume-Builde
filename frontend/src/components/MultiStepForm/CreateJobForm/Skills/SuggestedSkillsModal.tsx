import type { CreateJobFormData } from "../../../../../types/forms/createJobForm.types";
import type { TopSkill } from "./SkillsSection";
import { useJobTitleTopSkillsQuery } from "../../../../hooks/market/jobTitle/useJobTitleQueries";
import { ImportanceLevel } from "../../../../../../shared/constants/jobsAndIndustries/constants";

/**
 * SuggestedSkillsModal
 * ---------------------
 * Displays recommended skills for the selected job title, fetched from
 * the job title's `topSkills` array. Skills are grouped by importance level
 * and rendered as selectable items.
 *
 * Each skill item shows:
 * - The skill name
 * - The importance level badge (Required / Preferred / Nice-to-Have)
 * - A frequency indicator (how common this skill is for the role)
 * - A toggle button (add/remove) — handler left for caller to wire
 *
 * @prop onClose      - Called when the user dismisses the modal
 * @prop onAdd        - Called with a skill when the user clicks Add
 * @prop onAddAll     - Called with all displayed skills when user clicks Add all
 * @prop addedSkillIds - Set of skill _ids already in formData.skills, used to
 *                      show the correct toggle state per item
 */

type SuggestedSkillsModalProps = {
  jobTitle: CreateJobFormData['title'];
  onClose: () => void;
  onAdd: (skill: TopSkill) => void;
  onRemove: (skill: TopSkill) => void;
  onAddAll: (skills: TopSkill[]) => void;
  addedSkillIds: Set<string>;
};

const DEFAULT_SKILL_IMPORTANCE_LEVEL = ImportanceLevel['Required']

export const SuggestedSkillsModal = ({
  jobTitle,
  onClose,
  onAdd,
  onRemove,
  onAddAll,
  addedSkillIds,
}: SuggestedSkillsModalProps) => {
  const { data, isLoading, error } = useJobTitleTopSkillsQuery(jobTitle?._id ?? '', DEFAULT_SKILL_IMPORTANCE_LEVEL);

  const skills: TopSkill[] = data?.topSkills ?? [];
  const unadded = skills.filter(
    (s) => !(s._id && addedSkillIds.has(s._id)) // primary check by ID
  );

  return (
    <div
      className="skills-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label={`Recommended skills for ${jobTitle.name}`}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="skills-modal suggested-skills-modal !w-[40vw]">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="skills-modal__header" style={{ alignItems: "start" }}>
          <div className="flex flex-col items-start gap-1">
            <h4 className="suggested-skills-modal__title">
              Recommended skills for: {" "}
              <strong>{jobTitle.name}</strong>
            </h4>
            <p className="suggested-skills-modal__subtitle" style={{ textAlign: "left", margin: 0 }}>
              Based on common requirements for this role. Select the ones
              that apply to your posting.
            </p>
          </div>
          <button
            type="button"
            className="skills-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        {/* ── Body ───────────────────────────────────────────────────────── */}
        <div className="suggested-skills-modal__body">
          {isLoading && (
            <ul className="suggested-skills-list">
              {[...Array(6)].map((_, i) => (
                <li key={i} className="suggested-skill-item suggested-skill-item--shimmer">
                  <div className="shimmer-bar" style={{ width: `${50 + (i % 3) * 20}%` }} />
                  <div className="shimmer-bar shimmer-bar--sm" />
                </li>
              ))}
            </ul>
          )}

          {error && (
            <p className="suggested-skills-modal__error">
              Could not load suggestions. Please try again.
            </p>
          )}

          {!isLoading && !error && skills.length === 0 && (
            <p className="suggested-skills-modal__empty">
              No skill suggestions found for this job title.
            </p>
          )}

          {!isLoading && !error && skills.length > 0 && (
            <ul className="suggested-skills-list" role="list">
              {skills.map((skill) => {
                const isAdded = addedSkillIds.has(skill._id ?? '');

                return (
                  <li
                    key={skill._id}
                    className={`suggested-skill-item ${isAdded ? "suggested-skill-item--added" : ""}`}
                    role="listitem"
                  >

                    {/* Right — add / added toggle */}
                    <button
                      type="button"
                      className={`suggested-skill-item__toggle ${isAdded ? "suggested-skill-item__toggle--added" : ""}`}
                      onClick={() => isAdded ? onRemove(skill) : onAdd(skill)}
                      aria-label={isAdded ? `Remove ${skill.skillName}` : `Add ${skill.skillName}`}
                      aria-pressed={isAdded}
                    >
                      {isAdded ? (
                        <i className="fa-solid fa-check" aria-hidden="true" />
                      ) : (
                        <i className="fa-solid fa-plus" aria-hidden="true" />
                      )}
                      
                    </button>
                    <span>{skill.skillName}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Footer ─────────────────────────────────────────────────────── */}
        {!isLoading && !error && unadded.length > 0 && (
          <div className="suggested-skills-modal__footer">
            <button
              type="button"
              className="suggested-skills-modal__add-all"
              onClick={() => onAddAll(unadded)}
            >
              Add all ({unadded.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
};