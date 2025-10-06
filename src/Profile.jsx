import React, { useEffect, useState } from "react";
import { getUserInfo, changeUserPassword, updateUserProfile } from "./api";
import "./Profile.css";

export default function Profile() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [profileForm, setProfileForm] = useState({age: "", weight: "", height: "", activity: "",});
    const [passwordForm, setPasswordForm] = useState({oldPassword: "", newPassword: "", confirmPassword: ""});

    const getGenderLabel = (gender) => {
        if (!gender) return "nie podano";
        return gender.toUpperCase() === "M" ? "mężczyzna" : "kobieta";
    };

    const getActivityLabel = (activity) => {
        switch (activity) {
            case "BRAK":
                return "brak";
            case "MALA":
                return "mała";
            case "SREDNIA":
                return "średnia";
            case "DUZA":
                return "duża";
            case "BARDZO_DUZA":
                return "bardzo duża";
            default:
                return "nie podano";
        }
    };

    useEffect(() => {
        async function fetchUser() {
            try {
                const data = await getUserInfo();
                setUser(data);
                setProfileForm({
                    age: data.age || "",
                    weight: data.weight || "",
                    height: data.height || "",
                    activity: data.activity || "",
                });
            } catch (err) {
                setError("Nie udało się pobrać danych użytkownika");
            } finally {
                setLoading(false);
            }
        }
        fetchUser();
    }, []);

    async function handleProfileSubmit(e) {
        e.preventDefault();
        setMessage("");
        setError("");
        try {
          await updateUserProfile(profileForm.age, profileForm.weight, profileForm.height, profileForm.activity);
            setMessage("Dane profilu zostały zaktualizowane!");
        } catch (err) {
            setError(err.message);
        }
    }

    async function handlePasswordChange(e) {
        e.preventDefault();
        setMessage("");
        setError("");
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            setError("Nowe hasła muszą być zgodne!");
            return;
        }
        try {
           await changeUserPassword(passwordForm.oldPassword, passwordForm.newPassword);
            setMessage("Hasło zostało zmienione pomyślnie!");
            setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        } catch (err) {
            setError(err.message);
        }
    }

    if (loading) return <div className="profile-container">Ładowanie...</div>;
    if (error && !user) return <div className="profile-container error">{error}</div>;

    return (
        <div className="profile-container">
            <h2>Profil użytkownika</h2>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <div className="profile-sections">
                <div className="user-info">
                    <h3>Dane użytkownika</h3>
                    <p><strong>Imię:</strong> {user.firstName}</p>
                    <p><strong>Nazwisko:</strong> {user.lastName}</p>
                    <p><strong>Email:</strong> {user.email}</p>
                    <p><strong>Płeć:</strong> {getGenderLabel(user.gender)}</p>
                    <p><strong>Aktywność:</strong> {getActivityLabel(user.activity)}</p>
                </div>

                <div className="password-change">
                    <h3>Zmiana hasła</h3>
                    <form onSubmit={handlePasswordChange}>
                        <label>Stare hasło:</label>
                        <input
                            type="password"
                            value={passwordForm.oldPassword}
                            onChange={(e) =>
                                setPasswordForm({ ...passwordForm, oldPassword: e.target.value })
                            }
                            required
                        />
                        <label>Nowe hasło:</label>
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) =>
                                setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                            }
                            required
                        />
                        <label>Powtórz nowe hasło:</label>
                        <input
                            type="password"
                            value={passwordForm.confirmPassword}
                            onChange={(e) =>
                                setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                            }
                            required
                        />

                        <button type="submit">Zmień hasło</button>
                    </form>
                </div>
            </div>

            <div className="profile-update">
                <h3>Aktualizacja danych</h3>
                <form onSubmit={handleProfileSubmit}>
                    <label>Wiek:</label>
                    <input
                        type="number"
                        value={profileForm.age}
                        onChange={(e) =>
                            setProfileForm({ ...profileForm, age: e.target.value })
                        }
                    />
                    <label>Wzrost (cm):</label>
                    <input
                        type="number"
                        value={profileForm.height}
                        onChange={(e) =>
                            setProfileForm({ ...profileForm, height: e.target.value })
                        }
                    />
                    <label>Waga (kg):</label>
                    <input
                        type="number"
                        value={profileForm.weight}
                        onChange={(e) =>
                            setProfileForm({ ...profileForm, weight: e.target.value })
                        }
                    />
                    <label>Aktywność fizyczna:</label>
                    <select
                        value={profileForm.activity}
                        onChange={(e) =>
                            setProfileForm({ ...profileForm, activity: e.target.value })
                        }
                    >
                        <option value="">Wybierz...</option>
                        <option value="BRAK">brak</option>
                        <option value="MALA">mała</option>
                        <option value="SREDNIA">średnia</option>
                        <option value="DUZA">duża</option>
                        <option value="BARDZO_DUZA">bardzo duża</option>
                    </select>
                    <button type="submit">Zapisz zmiany</button>
                </form>
            </div>
        </div>
    );
}