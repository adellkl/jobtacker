import React from 'react';

function getMinMax(series) {
    let min = Infinity;
    let max = -Infinity;
    for (const s of series) {
        for (const v of s.data) {
            if (typeof v === 'number' && !Number.isNaN(v)) {
                if (v < min) min = v;
                if (v > max) max = v;
            }
        }
    }
    if (!Number.isFinite(min)) min = 0;
    if (!Number.isFinite(max)) max = 1;
    if (min === max) {
        // Avoid flat line scaling
        min = 0;
    }
    return { min, max };
}

const LineChart = ({
    series = [],
    labels = [],
    width = 800,
    height = 260,
    padding = { top: 20, right: 24, bottom: 28, left: 44 },
    showAxes = true,
    showGrid = true,
    showLegend = true,
    pointRadius = 2.5,
    strokeWidth = 2.5,
    legendItemWidth = 140,
    axisFontSize = 11,
    legendFontSize = 12,
}) => {
    const innerW = Math.max(0, width - padding.left - padding.right);
    const innerH = Math.max(0, height - padding.top - padding.bottom);
    const pointsCount = Math.max(0, ...series.map(s => s.data.length));
    const { min, max } = getMinMax(series);
    const yScale = (v) => {
        const t = (v - min) / (max - min || 1);
        return padding.top + innerH - t * innerH;
    };
    const xScale = (i) => padding.left + (pointsCount <= 1 ? innerW / 2 : (i / (pointsCount - 1)) * innerW);

    // Smooth path (cubic bezier)
    const makeSmoothPath = (data) => {
        if (!data || data.length === 0) return '';
        const pts = data.map((v, i) => [xScale(i), yScale(v)]);
        let d = `M ${pts[0][0]} ${pts[0][1]}`;
        for (let i = 1; i < pts.length; i++) {
            const [x0, y0] = pts[i - 1];
            const [x1, y1] = pts[i];
            const xc = (x0 + x1) / 2;
            d += ` Q ${x0} ${y0} ${xc} ${(y0 + y1) / 2}`;
            d += ` T ${x1} ${y1}`;
        }
        return d;
    };

    const makeAreaPath = (data) => {
        if (!data || data.length === 0) return '';
        const top = makeSmoothPath(data);
        const lastX = xScale(data.length - 1);
        const firstX = xScale(0);
        const baseY = yScale(min);
        return `${top} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
    };

    const yTicks = 4;
    const tickVals = Array.from({ length: yTicks + 1 }, (_, i) => min + (i * (max - min)) / yTicks);

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} className="block max-w-full">
            <defs>
                {series.map((s, i) => (
                    <linearGradient key={`g-${i}`} id={`grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={s.color || '#3B82F6'} stopOpacity="0.25" />
                        <stop offset="100%" stopColor={s.color || '#3B82F6'} stopOpacity="0" />
                    </linearGradient>
                ))}
            </defs>

            {/* Axes */}
            {showAxes && (
                <>
                    <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} stroke="#E5E7EB" />
                    <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} stroke="#E5E7EB" />
                </>
            )}

            {/* Grid + Y ticks */}
            {showGrid && tickVals.map((tv, i) => (
                <g key={`grid-${i}`}>
                    <line x1={padding.left} x2={width - padding.right} y1={yScale(tv)} y2={yScale(tv)} stroke="#F1F5F9" />
                    <text x={padding.left - 8} y={yScale(tv)} textAnchor="end" dominantBaseline="middle" fill="#64748B" fontSize={axisFontSize}>
                        {Math.round(tv)}
                    </text>
                </g>
            ))}

            {/* X labels (sparse) */}
            {showAxes && labels.map((lbl, i) => (
                (i % Math.ceil(Math.max(labels.length, 1) / 6) === 0) ? (
                    <text key={`x-${i}`} x={xScale(i)} y={height - padding.bottom + 16} textAnchor="middle" fill="#64748B" fontSize={axisFontSize}>
                        {lbl}
                    </text>
                ) : null
            ))}

            {/* Areas and Lines */}
            {series.map((s, idx) => (
                <g key={`s-${idx}`}>
                    <path d={makeAreaPath(s.data)} fill={`url(#grad-${idx})`} stroke="none" />
                    <path d={makeSmoothPath(s.data)} fill="none" stroke={s.color || '#3B82F6'} strokeWidth={strokeWidth} />
                    {pointRadius > 0 && s.data.map((v, i) => (
                        <circle key={`pt-${idx}-${i}`} cx={xScale(i)} cy={yScale(v)} r={pointRadius} fill="#fff" stroke={s.color || '#3B82F6'} strokeWidth="1.5" />
                    ))}
                </g>
            ))}

            {/* Legend */}
            {showLegend && (
                <g transform={`translate(${padding.left}, ${padding.top - 8})`}>
                    {series.map((s, i) => (
                        <g key={`lg-${i}`} transform={`translate(${i * legendItemWidth}, 0)`}>
                            <rect width="10" height="10" fill={s.color || '#3B82F6'} rx="2" />
                            <text x="14" y="9" fontSize={legendFontSize} fill="#374151">{s.label}</text>
                        </g>
                    ))}
                </g>
            )}
        </svg>
    );
};

export default LineChart;


