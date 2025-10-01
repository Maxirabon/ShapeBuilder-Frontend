import React from "react";
import { useNavigate } from "react-router-dom";
import Logo from "./assets/logo.png";
import "./Navbar.css";

export default function Navbar({ setToken }) {
    const navigate = useNavigate();

    const user = JSON.parse(sessionStorage.getItem("sb_user") || "{}");
    const isAdmin = user?.role === "ROLE_ADMIN";

    const handleLogout = () => {
        sessionStorage.removeItem("sb_token");
        sessionStorage.removeItem("sb_user");
        setToken(null);
        navigate("/auth", { replace: true });
    };

    return (
        <nav className="navbar">
            <div className="navbar-left" onClick={() => navigate("/")}>
                <img src={Logo} alt="ShapeBuilder logo" className="navbar-logo" />
                <span className="navbar-title">ShapeBuilder</span>
            </div>

            <div className="navbar-links">
                <button onClick={() => navigate("/profile")}>Profil</button>
                <button onClick={() => navigate("/")}>Kalendarz</button>
                <button onClick={() => navigate("/summary")}>Podsumowanie</button>
                {isAdmin && (
                    <button onClick={() => navigate("/admin")}>Użytkownicy</button>
                )}
                <button onClick={handleLogout} className="logout-btn">
                    Wyloguj
                </button>
            </div>
        </nav>
    );
}