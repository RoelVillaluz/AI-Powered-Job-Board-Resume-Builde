import { EditJobDetailsSection } from "./EditJobDetailsSection";
import { EditJobRequirementsSection } from "./EditJobRequirementsSection";
import { EditJobSkillsSection } from "./EditJobSkillsSection";


export const EditorJobFormPanel = () => {

    return (
        <div className="editor-form__body">

            {/* ── Job info ── */}
            <EditJobDetailsSection/>

            {/* ── Skills ── */}
            <EditJobSkillsSection/>

            {/* ── Requirements ── */}
            <EditJobRequirementsSection/>

        </div>
    );
};