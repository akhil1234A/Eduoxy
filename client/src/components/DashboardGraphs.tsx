'use client';

import React from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TooltipItem,
} from 'chart.js';
import { format, parse } from 'date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardGraphsProps {
  revenueGraph: { labels: string[]; data: number[] };
  topCourses: { name: string; revenue: number; enrollments: number }[];
  isTeacher: boolean;
  dateFilterType: 'day' | 'week' | 'month' | 'custom' | '';
}

const DashboardGraphs: React.FC<DashboardGraphsProps> = ({
  revenueGraph,
  topCourses,
  isTeacher,
  dateFilterType,
}) => {
  const revenueChartData = {
    labels: revenueGraph.labels,
    datasets: [
      {
        label: isTeacher ? 'Earnings Over Time' : 'Revenue Over Time',
        data: revenueGraph.data,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const topCoursesChartData = {
    labels: topCourses.map((course) => course.name),
    datasets: [
      {
        label: 'Enrollments',
        data: topCourses.map((course) => course.enrollments),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
      },
      {
        label: isTeacher ? 'Earnings' : 'Revenue',
        data: topCourses.map((course) => course.revenue),
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#D1D5DB' },
      },
      title: {
        display: true,
        text:
          dateFilterType === 'week'
            ? isTeacher ? 'Weekly Earnings' : 'Weekly Revenue'
            : dateFilterType === 'month'
            ? isTeacher ? 'Monthly Earnings' : 'Monthly Revenue'
            : isTeacher ? 'Daily Earnings' : 'Daily Revenue',
        color: '#D1D5DB',
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'line'>) => `₹${context.parsed.y.toFixed(2)}`,
          title: (tooltipItems: TooltipItem<'line'>[]) => {
            const label = tooltipItems[0].label;
            if (dateFilterType === 'month') {
              return format(parse(label, 'MMM yyyy', new Date()), 'MMMM yyyy');
            } else if (dateFilterType === 'week') {
              return `Week of ${label}`;
            }
            return label;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: isTeacher ? 'Earnings (₹)' : 'Revenue (₹)',
          color: '#D1D5DB',
        },
        grid: { color: '#4B5563' },
        ticks: { color: '#D1D5DB' },
      },
      x: {
        title: {
          display: true,
          text: dateFilterType === 'week' ? 'Week' : dateFilterType === 'month' ? 'Month' : 'Date',
          color: '#D1D5DB',
        },
        grid: { display: false },
        ticks: { color: '#D1D5DB' },
      },
    },
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { color: '#D1D5DB' },
      },
      title: {
        display: true,
        text: 'Top Selling Courses',
        color: '#D1D5DB',
        font: { size: 16 },
      },
      tooltip: {
        callbacks: {
          label: (context: TooltipItem<'bar'>) =>
            `${context.dataset.label}: ${
              context.dataset.label === 'Enrollments'
                ? context.parsed.y
                : `₹${context.parsed.y.toFixed(2)}`
            }`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Count / Amount (₹)',
          color: '#D1D5DB',
        },
        grid: { color: '#4B5563' },
        ticks: { color: '#D1D5DB' },
      },
      x: {
        title: {
          display: true,
          text: 'Course',
          color: '#D1D5DB',
        },
        grid: { display: false },
        ticks: { color: '#D1D5DB' },
      },
    },
  };

  return (
    <div className="space-y-8">
      <div className="bg-[#2D2E36] p-4 rounded-lg border border-gray-700">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">
          {isTeacher ? 'Earnings Trend' : 'Revenue Trend'}
        </h2>
        {revenueGraph.labels.length === 0 || revenueGraph.data.every((val) => val === 0) ? (
          <div className="text-gray-400 text-center py-8">
            No {isTeacher ? 'earnings' : 'revenue'} data available for the selected period
          </div>
        ) : (
          <Line options={chartOptions} data={revenueChartData} />
        )}
      </div>
      <div className="bg-[#2D2E36] p-4 rounded-lg border border-gray-700">
        <h2 className="text-lg font-semibold text-gray-200 mb-4">Top Selling Courses</h2>
        {topCourses.length === 0 ? (
          <div className="text-gray-400 text-center py-8">No top courses data available</div>
        ) : (
          <Bar options={barChartOptions} data={topCoursesChartData} />
        )}
      </div>
    </div>
  );
};

export default DashboardGraphs;