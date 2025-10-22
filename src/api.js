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
 * Dodanie produktu do posiłku użytkownika
 * @param {number} meal_id - ID posiłku
 * @param {number} product_id - ID produktu
 * @param {number} amount - ilość produktu w gramach
 * @returns {Promise<any>}
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

/**
 * Aktualizacja produktu w posiłku
 * @param {number} mealProductId - ID produktu w posiłku
 * @param {number} productId - nowe ID produktu
 * @param {number} amount - nowa ilość produktu
 * @returns {Promise<any>}
 */
export async function updateMealProduct(mealProductId, productId, amount) {
    const res = await fetch(`${API_URL}/user/updateMealProduct`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: mealProductId, product_id: productId, amount }),
    });
    if (!res.ok) {
        const errorData = await res.json();
        console.error("Response errorData:", errorData);
        throw new Error(errorData.error || "Nie udało się zmodyfikować produktu");
    }
    return await res.json();
}

/**
 * Usunięcie produktu z posiłku
 * @param {number} mealProductId - ID produktu w posiłku
 * @returns {Promise<string>} - komunikat z backendu
 */
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
 * Pobranie produktów utworzonych przez użytkownika
 * @returns {Promise<any>} - lista produktów użytkownika
 */
export async function getUserProducts() {
    const res = await fetch(`${API_URL}/user/getUserProducts`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało sie pobrac produktow uzytkownika");
    }
    return await res.json();
}

/**
 * Dodanie nowego produktu użytkownika
 * @param {Object} product - dane nowego produktu
 * @returns {Promise<any>} - dodany produkt
 */
export async function addUserProduct(product) {
    const res = await fetch(`${API_URL}/user/addUserProduct`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify(product)
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało sie dodac produktu uzytkownika");
    }
    const data = await res.json();
    return data;
}

/**
 * Modyfikacja istniejącego produktu użytkownika
 * @param {Object} product - zaktualizowane dane produktu
 * @returns {Promise<any>} - zaktualizowany produkt
 */
export async function modifyUserProduct(product) {
    const res = await fetch(`${API_URL}/user/updateUserProduct`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify(product)
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało sie zaktualizować produktu uzytkownika");
    }
    const data = await res.json();
    return data;
}

/**
 * Usunięcie produktu użytkownika
 * @param {number} productId - ID produktu użytkownika
 * @returns {Promise<string>} - komunikat z backendu
 */
export async function deleteUserProduct(productId) {
    const res = await fetch(`${API_URL}/user/deleteUserProduct/${productId}`, {
        method: "DELETE",
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się usunąć produktu");
    }
    return await res.text();
}

/**
 * Pobranie wszystkich szablonów ćwiczeń
 * @returns {Promise<Array>} - lista szablonów ćwiczeń
 */
export async function getAllExerciseTemplates(){
    const res = await fetch(`${API_URL}/user/getAllExerciseTemplates`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się pobrać schematów ćwiczeń");
    }
    return await res.json();
}

/**
 * Dodanie ćwiczenia
 * @param {Object} params - { day, exerciseTemplateId, userId, sets, repetitions, weight }
 * @returns {Promise<any>} - dodane ćwiczenie
 */
export async function addExercise({ day, exerciseTemplateId, userId, sets, repetitions, weight }){
    const res = await fetch(`${API_URL}/user/addExercise`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({ day, exerciseTemplateId, userId, sets, repetitions, weight })
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się dodać ćwiczenia");
    }
    return await res.json();
}

/**
 * Aktualizacja ćwiczenia
 * @param {Object} params - { exerciseId, sets, repetitions, weight }
 * @returns {Promise<any>} - zaktualizowane ćwiczenie
 */
export async function updateExercise({exerciseId, sets, repetitions, weight }){
    const res = await fetch(`${API_URL}/user/updateExercise`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({id: exerciseId, sets: Number(sets), repetitions: Number(repetitions), weight: Number(weight),
        }),
    });
    if (!res.ok) {
        const errorData = await res.json();
        console.error("Response errorData:", errorData);
        throw new Error(errorData.error || "Nie udało się zmodyfikować ćwiczenia");
    }
    return await res.json();
}

/**
 * Usuwanie ćwiczenia
 * @param exerciseId - id ćwiczenia
 * @returns {Promise<string>} - komunikat z backendu
 */
export async function deleteExercise(exerciseId){
    const res = await fetch(`${API_URL}/user/deleteExercise`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({ id: exerciseId })
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się usunąć ćwiczenia");
    }
    return await res.text();
}

/**
 * Pobranie informacji o użytkowniku
 * @returns {Promise<any>} - dane użytkownika
 */
export async function getUserInfo(){
    const res = await fetch(`${API_URL}/user/getUserInfo`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        const errorData = await res.json();
        console.error("Response errorData:", errorData);
        throw new Error(errorData.error || "Nie udało się pobrać danych użytkownika");
    }
    return await res.json();
}

/**
 * Zmiana hasła użytkownika
 * @param {string} oldPassword - stare hasło
 * @param {string} newPassword - nowe hasło
 * @returns {Promise<Response>} - odpowiedź serwera
 */
export async function changeUserPassword(oldPassword, newPassword) {
    const response = await fetch(`${API_URL}/user/changePassword`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({
            oldPassword: oldPassword,
            newPassword: newPassword,
        }),
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Nie udało się zmienić hasła");
    }
    return response;
}

/**
 * Aktualizacja profilu użytkownika
 * @param {number} age - wiek
 * @param {number} weight - waga
 * @param {number} height - wzrost
 * @param {string} activity - poziom aktywności
 * @returns {Promise<any>} - zaktualizowany profil
 */
export async function updateUserProfile(age, weight, height, activity){
    const res = await fetch(`${API_URL}/user/updateProfile`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({age, weight, height, activity})
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się zmienić danych użytkownika");
    }
    return await res.json();
}

/**
 * Pobranie wszystkich profili użytkowników (admin)
 * @returns {Promise<Array>} - lista profili użytkowników
 */
export async function getAllUsersProfile(){
    const res = await fetch(`${API_URL}/admin/getAllUsersProfile`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się wyświetlić profili użytkowników");
    }
    return await res.json();
}

/**
 * Zmiana roli użytkownika (admin)
 * @param {number} userId - ID użytkownika
 * @param {string} role - nowa rola
 * @returns {Promise<Object>} - zaktualizowany użytkownik
 */
export async function changeUserRole(userId, role){
    const res = await fetch(`${API_URL}/admin/changeUserRole`, {
        method: "PUT",
        headers: getAuthHeaders(),
        body: JSON.stringify({id: userId, role: role})
    })
    if (!res.ok) throw new Error("Nie udało się zmienić roli");

    const text = await res.text();
    return text ? JSON.parse(text) : {};
}

/**
 * Usunięcie użytkownika (admin)
 * @param {number} userId - ID użytkownika
 * @returns {Promise<string>} - komunikat z backendu
 */
export async function deleteUser(userId){
    const res = await fetch(`${API_URL}/admin/deleteUser`, {
        method: "DELETE",
        headers: getAuthHeaders(),
        body: JSON.stringify({id: userId})
    })
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się zmienić roli użytkownika");
    }
    return await res.text();
}

/**
 * Pobranie podsumowania dnia z posiłkami
 * @param {number} dayId - ID dnia
 * @returns {Promise<any>} - dane podsumowania dnia
 */
export async function getDaySummary(dayId) {
    const res = await fetch(`${API_URL}/user/getDaySummary/${dayId}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się pobrać podsumowania dnia - żywienie");
    }
    return await res.json();
}

/**
 * Pobranie podsumowania tygodnia z posiłkami
 * @param {number} userId - ID użytkownika
 * @param {string|null} startOfWeek - początek tygodnia (YYYY-MM-DD)
 * @param {string|null} endOfWeek - koniec tygodnia (YYYY-MM-DD)
 * @returns {Promise<any>} - dane podsumowania tygodnia
 */
export async function getWeekSummary(userId, startOfWeek = null, endOfWeek = null) {
    const params = new URLSearchParams();
    if (startOfWeek) params.append("startOfWeek", startOfWeek);
    if (endOfWeek) params.append("endOfWeek", endOfWeek);
    const res = await fetch(`${API_URL}/user/getWeekSummary/${userId}?${params.toString()}`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się pobrać podsumowania tygodnia - żywienie");
    }
    return await res.json();
}

/**
 * Pobranie podsumowania miesiąca z posiłkami
 * @param {number} userId - ID użytkownika
 * @param {number|null} year - rok
 * @param {number|null} month - miesiąc
 * @returns {Promise<any>} - dane podsumowania miesiąca
 */
export async function getMonthSummary(userId, year = null, month = null) {
    let url = `${API_URL}/user/getMonthSummary/${userId}`;
    if (year && month) {
        url += `/${year}/${month}`;
    }
    const res = await fetch(url, {
        method: "GET",
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się pobrać podsumowania miesiąca - żywienie");
    }
    return await res.json();
}

/**
 * Pobranie podsumowania ćwiczeń dnia
 * @param {number} dayId - ID dnia
 * @returns {Promise<any>} - dane podsumowania ćwiczeń dnia
 */
export async function getDayExerciseSummary(dayId) {
    const res = await fetch(`${API_URL}/user/getDayExerciseSummary/${dayId}`, {
        method: "GET",
        headers: getAuthHeaders(),
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się pobrać podsumowania dnia - trening");
    }
    return await res.json();
}

/**
 * Pobranie podsumowania ćwiczeń tygodnia
 * @param {number} userId - ID użytkownika
 * @param {string|null} startOfWeek - początek tygodnia (YYYY-MM-DD)
 * @param {string|null} endOfWeek - koniec tygodnia (YYYY-MM-DD)
 * @returns {Promise<any>} - dane podsumowania ćwiczeń tygodnia
 */
export async function getWeekExerciseSummary(userId, startOfWeek, endOfWeek){
    const params = new URLSearchParams();
    if (startOfWeek) params.append("startOfWeek", startOfWeek);
    if (endOfWeek) params.append("endOfWeek", endOfWeek);
    const res = await fetch(`${API_URL}/user/getWeekExerciseSummary/${userId}?${params.toString()}`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się pobrać podsumowania tygodnia - trening");
    }
    return await res.json();
}

/**
 * Pobranie podsumowania ćwiczeń miesiąca
 * @param {number} userId - ID użytkownika
 * @param {number} year - rok
 * @param {number} month - miesiąc
 * @returns {Promise<any>} - dane podsumowania ćwiczeń miesiąca
 */
export async function getMonthExerciseSummary(userId, year, month){
    const res = await fetch(`${API_URL}/user/getMonthExerciseSummary/${userId}/${year}/${month}`, {
        method: "GET",
        headers: getAuthHeaders()
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Nie udało się pobrać podsumowania miesiąca - trening");
    }
    return await res.json();
}