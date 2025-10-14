import React, { useEffect, useState } from "react";
import {
    getDaySummary,
    getWeekSummary,
    getMonthSummary,
    getDayExerciseSummary,
    getWeekExerciseSummary,
    getMonthExerciseSummary, getUserDays,
} from "./api";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import "./Summary.css";

export default function Summary() {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState("nutrition");
    const [range, setRange] = useState("week");
    const [chartData, setChartData] = useState([]);
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [today, setToday] = useState(new Date());

    useEffect(() => {
        const storedUser = sessionStorage.getItem("sb_user");
        if (storedUser) {
            const parsed = JSON.parse(storedUser);
            setUser(parsed);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [activeTab, range, user]);

    async function loadData() {
        console.log("loadData called. user:", user);
        if (!user) return;
        setLoading(true);
        try {
            let data = null;
            let todayCalendarId = null;

            if (range === "day") {
                const days = await getUserDays();
                const todayStr = new Date().toISOString().split("T")[0];
                const todayEntry = days.find((d) => d.day.startsWith(todayStr));
                if (todayEntry) todayCalendarId = todayEntry.dayId;
            }

            const year = today.getFullYear();
            const month = today.getMonth() + 1;
            if (activeTab === "nutrition") {
                if (range === "day" && todayCalendarId) {
                    console.log("Fetching day nutrition summary for calendarId:", todayCalendarId);
                    data = await getDaySummary(todayCalendarId);
                    console.log("Received day nutrition summary:", data);
                } else if (range === "week") {
                    console.log("Fetching week nutrition summary for userId:", user.id);
                    data = await getWeekSummary(user.id);
                    console.log("Received week nutrition summary:", data);
                } else if (range === "month") {
                    console.log("Fetching month nutrition summary for userId:", user.id, "year:", year, "month:", month);
                    data = await getMonthSummary(user.id, year, month);
                    console.log("Received month nutrition summary:", data);
                }
            } else {
                if (range === "day" && todayCalendarId) {
                    console.log("Fetching day exercise summary for calendarId:", todayCalendarId);
                    data = await getDayExerciseSummary(todayCalendarId);
                    console.log("Received day exercise summary:", data);
                } else if (range === "week") {
                    console.log("Fetching week exercise summary for userId:", user.id);
                    data = await getWeekExerciseSummary(user.id);
                    console.log("Received week exercise summary:", data);
                } else if (range === "month") {
                    console.log("Fetching month exercise summary for userId:", user.id, "year:", year, "month:", month);
                    data = await getMonthExerciseSummary(user.id, year, month);
                    console.log("Received month exercise summary:", data);
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
                    calories: Math.round(data.avgCalories ?? data.totalCalories ?? 0),
                    protein: Math.round(data.avgProtein ?? data.totalProtein ?? 0),
                    carbs: Math.round(data.avgCarbs ?? data.totalCarbs ?? 0),
                    fat: Math.round(data.avgFat ?? data.totalFat ?? 0),
                });
            } else {
                setChartData(data.chartData || []);
                setSummary({
                    avgVolume: Math.round(data.avgVolume ?? 0),
                    totalVolume: Math.round(data.totalVolume ?? 0),
                });
            }
        } catch (err) {
            console.error("Błąd ładowania danych:", err);
        } finally {
            setLoading(false);
        }
    }

    const renderChart = () => {
        if (chartData.length === 0)
            return <p className="summary-empty">Brak danych do wyświetlenia.</p>;

        if (activeTab === "nutrition") {
            return (
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="calories" name="Kalorie" stroke="#f97316" />
                        <Line type="monotone" dataKey="protein" name="Białko" stroke="#3b82f6" />
                        <Line type="monotone" dataKey="carbs" name="Węgle" stroke="#22c55e" />
                        <Line type="monotone" dataKey="fat" name="Tłuszcze" stroke="#eab308" />
                    </LineChart>
                </ResponsiveContainer>
            );
        } else {
            return (
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="totalVolume" name="Objętość (kg)" stroke="#16a34a" />
                        <Line type="monotone" dataKey="avgWeight" name="Średni ciężar (kg)" stroke="#3b82f6" />
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

            {loading ? (
                <p className="summary-loading">Ładowanie danych...</p>
            ) : (
                <>
                    {summary && (
                        <div
                            className={`summary-cards ${
                                activeTab === "nutrition" ? "nutrition" : "training"
                            }`}
                        >
                            {activeTab === "nutrition" ? (
                                <>
                                    <SummaryCard title="Kalorie" value={summary.calories} unit="kcal" color="orange" />
                                    <SummaryCard title="Białko" value={summary.protein} unit="g" color="blue" />
                                    <SummaryCard title="Węgle" value={summary.carbs} unit="g" color="green" />
                                    <SummaryCard title="Tłuszcze" value={summary.fat} unit="g" color="yellow" />
                                </>
                            ) : (
                                <>
                                    <SummaryCard title="Objętość" value={summary.totalVolume} unit="kg" color="green" />
                                    <SummaryCard title="Śr. objętość" value={summary.avgVolume} unit="kg/dzień" color="blue" />
                                </>
                            )}
                        </div>
                    )}
                    {renderChart()}
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