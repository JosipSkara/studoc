export default function Home() {
    return (
        <div className="flex flex-col items-center justify-center text-center min-h-[80vh] animate-fadeIn">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-cyan-300 text-transparent bg-clip-text">
                Willkommen bei StuDoc 📚
            </h1>
            <p className="mt-4 text-gray-400 text-lg">
                Dein Ort für Dokumente, Gruppen und Wissen.
            </p>
        </div>
    );
}
