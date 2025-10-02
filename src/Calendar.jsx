import React, {useEffect, useMemo, useState} from "react";
import {addMealProduct, getAllProducts, getUserCaloricRequisition, getUserDays} from "./api";
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
    const [allProducts, setAllProducts] = useState([]);
    const [search, setSearch] = useState("");
    const [amounts, setAmounts] = useState({});


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

    const goPrev = () => setCurrentMonth(new Date(year, monthIndex - 1, 1));
    const goNext = () => setCurrentMonth(new Date(year, monthIndex + 1, 1));

    const handleAddProduct = async (mealId, productId, amount) => {
        const parsedAmount = Number(amount);

        if (!parsedAmount || parsedAmount <= 0) {
            alert("Podaj poprawną ilość produktu");
            return;
        }

        console.log({ meal_id: mealId, product_id: productId, amount: parsedAmount });

        try {
            const updatedMeal = await addMealProduct(mealId, productId, parsedAmount);

            // Aktualizacja stanu nutritionModal w bezpieczny sposób
            setNutritionModal((prev) => {
                if (!prev.entry) return prev;

                const meals = prev.entry.meals.map((meal) =>
                    meal.id === updatedMeal.id ? updatedMeal : meal
                );

                return {
                    ...prev,
                    entry: {
                        ...prev.entry,
                        meals,
                    },
                };
            });

            // Czyszczenie pola ilości dla tego produktu
            setAmounts((prev) => ({ ...prev, [productId]: "" }));
        } catch (error) {
            console.error("Błąd podczas dodawania produktu:", error);
            alert(error.message || "Nie udało się dodać produktu");
        }
    };

    return (
        <div className="calendar-container">
            {user && (
                <div className="calendar-topline">
                    <h2 className="calendar-user">
                        {user.firstName} {user.lastName}
                    </h2>
                    {CaloricRequisition !== null && (
                        <div className="calendar-calories">
                            Zapotrzebowanie dzienne: {CaloricRequisition} kcal
                        </div>
                    )}
                </div>
            )}

            <div className="calendar-card">
                {/* Nagłówek miesiąca z przyciskami */}
                <div className="calendar-header">
                    {nutritionModal.open && nutritionModal.entry && (
                        <div className="modal-overlay">
                            <div className="modal-content">
                                <h2>Dodaj posiłek - {formatYYYYMMDD(nutritionModal.date)}</h2>

                                {nutritionModal.entry.meals.map((meal) => (
                                    <div key={meal.id} className="meal-section">
                                        <h3>{meal.description}</h3>
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
                                                    console.log(`${meal.description} - produkt użytkownika`)
                                                }
                                            >
                                                Moje produkty
                                            </button>
                                        </div>
                                            <hr className="meal-divider" />
                                    </div>
                                ))}

                                <button
                                    className="close-btn"
                                    onClick={() =>
                                        setNutritionModal({ open: false, date: null, entry: null })
                                    }
                                >
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    )}

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
                                        .filter((p) =>
                                            p.name.toLowerCase().includes(search.toLowerCase())
                                        )
                                        .map((p) => (
                                            <div key={p.id} className="product-item">
                            <span>
                                {p.name} ({p.calories} kcal / 100g)
                            </span>
                                                <input
                                                    type="number"
                                                    placeholder="ilość (g)"
                                                    value={amounts[p.id] || ""}
                                                    onChange={(e) =>
                                                        setAmounts({...amounts, [p.id]: e.target.value})
                                                    }
                                                />
                                                <button
                                                    onClick={() =>
                                                        handleAddProduct(
                                                            productModal.mealId,
                                                            p.id,
                                                            amounts[p.id]
                                                        )
                                                    }
                                                >
                                                    Dodaj
                                                </button>
                                            </div>
                                        ))}
                                </div>

                                <button
                                    className="close-btn"
                                    onClick={() =>
                                        setProductModal({open: false, mealId: null, mealType: null})
                                    }
                                >
                                    Zamknij
                                </button>
                            </div>
                        </div>
                    )}
                    <button className="month-nav" onClick={goPrev} aria-label="Poprzedni miesiąc">
                        ◀
                    </button>
                    <div className="month-title">{monthTitle}</div>
                    <button className="month-nav" onClick={goNext} aria-label="Następny miesiąc">
                        ▶
                    </button>
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
                                        onClick={() => console.log("Trening:", entry)}
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