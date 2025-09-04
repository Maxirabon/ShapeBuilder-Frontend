import React, { useState, useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Auth from "./Auth";
import Calendar from "./Calendar";
import Profile from "./Profile";
import Summary from "./Summary";
import Admin from "./Admin";
import Navbar from "./Navbar";

function App() {
    const [token, setToken] = useState(sessionStorage.getItem("sb_token"));

    useEffect(() => {
        const handleStorageChange = () => {
            setToken(sessionStorage.getItem("sb_token"));
        };

        window.addEventListener("storage", handleStorageChange);
        return () => window.removeEventListener("storage", handleStorageChange);
    }, []);

    return (
        <Router>
            {token && <Navbar setToken={setToken} />} {}

            <Routes>
                {/* Logowanie/rejestracja */}
                <Route
                    path="/auth"
                    element={!token ? <Auth setToken={setToken} /> : <Navigate to="/" />}
                />

                {/* Strona główna (kalendarz) */}
                <Route
                    path="/"
                    element={token ? <Calendar /> : <Navigate to="/auth" />}
                />

                {/* Profil użytkownika */}
                <Route
                    path="/profile"
                    element={token ? <Profile /> : <Navigate to="/auth" />}
                />

                {/* Podsumowanie */}
                <Route
                    path="/summary"
                    element={token ? <Summary /> : <Navigate to="/auth" />}
                />

                {/* Panel admina */}
                <Route
                    path="/admin"
                    element={token ? <Admin /> : <Navigate to="/auth" />}
                />

            </Routes>
        </Router>
    );
}

export default App;