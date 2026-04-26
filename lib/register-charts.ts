import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  LogarithmicScale,
  BarElement,
  LineElement,
  PointElement,
  Filler,
  Tooltip as ChartTooltip,
  Legend as ChartLegend,
} from "chart.js";

let registered = false;

/** Idempotent Chart.js registration for client components */
export function registerCharts() {
  if (registered) return;
  registered = true;
  ChartJS.register(
    CategoryScale,
    LinearScale,
    LogarithmicScale,
    BarElement,
    LineElement,
    PointElement,
    Filler,
    ChartTooltip,
    ChartLegend
  );
}
