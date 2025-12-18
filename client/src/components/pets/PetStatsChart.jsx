import React, { useState, useEffect } from 'react';
import { petsAPI } from '../../services/api';
import '../../styles/PetStatsChart.css';

const PetStatsChart = ({ petId, pet }) => {
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [days, setDays] = useState(30);
    const [selectedMetric, setSelectedMetric] = useState('weight');

    // Функция для парсинга диапазона веса (формат: "10-15" или "10-15 кг")
    const parseWeightRange = (weightStr) => {
        if (!weightStr) return null;
        // Убираем все нецифровые символы кроме дефиса
        const cleaned = weightStr.replace(/[^\d-]/g, '');
        const parts = cleaned.split('-');
        if (parts.length === 2) {
            const min = parseFloat(parts[0]);
            const max = parseFloat(parts[1]);
            if (!isNaN(min) && !isNaN(max)) {
                return { min, max };
            }
        }
        return null;
    };

    // Проверка веса на соответствие пороговым значениям
    const checkWeightWarning = () => {
        if (selectedMetric !== 'weight' || !pet?.breed?.weight) return null;
        
        const weightRange = parseWeightRange(pet.breed.weight);
        if (!weightRange) return null;

        // Находим последний вес из записей или используем текущий вес питомца
        const lastWeightLog = stats
            .filter(log => log.weight !== null && log.weight !== undefined)
            .sort((a, b) => new Date(b.logdate) - new Date(a.logdate))[0];
        
        const currentWeight = lastWeightLog 
            ? parseFloat(lastWeightLog.weight) 
            : (pet.currentweight ? parseFloat(pet.currentweight) : null);
        
        if (currentWeight === null || isNaN(currentWeight)) return null;

        if (currentWeight < weightRange.min) {
            return {
                type: 'low',
                message: `⚠️ Внимание: вес питомца (${currentWeight.toFixed(1)} кг) ниже нормы для породы (${weightRange.min}-${weightRange.max} кг)`,
                currentWeight,
                range: weightRange
            };
        }
        if (currentWeight > weightRange.max) {
            return {
                type: 'high',
                message: `⚠️ Внимание: вес питомца (${currentWeight.toFixed(1)} кг) выше нормы для породы (${weightRange.min}-${weightRange.max} кг)`,
                currentWeight,
                range: weightRange
            };
        }
        return null;
    };

    const weightWarning = checkWeightWarning();

    useEffect(() => {
        fetchStats();
    }, [petId, days]);

    // Пересчитываем предупреждение при изменении статистики или метрики
    useEffect(() => {
        // Предупреждение будет пересчитано при рендере
    }, [stats, selectedMetric, pet]);

    const fetchStats = async () => {
        try {
            setLoading(true);
            const data = await petsAPI.getPetLogStats(petId, days);
            setStats(data);
        } catch (err) {
            setError('Ошибка при загрузке статистики');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' });
    };

    const getChartData = () => {
        if (!stats || stats.length === 0) return { points: [], min: 0, max: 0 };

        const data = stats
            .filter(log => log[selectedMetric] !== null && log[selectedMetric] !== undefined)
            .map(log => ({
                date: log.logdate,
                value: parseFloat(log[selectedMetric])
            }));

        if (data.length === 0) return { points: [], min: 0, max: 0 };

        const values = data.map(d => d.value);
        const min = 0; // Минимум всегда 0
        const max = Math.max(...values); // Максимум - максимальное значение из записей
        const range = max || 1; // Если max = 0, используем 1 для избежания деления на 0

        const chartWidth = 800;
        const chartHeight = 300;
        const padding = 40;

        const points = data.map((item, index) => {
            const x = padding + (index / (data.length - 1 || 1)) * (chartWidth - 2 * padding);
            const y = chartHeight - padding - ((item.value - min) / range) * (chartHeight - 2 * padding);
            return { x, y, value: item.value, date: item.date };
        });

        return { points, min, max, chartWidth, chartHeight, padding };
    };

    const renderChart = () => {
        const { points, min, max, chartWidth, chartHeight, padding } = getChartData();

        if (points.length === 0) {
            return (
                <div className="chart-empty">
                    <p>Нет данных для отображения</p>
                </div>
            );
        }

        // Создаем путь для линии графика
        const pathData = points.map((point, index) => {
            return `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
        }).join(' ');

        // Создаем точки на графике
        const circles = points.map((point, index) => (
            <g key={index}>
                <circle
                    cx={point.x}
                    cy={point.y}
                    r="4"
                    fill="#4CAF50"
                    className="chart-point"
                />
                <title>{`${formatDate(point.date)}: ${point.value.toFixed(1)}`}</title>
            </g>
        ));

        // Создаем сетку
        const gridLines = [];
        const gridSteps = 5;
        for (let i = 0; i <= gridSteps; i++) {
            const y = padding + (i / gridSteps) * (chartHeight - 2 * padding);
            const value = max - (i / gridSteps) * (max - min); // min всегда 0
            gridLines.push(
                <g key={i}>
                    <line
                        x1={padding}
                        y1={y}
                        x2={chartWidth - padding}
                        y2={y}
                        stroke="#e0e0e0"
                        strokeWidth="1"
                    />
                    <text
                        x={padding - 10}
                        y={y + 5}
                        textAnchor="end"
                        fontSize="12"
                        fill="#666"
                    >
                        {value.toFixed(1)}
                    </text>
                </g>
            );
        }

        return (
            <svg width="100%" height={chartHeight + 60} viewBox={`0 0 ${chartWidth} ${chartHeight + 60}`} className="chart-svg">
                <g>
                    {gridLines}
                    <path
                        d={pathData}
                        fill="none"
                        stroke="#4CAF50"
                        strokeWidth="2"
                        className="chart-line"
                    />
                    {circles}
                </g>
                <g className="chart-labels">
                    {points.map((point, index) => {
                        if (index % Math.ceil(points.length / 8) === 0 || index === points.length - 1) {
                            return (
                                <text
                                    key={index}
                                    x={point.x}
                                    y={chartHeight + 20}
                                    textAnchor="middle"
                                    fontSize="10"
                                    fill="#666"
                                >
                                    {formatDate(point.date)}
                                </text>
                            );
                        }
                        return null;
                    })}
                </g>
            </svg>
        );
    };

    const getMetricLabel = () => {
        const labels = {
            weight: 'Вес (кг)',
            size: 'Размер (см)',
            mood: 'Настроение (1-5)',
            temperature: 'Температура (°C)'
        };
        return labels[selectedMetric] || selectedMetric;
    };

    if (loading) return <div className="loading">Загрузка статистики...</div>;
    if (error) return <div className="error-message">{error}</div>;

    const { min, max } = getChartData();

    return (
        <div className="pet-stats-chart">
            {weightWarning && (
                <div className={`weight-warning ${weightWarning.type}`} style={{
                    padding: '12px',
                    marginBottom: '20px',
                    borderRadius: '8px',
                    backgroundColor: weightWarning.type === 'low' ? '#fff3cd' : '#f8d7da',
                    border: `1px solid ${weightWarning.type === 'low' ? '#ffc107' : '#dc3545'}`,
                    color: weightWarning.type === 'low' ? '#856404' : '#721c24'
                }}>
                    {weightWarning.message}
                </div>
            )}
            <div className="chart-controls">
                <div className="metric-selector">
                    <label>Показатель:</label>
                    <select 
                        value={selectedMetric} 
                        onChange={(e) => setSelectedMetric(e.target.value)}
                        style={{
                            backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                            backgroundSize: '16px 16px',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 12px center'
                        }}
                    >
                        <option value="weight">Вес</option>
                        <option value="size">Размер</option>
                        <option value="mood">Настроение</option>
                        <option value="temperature">Температура</option>
                    </select>
                </div>
                <div className="days-selector">
                    <label>Период:</label>
                    <select 
                        value={days} 
                        onChange={(e) => setDays(parseInt(e.target.value))}
                        style={{
                            backgroundImage: `url(${process.env.PUBLIC_URL || ''}/icons/paw.svg)`,
                            backgroundSize: '16px 16px',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'right 12px center'
                        }}
                    >
                        <option value="7">7 дней</option>
                        <option value="14">14 дней</option>
                        <option value="30">30 дней</option>
                        <option value="60">60 дней</option>
                        <option value="90">90 дней</option>
                    </select>
                </div>
            </div>

            <div className="chart-container">
                <div className="chart-title">{getMetricLabel()}</div>
                {stats.length > 0 && (
                    <div className="chart-stats">
                        <span>Мин: {min.toFixed(1)}</span>
                        <span>Макс: {max.toFixed(1)}</span>
                        <span>Записей: {stats.length}</span>
                    </div>
                )}
                {renderChart()}
            </div>
        </div>
    );
};

export default PetStatsChart;

