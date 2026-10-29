import { ArcElement, BarElement, CategoryScale, Chart, Legend, LinearScale, Tooltip } from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

Chart.defaults.font.family = 'ui-sans-serif, system-ui, sans-serif';
Chart.defaults.color = '#475569';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.boxWidth = 8;
