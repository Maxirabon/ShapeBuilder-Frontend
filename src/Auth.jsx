import React, { useState } from "react";
import { loginUser, registerUser } from "./api";
import "./Auth.css";
import Logo from "./assets/logo.png"

export default function AuthPage() {
    const [tab, setTab] = useState("login");
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState(null);

    // LOGIN
    const [login, setLogin] = useState({ email: "", password: "" });

    // REGISTER
    const [reg, setReg] = useState({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        gender: "M",
        age: 0,
        weight: 0,
        height: 0,
        activity: "SREDNIA",
    });

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);
        try {
            const token = await loginUser(login);
            sessionStorage.setItem("sb_token", token);
            const payload = JSON.parse(atob(token.split('.')[1]));

            const userData = {
                id: payload.id,
                firstName: payload.firstName,
                lastName: payload.lastName,
                role: payload.role
            };

            sessionStorage.setItem("sb_user", JSON.stringify(userData));
            setMsg({ type: "success", text: "Zalogowano pomyślnie" });
            window.location.href = "/";
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMsg(null);

        if (Number(reg.age) < 1 || Number(reg.weight) < 1 || Number(reg.height) < 1) {
            setMsg({ type: "error", text: "Wiek, waga i wzrost muszą być większe niż 0" });
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...reg,
                age: Number(reg.age),
                weight: Number(reg.weight),
                height: Number(reg.height),
            };

            const data = await registerUser(payload);
            setMsg({ type: "success", text: data.message });
            setTab("login");
        } catch (err) {
            setMsg({ type: "error", text: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <img src={Logo} alt="ShapeBuilder logo" className="auth-logo" />

                <div className="auth-tabs">
                    <button
                        className={tab === "login" ? "active" : ""}
                        onClick={() => setTab("login")}
                    >
                        Logowanie
                    </button>
                    <button
                        className={tab === "register" ? "active" : ""}
                        onClick={() => setTab("register")}
                    >
                        Rejestracja
                    </button>
                </div>

                {msg && <div className={`auth-msg ${msg.type}`}>{msg.text}</div>}

                {tab === "login" ? (
                    <form onSubmit={handleLogin} className="auth-form">
                        <label>
                            Email
                            <input
                                type="email"
                                value={login.email}
                                onChange={(e) =>
                                    setLogin({ ...login, email: e.target.value })
                                }
                                required
                            />
                        </label>
                        <label>
                            Hasło
                            <input
                                type="password"
                                value={login.password}
                                onChange={(e) =>
                                    setLogin({ ...login, password: e.target.value })
                                }
                                required
                            />
                        </label>
                        <button disabled={loading}>
                            {loading ? "..." : "Zaloguj się"}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleRegister} className="auth-form">
                        <label>
                            Imię
                            <input
                                value={reg.firstName}
                                onChange={(e) =>
                                    setReg({ ...reg, firstName: e.target.value })
                                }
                                required
                            />
                        </label>
                        <label>
                            Nazwisko
                            <input
                                value={reg.lastName}
                                onChange={(e) =>
                                    setReg({ ...reg, lastName: e.target.value })
                                }
                                required
                            />
                        </label>
                        <label>
                            Email
                            <input
                                type="email"
                                value={reg.email}
                                onChange={(e) =>
                                    setReg({ ...reg, email: e.target.value })
                                }
                                required
                            />
                        </label>
                        <label>
                            Hasło
                            <input
                                type="password"
                                value={reg.password}
                                onChange={(e) =>
                                    setReg({ ...reg, password: e.target.value })
                                }
                                required
                            />
                        </label>
                        <label>
                            Wiek
                            <input
                                type="number"
                                value={reg.age}
                                onChange={(e) =>
                                    setReg({ ...reg, age: e.target.value })
                                }
                                required
                            />
                        </label>
                        <label>
                            Wzrost [cm]
                            <input
                                type="number"
                                value={reg.height}
                                onChange={(e) =>
                                    setReg({ ...reg, height: e.target.value })
                                }
                                required
                            />
                        </label>
                        <label>
                            Waga [kg]
                            <input
                                type="number"
                                value={reg.weight}
                                onChange={(e) =>
                                    setReg({ ...reg, weight: e.target.value })
                                }
                                required
                            />
                        </label>
                        <label>
                            Płeć
                            <select
                                value={reg.gender}
                                onChange={(e) =>
                                    setReg({ ...reg, gender: e.target.value })
                                }
                            >
                                <option value="M">Mężczyzna</option>
                                <option value="K">Kobieta</option>
                            </select>
                        </label>
                        <label>
                            Aktywność
                            <select
                                value={reg.activity}
                                onChange={(e) =>
                                    setReg({ ...reg, activity: e.target.value })
                                }
                            >
                                <option value="BRAK">Brak (brak treningów)</option>
                                <option value="MALA">Mała (1 - 2 jednostki w tyg)</option>
                                <option value="SREDNIA">Średnia (3 - 4 jednostki w tyg)</option>
                                <option value="DUZA">Duża (5 - 6 jednostek w tyg)</option>
                                <option value="BARDZO_DUZA">Bardzo duża (7+ jednostek w tyg)</option>
                            </select>
                        </label>
                        <button disabled={loading}>
                            {loading ? "..." : "Zarejestruj się"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}