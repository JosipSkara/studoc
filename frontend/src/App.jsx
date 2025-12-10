import { Routes, Route } from "react-router-dom";
import Header from "./components/Header.jsx";
import Login from "./pages/Login.jsx";
import Callback from "./pages/Callback.jsx";
import Home from "./pages/Home.jsx";
import Documents from "./pages/Documents.jsx";
import Groups from "./pages/Groups.jsx";
import Profile from "./pages/Profile.jsx";
import Files from "./components/Files.jsx";
import ModuleUserManagement from "./pages/ModuleUserManagement.jsx"; // 🆕 Import
// Import der neuen Seite:
import AccessControl from "./components/AccessControl.jsx"; // 🆕 Importieren Sie die neue Seite

export default function App() {
    return (
        <>
            <Header />
            <Routes>
                {/* Öffentliche Routen */}
                <Route path="/" element={<Login />} />
                <Route path="/callback" element={<Callback />} />

                {/* Geschützte Routen */}
                <Route path="/home" element={<Home />} />
                <Route path="/documents" element={<Documents />} />
                <Route path="/groups" element={<Groups />} />
                <Route path="/profile" element={<Profile />} />

                {/* 🟢 ROUTE FÜR DATEI-ANSICHT */}
                <Route path="/files/:moduleId" element={<Files />} />

                {/* 👥 NEUE HAUPT-ROUTE FÜR ZUGRIFFSKONTROLLE */}
                <Route path="/access" element={<AccessControl />} /> // 🆕 NEUER TAB

                {/* Fallback */}
                <Route path="*" element={<Home />} />
            </Routes>
        </>
    );
}