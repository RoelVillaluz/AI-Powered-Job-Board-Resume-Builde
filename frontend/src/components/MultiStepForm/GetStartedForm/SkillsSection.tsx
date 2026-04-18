import { useState } from "react";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
import type { DropResult } from "react-beautiful-dnd";
import type { SelectOption } from "../../../hooks/createJobForm/useCreateJobFormData";
import { SearchableSelect } from "../../FormComponents/SearchableSelect";
import { DropdownField } from "../../FormComponents/DropdownField";
import { useDebounce } from "../../../hooks/useDebounce";
import { useSkillSearchQuery } from "../../../hooks/market/skills/useSkillQueries";
import { useGetStartedForm } from "../../../contexts/GetStartedFormContext";

const SKILL_LEVEL_OPTIONS = [
  { value: "Beginner",     label: "Beginner"     },
  { value: "Intermediate", label: "Intermediate" },
  { value: "Advanced",     label: "Advanced"     },
] as const;

function SkillsSection() {
  const { selectedRole, formData, handleChange, handleRemoveListItem } = useGetStartedForm();

  const [skillSearch, setSkillSearch] = useState("");
  const [skillToAdd, setSkillToAdd] = useState<{
    _id: string;
    name: string;
    level: string;
  }>({ _id: "", name: "", level: "Beginner" });

  const debouncedSkill = useDebounce(skillSearch, 300);
  const { data: skillOptions = [], isLoading } = useSkillSearchQuery(debouncedSkill, []);

  const isJobseeker = formData?.role === "jobseeker";
  const skills = isJobseeker ? (formData!.data as any).skills ?? [] : [];

  const handleSelectSkill = (opt: SelectOption) => {
    setSkillToAdd((prev) => ({ ...prev, _id: opt._id ?? "", name: opt.name }));
    setSkillSearch(opt.name);
  };

  const handleAddSkill = () => {
    if (!skillToAdd.name.trim() || !isJobseeker) return;
    const currentSkills = (formData!.data as any).skills ?? [];
    handleChange({
      target: {
        name: "skills",
        value: [
          ...currentSkills,
          { skill: skillToAdd._id || undefined, name: skillToAdd.name, level: skillToAdd.level },
        ],
      },
    });
    setSkillToAdd({ _id: "", name: "", level: "Beginner" });
    setSkillSearch("");
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !isJobseeker) return;
    const reordered = [...((formData!.data as any).skills ?? [])];
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    handleChange({ target: { name: "skills", value: reordered } });
  };

  return (
    <section className="user-skills">
      <header>
        <h3>
          {selectedRole === "jobseeker"
            ? "Showcase Your Skills!"
            : "What Skills Are You Looking For?"}
        </h3>
        <p>
          {selectedRole === "jobseeker"
            ? "Highlight your key skills to stand out to potential employers."
            : "Specify the skills required for the roles you're hiring for."}
        </p>
      </header>

      <div className="form-details">
        <div className="form-group">
          <label>Skills (Minimum of 3)</label>
          <div className="wrapper" style={{ alignItems: "stretch", gap: "0.5rem" }}>
            <SearchableSelect
              name="skillSearch"
              value={skillSearch}
              onChange={setSkillSearch}
              onSelect={handleSelectSkill}
              onClear={() => {
                setSkillSearch("");
                setSkillToAdd({ _id: "", name: "", level: "Beginner" });
              }}
              options={skillOptions.map((s) => ({ _id: s._id.toString(), name: s.name }))}
              isLoading={isLoading}
              placeholder="Search skills..."
            />
            <DropdownField
              label="Level"
              name="skillLevel"
              value={skillToAdd.level as any}
              options={SKILL_LEVEL_OPTIONS}
              onChange={(e) => setSkillToAdd((prev) => ({ ...prev, level: e.target.value }))}
            />
            <button
              type="button"
              className="add-item-btn"
              onClick={handleAddSkill}
              disabled={!skillToAdd.name.trim()}
              aria-label="Add skill"
            >
              <i className="fa fa-plus" aria-hidden="true" />
            </button>
          </div>
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="skills-list">
            {(provided) => (
              <ul className="added" {...provided.droppableProps} ref={provided.innerRef}>
                {skills.length > 0 ? (
                  skills.map((skill: { name: string; level?: string }, index: number) => (
                    <Draggable
                      key={`${skill.name}-${index}`}
                      draggableId={`${skill.name}-${index}`}
                      index={index}
                    >
                      {(provided) => (
                        <li
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className="draggable-skill"
                        >
                          <span>
                            {skill.name}
                            {skill.level && skill.level !== "Level" ? ` — ${skill.level}` : ""}
                          </span>
                          <i
                            className="fa-solid fa-xmark"
                            onClick={() => handleRemoveListItem("skills", index)}
                            role="button"
                            aria-label={`Remove ${skill.name}`}
                          />
                        </li>
                      )}
                    </Draggable>
                  ))
                ) : (
                  <p>No skills added yet.</p>
                )}
                {provided.placeholder}
              </ul>
            )}
          </Droppable>
        </DragDropContext>
      </div>
    </section>
  );
}

export default SkillsSection;