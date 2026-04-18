import type { JobPosting } from "../../../../shared/types/jobPostingTypes";
import { useEditJobForm } from "../../contexts/JobFormContexts/EditJobFormContext"
import JobCompany from "../JobDetailComponents/JobCompany";
import JobDescription from "../JobDetailComponents/JobDescription";
import JobDetailHeader from "../JobDetailComponents/JobDetailHeader";
import JobHighlights from "../JobDetailComponents/JobHighlights";
import JobSkillsSection from "../JobDetailComponents/JobSkillsSection";

// Cast all JS components to silence missing-prop TS errors
const JobDetailHeaderAny = JobDetailHeader as any;
const JobHighlightsAny = JobHighlights as any;
const JobDescriptionAny = JobDescription as any;
const JobSkillsSectionAny = JobSkillsSection as any;

export const EditJobPreview = ({ job }: { job: JobPosting | undefined }) => {
    const { formData } = useEditJobForm();

    const previewData = {
        job: { 
            ...job, 
            ...formData,
            company: job?.company,          // always keep the original populated company
            salary: { ...job?.salary, ...formData?.salary },
        },
    };

    return (
        <div id="job-details-preview" aria-label="Live preview">
            <header>
                <h2>Live Preview</h2>
            </header>
            <section id="job-details">
                <JobDetailHeaderAny previewData={previewData} previewMode />
                <JobHighlightsAny previewData={previewData} />
                <div className="wrapper">
                    <JobDescriptionAny previewData={previewData} />
                </div>
                <div className="wrapper">
                    <JobSkillsSectionAny previewData={previewData} previewMode />
                </div>
            </section>
        </div>
    );
};