import { useEffect } from "react"
import Layout from "../components/Layout"

function Dashboard () {

    useEffect(() => {
        document.title = 'Dashboard'
    }, [])

    return (
        <>
            <Layout>
                
            </Layout>
        </>
    )
}

export default Dashboard