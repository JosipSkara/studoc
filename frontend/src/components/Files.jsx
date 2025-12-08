import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";

const Files = () => {
    const { moduleId } = useParams();

    // States
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState("");
    const [fileList, setFileList] = useState([]);
    const [loadingFiles, setLoadingFiles] = useState(false);


    // 🔹 Datei aus Input speichern
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file && file.size > 20 * 1024 * 1024) {
            setMessage("❌ Die Datei ist zu groß (max. 20 MB erlaubt).");
            setSelectedFile(null);
            return;
        }
        setSelectedFile(file);
        setMessage("");
    };

    // 🚀 Hauptfunktion: Datei hochladen (Mit neuem fetchFiles-Aufruf)
    const handleFileUpload = async () => {
        if (!selectedFile) {
            setMessage("Bitte wähle zuerst eine Datei aus!");
            return;
        }

        setUploading(true);
        setMessage("📡 Lade hoch...");

        try {
            const session = await fetchAuthSession();
            const token = session.tokens.idToken.toString();

            const formData = new FormData();
            formData.append('file', selectedFile);

            const uploadUrl = `${import.meta.env.VITE_API_BASE}/modules/${moduleId}/files`;

            const res = await fetch(uploadUrl, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                body: formData,
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.details || err.error || `HTTP Fehler ${res.status}`);
            }

            setMessage(`✅ Datei erfolgreich hochgeladen: ${selectedFile.name}`);
            setSelectedFile(null);
            document.getElementById('file-input').value = null;

            // Nach erfolgreichem Upload Liste neu laden
            await fetchFiles();

        } catch (error) {
            console.error("❌ Upload-Fehler:", error);
            setMessage(`❌ Fehler beim Upload: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    // 💾 Funktion: Dateiliste vom Backend abrufen
    const fetchFiles = async () => {
        setLoadingFiles(true);
        try {
            const session = await fetchAuthSession();
            const token = session.tokens.idToken.toString();

            // Senden des GET-Requests an das neue Lambda
            const url = `${import.meta.env.VITE_API_BASE}/modules/${moduleId}/files`;

            const res = await fetch(url, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const data = await res.json();

            // Wenn der Request nicht OK ist, werfen wir den Fehler
            if (!res.ok) {
                // Wenn 'data' ein Objekt mit einer Fehlermeldung ist, verwenden wir diese
                throw new Error(data.message || `HTTP Fehler ${res.status}`);
            }

            // SICHERHEITSPRÜFUNG: Behebt den 'fileList.map is not a function' Fehler.
            if (Array.isArray(data)) {
                setFileList(data);
            } else {
                console.error("❌ Backend hat kein Array zurückgegeben. Erhaltene Daten:", data);
                setFileList([]);
            }

        } catch (error) {
            console.error("❌ Fehler beim Abrufen der Dateiliste:", error);
        } finally {
            setLoadingFiles(false);
        }
    };

    // Effekt: Lädt die Dateiliste beim ersten Laden der Komponente
    useEffect(() => {
        if (moduleId) {
            fetchFiles();
        }
    }, [moduleId]);


    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white p-8">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-bold mb-2">📂 Dateien für Modul: {moduleId}</h1>
                <p className="text-gray-400 mb-8">Lade neue Studienunterlagen hoch.</p>

                {/* Upload-Bereich */}
                <div className="bg-gray-900/60 p-5 rounded-xl border border-gray-800 mb-8">
                    <h2 className="text-lg font-semibold mb-3">Datei hochladen</h2>
                    <div className="flex gap-2 flex-wrap items-center">
                        <input
                            type="file"
                            id="file-input"
                            onChange={handleFileChange}
                            disabled={uploading}
                            className="flex-1 text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-500/20 file:text-blue-300 hover:file:bg-blue-500/30"
                        />
                        <button
                            onClick={handleFileUpload}
                            disabled={uploading || !selectedFile}
                            className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                                uploading
                                    ? "bg-gray-500 text-gray-300"
                                    : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                        >
                            {uploading ? "Wird hochgeladen..." : "Upload starten"}
                        </button>
                    </div>
                    {message && <p className={`mt-3 text-sm ${message.startsWith("❌") ? "text-red-400" : "text-green-400"}`}>{message}</p>}
                </div>

                {/* 📋 Dateiliste anzeigen */}
                <h2 className="text-2xl font-bold mb-4">Aktuelle Dateien</h2>

                {loadingFiles ? (
                    <p className="text-gray-400">Lade Dateien...</p>
                ) : fileList.length === 0 ? (
                    <p className="text-gray-400">Keine Dateien in diesem Modul gefunden.</p>
                ) : (
                    <div className="space-y-3">
                        {fileList.map((file) => (
                            <div
                                key={file.fileId}
                                className="flex justify-between items-center bg-gray-900/40 p-3 rounded-lg border border-gray-800"
                            >
                                <div className="flex items-center space-x-3">
                                    <span className="text-xl text-yellow-400">📄</span>
                                    <div>
                                        <p className="font-semibold">{file.fileName}</p>
                                        <p className="text-sm text-gray-400">
                                            {/* KORREKTUR: Verwende file.size statt file.fileSize */}
                                            {(file.size / 1024 / 1024).toFixed(2)} MB
                                            {/* KORREKTUR: Verwende file.createdDate statt file.uploadDate */}
                                            — Hochgeladen: {new Date(file.createdDate).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Späterer Download-Button */}
                                <button
                                    onClick={() => alert(`Download für ${file.fileName} ist noch nicht implementiert.`)}
                                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                                >
                                    Download ⬇️
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Files;