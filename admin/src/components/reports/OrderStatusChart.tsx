"use client"

import { Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface OrderStatusData {
    [status: string]: number;
}

interface OrderStatusChartProps {
    data: OrderStatusData;
}

export function OrderStatusChart({ data }: OrderStatusChartProps) {
    const options = {
        responsive: true,
        plugins: {
            legend: {
                position: 'right' as const,
            },
            title: {
                display: true,
                text: 'Order Status Distribution',
            },
        },
    };

    const labels = Object.keys(data);
    const values = Object.values(data);

    // Consistent colors for statuses
    const backgroundColors = labels.map(status => {
        switch (status.toLowerCase()) {
            case 'pending': return 'rgba(255, 206, 86, 0.6)'; // Yellow
            case 'processing': return 'rgba(54, 162, 235, 0.6)'; // Blue
            case 'shipped': return 'rgba(153, 102, 255, 0.6)'; // Purple
            case 'delivered': return 'rgba(75, 192, 192, 0.6)'; // Green
            case 'cancelled': return 'rgba(255, 99, 132, 0.6)'; // Red
            default: return 'rgba(201, 203, 207, 0.6)'; // Grey
        }
    });

    const borderColors = labels.map(status => {
        switch (status.toLowerCase()) {
            case 'pending': return 'rgba(255, 206, 86, 1)';
            case 'processing': return 'rgba(54, 162, 235, 1)';
            case 'shipped': return 'rgba(153, 102, 255, 1)';
            case 'delivered': return 'rgba(75, 192, 192, 1)';
            case 'cancelled': return 'rgba(255, 99, 132, 1)';
            default: return 'rgba(201, 203, 207, 1)';
        }
    });

    const chartData = {
        labels: labels.map(l => l.charAt(0).toUpperCase() + l.slice(1)),
        datasets: [
            {
                label: '# of Orders',
                data: values,
                backgroundColor: backgroundColors,
                borderColor: borderColors,
                borderWidth: 1,
            },
        ],
    };

    return (
        <div className="w-full h-[300px] bg-white p-4 rounded-lg shadow border flex justify-center items-center">
            <Doughnut data={chartData} options={options} />
        </div>
    );
}
