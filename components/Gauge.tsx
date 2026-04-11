'use client';

import { useEffect, useState } from 'react';
import { MOODS } from '@/lib/constants';

interface GaugeProps {
    average: number;
}

export function Gauge({ average }: GaugeProps) {
    const clampedAvg = Math.max(1, Math.min(5, average));
    const targetAngle = 180 - ((clampedAvg - 1) / 4) * 180;

    // Animate needle from leftmost (180°) to actual position
    const [displayAngle, setDisplayAngle] = useState(180);

    useEffect(() => {
        const id = requestAnimationFrame(() => setDisplayAngle(targetAngle));
        return () => cancelAnimationFrame(id);
    }, [targetAngle]);

    const viewWidth = 320;
    const viewHeight = 180;
    const centerX = 160;
    const centerY = 132;
    const arcRadius = 104;
    const arcStartAngle = 180;
    const anglePerSegment = 180 / 5;
    const strokeWidth = 14;

    const polarToCartesian = (angle: number, radius: number) => {
        const radians = (angle * Math.PI) / 180;
        return {
            x: centerX + radius * Math.cos(radians),
            y: centerY - radius * Math.sin(radians),
        };
    };

    const describeArc = (startAngle: number, endAngle: number, radius: number) => {
        const start = polarToCartesian(startAngle, radius);
        const end = polarToCartesian(endAngle, radius);
        const largeArcFlag = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
        const sweepFlag = startAngle > endAngle ? 0 : 1;
        return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} ${sweepFlag} ${end.x} ${end.y}`;
    };

    const backgroundArcs = MOODS.map((_, index) => {
        const startAngle = arcStartAngle - index * anglePerSegment;
        const endAngle = startAngle - anglePerSegment;
        return (
            <path
                key={`background-${index}`}
                d={describeArc(startAngle, endAngle, arcRadius)}
                fill="none"
                stroke="var(--gauge-bg-arc)"
                strokeWidth={strokeWidth + 4}
                strokeLinecap="round"
            />
        );
    });

    const moodArcs = MOODS.map((mood, index) => {
        const startAngle = arcStartAngle - index * anglePerSegment;
        const endAngle = startAngle - anglePerSegment;
        return (
            <path
                key={`mood-${index}`}
                d={describeArc(startAngle, endAngle, arcRadius)}
                fill="none"
                stroke={mood.color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
            />
        );
    });

    const needleLength = 84;
    const moodIndex = Math.round(clampedAvg) - 1;
    const moodLabel = MOODS[Math.max(0, Math.min(4, moodIndex))]?.label || '';

    return (
        <div className="w-full">
            <svg
                viewBox={`0 0 ${viewWidth} ${viewHeight}`}
                className="h-auto w-full"
                preserveAspectRatio="xMidYMid meet"
                role="img"
                aria-label={`World mood gauge showing ${clampedAvg.toFixed(1)} - ${moodLabel}`}
            >
                {backgroundArcs}
                {moodArcs}

                {/* Needle — rotates around center, animated via CSS transform */}
                <g
                    style={{
                        transform: `rotate(${-displayAngle}deg)`,
                        transformOrigin: `${centerX}px ${centerY}px`,
                        transition: 'transform 900ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                >
                    <line
                        x1={centerX}
                        y1={centerY}
                        x2={centerX + needleLength}
                        y2={centerY}
                        stroke="var(--gauge-needle)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                    />
                </g>

                <circle cx={centerX} cy={centerY} r="6" fill="var(--gauge-pivot)" />
                <circle cx={centerX} cy={centerY} r="2.5" fill="var(--gauge-pivot-inner)" />

                <text x={52} y={centerY + 18} textAnchor="middle"
                    fontSize="11" fontWeight="400" fill="var(--gauge-label)">
                    Awful
                </text>
                <text x={268} y={centerY + 18} textAnchor="middle"
                    fontSize="11" fontWeight="400" fill="var(--gauge-label)">
                    Great
                </text>
            </svg>
        </div>
    );
}
