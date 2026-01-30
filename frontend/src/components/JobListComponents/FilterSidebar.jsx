import { useMemo, useState, useEffect } from "react";
import { useDebounce } from "../../hooks/useDebounce";
import { useJobStore } from "../../stores/jobStore";
import { useResumeStore } from "../../stores/resumeStore";
import { useToggleSections } from "../../hooks/jobs/useToggleSections";
import DatePostedFilter from "./FilterSidebarComponents/DatePostedFilter";
import { FILTER_CHOICES } from "../../../../backend/constants";
import { useFilterHandlers } from "../../hooks/jobs/useFilterHandlers";
import MatchScoreFilter from "./FilterSidebarComponents/MatchScoreFilter";
import HasQuestionsFilter from "./FilterSidebarComponents/HasQuestionsFilter";
import CollapsibleCheckboxFilter from "./FilterSidebarComponents/CollapsibleCheckboxFilter";
import SalaryFilter from "./FilterSidebarComponents/SalaryFilter";

const FilterSidebar = () => {
  const currentResume = useResumeStore(state => state.currentResume);
  const allResumeSkills = useMemo(
    () => currentResume?.skills?.map(skill => skill.name) || [],
    [currentResume?.skills]
  );

  const { activeFilters, resetFilters } = useJobStore();
  const { hiddenSections, toggleVisibility } = useToggleSections();
  const {
    handleSalaryChange,
    handleArrayFilterChange,
    handleApplicationStatusChange,
    handleSimpleFilterChange,
    handleNumericFilterChange,
    handleBooleanToggle,
  } = useFilterHandlers();

  const filterSections = useMemo(() => [
    { title: 'Job Type', filterType: 'jobType', choices: FILTER_CHOICES.JOB_TYPE },
    { title: 'Experience Level', filterType: 'experienceLevel', choices: FILTER_CHOICES.EXPERIENCE_LEVEL },
    { title: 'Skills', filterType: 'skills', choices: allResumeSkills },
    { title: 'Industry', filterType: 'industry', choices: FILTER_CHOICES.INDUSTRY },
    { title: 'Application Status', filterType: 'applicationStatus', choices: FILTER_CHOICES.APPLICATION_STATUS }
  ], [allResumeSkills]);

  return (
    <aside className="filter-sidebar">
      <header>
        <h3>Filters</h3>
        <button type="reset" onClick={resetFilters}>Clear All</button>
      </header>

      <ul className="filter-category-list">
        <li>
          <DatePostedFilter 
            value={activeFilters.datePosted}
            onChange={(value) => handleSimpleFilterChange('datePosted', value)}
          />
        </li>

        <li>
          <SalaryFilter
            min={activeFilters.salary.amount.min}
            max={activeFilters.salary.amount.max}
            onChange={handleSalaryChange}
          />
        </li>

        <li>
          <MatchScoreFilter
            value={activeFilters.minMatchScore}
            onChange={(value) => handleNumericFilterChange('minMatchScore', value)}
          />
        </li>

        <li>
          <HasQuestionsFilter
            checked={activeFilters.hasQuestions}
            onChange={() => handleBooleanToggle('hasQuestions')}
          />
        </li>

        <li>
          {filterSections.map((section) => (
            <CollapsibleCheckboxFilter
              key={section.title}
              title={section.title}
              choices={section.choices}
              selectedValues={
                section.filterType === 'applicationStatus'
                  ? activeFilters.applicationStatus
                  : activeFilters[section.filterType]
              }
              onChange={
                section.filterType === 'applicationStatus'
                  ? handleApplicationStatusChange
                  : (value) => handleArrayFilterChange(section.filterType, value)
              }
              isHidden={hiddenSections[section.title]}
              onToggle={() => toggleVisibility(section.title)}
            />
          ))}
        </li>
      </ul>
    </aside>
  );
};

export default FilterSidebar;
