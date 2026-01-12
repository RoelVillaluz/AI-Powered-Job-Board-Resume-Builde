const HasQuestionsFilter = ({ checked, onChange }) => {
    return (
        <>
            <h4>Has Questions</h4>
            <ul className="checkbox-list">
                <li>
                    <input
                        type="checkbox"
                        checked={checked}
                        id="checkbox-has-questions"
                        onChange={() => onChange("hasQuestions")}
                    />
                    <label htmlFor="checkbox-has-questions">Has Questions</label>
                </li>
            </ul>
        </>
    )
}

export default HasQuestionsFilter