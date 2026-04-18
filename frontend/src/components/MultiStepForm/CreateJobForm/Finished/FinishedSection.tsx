import { FormSummary } from "./FormSummary"

export const FinishedSection = () => {

    return (
        <section>
            <header>
                <h3 className="text-xl md:text-2xl font-semibold">Finished</h3>
                <p>You're almost done — review your job posting before submitting.</p>
            </header>

            <FormSummary/>

        </section>
    )
}