import { RequirementsFormGroup } from "./RequirementsFormGroup"

export const RequirementsSection = () => {
    return (
        <section>
            <header>
                <h3>Requirements</h3>
                <p>Define the qualifications, experience, and other criteria candidates must meet to be considered.</p>
            </header>

            <RequirementsFormGroup/>

        </section>
    )
}