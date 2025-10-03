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

/**
 * Pobranie dziennego zapotrzebowania kalorycznego użytkownika
 * Wymaga aktywnego JWT w sessionStorage
 * @returns {Promise<any>} - double (zapotrzebowanie kaloryczne)
 */
export async function getUserCaloricRequisition(){
    const res = await fetch(`${API_URL}/user/getCaloricRequisition`, {
        method: "GET",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        throw new Error("Błąd pobierania zapotrzebowania kalorycznego użytkownika");
    }

    return await res.json();
}

/**
 * Pobranie wszystkich produktów z bazy
 * Wymaga aktywnego JWT w sessionStorage
 * @returns {Promise<any>} - listę produktów z bazy
 */
export async function getAllProducts() {
    const res = await fetch(`${API_URL}/user/getAllProducts`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Błąd pobierania produktów");
    return res.json();
}

/**
 *
 * @param meal_id
 * @param product_id
 * @param amount
 * @returns {Promise<void>}
 */
export async function addMealProduct(meal_id, product_id, amount) {
    const res = await fetch(`${API_URL}/user/addMealProduct`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ meal_id, product_id, amount }),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się dodać produktu");
    }

    return await res.json();
}

export async function updateMealProduct(mealProductId, productId, amount) {
    console.log("API updateMealProduct called", { mealProductId, productId, amount });

    const res = await fetch(`${API_URL}/user/updateMealProduct`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: mealProductId, product_id: productId, amount }),
    });

    console.log("Response status:", res.status);

    if (!res.ok) {
        const errorData = await res.json();
        console.error("Response errorData:", errorData);
        throw new Error(errorData.error || "Nie udało się zmodyfikować produktu");
    }
    return await res.json();
}

export async function deleteMealProduct(mealProductId) {
    const res = await fetch(`${API_URL}/user/deleteMealProduct?id=${mealProductId}`, {
        method: "DELETE",
        headers: getAuthHeaders(),
    });

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się usunąć produktu");
    }

    return await res.json();
}

/**
 * Pobranie podsumowania dziennego (z posiłkami i produktami)
 * @param {number} dayId - id dnia (calendarId z backendu)
 * @returns {Promise<any>}
 */
export async function getDaySummary(dayId) {
    const res = await fetch(`${API_URL}/user/getDaySummary/${dayId}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error("Błąd pobierania podsumowania dnia");
    return await res.json();
}