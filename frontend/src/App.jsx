import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import Login from "./pages/Login.jsx";
import Callback from "./pages/Callback.jsx";
import Home from "./pages/Home.jsx";
import Documents from "./pages/Documents.jsx";
import Groups from "./pages/Groups.jsx";
import Profile from "./pages/Profile.jsx";
import Files from "./components/Files.jsx";
export default function App() {
    return (
        <>
            <Header />
            <Routes>
                {/* Öffentliche Routen */}
                <Route path="/" element={<Login />} />
                <Route path="/callback" element={<Callback />} />

                {/* Geschützte Routen (nur sichtbar, wenn eingeloggt) */}
                <Route path="/home" element={<Home />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/profile" element={<Profile />} />

                {/* 🟢 NEUE ROUTE FÜR DATEI-ANSICHT */}
                <Route path="/files/:moduleId" element={<Files />} />

                {/* Fallback: falls Route nicht existiert */}
                <Route path="*" element={<Home />} />
            </Routes>
        </>
    );
}