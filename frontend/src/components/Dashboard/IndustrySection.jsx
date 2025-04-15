import { useState } from "react"
import { industryChoices } from "../../../../backend/constants"

function IndustrySection () {
    return (
        <section className="company-industry">
            <header>
                <h3>Select Your Industry</h3>
                <p>Please choose the industry that best represents your company.</p>
            </header>
            <div className="choice-buttons" id="industry-choice-buttons">
                {Object.entries(industryChoices).sort(([a], [b]) => a.localeCompare(b)).map(([industry, iconClass], index) => (
                    <div className="choice-button" key={index}>
                        <i className={iconClass}></i>
                        <label htmlFor="">{industry}</label>
                    </div>
                ))}
            </div>
        </section>
    )
}

export default IndustrySection