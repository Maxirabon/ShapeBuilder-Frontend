import React, {useEffect, useMemo, useState} from "react";
import { getUserDays } from "./api";
import "./Calendar.css";

/**
 * Prosty parser daty z backendu
 * @param {Object} item - obiekt dnia z backendu { dayId, day, modification_date }
 * @returns {Date} obiekt Date
 */
function parseDateFromServer(item) {
    return new Date(item.day);
}

/**
 * Formatuje datę do stringa YYYY-MM-DD
 */
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

    // polskie dni tygodnia (poniedziałek = 0)
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
        cells.push({ date, entry });
    }

    const monthTitle = capitalizeFirst(
        currentMonth.toLocaleString("pl-PL", { month: "long", year: "numeric" })
    );

    const goPrev = () => setCurrentMonth(new Date(year, monthIndex - 1, 1));
    const goNext = () => setCurrentMonth(new Date(year, monthIndex + 1, 1));

    return (
        <div className="calendar-container">
            {user && (
                <div className="calendar-topline">
                    <h2 className="calendar-user">
                        {user.firstName} {user.lastName}
                    </h2>
                </div>
            )}

            <div className="calendar-card">
                {/* Nagłówek miesiąca z przyciskami */}
                <div className="calendar-header">
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
                        if (!cell) return <div key={`empty-${idx}`} className="calendar-day empty" />;

                        const { date, entry } = cell;
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
                                        className="day-btn"
                                        onClick={() => console.log("Plan żywieniowy:", entry)}
                                    >
                                        Żywienie
                                    </button>
                                    <button
                                        className="day-btn"
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