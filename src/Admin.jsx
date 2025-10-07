import React, { useEffect, useState } from "react";
import { getAllUsersProfile, changeUserRole, deleteUser } from "./api";
import "./Admin.css";

export default function Admin() {
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getGenderLabel = (gender) => {
        if (!gender) return "nie podano";
        return gender.toUpperCase() === "M" ? "mężczyzna" : "kobieta";
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            setLoading(true);
            const data = await getAllUsersProfile();
            setUsers(data);
            setError("");
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    }

    async function handleChangeRole(userId, currentRole) {
        const newRole = currentRole === "ROLE_USER" ? "ROLE_ADMIN" : "ROLE_USER";
        try {
            await changeUserRole(userId, newRole);
            await fetchUsers();
            setMessage(
                newRole === "ROLE_ADMIN"
                    ? "Użytkownik został awansowany na administratora"
                    : "Użytkownik został zdegradowany do roli użytkownika"
            );
            setTimeout(() => setMessage(""), 3000);
        } catch (e) {
            alert("Błąd przy zmianie roli: " + e.message);
        }
    }

    async function handleDeleteUser(userId) {
        if (!window.confirm("Czy na pewno chcesz usunąć tego użytkownika?")) return;
        try {
            await deleteUser(userId);
            setUsers(users.filter((u) => u.id !== userId));
            setMessage("Użytkownik został usunięty");
            setTimeout(() => setMessage(""), 3000);
        } catch (e) {
            alert("Błąd przy usuwaniu użytkownika: " + e.message);
        }
    }

    const filteredUsers = users.filter((u) =>
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="admin-container">
            <h1 className="admin-title">Panel administratora</h1>

            <input
                type="text"
                placeholder="Szukaj po adresie e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-search"
            />
            {message && <p className="admin-success">{message}</p>}

            {loading && <p className="admin-info">Ładowanie użytkowników...</p>}
            {error && <p className="admin-error">{error}</p>}
            {!loading && filteredUsers.length === 0 && (
                <p className="admin-info">Brak użytkowników do wyświetlenia.</p>
            )}

            <div className="admin-grid">
                {filteredUsers.map((user) => (
                    <div key={user.id} className="user-card">
                        <div className="user-info">
                            <h2 className="user-name">
                                {user.firstName} {user.lastName}
                            </h2>
                            <p><strong>Email:</strong> {user.email}</p>
                            <p><strong>Płeć:</strong> {getGenderLabel(user.gender)}</p>
                            <p><strong>Wiek:</strong> {user.age}</p>
                            <p><strong>Wzrost:</strong> {user.height} cm</p>
                            <p><strong>Waga:</strong> {user.weight} kg</p>
                            <p><strong>Aktywność:</strong> {user.activity}</p>
                            <p><strong>Rola:</strong> {user.role}</p>
                        </div>

                        <div className="user-actions">
                            <button
                                className="btn btn-green"
                                onClick={() => handleChangeRole(user.id, user.role)}
                            >
                                {user.role === "ROLE_USER" ? "Promuj" : "Degraduj"}
                            </button>
                            <button
                                className="btn btn-red"
                                onClick={() => handleDeleteUser(user.id)}
                            >
                                Usuń
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}