import { useGetStartedForm } from "../../../contexts/GetStartedFormContext";
import { JobseekerDetailsFormGroup } from "./UserDetails/JobseekerDetailsFormGroup";
import { CompanyFormGroup } from "./UserDetails/CompanyFormGroup";

function UserDetailsSection() {
    const { selectedRole, formData, handleChange, handleSelect, handleClearSelection } =
      useGetStartedForm();

    // Guard: this step only renders when formData exists
    if (!formData) return null;

    const isJobseeker = formData.role === "jobseeker";
    const isEmployer = formData.role === "employer";

    return (
      <section className="user-details">
        <header>
          <h3>
            {selectedRole === "jobseeker"
              ? "A little about you!"
              : "Tell us about your company!"}
          </h3>
          <p>
            {selectedRole === "jobseeker"
              ? "Fill in some basic details to help employers get to know you better."
              : "Provide key details about your organization to attract the right talent."}
          </p>
        </header>

        {isJobseeker && (
          <JobseekerDetailsFormGroup/>
        )}

        {isEmployer && (
          <CompanyFormGroup/>
        )}
          
      </section>
    );
}

export default UserDetailsSection;