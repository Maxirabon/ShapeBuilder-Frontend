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

/**
 * Tworzy nagłówki autoryzacyjne do zapytań API
 * Pobiera token JWT z sessionStorage i dodaje go do nagłówka Authorization
 * @returns {Object} - nagłówki z Content-Type i Authorization
 */
function getAuthHeaders() {
    const token = sessionStorage.getItem("sb_token");
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

/**
 * Pobranie dni zalogowanego użytkownika
 * Wymaga aktywnego JWT w sessionStorage
 * @returns {Promise<Array>} - lista dni użytkownika zwrócona z backendu
 * */
export async function getUserDays() {
    const res = await fetch(`${API_URL}/user/getUserDays`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error("Błąd pobierania dni użytkownika");
    }

    return await res.json();
}