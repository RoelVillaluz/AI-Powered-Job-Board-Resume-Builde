import { QuestionsFormGroup } from "./QuestionsFormGroup"

export const QuestionsSection = () => {
    return (
        <section>
            <header>
                <h3>Pre Screening Questions</h3>
                <p>Enter questions that candidates must answer before applying.</p>
            </header>
    
            <QuestionsFormGroup/>
        
        </section>
    )
}