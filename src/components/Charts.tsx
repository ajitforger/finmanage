import React, { useState } from 'react';
import { formatINR, formatINRCompact } from '../utils/formatters';

export interface MonthlyCashflowPoint {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  savings: number;
}

export function CashflowBarChart({ data }: { data: MonthlyCashflowPoint[] }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const maxVal = Math.max(
    10000,
    ...data.flatMap((d) => [d.income, d.expense])
  );
  const yMax = Math.ceil(maxVal / 25000) * 25000;

  const width = 640;
  const height = 220;
  const padLeft = 56;
  const padRight = 16;
  const padTop = 18;
  const padBottom = 30;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const groupW = innerW / Math.max(1, data.length);
  const barW = Math.min(22, groupW * 0.28);
  const gap = 5;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((r) => Math.round(yMax * r));

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-56 overflow-visible select-none"
        role="img"
        aria-label="Six-month income versus expense cashflow chart"
      >
        {/* Horizontal grid lines */}
        {ticks.map((val, i) => {
          const y = padTop + innerH - (val / yMax) * innerH;
          return (
            <g key={i}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-[#E5E2D8] dark:text-[#1E293B]"
                strokeDasharray={i === 0 ? undefined : '3 3'}
                strokeWidth={1}
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-[#64748B] dark:fill-[#94A3B8] text-[10px] font-mono-nums"
              >
                {val === 0 ? '₹0' : formatINRCompact(val)}
              </text>
            </g>
          );
        })}

        {/* Bar groups */}
        {data.map((d, idx) => {
          const centerX = padLeft + idx * groupW + groupW / 2;
          const incH = (d.income / yMax) * innerH;
          const expH = (d.expense / yMax) * innerH;
          const incY = padTop + innerH - incH;
          const expY = padTop + innerH - expH;
          const isHovered = hoveredIdx === idx;

          return (
            <g
              key={d.monthKey}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="cursor-pointer"
            >
              {/* Hover column backdrop */}
              <rect
                x={padLeft + idx * groupW + 4}
                y={padTop}
                width={Math.max(0, groupW - 8)}
                height={innerH}
                rx={6}
                className={`transition-opacity duration-150 ${
                  isHovered
                    ? 'fill-[#0E172A]/[0.04] dark:fill-white/[0.04] opacity-100'
                    : 'opacity-0'
                }`}
              />

              {/* Income Bar */}
              <rect
                x={centerX - barW - gap / 2}
                y={incY}
                width={barW}
                height={Math.max(2, incH)}
                rx={4}
                className="fill-[#65A30D] dark:fill-[#A3E635] transition-opacity duration-150"
                opacity={hoveredIdx !== null && !isHovered ? 0.45 : 1}
              />

              {/* Expense Bar */}
              <rect
                x={centerX + gap / 2}
                y={expY}
                width={barW}
                height={Math.max(2, expH)}
                rx={4}
                className="fill-[#0E172A] dark:fill-[#64748B] transition-opacity duration-150"
                opacity={hoveredIdx !== null && !isHovered ? 0.45 : 1}
              />

              {/* Month Label */}
              <text
                x={centerX}
                y={height - 8}
                textAnchor="middle"
                className={`text-[11px] font-medium ${
                  isHovered
                    ? 'fill-[#0E172A] dark:fill-[#F4F3EE]'
                    : 'fill-[#64748B] dark:fill-[#94A3B8]'
                }`}
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Interactive readout strip below/above */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E2D8] dark:border-[#1E293B] pt-3 text-xs">
        <div className="flex items-center gap-4 text-[#475569] dark:text-[#94A3B8]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#65A30D] dark:bg-[#A3E635]" />
            Income
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-xs bg-[#0E172A] dark:bg-[#64748B]" />
            Expenses
          </span>
        </div>

        {hoveredIdx !== null && data[hoveredIdx] ? (
          <div className="flex flex-wrap items-center gap-3 font-mono-nums text-[#0E172A] dark:text-[#F4F3EE]">
            <span className="font-sans font-semibold">{data[hoveredIdx].label}:</span>
            <span className="text-[#4D7C0F] dark:text-[#A3E635]">
              +{formatINR(data[hoveredIdx].income)}
            </span>
            <span className="text-[#475569] dark:text-[#CBD5E1]">
              -{formatINR(data[hoveredIdx].expense)}
            </span>
            <span className="text-[#64748B] dark:text-[#94A3B8]">
              Net {formatINR(data[hoveredIdx].savings)}
            </span>
          </div>
        ) : (
          <span className="text-[#64748B] dark:text-[#94A3B8]">
            Hover any month to inspect cashflow breakdown
          </span>
        )}
      </div>
    </div>
  );
}

export interface DailyCumulativePoint {
  day: number;
  current: number | null;
  previous: number;
}

export function SpendVelocityChart({
  data,
  budgetCeiling,
}: {
  data: DailyCumulativePoint[];
  budgetCeiling: number;
}) {
  const [hoverDay, setHoverDay] = useState<number | null>(null);

  const maxData = Math.max(
    budgetCeiling,
    ...data.map((d) => Math.max(d.current ?? 0, d.previous))
  );
  const yMax = Math.max(10000, Math.ceil(maxData / 20000) * 20000);

  const width = 620;
  const height = 210;
  const padLeft = 56;
  const padRight = 16;
  const padTop = 16;
  const padBottom = 28;
  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const totalDays = Math.max(28, data.length);
  const xForDay = (day: number) => padLeft + ((day - 1) / (totalDays - 1)) * innerW;
  const yForVal = (val: number) => padTop + innerH - (val / yMax) * innerH;

  const prevPath = data
    .map((d, idx) => `${idx === 0 ? 'M' : 'L'} ${xForDay(d.day).toFixed(1)} ${yForVal(d.previous).toFixed(1)}`)
    .join(' ');

  const currentPts = data.filter((d) => d.current !== null);
  const currPath = currentPts
    .map(
      (d, idx) =>
        `${idx === 0 ? 'M' : 'L'} ${xForDay(d.day).toFixed(1)} ${yForVal(d.current as number).toFixed(1)}`
    )
    .join(' ');

  const lastCurr = currentPts[currentPts.length - 1];
  const areaPath =
    currentPts.length > 1
      ? `${currPath} L ${xForDay(lastCurr.day).toFixed(1)} ${(padTop + innerH).toFixed(1)} L ${xForDay(
          currentPts[0].day
        ).toFixed(1)} ${(padTop + innerH).toFixed(1)} Z`
      : '';

  const ceilingY = yForVal(budgetCeiling);
  const hoveredPoint = hoverDay !== null ? data.find((d) => d.day === hoverDay) : null;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-52 overflow-visible select-none"
        role="img"
        aria-label="Cumulative daily spending velocity compared to previous month"
      >
        <defs>
          <linearGradient id="currSpendGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#84CC16" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#84CC16" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {[0, 0.5, 1].map((r, i) => {
          const val = Math.round(yMax * r);
          const y = yForVal(val);
          return (
            <g key={i}>
              <line
                x1={padLeft}
                x2={width - padRight}
                y1={y}
                y2={y}
                stroke="currentColor"
                className="text-[#E5E2D8] dark:text-[#1E293B]"
                strokeWidth={1}
              />
              <text
                x={padLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="fill-[#64748B] dark:fill-[#94A3B8] text-[10px] font-mono-nums"
              >
                {val === 0 ? '₹0' : formatINRCompact(val)}
              </text>
            </g>
          );
        })}

        {/* Budget Ceiling Line */}
        {budgetCeiling > 0 && (
          <g>
            <line
              x1={padLeft}
              x2={width - padRight}
              y1={ceilingY}
              y2={ceilingY}
              stroke="#E05A47"
              strokeDasharray="4 4"
              strokeWidth={1.25}
            />
            <text
              x={width - padRight}
              y={ceilingY - 5}
              textAnchor="end"
              className="fill-[#DC4C3E] dark:fill-[#F07160] text-[10px] font-medium"
            >
              Budget Cap ({formatINRCompact(budgetCeiling)})
            </text>
          </g>
        )}

        {/* Previous Month Line */}
        <path
          d={prevPath}
          fill="none"
          stroke="currentColor"
          className="text-[#94A3B8] dark:text-[#475569]"
          strokeWidth={1.75}
          strokeDasharray="4 3"
        />

        {/* Current Month Area & Line */}
        {areaPath && <path d={areaPath} fill="url(#currSpendGrad)" />}
        {currPath && (
          <path
            d={currPath}
            fill="none"
            className="stroke-[#4D7C0F] dark:stroke-[#A3E635]"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Last Current Dot */}
        {lastCurr && (
          <circle
            cx={xForDay(lastCurr.day)}
            cy={yForVal(lastCurr.current as number)}
            r={4}
            className="fill-[#4D7C0F] dark:fill-[#A3E635] stroke-[#FAF9F5] dark:stroke-[#0B111C]"
            strokeWidth={2}
          />
        )}

        {/* Interactive hover targets */}
        {data.map((d) => (
          <rect
            key={d.day}
            x={xForDay(d.day) - innerW / totalDays / 2}
            y={padTop}
            width={innerW / totalDays}
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setHoverDay(d.day)}
            onMouseLeave={() => setHoverDay(null)}
            className="cursor-crosshair"
          />
        ))}

        {/* Hover cursor */}
        {hoveredPoint && (
          <line
            x1={xForDay(hoveredPoint.day)}
            x2={xForDay(hoveredPoint.day)}
            y1={padTop}
            y2={padTop + innerH}
            stroke="currentColor"
            className="text-[#CBD5E1] dark:text-[#334155]"
            strokeWidth={1}
          />
        )}

        {/* X Axis day ticks */}
        {[1, 5, 10, 15, 20, 25, totalDays].map((d) => (
          <text
            key={d}
            x={xForDay(d)}
            y={height - 6}
            textAnchor="middle"
            className="fill-[#64748B] dark:fill-[#94A3B8] text-[10px] font-mono-nums"
          >
            {d}
          </text>
        ))}
      </svg>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-[#E5E2D8] dark:border-[#1E293B] pt-3 text-xs">
        <div className="flex items-center gap-4 text-[#475569] dark:text-[#94A3B8]">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 bg-[#4D7C0F] dark:bg-[#A3E635]" />
            This month
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-3.5 border-t border-dashed border-[#94A3B8]" />
            Last month
          </span>
        </div>

        {hoveredPoint ? (
          <div className="flex items-center gap-3 font-mono-nums text-[#0E172A] dark:text-[#F4F3EE]">
            <span className="font-sans font-semibold">Day {hoveredPoint.day}:</span>
            {hoveredPoint.current !== null && (
              <span className="text-[#4D7C0F] dark:text-[#A3E635]">
                Now {formatINR(hoveredPoint.current)}
              </span>
            )}
            <span className="text-[#64748B] dark:text-[#94A3B8]">
              Prev {formatINR(hoveredPoint.previous)}
            </span>
          </div>
        ) : (
          <span className="text-[#64748B] dark:text-[#94A3B8]">
            Hover timeline to compare daily pace
          </span>
        )}
      </div>
    </div>
  );
}
