import type { Forecast } from "@/lib/risk/types";
import { dayMonthLabel, weekdayName } from "@/lib/risk/util";

const W = 680;
const H = 236;
const PAD_L = 36;
const PAD_R = 12;
const TOP = 30;
const TEMP_H = 104;
const RAIN_BASE = 190;
const RAIN_H = 32;

/** Fourteen days of real weather: the past week, then the week ahead. Temperature line, rain bars. */
export function WeatherPanel({ forecast, selectedDate }: { forecast: Forecast; selectedDate: string }) {
  const { days, todayIndex } = forecast;
  const n = days.length;
  const x = (i: number) => PAD_L + (i * (W - PAD_L - PAD_R)) / (n - 1);
  const step = (W - PAD_L - PAD_R) / (n - 1);
  const tMin = Math.floor(Math.min(...days.map((d) => d.tempMin))) - 1;
  const tMax = Math.ceil(Math.max(...days.map((d) => d.tempMax))) + 1;
  const yT = (t: number) => TOP + ((tMax - t) / (tMax - tMin)) * TEMP_H;
  const rainMax = Math.max(6, ...days.map((d) => d.precipSum));
  const yR = (p: number) => RAIN_BASE - (p / rainMax) * RAIN_H;

  const upper = days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${yT(d.tempMax).toFixed(1)}`).join(" ");
  const lower = [...days]
    .map((d, i) => ({ d, i }))
    .reverse()
    .map(({ d, i }) => `L${x(i).toFixed(1)} ${yT(d.tempMin).toFixed(1)}`)
    .join(" ");
  const mean = days.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${yT(d.tempMean).toFixed(1)}`).join(" ");
  const selIndex = days.findIndex((d) => d.date === selectedDate);
  const mid = Math.round((tMin + tMax) / 2);

  return (
    <figure className="weather glass">
      <figcaption className="weather__cap">
        <h2 className="weather__title">The weather behind the plan</h2>
        <p>
          Real readings for {forecast.place.label}: the last 7 days, and the next 7. Temperature as a line with its daily range, rain as bars.
        </p>
      </figcaption>
      <div className="weather__scroll">
      <svg viewBox={`0 0 ${W} ${H}`} className="weather__svg" role="img" aria-label="Chart of daily temperature and rain for the last 7 days and the next 7 days. A table follows.">
        <defs>
          <linearGradient id="wx-band" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#14736F" stopOpacity=".26" />
            <stop offset="1" stopColor="#8FD9C4" stopOpacity=".14" />
          </linearGradient>
        </defs>

        <rect x={x(todayIndex) - step / 2} y={TOP - 14} width={W - PAD_R - (x(todayIndex) - step / 2)} height={H - TOP - 8} rx="10" className="weather__ahead" />
        {selIndex >= 0 && <rect x={x(selIndex) - step / 2} y={TOP - 14} width={step} height={H - TOP - 8} rx="10" className="weather__sel" />}

        {[tMax - 1, mid, tMin + 1].map((t) => (
          <g key={t}>
            <line x1={PAD_L} x2={W - PAD_R} y1={yT(t)} y2={yT(t)} className="weather__grid" />
            <text x={PAD_L - 8} y={yT(t) + 4} textAnchor="end" className="weather__tick">
              {t}°
            </text>
          </g>
        ))}

        <path d={`${upper} ${lower} Z`} fill="url(#wx-band)" />
        <path d={mean} className="weather__line" />
        {days.map((d, i) => (
          <circle key={d.date} cx={x(i)} cy={yT(d.tempMean)} r={i === selIndex ? 4.5 : 2.6} className={i === selIndex ? "weather__dot weather__dot--sel" : "weather__dot"} />
        ))}

        {days.map((d, i) => (
          <rect key={d.date} x={x(i) - 7} y={yR(d.precipSum)} width="14" height={Math.max(1.5, RAIN_BASE - yR(d.precipSum))} rx="3" className="weather__rain" />
        ))}
        <line x1={PAD_L} x2={W - PAD_R} y1={RAIN_BASE} y2={RAIN_BASE} className="weather__grid" />

        <line x1={x(todayIndex)} x2={x(todayIndex)} y1={TOP - 12} y2={RAIN_BASE + 4} className="weather__today" />
        <text x={x(todayIndex)} y={TOP - 18} textAnchor="middle" className="weather__todaylabel">
          Today
        </text>
        <text x={PAD_L} y={TOP - 18} className="weather__side">
          Last 7 days
        </text>
        <text x={W - PAD_R} y={TOP - 18} textAnchor="end" className="weather__side">
          Next 7 days
        </text>

        {days.map((d, i) => (
          <text key={d.date} x={x(i)} y={H - 12} textAnchor="middle" className={i === selIndex ? "weather__day weather__day--sel" : "weather__day"}>
            {weekdayName(d.date, "short").slice(0, 2)}
          </text>
        ))}
      </svg>
      </div>

      <div className="sr-only">
      <table>
        <caption>Daily weather, last 7 days and next 7 days</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>Average temperature</th>
            <th>Humidity</th>
            <th>Rain</th>
          </tr>
        </thead>
        <tbody>
          {days.map((d) => (
            <tr key={d.date}>
              <td>
                {weekdayName(d.date)} {dayMonthLabel(d.date)}
              </td>
              <td>{d.tempMean} °C</td>
              <td>{d.humidityMean}%</td>
              <td>{d.precipSum} mm</td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
      <p className="weather__credit">
        Weather data by{" "}
        <a href="https://open-meteo.com/" target="_blank" rel="noopener noreferrer">
          Open-Meteo.com
        </a>
        . Not the Met Office.
      </p>
    </figure>
  );
}
