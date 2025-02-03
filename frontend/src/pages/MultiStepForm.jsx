import { useEffect } from "react"
import Layout from "../components/Layout"

function MultiStepForm() {
    useEffect(() => {
        document.title = "Let's get started"
    })

    return (
        <>
            <div className="form-container">
                <div className="steps">
                    
                </div>
            </div>
        </>
    )
}

export default MultiStepForm