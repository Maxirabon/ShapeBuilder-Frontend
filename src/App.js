import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./Auth";
import HomePage from "./HomePage";

function App() {
    const token = sessionStorage.getItem("sb_token");

    return (
        <Router>
            <Routes>
                {/* Strona logowania/rejestracji */}
                <Route
                    path="/auth"
                    element={!token ? <Auth /> : <Navigate to="/" />}
                />

                {/* Strona główna – dostępna tylko gdy zalogowany */}
                <Route
                    path="/"
                    element={token ? <HomePage /> : <Navigate to="/auth" />}
                />

                {/* Domyślne przekierowanie */}
                <Route path="*" element={<Navigate to={token ? "/" : "/auth"} />} />
            </Routes>
        </Router>
    );
}

export default App;