import { useMemo, useState } from "react";
import type { FormSkill } from "../../../../../types/forms/createJobForm.types";

const GROUP_ORDER = ["Required", "Preferred", "Nice-to-Have", "Unspecified"] as const;
const VISIBLE_LIMIT = 2;

type GroupKey = (typeof GROUP_ORDER)[number];

// Icon markers per level — communicates priority without color
const GROUP_ICONS: Record<GroupKey, string> = {
  "Required":     "★",  // filled star — must-have
  "Preferred":    "◈",  // filled diamond — strong signal
  "Nice-to-Have": "○",  // open circle — optional
  "Unspecified":  "·",  // dot — no signal set
};

type SkillsListProps = {
  skills: FormSkill[];
  onRemove: (index: number) => void;
};

/**
 * SkillsList
 * -----------
 * Renders committed skills grouped by requirement level. Each group uses a
 * distinct icon marker and grayscale shade to communicate priority without
 * relying on color:
 * - Required     → ★ near-black tag
 * - Preferred    → ◈ dark-gray tag
 * - Nice-to-Have → ○ light ghost tag
 * - Unspecified  → · borderless muted tag
 *
 * Shows up to `VISIBLE_LIMIT` per group; overflow opens a modal.
 *
 * @param skills   - Committed skills from formData
 * @param onRemove - Called with the original formData index to remove a skill
 */
export const SkillsList = ({ skills, onRemove }: SkillsListProps) => {
  const [modalGroup, setModalGroup] = useState<GroupKey | null>(null);

  const groupedSkills = useMemo(() => {
    const groups: Record<GroupKey, (FormSkill & { index: number })[]> = {
      Required: [],
      Preferred: [],
      "Nice-to-Have": [],
      Unspecified: [],
    };
    skills.forEach((skill, index) => {
      const key = (skill.requirementLevel ?? "Unspecified") as GroupKey;
      groups[key].push({ ...skill, index });
    });
    return groups;
  }, [skills]);

  if (skills.length === 0) return null;

  const closeModal = () => setModalGroup(null);

  const handleRemoveFromModal = (index: number) => {
    onRemove(index);
    if (modalGroup && groupedSkills[modalGroup].length <= 1) {
      closeModal();
    }
  };

  const modifier = (group: GroupKey) =>
    group.toLowerCase().replace("-to-", "-");

  const renderTag = (
    skill: FormSkill & { index: number },
    onRemoveFn: (i: number) => void,
    group: GroupKey
  ) => (
    <div
      key={skill._id || skill.name}
      className={`skill-tag skill-tag--${modifier(group)}`}
      role="listitem"
    >
      <span className="skill-tag__icon" aria-hidden="true">
        {GROUP_ICONS[group]}
      </span>
      <span className="skill-tag__name">{skill.name}</span>
      <button
        type="button"
        className="skill-tag__remove"
        onClick={() => onRemoveFn(skill.index)}
        aria-label={`Remove ${skill.name}`}
      >
        <i className="fa-solid fa-xmark" aria-hidden="true" />
      </button>
    </div>
  );

  return (
    <>
      <div className="skills-list" aria-label="Added skills" role="list">
        {GROUP_ORDER.map((groupName) => {
          const skillList = groupedSkills[groupName];
          if (!skillList.length) return null;

          const overflow = skillList.length - VISIBLE_LIMIT;
          const visibleSkills = skillList.slice(0, VISIBLE_LIMIT);

          return (
            <div
              key={groupName}
              className={`skills-group skills-group--${modifier(groupName)}`}
              role="group"
              aria-label={`${groupName} skills`}
            >
              <strong className="skills-group__label">
                {groupName === "Unspecified" ? "No level set" : groupName}
              </strong>

              <div className="skills-group__tags">
                {visibleSkills.map((skill) => renderTag(skill, onRemove, groupName))}

                {overflow > 0 && (
                  <button
                    type="button"
                    className="skill-tag skill-tag--overflow"
                    onClick={() => setModalGroup(groupName)}
                    aria-label={`Show all ${groupName} skills`}
                    aria-haspopup="dialog"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalGroup && (
        <div
          className="skills-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={`${modalGroup} skills`}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="skills-modal">
            <div className="skills-modal__header">
              <span className="skills-modal__group-label">
                {GROUP_ICONS[modalGroup]}{" "}
                {modalGroup === "Unspecified" ? "No level set" : modalGroup}
              </span>
              <button
                type="button"
                className="skills-modal__close"
                onClick={closeModal}
                aria-label="Close"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" />
              </button>
            </div>

            <div
                className={`skills-modal__tags skills-group skills-group--${modifier(modalGroup)}`}
                >
                {groupedSkills[modalGroup].map((skill) =>
                    renderTag(skill, handleRemoveFromModal, modalGroup)
                )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};