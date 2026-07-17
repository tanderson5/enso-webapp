import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  Legend,
} from "recharts";
import { Paper, Stack, Text } from "@mantine/core";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const EL_NINO_THRESHOLD = 0.5;
const LA_NINA_THRESHOLD = -0.5;

function parseDecimalYear(decYear) {
  const year = Math.floor(decYear);
  const monthIndex = Math.min(Math.floor((decYear - year) * 12), 11);
  return { year, monthIndex };
}

function makeLabel(monthIndex, year, includeYear) {
  const month = MONTHS[monthIndex];
  return includeYear
    ? `${month}${String(year).slice(2)}`
    : month;
}


export function ForecastChart({ result, historical, times }) {
  const { lead_times, predictions } = result;

  let displayLabels = [];
  let fullLabels = [];

  if (times) {
    const { year, monthIndex } = parseDecimalYear(times[0]);
    const startMonth = year * 12 + monthIndex;
    const totalPoints = historical.length + lead_times.length;

    for (let i = 0; i < totalPoints; i++) {
      const absoluteMonth = startMonth + i;
      const currentYear = Math.floor(absoluteMonth / 12);
      const currentMonth = absoluteMonth % 12;

      const shortLabel =
        (i === 0 || absoluteMonth % 2  === 0) && currentMonth !== 3
          ? makeLabel(
              currentMonth,
              currentYear,
              i === 0 || currentMonth === 0
            )
          : "";

      displayLabels.push(shortLabel);
      fullLabels.push(
        makeLabel(currentMonth, currentYear, true)
      );
    }
  }

  const historicalPoints = historical.map((value, i) => ({
    month: i - (historical.length - 1),
    label: times ? displayLabels[i] : `M${i - historical.length + 1}`,
    fullLabel: times
      ? fullLabels[i]
      : `Month ${i - historical.length + 1}`,
    historical: +value.toFixed(4),
  }));

  const connectionPoint = {
    month: 0,
    label: historicalPoints.at(-1).label,
    fullLabel: historicalPoints.at(-1).fullLabel,
    historical: historicalPoints.at(-1).historical,
    prediction: historicalPoints.at(-1).historical,
  };

  const forecastPoints = lead_times.map((lead, i) => ({
    month: lead,
    label: times
      ? displayLabels[historical.length + i]
      : `M+${lead}`,
    fullLabel: times
      ? fullLabels[historical.length + i]
      : `Month +${lead}`,
    prediction: +predictions[i].toFixed(4),
  }));

  const data = [
    ...historicalPoints.slice(0, -1),
    connectionPoint,
    ...forecastPoints,
  ].map((point, i) => ({ ...point, idx: i }));

  function CustomTick({ x, y, payload }) {
    const label = data[Number(payload.value)]?.label ?? '';
    if (!label) return null;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          x={0}
          y={0}
          dy={4}
          textAnchor="end"
          fill="var(--mantine-color-gray-7)"
          fontSize={10}
          transform="rotate(-45)"
        >
          {label}
        </text>
      </g>
    );
  }

  function getYAxisConfig(data) {
    const allValues = data.flatMap((d) => [d.historical, d.prediction]).filter((v) => v != null);
    const actualMin = Math.min(...allValues);
    const actualMax = Math.max(...allValues);

    // snap to nearest 0.5, with minimum range of -1 to 1
    const minTick = Math.min(Math.floor(actualMin / 0.5) * 0.5, -1.0);
    const maxTick = Math.max(Math.ceil(actualMax / 0.5) * 0.5, 1.0);

    // build ticks array in 0.5 increments
    const ticks = [];
    for (let t = minTick; t <= maxTick + 1e-9; t = Math.round((t + 0.5) * 10) / 10) {
      ticks.push(t);
    }

    return {
      domain: [minTick - 0.1, maxTick + 0.1],
      ticks,
    };
  }

  const { domain, ticks } = getYAxisConfig(data);

  return (
    <Paper withBorder p="xl" radius="md" width="100%">  
      <Stack gap="md">
        <Text fw={600} ta="center">
          Monthly SST PC1 Forecast
        </Text>

        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={data}
            margin={{ top: 0, right: 90, left: 0, bottom: 10 }}
          >
            <XAxis
              dataKey="idx"
              type="category"
              interval={0}
              tick={<CustomTick tickFormatter={(value, index) => data[index]?.label ?? ''} />}
              tickFormatter={(value, index) => data[index]?.label}
            />

            <YAxis
              domain={domain}
              ticks={ticks}
              tick={{ fontSize: 11 }}
              label={{
                value: "Difference from average temperature (°C)",
                angle: -90,
                position: "insideLeft",
                fontSize: 10,
                dy: 100,
              }}
            />

            <Tooltip
              formatter={(value, name) => [
                value.toFixed(4),
                name === "Observed (18 months)"
                  ? "Observed"
                  : "Forecast",
              ]}
              labelFormatter={(_, payload) =>
                payload?.[0]?.payload?.fullLabel
              }
            />

            <ReferenceLine y={0} stroke="black" />

            <ReferenceLine
              y={EL_NINO_THRESHOLD}
              stroke="#e03131"
              strokeDasharray="6 3"
              label={{
                value: "El Niño threshold",
                position: "right",
                fill: "#e03131",
                fontSize: 11,
              }}
            />

            <ReferenceLine
              y={LA_NINA_THRESHOLD}
              stroke="#1971c2"
              strokeDasharray="6 3"
              label={{
                value: "La Niña threshold",
                position: "right",
                fill: "#1971c2",
                fontSize: 11,
              }}
            />

            <Line
              dataKey="historical"
              stroke="var(--mantine-color-gray-6)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              name="Observed (18 months)"
            />

            <Line
              dataKey="prediction"
              stroke="var(--mantine-color-polyPurple-6)"
              strokeWidth={2}
              dot={false}
              connectNulls={false}
              name="Predicted (24 months)"
            />

            <Legend />

          </LineChart>
        </ResponsiveContainer>
      </Stack>
    </Paper>
  );
}