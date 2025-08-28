const API_URL = "http://localhost:8080";

/**
 * Logowanie użytkownika
 * @param {Object} credentials - { email, password }
 * @returns JWT token (string)
 */
export async function loginUser(credentials) {
    const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Błąd logowania");
    }

    const data = await res.json();
    return data.token;
}

/**
 * Rejestracja nowego użytkownika
 * @param {Object} userData - dane użytkownika
 */
export async function registerUser(userData) {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
    });

    if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Błąd rejestracji");
    }
    return await res.json();
}