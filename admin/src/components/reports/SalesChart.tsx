"use client"

import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

interface SalesData {
    _id: string; // Date
    totalSales: number;
    orderCount: number;
}

interface SalesChartProps {
    data: SalesData[];
}

export function SalesChart({ data }: SalesChartProps) {
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top' as const,
            },
            title: {
                display: true,
                text: 'Sales Overview',
            },
        },
        scales: {
            y: {
                beginAtZero: true
            }
        }
    };

    const labels = data.map(item => item._id);

    const chartData = {
        labels,
        datasets: [
            {
                label: 'Total Sales',
                data: data.map(item => item.totalSales),
                borderColor: 'rgb(255, 99, 132)',
                backgroundColor: 'rgba(255, 99, 132, 0.5)',
                yAxisID: 'y',
            },
            {
                label: 'Order Count',
                data: data.map(item => item.orderCount),
                borderColor: 'rgb(53, 162, 235)',
                backgroundColor: 'rgba(53, 162, 235, 0.5)',
                yAxisID: 'y1',
            },
        ],
    };

    const combinedOptions = {
        ...options,
        scales: {
            y: {
                type: 'linear' as const,
                display: true,
                position: 'left' as const,
                title: {
                    display: true,
                    text: 'Amount ($)'
                }
            },
            y1: {
                type: 'linear' as const,
                display: true,
                position: 'right' as const,
                grid: {
                    drawOnChartArea: false,
                },
                title: {
                    display: true,
                    text: 'Count'
                }
            },
        },
    }

    return (
        <div className="w-full h-[400px] bg-white p-4 rounded-lg shadow border">
            <Line options={combinedOptions} data={chartData} />
        </div>
    );
}
