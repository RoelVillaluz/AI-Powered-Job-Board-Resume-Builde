import { useState, useEffect } from "react";
import { INDUSTRY_CHOICES } from "@shared/constants/jobs/constants";
import { useGetStartedForm } from "../../contexts/GetStartedFormContext";

function IndustrySection() {
  const { formData, handleChange } = useGetStartedForm();

  const currentIndustries =
    formData?.role === "employer" ? (formData.data).industry ?? [] : [];

  const [selectedIndustries, setSelectedIndustries] = useState(currentIndustries);

  // Keep local state in sync if formData resets (e.g. role change)
  useEffect(() => {
    setSelectedIndustries(currentIndustries);
  }, [formData?.role]);

  const addOrRemoveIndustry = (industry) => {
    const updated = selectedIndustries.includes(industry)
      ? selectedIndustries.filter((i) => i !== industry)
      : [...selectedIndustries, industry];

    setSelectedIndustries(updated);
    handleChange({ target: { name: "industry", value: updated } });
  };

  return (
    <section className="company-industry">
      <header>
        <h3>Select Your Industry</h3>
        <p>Please choose the industry that best represents your company.</p>
      </header>
      <div className="choice-buttons" id="industry-choice-buttons">
        {Object.entries(INDUSTRY_CHOICES)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([industry, iconClass], index) => (
            <div
              key={index}
              className={`choice-button ${selectedIndustries.includes(industry) ? "selected" : ""}`}
              onClick={() => addOrRemoveIndustry(industry)}
            >
              <i className={iconClass} />
              <label>{industry}</label>
            </div>
          ))}
      </div>
    </section>
  );
}

export default IndustrySection;