import React, { useEffect, useState } from "react";
import {
    getDaySummary,
    getWeekSummary,
    getMonthSummary,
    getDayExerciseSummary,
    getWeekExerciseSummary,
    getMonthExerciseSummary,
    getUserDays, getUserCaloricRequisition,
} from "./api";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell, BarChart, Bar, ReferenceLine,
} from "recharts";
import "./Summary.css";

export default function Summary() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("nutrition");
    const [range, setRange] = useState("week");
    const [chartData, setChartData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [today, setToday] = useState(new Date());
    const [userDays, setUserDays] = useState([]);
    const [selectedDayId, setSelectedDayId] = useState(null);
    const [selectedWeek, setSelectedWeek] = useState({ start: null, end: null });
    const [selectedMonth, setSelectedMonth] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
    const [selectedWeekInput, setSelectedWeekInput] = useState("");
    const [caloricRequisition, setCaloricRequisition] = useState(null);

    useEffect(() => {
        const storedUser = sessionStorage.getItem("sb_user");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
        }
    }, []);

    useEffect(() => {
        async function fetchUserDays() {
            if (!user) return;
            const days = await getUserDays();
            setUserDays(days);

            const todayStr = new Date().toISOString().split("T")[0];
            const todayEntry = days.find(d => d.day.startsWith(todayStr));
            if (todayEntry) setSelectedDayId(todayEntry.dayId);
        }
        fetchUserDays();
    }, [user]);

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
        loadData();
    }, [activeTab, range, user, selectedDayId, selectedWeek, selectedMonth]);

    useEffect(() => {
        const today = new Date();
        const year = today.getFullYear();
        const week = getWeekNumber(today);
        setSelectedWeekInput(`${year}-W${String(week).padStart(2, "0")}`);

        const start = getDateOfISOWeek(week, year);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        setSelectedWeek({ start, end: end.toISOString().split("T")[0] });
    }, []);

    async function loadData() {
        if (!user) return;
        setLoading(true);
        try {
            let data = null;

            if (activeTab === "nutrition") {
                if (range === "day" && selectedDayId) {
                    data = await getDaySummary(selectedDayId);
                } else if (range === "week") {
                    data = await getWeekSummary(user.id, selectedWeek.start, selectedWeek.end);
                } else if (range === "month") {
                    data = await getMonthSummary(user.id, selectedMonth.year, selectedMonth.month);
                }
            } else {
                if (range === "day" && selectedDayId) {
                    data = await getDayExerciseSummary(selectedDayId);
                } else if (range === "week") {
                    data = await getWeekExerciseSummary(user.id, selectedWeek.start, selectedWeek.end);
                } else if (range === "month") {
                    data = await getMonthExerciseSummary(user.id, selectedMonth.year, selectedMonth.month);
                }
            }

            if (!data) {
                setChartData([]);
                setSummary(null);
                return;
            }

            if (activeTab === "nutrition") {
                setChartData(data.chartData || []);
                setSummary({
                    calories: parseFloat(data.avgCalories ?? data.totalCalories ?? 0),
                    protein: parseFloat(data.avgProtein ?? data.totalProtein ?? 0),
                    carbs: parseFloat(data.avgCarbs ?? data.totalCarbs ?? 0),
                    fat: parseFloat(data.avgFat ?? data.totalFat ?? 0),
                });
            } else {
                setChartData(data.chartData || []);
                setSummary({
                    avgVolume: data.avgVolume ?? 0,
                    totalVolume: data.totalVolume ?? 0,
                });
            }
        } catch (err) {
            console.error("Błąd ładowania danych:", err);
        } finally {
            setLoading(false);
        }
    }

    function getWeekNumber(d) {
        const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
        const dayNum = date.getUTCDay() || 7;
        date.setUTCDate(date.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
        return Math.ceil((((date - yearStart) / 86400000) + 1) / 7);
    }

    function getDateOfISOWeek(week, year) {
        const simple = new Date(Date.UTC(year, 0, 1 + (week - 1) * 7));
        const dayOfWeek = simple.getUTCDay();
        const ISOweekStart = new Date(simple);
        if (dayOfWeek <= 4)
            ISOweekStart.setUTCDate(simple.getUTCDate() - simple.getUTCDay() + 1);
        else
            ISOweekStart.setUTCDate(simple.getUTCDate() + 8 - simple.getUTCDay());
        return ISOweekStart.toISOString().split("T")[0];
    }

    const renderChart = () => {
        if (chartData.length === 0)
            return <p className="summary-empty">Brak danych do wyświetlenia.</p>;

        if ((range === "week" || range === "month") && activeTab === "nutrition") {
            const kcalData = chartData.map(d => {
                const proteinKcal = (d.protein ?? 0) * 4;
                const carbsKcal = (d.carbs ?? 0) * 4;
                const fatKcal = (d.fat ?? 0) * 9;
                const totalKcal = proteinKcal + carbsKcal + fatKcal;
                return { ...d, proteinKcal, carbsKcal, fatKcal, totalKcal };
            });

            const CustomTooltip = ({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;

                const total = payload[0].payload.totalKcal ?? 0;

                return (
                    <div className="bg-white p-3 rounded-lg shadow-md text-sm border border-gray-200">
                        <p className="font-semibold mb-2">{label}</p>
                        {payload.map((entry) => {
                            const value = entry.value ?? 0;
                            const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                            const name =
                                entry.dataKey === "proteinKcal"
                                    ? "Białko"
                                    : entry.dataKey === "carbsKcal"
                                        ? "Węgle"
                                        : "Tłuszcze";
                            const color =
                                entry.dataKey === "proteinKcal"
                                    ? "#3b82f6"
                                    : entry.dataKey === "carbsKcal"
                                        ? "#22c55e"
                                        : "#eab308";
                            return (
                                <div key={entry.dataKey} className="flex justify-between items-center mb-1">
                            <span className="flex items-center gap-2">
                                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></span>
                                <span style={{ color }}>{name}:</span>
                            </span>
                                    <span> {value.toFixed(0)} kcal ({percent}%)</span>
                                </div>
                            );
                        })}
                        <p className="mt-2 text-gray-500 border-t pt-1">
                            <strong>Razem:</strong> {total.toFixed(0)} kcal
                        </p>
                    </div>
                );
            };

            return (
                <ResponsiveContainer width="100%" height={400}>
                    <BarChart
                        data={kcalData}
                        barSize={40}
                        barCategoryGap="20%"
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 5000]} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            payload={[
                                { value: "Białko", type: "square", color: "#3b82f6" },
                                { value: "Węgle", type: "square", color: "#22c55e" },
                                { value: "Tłuszcze", type: "square", color: "#eab308" },
                            ]}
                        />
                        <Bar dataKey="proteinKcal" stackId="a" fill="#3b82f6" />
                        <Bar dataKey="carbsKcal" stackId="a" fill="#22c55e" />
                        <Bar dataKey="fatKcal" stackId="a" fill="#eab308" />

                        {caloricRequisition && (
                            <ReferenceLine
                                y={caloricRequisition}
                                stroke="red"
                                strokeDasharray="3 3"
                                label={{ position: 'right', fill: 'red', fontSize: 12 }}
                            />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            );
        }

        // Wykres liniowy dla tygodnia/miesiąca (Kalorie, Białko, Węgle, Tłuszcze)
        if (activeTab === "nutrition") {
            return (
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis domain={[0, 5000]} /> {/* Skala Y do 5000 kcal */}
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="calories" name="Kalorie" stroke="#f97316" />
                        <Line type="monotone" dataKey="protein" name="Białko" stroke="#3b82f6" />
                        <Line type="monotone" dataKey="carbs" name="Węgle" stroke="#22c55e" />
                        <Line type="monotone" dataKey="fat" name="Tłuszcze" stroke="#eab308" />

                        {caloricRequisition && (
                            <ReferenceLine
                                y={caloricRequisition}
                                stroke="red"
                                strokeDasharray="3 3"
                                label={{ value: 'Zapotrzebowanie', position: 'right', fill: 'red', fontSize: 12 }}
                            />
                        )}
                    </LineChart>
                </ResponsiveContainer>
            );
        }
    };

    return (
        <div className="summary-container">
            <h1 className="summary-title">Podsumowania</h1>

            {/* Zakładki */}
            <div className="summary-tabs">
                <button
                    className={`summary-tab ${activeTab === "nutrition" ? "active" : ""}`}
                    onClick={() => setActiveTab("nutrition")}
                >
                    Żywienie
                </button>
                <button
                    className={`summary-tab ${activeTab === "training" ? "active" : ""}`}
                    onClick={() => setActiveTab("training")}
                >
                    Trening
                </button>
            </div>

            {/* Zakres */}
            <div className="summary-range">
                {["day", "week", "month"].map((r) => (
                    <button
                        key={r}
                        className={`summary-range-btn ${range === r ? "active" : ""}`}
                        onClick={() => setRange(r)}
                    >
                        {r === "day" ? "Dzień" : r === "week" ? "Tydzień" : "Miesiąc"}
                    </button>
                ))}
            </div>

            {/* Wybór dnia */}
            {range === "day" && (
                <input
                    type="date"
                    value={selectedDayId ? userDays.find(d => d.dayId === selectedDayId)?.day : ""}
                    onChange={e => {
                        const selectedDate = e.target.value;
                        const dayEntry = userDays.find(d => d.day === selectedDate);
                        if (dayEntry) setSelectedDayId(dayEntry.dayId);
                    }}
                    min={userDays[0].day}
                    max={userDays[userDays.length - 1].day}
                />
            )}

            {/* Wybór tygodnia */}
            {range === "week" && (
                <input
                    type="week"
                    value={selectedWeekInput}
                    onChange={(e) => {
                        const value = e.target.value; // np. "2025-W41"
                        setSelectedWeekInput(value);

                        const [year, week] = value.split("-W");
                        const firstDay = getDateOfISOWeek(parseInt(week), parseInt(year));
                        const endDay = new Date(firstDay);
                        endDay.setDate(endDay.getDate() + 6);

                        setSelectedWeek({
                            start: firstDay,
                            end: endDay.toISOString().split("T")[0],
                        });
                    }}
                />
            )}

            {/* Wybór miesiąca */}
            {range === "month" && userDays.length > 0 && (
                <input
                    type="month"
                    value={`${selectedMonth.year}-${String(selectedMonth.month).padStart(2, "0")}`}
                    min={userDays[0].day.slice(0, 7)}
                    max={userDays[userDays.length - 1].day.slice(0, 7)}
                    onChange={e => {
                        const [year, month] = e.target.value.split("-");
                        setSelectedMonth({ year: parseInt(year), month: parseInt(month) });
                    }}
                />
            )}

            {loading ? (
                <p className="summary-loading">Ładowanie danych...</p>
            ) : (
                <>
                    {summary && range === "day" && (
                        <div className={`summary-cards ${activeTab === "nutrition" ? "nutrition" : "training"}`}>
                            {activeTab === "nutrition" ? (
                                <>
                                    <SummaryCard title="Kalorie" value={summary.calories.toFixed(1)} unit="kcal" color="orange" />
                                    <SummaryCard title="Białko" value={summary.protein.toFixed(1)} unit="g" color="blue" />
                                    <SummaryCard title="Węgle" value={summary.carbs.toFixed(1)} unit="g" color="green" />
                                    <SummaryCard title="Tłuszcze" value={summary.fat.toFixed(1)} unit="g" color="yellow" />
                                </>
                            ) : (
                                <>
                                    <SummaryCard title="Objętość" value={summary.totalVolume.toFixed(1)} unit="kg" color="green" />
                                    <SummaryCard title="Śr. objętość" value={summary.avgVolume.toFixed(1)} unit="kg/dzień" color="blue" />
                                </>
                            )}
                        </div>
                    )}

                    {/* Wykres kołowy tylko dla dnia i zakładki żywienie */}
                    {activeTab === "nutrition" && range === "day" && summary && (
                        <div className="summary-piechart">
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={[
                                            { name: "Białko", value: summary.protein },
                                            { name: "Węgle", value: summary.carbs },
                                            { name: "Tłuszcze", value: summary.fat },
                                        ]}
                                        dataKey="value"
                                        nameKey="name"
                                        outerRadius={100}
                                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                                    >
                                        <Cell fill="#3b82f6" />
                                        <Cell fill="#22c55e" />
                                        <Cell fill="#eab308" />
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {/* Wykres liniowy tylko dla tygodnia i miesiąca */}
                    {(range === "week" || range === "month" || activeTab === "training") &&
                        renderChart()
                    }
                </>
            )}
        </div>
    );
}

function SummaryCard({ title, value, unit, color }) {
    return (
        <div className={`summary-card ${color}`}>
            <h3 className="summary-card-title">{title}</h3>
            <p className="summary-card-value">{value ?? 0}</p>
            <p className="summary-card-unit">{unit}</p>
        </div>
    );
}