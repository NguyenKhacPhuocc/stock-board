import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import { useMemo, memo } from "react";
import styles from "./MarketIndexCard.module.scss";

interface Props {
  data: {
    time: string;
    value: number;
    volume: number;
  }[];
  color: 'up' | 'down' | 'ref';
}

function MarketIndexChart({ data, color }: Props) {
  const chartColor = color === 'up' ? '#00ff00' : color === 'down' ? '#ff3b3b' : '#ffd700';

  const options: ApexOptions = useMemo(() => ({
    chart: {
      type: 'line',
      background: '#000',
      sparkline: {
        enabled: false,
      },
      animations: {
        enabled: false
      },
      toolbar: {
        show: false
      },
      zoom: {
        enabled: false
      }
    },
    stroke: {
      curve: "smooth",
      width: [1, 0],
    },
    fill: {
      type: ["gradient", "solid"],
      gradient: {
        shade: 'dark',
        type: "vertical",
        shadeIntensity: 0.5,
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.1,
        stops: [0, 100],
      }
    },
    tooltip: {
      enabled: true,
      theme: 'light',
      shared: true,
      cssClass: styles.tooltip,
      custom: ({ dataPointIndex, w }: { dataPointIndex: number; w: Record<string, unknown> }) => {
        const config = w.config as { series: Array<{ data: Array<{ x: number; y: number }> }> };
        const timestamp = config?.series?.[0]?.data?.[dataPointIndex]?.x;
        
        if (!timestamp) return '';

        // Format time as HH:MM:SS
        const date = new Date(timestamp);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const timeStr = `${hours}:${minutes}:${seconds}`;

        // Get index and volume values
        const indexValue = config?.series?.[0]?.data?.[dataPointIndex]?.y || 0;
        const volumeValue = config?.series?.[1]?.data?.[dataPointIndex]?.y || 0;

        // Format volume with vi-VN locale
        const volumeFormatted = new Intl.NumberFormat('vi-VN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(volumeValue);

        return `
          <div style="padding: 12px; background: #fff; border-radius: 4px; border: 1px solid #ddd; box-shadow: 0 2px 8px rgba(0,0,0,0.15);">
            <div style="margin-bottom: 6px; font-weight: 600; color: #333;">${timeStr}</div>
            <div style="margin-bottom: 4px; font-size: 12px; color: #666;">
              <span style="color: ${chartColor};">● Index:</span> <span style="font-weight: 500; color: #000;">${indexValue.toFixed(2)}</span>
            </div>
            <div style="font-size: 12px; color: #666;">
              <span style="color: #60a0ff;">● Volume:</span> <span style="font-weight: 500; color: #000;">${volumeFormatted}</span>
            </div>
          </div>
        `;
      },
      style: {
        fontSize: '12px',
      },
    },
    legend: {
      show: false,
    },
    colors: [chartColor, "rgba(96, 160, 255, 0.75)"],
    grid: {
      show: true,
      borderColor: "#222",
      xaxis: {
        lines: {
          show: true
        }
      },
      yaxis: {
        lines: {
          show: false
        }
      },
      padding: {
        top: -25,
        right: 20,
        bottom: -10,
        left: 5,
      }
    },
    xaxis: {
      type: 'datetime',
      min: new Date(`2024-01-01 09:00`).getTime(),
      max: new Date(`2024-01-01 15:00`).getTime(),
      tickAmount: 6,
      labels: {
        show: true,
        offsetY: -5,
        datetimeUTC: false,
        hideOverlappingLabels: false,
        trim: false,
        style: {
          colors: '#888',
          fontSize: '10px'
        },
        rotate: 0,
        formatter: (_value, timestamp) => {
          const d = new Date(timestamp || 0);
          return d.getHours() + 'h';
        }
      },
      axisBorder: { show: false },
      axisTicks: { show: false },
      crosshairs: {
        show: true,
        stroke: {
          color: '#000',
          width: 1,
          dashArray: 3
        }
      },
      tooltip: { enabled: false }
    },
    yaxis: [
      {
        seriesName: "Index",
        show: false,
      },
      {
        seriesName: "Volume",
        show: false,
        opposite: true,
      },
    ],
  }), [chartColor]);

  const series = useMemo(() => [
    {
      name: "Index",
      type: "area",
      data: data.map(d => ({
        x: new Date(`2024-01-01 ${d.time}`).getTime(),
        y: d.value
      })),
    },
    {
      name: "Volume",
      type: "bar",
      data: data.map(d => ({
        x: new Date(`2024-01-01 ${d.time}`).getTime(),
        y: d.volume
      })),
    },
  ], [data]);

  return (
    <Chart
      options={options}
      series={series}
      type="line" // Parent type required for mixed charts
      height="100%"
      width="100%"
    />
  );
}

export default memo(MarketIndexChart);