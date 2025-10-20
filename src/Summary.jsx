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
    const today = new Date();
    /** --- DIETA --- **/
    const [rangeNutrition, setRangeNutrition] = useState("week");
    const [selectedDayIdNutrition, setSelectedDayIdNutrition] = useState(null);
    const [selectedWeekNutrition, setSelectedWeekNutrition] = useState({ start: null, end: null });
    const [selectedMonthNutrition, setSelectedMonthNutrition] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
    const [selectedWeekInputNutrition, setSelectedWeekInputNutrition] = useState("");
    const [chartDataNutrition, setChartDataNutrition] = useState([]);
    const [summaryNutrition, setSummaryNutrition] = useState(null);
    const [loadingNutrition, setLoadingNutrition] = useState(false);

    /** --- TRENING --- **/
    const [rangeTraining, setRangeTraining] = useState("week");
    const [selectedDayIdTraining, setSelectedDayIdTraining] = useState(null);
    const [selectedWeekTraining, setSelectedWeekTraining] = useState({ start: null, end: null });
    const [selectedMonthTraining, setSelectedMonthTraining] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
    const [selectedWeekInputTraining, setSelectedWeekInputTraining] = useState("");
    const [chartDataTraining, setChartDataTraining] = useState([]);
    const [summaryTraining, setSummaryTraining] = useState(null);
    const [loadingTraining, setLoadingTraining] = useState(false);

    const [userDays, setUserDays] = useState([]);
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
            if (todayEntry){
                setSelectedDayIdNutrition(todayEntry.dayId);
                setSelectedDayIdTraining(todayEntry.dayId);
            }
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

    useEffect(() => { loadNutritionData(); }, [user, rangeNutrition, selectedDayIdNutrition, selectedWeekNutrition, selectedMonthNutrition]);
    useEffect(() => { loadTrainingData(); }, [user, rangeTraining, selectedDayIdTraining, selectedWeekTraining, selectedMonthTraining]);

    useEffect(() => {
        const year = today.getFullYear();
        const week = getWeekNumber(today);
        const start = getDateOfISOWeek(week, year);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);

        setSelectedWeekInputNutrition(`${year}-W${String(week).padStart(2, "0")}`);
        setSelectedWeekNutrition({ start, end: end.toISOString().split("T")[0] });

        setSelectedWeekInputTraining(`${year}-W${String(week).padStart(2, "0")}`);
        setSelectedWeekTraining({ start, end: end.toISOString().split("T")[0] });
    }, []);

    async function loadNutritionData() {
        if (!user) return;
        setLoadingNutrition(true);
        try {
            let data = null;
            if (rangeNutrition === "day" && selectedDayIdNutrition) {
                data = await getDaySummary(selectedDayIdNutrition);
            } else if (rangeNutrition === "week") {
                data = await getWeekSummary(user.id, selectedWeekNutrition.start, selectedWeekNutrition.end);
            } else if (rangeNutrition === "month") {
                data = await getMonthSummary(user.id, selectedMonthNutrition.year, selectedMonthNutrition.month);
            }

            if (!data) {
                setChartDataNutrition([]);
                setSummaryNutrition(null);
                return;
            }

            setChartDataNutrition(data.chartData || []);
            setSummaryNutrition({
                calories: parseFloat(data.avgCalories ?? data.totalCalories ?? 0),
                protein: parseFloat(data.avgProtein ?? data.totalProtein ?? 0),
                carbs: parseFloat(data.avgCarbs ?? data.totalCarbs ?? 0),
                fat: parseFloat(data.avgFat ?? data.totalFat ?? 0),
            });
        } catch (err) { console.error(err); }
        finally { setLoadingNutrition(false); }
    }

    async function loadTrainingData() {
        if (!user) return;
        setLoadingTraining(true);
        try {
            let data = null;
            if (rangeTraining === "day" && selectedDayIdTraining) {
                data = await getDayExerciseSummary(selectedDayIdTraining);
            } else if (rangeTraining === "week") {
                data = await getWeekExerciseSummary(user.id, selectedWeekTraining.start, selectedWeekTraining.end);
            } else if (rangeTraining === "month") {
                data = await getMonthExerciseSummary(user.id, selectedMonthTraining.year, selectedMonthTraining.month);
            }

            if (!data) {
                setChartDataTraining([]);
                setSummaryTraining(null);
                return;
            }

            setChartDataTraining(data.chartData || []);
            setSummaryTraining({
                avgVolume: parseFloat(data.avgVolume ?? 0),
                totalVolume: parseFloat(data.totalVolume ?? 0),
            });
        } catch (err) { console.error(err); }
        finally { setLoadingTraining(false); }
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

    const renderChart = (tab) => {
        const chartData = tab === "nutrition" ? chartDataNutrition : chartDataTraining;
        const range = tab === "nutrition" ? rangeNutrition : rangeTraining;

        if (chartData.length === 0 && range !== "day") return <p className="summary-empty">Brak danych do wyświetlenia.</p>;

        if (tab === "nutrition" && range === "day" && summaryNutrition) {
            const hasData = summaryNutrition.protein > 0 || summaryNutrition.carbs > 0 || summaryNutrition.fat > 0;
            if (!hasData) return <p className="summary-empty">Brak danych do wyświetlenia.</p>;
            const pieData = [
                { name: "Białko", value: summaryNutrition.protein },
                { name: "Węgle", value: summaryNutrition.carbs },
                { name: "Tłuszcze", value: summaryNutrition.fat },
            ];
            return (
                <div className="summary-piechart">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={pieData}
                                dataKey="value"
                                nameKey="name"
                                outerRadius="80%"
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                            >
                                <Cell fill="#3b82f6"/>
                                <Cell fill="#22c55e"/>
                                <Cell fill="#eab308"/>
                            </Pie>
                            <Tooltip formatter={(value) => `${value.toFixed(1)} g`}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            );
        }

        // DIETA – wykres słupkowy kcal
        if (tab === "nutrition" && (range === "week" || range === "month")) {
            const kcalData = chartData.map(d => {
                const proteinKcal = (d.protein ?? 0) * 4;
                const carbsKcal = (d.carbs ?? 0) * 4;
                const fatKcal = (d.fat ?? 0) * 9;
                return { ...d, proteinKcal, carbsKcal, fatKcal, totalKcal: proteinKcal + carbsKcal + fatKcal };
            });

            const CustomTooltip = ({ active, payload, label }) => {
                if (!active || !payload || payload.length === 0) return null;
                const total = payload[0].payload.totalKcal ?? 0;
                return (
                    <div className="bg-white p-3 rounded-lg shadow-md text-sm border border-gray-200">
                        <p className="font-semibold mb-2">{label}</p>
                        {payload.map(entry => {
                            const value = entry.value ?? 0;
                            const percent = total ? ((value / total) * 100).toFixed(1) : 0;
                            const name = entry.dataKey === "proteinKcal" ? "Białko" : entry.dataKey === "carbsKcal" ? "Węgle" : "Tłuszcze";
                            const color = entry.dataKey === "proteinKcal" ? "#3b82f6" : entry.dataKey === "carbsKcal" ? "#22c55e" : "#eab308";
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
                    <BarChart data={kcalData} barSize={40} barCategoryGap="20%" margin={{top: 20, right: 30, left: 20, bottom: 20}}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="date"/>
                        <YAxis domain={[0, 5000]}/>
                        <Tooltip content={<CustomTooltip/>}/>
                        <Legend payload={[
                            { value: "Białko", type: "square", color: "#3b82f6" },
                            { value: "Węgle", type: "square", color: "#22c55e" },
                            { value: "Tłuszcze", type: "square", color: "#eab308" },
                        ]}/>
                        <Bar dataKey="proteinKcal" stackId="a" fill="#3b82f6"/>
                        <Bar dataKey="carbsKcal" stackId="a" fill="#22c55e"/>
                        <Bar dataKey="fatKcal" stackId="a" fill="#eab308"/>
                        {caloricRequisition && <ReferenceLine y={caloricRequisition} stroke="red" strokeDasharray="3 3" label={{ position: 'right', fill: 'red', fontSize: 12 }}/>}
                    </BarChart>
                </ResponsiveContainer>
            );
        }

        // TRENING – wykres liniowy
        if (tab === "training" && (range === "week" || range === "month")) {
            const CustomTooltipTraining = ({active, payload, label}) => {
                if (!active || !payload || payload.length === 0) return null;

                return (
                    <div className="bg-white p-3 rounded-lg shadow-md text-sm border border-gray-200">
                        <p className="font-semibold mb-2">{label}</p>
                        {payload.map(entry => (
                            <div key={entry.dataKey} className="flex justify-between items-center mb-1">
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{backgroundColor: entry.color}}></span>
                            <span style={{color: entry.color}}>{entry.name}:</span>
                        </span>
                                <span> {entry.value.toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                );
            };

            return (
                <ResponsiveContainer width="100%" height={350}>
                    <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3"/>
                        <XAxis dataKey="date"/>
                        <YAxis/>
                        <Tooltip content={<CustomTooltipTraining/>}/>
                        <Legend/>
                        <Line type="monotone" dataKey="totalVolume" name="Objętość (kg)" stroke="#22c55e"
                              strokeWidth={2}/>
                        <Line type="monotone" dataKey="avgWeight" name="Śr. ciężar (kg)" stroke="#3b82f6"
                              strokeWidth={2}/>
                    </LineChart>
                </ResponsiveContainer>
            );
        }

        return <p className="summary-empty">Brak danych do wyświetlenia.</p>;
    };

    return (
        <div className="summary-container">
            <h1 className="summary-title">Podsumowania</h1>

            <div className="summary-sections">
                {/* DIETA */}
                <div className="summary-section">
                    <h2 className="summary-section-title">Analiza diety</h2>

                    <div className="summary-range">
                        {["day", "week", "month"].map(r => (
                            <button
                                key={`nutrition-${r}`}
                                className={`summary-range-btn ${rangeNutrition === r ? "active" : ""}`}
                                onClick={() => setRangeNutrition(r)}
                            >
                                {r === "day" ? "Dzień" : r === "week" ? "Tydzień" : "Miesiąc"}
                            </button>
                        ))}
                    </div>

                    {/* Wybór daty / tygodnia / miesiąca */}
                    {rangeNutrition === "day" && (
                        <input
                            type="date"
                            value={selectedDayIdNutrition ? userDays.find(d => d.dayId === selectedDayIdNutrition)?.day : ""}
                            onChange={e => {
                                const dayEntry = userDays.find(d => d.day === e.target.value);
                                if (dayEntry) setSelectedDayIdNutrition(dayEntry.dayId);
                            }}
                            min={userDays[0]?.day}
                            max={userDays[userDays.length - 1]?.day}
                        />
                    )}

                    {rangeNutrition === "week" && (
                        <input
                            type="week"
                            value={selectedWeekInputNutrition}
                            onChange={e => {
                                const value = e.target.value;
                                setSelectedWeekInputNutrition(value);
                                const [year, week] = value.split("-W");
                                const start = getDateOfISOWeek(parseInt(week), parseInt(year));
                                const end = new Date(start); end.setDate(end.getDate() + 6);
                                setSelectedWeekNutrition({ start, end: end.toISOString().split("T")[0] });
                            }}
                        />
                    )}

                    {rangeNutrition === "month" && userDays.length > 0 && (
                        <input
                            type="month"
                            value={`${selectedMonthNutrition.year}-${String(selectedMonthNutrition.month).padStart(2, "0")}`}
                            min={userDays[0].day.slice(0, 7)}
                            max={userDays[userDays.length - 1].day.slice(0, 7)}
                            onChange={e => {
                                const [year, month] = e.target.value.split("-");
                                setSelectedMonthNutrition({ year: parseInt(year), month: parseInt(month) });
                            }}
                        />
                    )}

                    {loadingNutrition ? (
                        <p className="summary-loading">Ładowanie danych...</p>
                    ) : (
                        <>
                            {/* Dzień: karty + PieChart */}
                            {summaryNutrition && rangeNutrition === "day" && (
                                <>
                                    <div className="summary-cards nutrition">
                                        <SummaryCard title="Kalorie" value={summaryNutrition.calories} unit="kcal" color="orange"/>
                                        <SummaryCard title="Białko" value={summaryNutrition.protein} unit="g" color="blue"/>
                                        <SummaryCard title="Węgle" value={summaryNutrition.carbs} unit="g" color="green"/>
                                        <SummaryCard title="Tłuszcze" value={summaryNutrition.fat} unit="g" color="yellow"/>
                                    </div>
                                    <div className="summary-chart">
                                        {renderChart("nutrition")}
                                    </div>
                                </>
                            )}

                            {/* Tydzień / Miesiąc: wykres słupkowy */}
                            {(rangeNutrition === "week" || rangeNutrition === "month") && renderChart("nutrition")}
                        </>
                    )}
                </div>

                {/* TRENING */}
                <div className="summary-section">
                    <h2 className="summary-section-title">Analiza treningu</h2>

                    <div className="summary-range">
                        {["day", "week", "month"].map(r => (
                            <button
                                key={`training-${r}`}
                                className={`summary-range-btn ${rangeTraining === r ? "active" : ""}`}
                                onClick={() => setRangeTraining(r)}
                            >
                                {r === "day" ? "Dzień" : r === "week" ? "Tydzień" : "Miesiąc"}
                            </button>
                        ))}
                    </div>

                    {rangeTraining === "day" && (
                        <input
                            type="date"
                            value={selectedDayIdTraining ? userDays.find(d => d.dayId === selectedDayIdTraining)?.day : ""}
                            onChange={e => {
                                const dayEntry = userDays.find(d => d.day === e.target.value);
                                if (dayEntry) setSelectedDayIdTraining(dayEntry.dayId);
                            }}
                            min={userDays[0]?.day}
                            max={userDays[userDays.length - 1]?.day}
                        />
                    )}

                    {rangeTraining === "week" && (
                        <input
                            type="week"
                            value={selectedWeekInputTraining}
                            onChange={e => {
                                const value = e.target.value;
                                setSelectedWeekInputTraining(value);
                                const [year, week] = value.split("-W");
                                const start = getDateOfISOWeek(parseInt(week), parseInt(year));
                                const end = new Date(start); end.setDate(end.getDate() + 6);
                                setSelectedWeekTraining({ start, end: end.toISOString().split("T")[0] });
                            }}
                        />
                    )}

                    {rangeTraining === "month" && userDays.length > 0 && (
                        <input
                            type="month"
                            value={`${selectedMonthTraining.year}-${String(selectedMonthTraining.month).padStart(2, "0")}`}
                            min={userDays[0].day.slice(0, 7)}
                            max={userDays[userDays.length - 1].day.slice(0, 7)}
                            onChange={e => {
                                const [year, month] = e.target.value.split("-");
                                setSelectedMonthTraining({ year: parseInt(year), month: parseInt(month) });
                            }}
                        />
                    )}

                    {loadingTraining ? <p className="summary-loading">Ładowanie danych...</p> : (
                        <>
                            {summaryTraining && rangeTraining === "day" && (
                                <div className="summary-cards training">
                                    <SummaryCard title="Objętość" value={summaryTraining.totalVolume} unit="kg" color="green"/>
                                    <SummaryCard title="Śr. objętość" value={summaryTraining.avgVolume} unit="kg/dzień" color="blue"/>
                                </div>
                            )}
                            {(rangeTraining === "week" || rangeTraining === "month") && renderChart("training")}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function SummaryCard({ title, value, unit, color }) {
    return (
        <div className={`summary-card ${color}`}>
            <h3 className="summary-card-title">{title}</h3>
            <p className="summary-card-value">{(Number(value) || 0).toFixed(1)}</p>
            <p className="summary-card-unit">{unit}</p>
        </div>
    );
}