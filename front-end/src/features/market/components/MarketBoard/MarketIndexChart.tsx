import Chart from "react-apexcharts";
import type { ApexOptions } from "apexcharts";
import styles from "./MarketBoard.module.scss";

interface Props {
  data: {
    time: string;
    value: number;
    volume: number;
  }[];
  color: 'up' | 'down' | 'ref';
}

export default function MarketIndexChart({ data, color }: Props) {
  const chartColor = color === 'up' ? '#00ff00' : color === 'down' ? '#ff3b3b' : '#ffd700';

  const options: ApexOptions = {
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
        type: "vertical",  //Gradient chạy từ trên xuống dưới.
        shadeIntensity: 0.5,
        inverseColors: false,
        opacityFrom: 0.8,
        opacityTo: 0.1,
        stops: [0, 100],  // Đảm bảo dải màu trải dài toàn bộ area
      }
    },
    tooltip: {
      enabled: true,
      theme: 'light',
      shared: true,
      cssClass: styles.tooltip,
      style: {
        fontSize: '12px',
      },
    },
    legend: {
      show: false,
    },
    colors: [chartColor, "rgba(100, 150, 255, 0.4)"],
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
  };

  const series = [
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
  ];

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