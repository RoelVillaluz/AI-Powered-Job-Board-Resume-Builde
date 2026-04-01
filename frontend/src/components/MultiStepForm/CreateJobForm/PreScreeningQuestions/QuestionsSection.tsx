import { QuestionsFormGroup } from "./QuestionsFormGroup"

export const QuestionsSection = () => {
    return (
        <section>
            <header className="w-full border-b border-gray-200 pb-6 mb-6">
                <h3 className="text-xl md:text-2xl font-semibold">Pre Screening Questions</h3>
                <p>Enter questions that candidates must answer before applying.</p>
            </header>
    
            <QuestionsFormGroup/>
        
        </section>
    )
}