import React, {useEffect, useMemo, useState} from "react";
import {
    addExercise,
    addMealProduct, addUserProduct, deleteExercise,
    deleteMealProduct, deleteUserProduct, getAllExerciseTemplates,
    getAllProducts,
    getUserCaloricRequisition,
    getUserDays, getUserProducts, modifyUserProduct, updateExercise,
    updateMealProduct
} from "./api";
import "./Calendar.css";

/**
 * Prosty parser daty z backendu
 * @param {Object} item - obiekt dnia z backendu { dayId, day, modification_date }
 * @returns {Date} obiekt Date
 */
function parseDateFromServer(item) {
    return new Date(item.day);
}


//Formatuje datę do stringa YYYY-MM-DD
function formatYYYYMMDD(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function capitalizeFirst(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function Calendar() {
    const [user, setUser] = useState(null);
    const [rawDays, setRawDays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(() => {
        const d = new Date();
        return new Date(d.getFullYear(), d.getMonth(), 1);
    });
    const [CaloricRequisition, setCaloricRequisition] = useState(null);
    const [nutritionModal, setNutritionModal] = useState({open: false, date: null, entry: null});
    const [productModal, setProductModal] = useState({open: false, mealId: null, mealType: null});
    const [userProductModal, setUserProductModal] = useState({open: false, mealId: null, mealType: null});
    const [allProducts, setAllProducts] = useState([]);
    const [trainingModal, setTrainingModal] = useState({open: false, date: null, entry: null});
    const [allExerciseTemplates, setAllExerciseTemplates] = useState([]);
    const [exerciseModal, setExerciseModal] = useState({ open: false, date: null, dayId: null });
    const [search, setSearch] = useState("");
    const [exerciseSearch, setExerciseSearch] = useState("");
    const [amounts, setAmounts] = useState({});
    const [allUserProducts, setAllUserProducts] = useState([]);
    const [addUserProductModal, setAddUserProductModal] = useState({open: false});
    const [newUserProduct, setNewUserProduct] = useState({
        name: "",
        protein: "",
        carbs: "",
        fat: "",
        calories: ""
    });
    const [editExerciseModal, setEditExerciseModal] = useState({
        open: false,
        exercise: null,
        dayId: null,
        date: null,
    });


    const minDate = useMemo(() => {
        if (!rawDays.length) return null;
        return parseDateFromServer(rawDays[0]);
    }, [rawDays]);

    const maxDate = useMemo(() => {
        if (!rawDays.length) return null;
        return parseDateFromServer(rawDays[rawDays.length - 1]);
    }, [rawDays]);


    // Ustawienie paddingu dla kontentu pod Navbar
    useEffect(() => {
        const nav = document.querySelector(".navbar");
        if (nav) {
            const h = nav.offsetHeight || 0;
            document.documentElement.style.setProperty("--navbar-height", `${h}px`);
        } else {
            document.documentElement.style.setProperty("--navbar-height", `64px`);
        }
    }, []);

    useEffect(() => {
        const storedUser = sessionStorage.getItem("sb_user");
        if (storedUser) setUser(JSON.parse(storedUser));

        async function fetchData() {
            try {
                const data = await getUserDays();
                setRawDays(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("Błąd pobierania dni użytkownika:", err);
                setRawDays([]);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, []);

    useEffect(() => {
        async function fetchCalories() {
            try {
                const kcal = await getUserCaloricRequisition();
                setCaloricRequisition(kcal);
            } catch (err) {
                console.error("Błąd pobierania zapotrzebowania kalorycznego:", err);
            }
        }

        if (user) fetchCalories();
    }, [user]);

    useEffect(() => {
        if (!productModal.open) return;

        async function fetchProducts() {
            try {
                const products = await getAllProducts();
                setAllProducts(products);
            } catch (err) {
                console.error("Błąd pobierania produktów:", err);
            }
        }

        fetchProducts();
    }, [productModal.open]);

    useEffect(() => {
        if(!exerciseModal.open) return;

        async function fetchExerciseTemplates() {
            try{
                const exerciseTemplates = await getAllExerciseTemplates();
                setAllExerciseTemplates(Array.isArray(exerciseTemplates) ? exerciseTemplates : []);
            }catch(err){
                console.error("Błąd pobierania schematów ćwiczeń:", err);
            }
        }

        fetchExerciseTemplates();
    }, [exerciseModal.open]);

    useEffect(() => {
        if (!userProductModal.open) return;

        async function fetchUserProducts() {
            try {
                const userProducts = await getUserProducts();
                setAllUserProducts(userProducts);
            } catch (err) {
                console.error("Błąd pobierania produktow uzytkownika:", err);
            }
        }

        fetchUserProducts();
    }, [userProductModal.open]);

    // Mapa dni do obiektów backendu
    const daysMap = useMemo(() => {
        const m = new Map();
        rawDays.forEach((item) => {
            const dt = parseDateFromServer(item);
            if (!isNaN(dt.getTime())) {
                const key = formatYYYYMMDD(dt);
                m.set(key, item);
            }
        });
        return m;
    }, [rawDays]);

    if (loading) return <p className="calendar-loading">Ładowanie...</p>;

    const weekDays = ["Poniedziałek", "Wtorek", "Środa", "Czwartek", "Piątek", "Sobota", "Niedziela"];

    // obliczenia dla bieżącego miesiąca
    const year = currentMonth.getFullYear();
    const monthIndex = currentMonth.getMonth();
    const firstOfMonth = new Date(year, monthIndex, 1);
    const offset = (firstOfMonth.getDay() + 6) % 7; // przesunięcie dla poniedziałku
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < offset; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, monthIndex, d);
        const key = formatYYYYMMDD(date);
        const entry = daysMap.get(key) ?? null;
        cells.push({date, entry});
    }

    const monthTitle = capitalizeFirst(
        currentMonth.toLocaleString("pl-PL", {month: "long", year: "numeric"})
    );

    const goPrev = () => {
        const prev = new Date(year, monthIndex - 1, 1);
        if (!minDate || prev >= new Date(minDate.getFullYear(), minDate.getMonth(), 1)) {
            setCurrentMonth(prev);
        }
    };

    const goNext = () => {
        const next = new Date(year, monthIndex + 1, 1);
        if (!maxDate || next <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) {
            setCurrentMonth(next);
        }
    };

    function getDayTotals(day) {
        if (!day || !day.meals) return {calories: 0, protein: 0, carbs: 0, fat: 0};
        return day.meals.reduce((acc, meal) => {
            meal.mealProducts.forEach(p => {
                acc.calories += p.calories;
                acc.protein += p.protein;
                acc.carbs += p.carbs;
                acc.fat += p.fat;
            });
            return acc;
        }, {calories: 0, protein: 0, carbs: 0, fat: 0});
    }

    const handleAddProduct = async (mealId, productId, amount, date) => {
        const parsedAmount = Number(amount);
        if (!parsedAmount || parsedAmount <= 0) {
            console.log("Invalid data detected", {mealId, productId, parsedAmount, date});
            alert("Podaj poprawną ilość produktu");
            return;
        }
        if (!mealId || !productId || !parsedAmount || parsedAmount <= 0 || !date) {
            alert("Brak wymaganych danych lub niepoprawna ilość");
            return;
        }

        try {
            const updatedMeal = await addMealProduct(mealId, productId, parsedAmount);

            // Aktualizacja modala
            setNutritionModal(prev => {
                if (!prev.entry) return prev;
                const meals = prev.entry.meals.map(meal =>
                    meal.id === updatedMeal.id ? updatedMeal : meal
                );
                return {...prev, entry: {...prev.entry, meals}};
            });

            // Aktualizacja rawDays
            setRawDays(prevDays =>
                prevDays.map(day => {
                    if (formatYYYYMMDD(parseDateFromServer(day)) !== formatYYYYMMDD(date)) return day;
                    return {
                        ...day,
                        meals: day.meals.map(meal =>
                            meal.id === updatedMeal.id ? updatedMeal : meal
                        ),
                    };
                })
            );

            setAmounts(prev => ({...prev, [productId]: ""}));
        } catch (error) {
            alert(error.message || "Nie udało się dodać produktu");
        }
    };

    const handleModifyProduct = async (mealId, mealProductId, productId, currentAmount, date) => {
        const newAmount = prompt("Podaj nową ilość (g)", currentAmount);
        const parsedAmount = Number(newAmount);

        if (!parsedAmount || parsedAmount <= 0) {
            alert("Podaj poprawną ilość produktu");
            return;
        }

        try {
            const updatedProduct = await updateMealProduct(mealProductId, productId, parsedAmount);

            // Aktualizacja modala
            setNutritionModal(prev => {
                if (!prev.entry) return prev;
                const meals = prev.entry.meals.map(meal =>
                    meal.id === mealId
                        ? {
                            ...meal,
                            mealProducts: meal.mealProducts.map(p =>
                                p.id === mealProductId ? updatedProduct : p
                            ),
                        }
                        : meal
                );
                return {...prev, entry: {...prev.entry, meals}};
            });

            // Aktualizacja rawDays
            setRawDays(prevDays =>
                prevDays.map(day => {
                    if (formatYYYYMMDD(parseDateFromServer(day)) !== formatYYYYMMDD(date)) return day;
                    return {
                        ...day,
                        meals: day.meals.map(meal =>
                            meal.id === mealId
                                ? {
                                    ...meal,
                                    mealProducts: meal.mealProducts.map(p =>
                                        p.id === mealProductId ? updatedProduct : p
                                    ),
                                }
                                : meal
                        ),
                    };
                })
            );
        } catch (error) {
            alert(error.message || "Nie udało się zmodyfikować produktu");
        }
    };

    const handleDeleteProduct = async (mealId, mealProductId, date) => {
        if (!window.confirm("Czy na pewno chcesz usunąć ten produkt?")) return;

        try {
            const deleted = await deleteMealProduct(mealProductId);

            // Aktualizacja modala
            setNutritionModal(prev => {
                if (!prev.entry) return prev;
                const meals = prev.entry.meals.map(meal =>
                    meal.id === mealId
                        ? {
                            ...meal,
                            mealProducts: meal.mealProducts.filter(p => p.id !== deleted.id),
                        }
                        : meal
                );
                return {...prev, entry: {...prev.entry, meals}};
            });

            // Aktualizacja rawDays
            setRawDays(prevDays =>
                prevDays.map(day => {
                    if (formatYYYYMMDD(parseDateFromServer(day)) !== formatYYYYMMDD(date)) return day;
                    return {
                        ...day,
                        meals: day.meals.map(meal =>
                            meal.id === mealId
                                ? {
                                    ...meal,
                                    mealProducts: meal.mealProducts.filter(p => p.id !== deleted.id),
                                }
                                : meal
                        ),
                    };
                })
            );
        } catch (error) {
            alert(error.message || "Nie udało się usunąć produktu");
        }
    };

    const handleSaveUserProduct = async () => {
        if (!newUserProduct.name || !newUserProduct.protein || !newUserProduct.carbs || !newUserProduct.fat || !newUserProduct.calories) {
            alert("Uzupełnij wszystkie pola!");
            return;
        }

        try {
            const created = await addUserProduct({
                name: newUserProduct.name,
                protein: Number(newUserProduct.protein),
                carbs: Number(newUserProduct.carbs),
                fat: Number(newUserProduct.fat),
                calories: Number(newUserProduct.calories),
            });

            setAllUserProducts((prev) => [...prev, created]);
            setAddUserProductModal({open: false});
            setNewUserProduct({name: "", protein: "", carbs: "", fat: "", calories: ""});
        } catch (err) {
            alert(err.message || "Nie udało się dodać produktu");
        }
    };

    const handleModifyUserProduct = async () => {
        if (!newUserProduct.id) {
            alert("Brak ID produktu do modyfikacji");
            return;
        }
        if (!newUserProduct.name || !newUserProduct.protein || !newUserProduct.carbs || !newUserProduct.fat || !newUserProduct.calories) {
            alert("Uzupełnij wszystkie pola!");
            return;
        }
        try {
            const updated = await modifyUserProduct({
                id: newUserProduct.id,
                name: newUserProduct.name,
                protein: Number(newUserProduct.protein),
                carbs: Number(newUserProduct.carbs),
                fat: Number(newUserProduct.fat),
                calories: Number(newUserProduct.calories),
            });
            setAllUserProducts((prev) =>
                prev.map((p) => (p.id === updated.id ? updated : p))
            );
            setAddUserProductModal({open: false, isEditing: false});
            setNewUserProduct({id: null, name: "", protein: "", carbs: "", fat: "", calories: ""});
            console.log("Zaktualizowano produkt:", updated);
        } catch (e) {
            alert(e.message);
        }
    }

    const handleDeleteUserProduct = async (productId) => {
        if (!window.confirm("Czy na pewno chcesz usunąć ten produkt?")) return;

        try {
            await deleteUserProduct(productId);
            setAllUserProducts((prev) => prev.filter((p) => p.id !== productId));
        } catch (err) {
            alert(err.message || "Nie udało się usunąć produktu");
        }
    };

    const handleAddExercise = async (ex, exerciseModal, setTrainingModal) => {
        const { _sets, _reps, _weight } = ex;
        if (!_sets || !_reps) {
            alert("Podaj liczbę serii i powtórzeń!");
            return;
        }

        try {
            const correctedDate = new Date(exerciseModal.date);
            correctedDate.setDate(correctedDate.getDate() + 1); // jeśli potrzebne
            const formattedDate = correctedDate.toISOString().split("T")[0];
            const newExercise = await addExercise({
                day: formattedDate,
                exerciseTemplateId: ex.id,
                sets: Number(_sets),
                repetitions: Number(_reps),
                weight: Number(_weight) || 0,
            });

            setTrainingModal((prev) => ({
                ...prev,
                entry: {
                    ...prev.entry,
                    exercises: [...(prev.entry.exercises || []), newExercise],
                },
            }));

            setRawDays((prevDays) =>
                prevDays.map((day) => {
                    if (formatYYYYMMDD(parseDateFromServer(day)) !== formattedDate) return day;
                    return {
                        ...day,
                        exercises: [...(day.exercises || []), newExercise],
                    };
                })
            );
        } catch (err) {
            alert(err.message);
        }
    };

    const handleModifyExercise = async () => {
        console.log("handleModifyExercise wywołane");
        console.log("editExerciseModal:", editExerciseModal);

        if (!editExerciseModal.exercise) {
            alert("Brak wybranego ćwiczenia do modyfikacji");
            return;
        }

        const { id, _sets, _reps, _weight, day } = editExerciseModal.exercise;
        console.log("Exercise dane:", { id, _sets, _reps, _weight, day });

        if (!_sets || !_reps) {
            alert("Podaj liczbę serii i powtórzeń!");
            return;
        }

        if (!id) {
            console.error("ID ćwiczenia jest null lub undefined!");
            alert("Nie można modyfikować ćwiczenia bez ID");
            return;
        }

        try {
            const updatedData = await updateExercise({
                exerciseId: id,
                sets: _sets,
                repetitions: _reps,
                weight: _weight || 0,
            });

            console.log("Otrzymane z backendu updatedData:", updatedData);

            const updatedExercise = { ...editExerciseModal.exercise, ...updatedData };
            setTrainingModal((prev) => {
                console.log("Poprzedni trainingModal:", prev);
                if (!prev.entry) return prev;
                const exercises = prev.entry.exercises.map((ex) =>
                    ex.id === updatedExercise.id ? updatedExercise : ex
                );
                console.log("Zaktualizowane exercises:", exercises);
                return { ...prev, entry: { ...prev.entry, exercises } };
            });

            setRawDays((prevDays) =>
                prevDays.map((dayItem) => {
                    const key = formatYYYYMMDD(parseDateFromServer(dayItem));
                    if (key !== formatYYYYMMDD(new Date(day))) return dayItem;
                    return {
                        ...dayItem,
                        exercises: dayItem.exercises.map((ex) =>
                            ex.id === updatedExercise.id ? updatedExercise : ex
                        ),
                    };
                })
            );

            setEditExerciseModal({ open: false, date: null, dayId: null, exercise: null });
        } catch (err) {
            console.error("Błąd podczas modyfikacji ćwiczenia:", err);
            alert(err.message || "Nie udało się zmodyfikować ćwiczenia");
        }
    };


    const handleDeleteExercise = async (exerciseId) => {
        console.log("handleDeleteExercise wywołane, exerciseId:", exerciseId);

        if (!exerciseId) {
            console.error("exerciseId jest null lub undefined!");
            alert("Nie można usunąć ćwiczenia bez ID");
            return;
        }

        if (!window.confirm("Czy na pewno chcesz usunąć to ćwiczenie?")) return;

        try {
            const res = await deleteExercise(exerciseId);
            console.log("deleteExercise response:", res);

            setTrainingModal((prev) => {
                console.log("Poprzedni trainingModal przed usunięciem:", prev);
                if (!prev.entry) return prev;
                const exercises = prev.entry.exercises.filter((ex) => ex.id !== exerciseId);
                console.log("Zaktualizowane exercises po usunięciu:", exercises);
                return { ...prev, entry: { ...prev.entry, exercises } };
            });

            setRawDays((prevDays) =>
                prevDays.map((dayItem) => ({
                    ...dayItem,
                    exercises: dayItem.exercises.filter((ex) => ex.id !== exerciseId),
                }))
            );

            alert("Ćwiczenie zostało usunięte.");
        } catch (err) {
            console.error("Błąd podczas usuwania ćwiczenia:", err);
            alert(err.message || "Nie udało się usunąć ćwiczenia");
        }
    };

    return (
        <div className="calendar-container">
            {user && (
                <div className="calendar-topline">
                    <h2 className="calendar-user">
                        {user.firstName} {user.lastName}
                    </h2>

                    <div className="calories-calories">
                        {CaloricRequisition !== null && (
                            <div className="calendar-calories">
                                Zapotrzebowanie dzienne: {CaloricRequisition} kcal
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="calendar-card">
                {/* Nagłówek miesiąca z przyciskami */}
                <div className="calendar-header">
                    {/* Modal żywienia */}
                    {nutritionModal.open && nutritionModal.entry && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Dodaj posiłek - {formatYYYYMMDD(nutritionModal.date)}</h2>

                                {nutritionModal.entry && (() => {
                                    const dayTotals = getDayTotals(nutritionModal.entry);
                                    return (
                                        <div className="day-totals-modal">
                                            <strong>Łącznie dzisiaj:</strong> kcal: {dayTotals.calories.toFixed(2)},
                                            B: {dayTotals.protein.toFixed(2)}g,
                                            T: {dayTotals.fat.toFixed(2)}g,
                                            W: {dayTotals.carbs.toFixed(2)}g
                                        </div>
                                    );
                                })()}

                                {nutritionModal.entry.meals.map((meal) => {
                                    const totals = meal.mealProducts.reduce(
                                        (acc, p) => {
                                            acc.calories += p.calories;
                                            acc.protein += p.protein;
                                            acc.carbs += p.carbs;
                                            acc.fat += p.fat;
                                            return acc;
                                        },
                                        {calories: 0, protein: 0, carbs: 0, fat: 0}
                                    );

                                    return (
                                        <div key={meal.id} className="meal-section">
                                            <h3>{meal.description}</h3>

                                            {/* Lista produktów */}
                                            {meal.mealProducts && meal.mealProducts.length > 0 ? (
                                                <div className="meal-products">
                                                    {meal.mealProducts.map((p) => (
                                                        <div key={p.id} className="meal-product-item">
                            <span>
                              {p.name} - {p.amount}g | kcal: {p.calories.toFixed(2)}, B: {p.protein.toFixed(2)}g, W: {p.carbs.toFixed(2)}g, T: {p.fat.toFixed(2)}g
                            </span>
                                                            <div className="meal-product-actions">
                                                                <button
                                                                    className="modify-btn"
                                                                    onClick={() => handleModifyProduct(meal.id, p.id, p.productId, p.amount, nutritionModal.date)}
                                                                >
                                                                    Modyfikuj
                                                                </button>
                                                                <button
                                                                    className="delete-btn"
                                                                    onClick={() => handleDeleteProduct(meal.id, p.id, nutritionModal.date)}
                                                                >
                                                                    Usuń
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Podsumowanie kalorii i makrosów */}
                                                    <div className="meal-totals">
                                                        <strong>Łącznie:</strong> {totals.calories.toFixed(2)} kcal |
                                                        B: {totals.protein.toFixed(2)}g | W: {totals.carbs.toFixed(2)}g
                                                        | T: {totals.fat.toFixed(2)}g
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="no-products">Brak produktów</div>
                                            )}

                                            {/* Przyciski posiłku pod listą produktów */}
                                            <div className="meal-buttons">
                                                <button
                                                    onClick={() =>
                                                        setProductModal({
                                                            open: true,
                                                            mealId: meal.id,
                                                            mealType: meal.description,
                                                        })
                                                    }
                                                >
                                                    Dodaj produkt
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setUserProductModal({
                                                            open: true,
                                                            mealId: meal.id,
                                                            mealType: meal.description,
                                                        })
                                                    }
                                                >
                                                    Moje produkty
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                <button
                                    className="close-btn"
                                    onClick={() => setNutritionModal({open: false, date: null, entry: null})}
                                >
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Modal produktów z bazy */}
                    {productModal.open && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Dodaj produkt - {productModal.mealType}</h2>
                                <input
                                    type="text"
                                    placeholder="Szukaj produktu..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="search-input"
                                />
                                <div className="product-list">
                                    {allProducts
                                        .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
                                        .map((p) => (
                                            <div key={`base-${p.id}`} className="product-item">
                                                <span>{p.name} ({p.calories} kcal / 100g)</span>
                                                <input
                                                    type="number"
                                                    placeholder="ilość (g)"
                                                    value={amounts[`base-${p.id}`] || ""}
                                                    onChange={(e) =>
                                                        setAmounts({...amounts, [`base-${p.id}`]: e.target.value})
                                                    }
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleAddProduct(
                                                            productModal.mealId,
                                                            p.id,
                                                            amounts[`base-${p.id}`],
                                                            nutritionModal.date
                                                        )
                                                    }
                                                >
                                                    Dodaj
                                                </button>
                                            </div>
                                        ))}
                                </div>
                                <button className="close-btn" onClick={() => setProductModal({
                                    open: false,
                                    mealId: null,
                                    mealType: null
                                })}>Zamknij
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Modal user-products */}
                    {userProductModal.open && (
                        <div className="userproducts-overlay">
                            <div className="userproducts-modal">
                                <h2>Moje produkty</h2>
                                {allUserProducts.length === 0 ? (
                                    <div className="userproducts-no-products">
                                        <p>Nie masz jeszcze własnych produktów</p>
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type="text"
                                            placeholder="Szukaj w moich produktach..."
                                            value={search}
                                            onChange={(e) => setSearch(e.target.value)}
                                            className="userproducts-search"
                                        />
                                        <div className="userproducts-list">
                                            {allUserProducts
                                                .filter((p) =>
                                                    p.name.toLowerCase().includes(search.toLowerCase())
                                                )
                                                .map((p) => (
                                                    <div
                                                        key={`user-${p.id}`}
                                                        className="userproducts-item"
                                                    >
                  <span>
                    {p.name} ({p.calories} kcal / 100g)
                  </span>
                                                        <input
                                                            type="number"
                                                            placeholder="ilość (g)"
                                                            value={amounts[`user-${p.id}`] || ""}
                                                            onChange={(e) =>
                                                                setAmounts({
                                                                    ...amounts,
                                                                    [`user-${p.id}`]: e.target.value,
                                                                })
                                                            }
                                                        />
                                                        <button
                                                            className="userproducts-add"
                                                            onClick={() =>
                                                                handleAddProduct(
                                                                    userProductModal.mealId,
                                                                    p.id,
                                                                    amounts[`user-${p.id}`],
                                                                    nutritionModal.date
                                                                )
                                                            }
                                                        >
                                                            Dodaj
                                                        </button>
                                                        <button
                                                            className="userproducts-modify"
                                                            onClick={() => {
                                                                setNewUserProduct({
                                                                    id: p.id,
                                                                    name: p.name,
                                                                    protein: p.protein,
                                                                    carbs: p.carbs,
                                                                    fat: p.fat,
                                                                    calories: p.calories,
                                                                });
                                                                setAddUserProductModal({
                                                                    open: true,
                                                                    isEditing: true,
                                                                });
                                                            }}
                                                        >
                                                            Modyfikuj
                                                        </button>
                                                        <button
                                                            className="userproducts-delete"
                                                            onClick={() => handleDeleteUserProduct(p.id)}
                                                        >
                                                            Usuń
                                                        </button>
                                                    </div>
                                                ))}
                                        </div>
                                    </>
                                )}
                                <div className="userproducts-actions">
                                    <button
                                        onClick={() =>
                                            setAddUserProductModal({ open: true, isEditing: false })
                                        }
                                    >
                                        Dodaj nowy produkt
                                    </button>
                                </div>
                                <button
                                    className="userproducts-close"
                                    onClick={() =>
                                        setUserProductModal({
                                            open: false,
                                            mealId: null,
                                            mealType: null,
                                        })
                                    }
                                >
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Modal dodawania / edycji własnego produktu */}
                    {addUserProductModal.open && (
                        <div className="adduserproduct-overlay">
                            <div className="adduserproduct-modal">
                                <h2>{addUserProductModal.isEditing ? "Edytuj produkt" : "Dodaj własny produkt"}</h2>

                                <input
                                    type="text"
                                    placeholder="Nazwa produktu"
                                    value={newUserProduct.name}
                                    onChange={(e) => setNewUserProduct({...newUserProduct, name: e.target.value})}
                                    className="search-input"
                                />
                                <input
                                    type="number"
                                    placeholder="Białko (g/100g)"
                                    value={newUserProduct.protein}
                                    onChange={(e) => setNewUserProduct({...newUserProduct, protein: e.target.value})}
                                    className="search-input"
                                />
                                <input
                                    type="number"
                                    placeholder="Węglowodany (g/100g)"
                                    value={newUserProduct.carbs}
                                    onChange={(e) => setNewUserProduct({...newUserProduct, carbs: e.target.value})}
                                    className="search-input"
                                />
                                <input
                                    type="number"
                                    placeholder="Tłuszcz (g/100g)"
                                    value={newUserProduct.fat}
                                    onChange={(e) => setNewUserProduct({...newUserProduct, fat: e.target.value})}
                                    className="search-input"
                                />
                                <input
                                    type="number"
                                    placeholder="Kalorie (kcal/100g)"
                                    value={newUserProduct.calories}
                                    onChange={(e) => setNewUserProduct({...newUserProduct, calories: e.target.value})}
                                    className="search-input"
                                />

                                <div className="meal-buttons">
                                    <button
                                        className="modify-btn"
                                        onClick={
                                            addUserProductModal.isEditing
                                                ? handleModifyUserProduct
                                                : handleSaveUserProduct
                                        }
                                    >
                                        {addUserProductModal.isEditing ? "Zapisz zmiany" : "Zapisz"}
                                    </button>
                                </div>

                                <button
                                    className="adduserproduct-close"
                                    onClick={() => setAddUserProductModal({open: false, isEditing: false})}
                                >
                                    Anuluj
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Modal treningowy */}
                    {trainingModal.open && trainingModal.entry && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Dodaj trening - {formatYYYYMMDD(trainingModal.date)}</h2>

                                <div className="training-section">
                                    {trainingModal.entry.exercises && trainingModal.entry.exercises.length > 0 ? (
                                        <div className="training-exercises">
                                            {trainingModal.entry.exercises.map((ex) => (
                                                <div key={ex.id} className="exercise-item">
                                                    <div className="exercise-info">
                                                        <span className="exercise-name"><strong>{ex.name} </strong></span>
                                                        <span className="exercise-details">{ex.sets} serii {ex.repetitions} x </span>
                                                        <span className="exercise-weight"><strong>{ex.weight} kg</strong></span>
                                                    </div>
                                                    <div className="exercise-actions">
                                                        <button
                                                            className="btn-edit"
                                                            onClick={() =>
                                                                setEditExerciseModal({
                                                                    open: true,
                                                                    exercise: ex,
                                                                    dayId: trainingModal.entry.dayId,
                                                                    date: trainingModal.date,
                                                                })
                                                            }
                                                        >
                                                            Modyfikuj
                                                        </button>
                                                        <button
                                                            className="btn-delete"
                                                            onClick={() => handleDeleteExercise(ex.id)}
                                                        >
                                                            Usuń
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="no-exercises">Nie ma żadnych ćwiczeń w tym dniu</div>
                                    )}
                                </div>

                                <div className="training-buttons">
                                    <button
                                        onClick={() =>
                                            setExerciseModal({
                                                open: true,
                                                date: trainingModal.date,
                                                dayId: trainingModal.entry.dayId,
                                            })
                                        }
                                    >
                                        Dodaj ćwiczenie
                                    </button>
                                </div>

                                <button
                                    className="close-btn"
                                    onClick={() => setTrainingModal({ open: false, date: null, entry: null })}
                                >
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Modal wyboru ćwiczeń z templatek */}
                    {exerciseModal?.open && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Wybierz ćwiczenie</h2>
                                <input
                                    type="text"
                                    placeholder="Szukaj ćwiczenia..."
                                    value={exerciseSearch}
                                    onChange={(e) => setExerciseSearch(e.target.value)}
                                    className="search-input"
                                />

                                <div className="exercise-list">
                                    {allExerciseTemplates
                                        .filter((ex) => ex.name.toLowerCase().includes(exerciseSearch.toLowerCase()))
                                        .map((ex) => (
                                            <div key={ex.id} className="exercise-item">
                                                <span className="exercise-name">{ex.name}</span>

                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Serie"
                                                    value={ex._sets || ""}
                                                    onChange={(e) =>
                                                        setAllExerciseTemplates((prev) =>
                                                            prev.map((p) =>
                                                                p.id === ex.id ? { ...p, _sets: e.target.value } : p
                                                            )
                                                        )
                                                    }
                                                    className="exercise-input"
                                                />

                                                <input
                                                    type="number"
                                                    min="1"
                                                    placeholder="Powt."
                                                    value={ex._reps || ""}
                                                    onChange={(e) =>
                                                        setAllExerciseTemplates((prev) =>
                                                            prev.map((p) =>
                                                                p.id === ex.id ? { ...p, _reps: e.target.value } : p
                                                            )
                                                        )
                                                    }
                                                    className="exercise-input"
                                                />

                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.5"
                                                    placeholder="Waga (kg)"
                                                    value={ex._weight || ""}
                                                    onChange={(e) =>
                                                        setAllExerciseTemplates((prev) =>
                                                            prev.map((p) =>
                                                                p.id === ex.id ? { ...p, _weight: e.target.value } : p
                                                            )
                                                        )
                                                    }
                                                    className="exercise-input"
                                                />

                                                <button
                                                    className="btn-add"
                                                    onClick={() => handleAddExercise(ex, exerciseModal, setTrainingModal)}
                                                >
                                                    Dodaj
                                                </button>
                                            </div>
                                        ))}
                                </div>

                                <button
                                    className="close-btn"
                                    onClick={() => setExerciseModal({ open: false, date: null, dayId: null })}
                                >
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    )}

                    {editExerciseModal.open && (
                        <div className="edit-exercise-overlay">
                            <div className="edit-exercise-content">
                                <h2>Modyfikacja ćwiczenia - {editExerciseModal.exercise.name}</h2>

                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Serie"
                                    value={editExerciseModal.exercise._sets || ""}
                                    onChange={(e) =>
                                        setEditExerciseModal(prev => ({
                                            ...prev,
                                            exercise: { ...prev.exercise, _sets: e.target.value },
                                        }))
                                    }
                                    className="exercise-input"
                                />

                                <input
                                    type="number"
                                    min="1"
                                    placeholder="Powtórzenia"
                                    value={editExerciseModal.exercise._reps || ""}
                                    onChange={(e) =>
                                        setEditExerciseModal(prev => ({
                                            ...prev,
                                            exercise: { ...prev.exercise, _reps: e.target.value },
                                        }))
                                    }
                                    className="exercise-input"
                                />

                                <input
                                    type="number"
                                    min="0"
                                    step="0.5"
                                    placeholder="Waga (kg)"
                                    value={editExerciseModal.exercise._weight || ""}
                                    onChange={(e) =>
                                        setEditExerciseModal(prev => ({
                                            ...prev,
                                            exercise: { ...prev.exercise, _weight: e.target.value },
                                        }))
                                    }
                                    className="exercise-input"
                                />

                                <div className="meal-buttons">
                                    <button className="modify-btn" onClick={handleModifyExercise}>Zapisz zmiany</button>
                                    <button
                                        className="close-btn"
                                        onClick={() => setEditExerciseModal({ open: false, exercise: null, dayId: null, date: null })}
                                    >
                                        Anuluj
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <button className="month-nav" onClick={goPrev} aria-label="Poprzedni miesiąc">◀</button>
                    <div className="month-title">{monthTitle}</div>
                    <button className="month-nav" onClick={goNext} aria-label="Następny miesiąc">▶</button>
                </div>

                {/* Nagłówki dni tygodnia */}
                <div className="calendar-weekdays">
                    {weekDays.map((wd) => (
                        <div key={wd} className="calendar-weekday">
                            {wd}
                        </div>
                    ))}
                </div>

                {/* Siatka dni */}
                <div className="calendar-grid">
                    {cells.map((cell, idx) => {
                        if (!cell) return <div key={`empty-${idx}`} className="calendar-day empty"/>;

                        const {date, entry} = cell;
                        const today = new Date();
                        const isToday = date.toDateString() === today.toDateString();
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                        let cls = "calendar-day";
                        if (isToday) cls += " today";
                        else if (isWeekend) cls += " weekend";

                        return (
                            <div key={formatYYYYMMDD(date)} className={cls}>
                                <div className="day-number">{date.getDate()}</div>

                                <div className="day-content">
                                    {entry && entry.exercises && entry.exercises.length > 0 ? (
                                        <div className="entry-indicator training">Dzień treningowy</div>
                                    ) : (
                                        <div className="entry-empty rest">Odpoczynek</div>
                                    )}
                                    {entry && entry.meals && entry.meals.length > 0 && (() => {
                                        const totals = getDayTotals(entry);
                                        return (
                                            <div className="day-totals">
                                                kcal: {totals.calories.toFixed(2)}, B: {totals.protein.toFixed(2)}g,
                                                W: {totals.carbs.toFixed(2)}g, T: {totals.fat.toFixed(2)}g
                                            </div>
                                        );
                                    })()}
                                </div>

                                <div className="day-actions">
                                    <button
                                        className="day-btn nutrition"
                                        onClick={() => setNutritionModal({open: true, date, entry})}
                                    >
                                        Żywienie
                                    </button>
                                    <button
                                        className="day-btn training"
                                        onClick={() => setTrainingModal({ open: true, date, entry })}
                                    >
                                        Trening
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}