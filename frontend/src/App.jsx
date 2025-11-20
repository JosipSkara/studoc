import { useEffect, useState } from "react";

function App() {
    const [message, setMessage] = useState("Lade Backend...");

    useEffect(() => {
        fetch("/api/hello")
            .then((res) => res.json())
            .then((data) => setMessage(data.message))
            .catch((err) => {
                console.error(err);
                setMessage("Backend nicht erreichbar");
            });
    }, []);

    return (
        <div>
            <h1>StuDoc</h1>
            <p>{message}</p>
        </div>
    );
}

export default App;
