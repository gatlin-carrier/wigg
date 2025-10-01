import React, { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import annotationPlugin from 'chartjs-plugin-annotation';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

interface Rating {
  id: number;
  label: string;
  emoji: string;
  progress: number;
  color: string;
  bgClass: string;
  borderClass: string;
  hoverBg: string;
  activeBg: string;
}

interface RatingHistoryItem {
  rating: number;
  label: string;
  emoji: string;
  time: string;
  timestamp: number;
}

const ratings: Rating[] = [
  {
    id: 1,
    label: 'Boring',
    emoji: '😴',
    progress: 0,
    color: '#6B7280',
    bgClass: 'bg-gray-600/10',
    borderClass: 'border-gray-600/20',
    hoverBg: 'hover:bg-gray-600/20',
    activeBg: 'bg-gray-600/30'
  },
  {
    id: 2,
    label: 'Good',
    emoji: '👍',
    progress: 33,
    color: '#3B82F6',
    bgClass: 'bg-blue-500/10',
    borderClass: 'border-blue-500/20',
    hoverBg: 'hover:bg-blue-500/20',
    activeBg: 'bg-blue-500/30'
  },
  {
    id: 3,
    label: 'Great',
    emoji: '🔥',
    progress: 66,
    color: '#F59E0B',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/20',
    hoverBg: 'hover:bg-orange-500/20',
    activeBg: 'bg-orange-500/30'
  },
  {
    id: 4,
    label: 'Peak',
    emoji: '🚀',
    progress: 100,
    color: '#A855F7',
    bgClass: 'bg-purple-500/10',
    borderClass: 'border-purple-500/20',
    hoverBg: 'hover:bg-purple-500/20',
    activeBg: 'bg-purple-500/30'
  }
];

export default function RatingSystem() {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [isHovered, setIsHovered] = useState<number | null>(null);
  const [ratingHistory, setRatingHistory] = useState<RatingHistoryItem[]>([]);

  const handleRatingClick = (ratingId: number) => {
    setSelectedRating(ratingId);

    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });

    const newRating: RatingHistoryItem = {
      rating: ratingId,
      label: ratings[ratingId - 1].label,
      time: timeString,
      timestamp: now.getTime(),
      emoji: ratings[ratingId - 1].emoji
    };

    setRatingHistory(prev => [...prev, newRating]);
  };

  const clearHistory = () => {
    setRatingHistory([]);
    setSelectedRating(null);
  };

  // Chart configuration
  const firstPeakIndex = ratingHistory.findIndex(h => h.rating === 4);

  const chartData = {
    labels: ratingHistory.map(h => h.time),
    datasets: [
      {
        label: 'Rating',
        data: ratingHistory.map(h => h.rating),
        borderColor: '#A855F7',
        backgroundColor: (context: any) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'rgba(168, 85, 247, 0.6)';

          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(168, 85, 247, 0.6)');
          gradient.addColorStop(1, 'rgba(192, 132, 252, 0.1)');
          return gradient;
        },
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointRadius: 5,
        pointBackgroundColor: '#A855F7',
        pointBorderColor: 'hsl(222.2, 84%, 4.9%)',
        pointBorderWidth: 2,
        pointHoverRadius: 8,
        pointHoverBackgroundColor: '#C084FC'
      }
    ]
  };

  const chartOptions: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(30, 41, 59, 0.95)',
        titleColor: '#fff',
        bodyColor: '#9ca3af',
        borderColor: 'rgba(51, 65, 85, 1)',
        borderWidth: 1,
        padding: 12,
        displayColors: false,
        callbacks: {
          title: (context) => {
            const index = context[0].dataIndex;
            const rating = ratingHistory[index];
            return `${rating.emoji} ${rating.label}`;
          },
          label: (context) => {
            return `Time: ${context.label}`;
          }
        }
      },
      annotation: {
        annotations: firstPeakIndex !== -1 ? {
          playhead: {
            type: 'line',
            xMin: firstPeakIndex,
            xMax: firstPeakIndex,
            borderColor: '#F59E0B',
            borderWidth: 3,
            borderDash: [5, 5],
            label: {
              display: true,
              content: '🚀 First Peak!',
              position: 'start',
              backgroundColor: 'rgba(245, 158, 11, 0.9)',
              color: '#fff',
              font: {
                size: 12,
                weight: 'bold'
              },
              padding: 8,
              borderRadius: 6,
              yAdjust: -10
            }
          },
          peakHighlight: {
            type: 'point',
            xValue: firstPeakIndex,
            yValue: 4,
            backgroundColor: '#F59E0B',
            borderColor: '#fff',
            borderWidth: 3,
            radius: 10
          }
        } : {}
      }
    },
    scales: {
      y: {
        min: 0.5,
        max: 4.5,
        ticks: {
          stepSize: 1,
          callback: (value) => {
            return ratings[Number(value) - 1]?.label || '';
          },
          color: '#9ca3af',
          font: {
            size: 12
          }
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.5)',
          drawBorder: false
        },
        border: {
          display: false
        }
      },
      x: {
        ticks: {
          color: '#9ca3af',
          font: {
            size: 12
          },
          maxRotation: 45,
          minRotation: 0
        },
        grid: {
          color: 'rgba(51, 65, 85, 0.5)',
          drawBorder: false
        },
        border: {
          display: false
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3 bg-gradient-primary bg-clip-text text-transparent">
            Rate Your Experience
          </h1>
          <p className="text-muted-foreground text-base md:text-lg">
            How would you rate this?
          </p>
        </div>

        {/* Rating History Graph */}
        {ratingHistory.length > 0 && (
          <div className="mb-8">
            <div className="bg-card/30 backdrop-blur-sm rounded-lg border border-border p-6 md:p-8">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl md:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                    Rating Timeline
                  </h2>
                  <p className="text-muted-foreground text-sm mt-1">
                    Your {ratingHistory.length} rating{ratingHistory.length !== 1 ? 's' : ''} over time
                  </p>
                </div>
                <button
                  onClick={clearHistory}
                  className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-secondary-foreground text-sm font-medium transition-colors border border-border"
                >
                  Clear History
                </button>
              </div>

              {/* Chart */}
              <div className="h-64 md:h-80 mb-6">
                <Line data={chartData} options={chartOptions} />
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ratings.map((rating) => {
                  const count = ratingHistory.filter(h => h.rating === rating.id).length;
                  const percentage = ratingHistory.length > 0
                    ? Math.round((count / ratingHistory.length) * 100)
                    : 0;

                  return (
                    <div
                      key={rating.id}
                      className={`${rating.bgClass} border ${rating.borderClass} rounded-lg p-4 text-center backdrop-blur-sm`}
                    >
                      <div className="text-2xl mb-2">{rating.emoji}</div>
                      <div className="text-xs text-muted-foreground mb-2">{rating.label}</div>
                      <div className="text-2xl font-bold text-foreground mb-1">{count}</div>
                      <div className="text-sm font-medium" style={{ color: rating.color }}>
                        {percentage}%
                      </div>
                      {/* Mini progress bar */}
                      <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percentage}%`,
                            backgroundColor: rating.color
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Rating Cards Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {ratings.map((rating) => {
            const isSelected = selectedRating === rating.id;
            const isCurrentHovered = isHovered === rating.id;

            return (
              <button
                key={rating.id}
                onClick={() => handleRatingClick(rating.id)}
                onMouseEnter={() => setIsHovered(rating.id)}
                onMouseLeave={() => setIsHovered(null)}
                className={`
                  relative overflow-hidden rounded-lg p-6
                  border transition-all duration-300
                  ${isSelected ? rating.activeBg : rating.bgClass}
                  ${isSelected ? rating.borderClass : 'border-border'}
                  ${!isSelected ? rating.hoverBg : ''}
                  ${isSelected || isCurrentHovered ? 'scale-105 shadow-lg' : 'shadow'}
                  backdrop-blur-sm
                `}
                style={{
                  boxShadow: isSelected || isCurrentHovered
                    ? `0 8px 30px -8px ${rating.color}40`
                    : undefined
                }}
              >
                {/* Content */}
                <div className="relative z-10 flex flex-col items-center space-y-3">
                  <span
                    className="text-4xl md:text-5xl transform transition-transform duration-300"
                    style={{
                      transform: isSelected || isCurrentHovered ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    {rating.emoji}
                  </span>
                  <span className="font-semibold text-base md:text-lg text-foreground">
                    {rating.label}
                  </span>

                  {/* Progress bar */}
                  <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${rating.progress}%`,
                        backgroundColor: rating.color
                      }}
                    />
                  </div>
                </div>

                {/* Selected indicator */}
                {isSelected && (
                  <div className="absolute top-2 right-2">
                    <div
                      className="w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: rating.color }}
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Selection Feedback */}
        {selectedRating && (
          <div className="text-center mb-8 animate-fade-in">
            <div className="inline-flex items-center space-x-2 px-6 py-3 rounded-lg bg-card border border-border">
              <span className="text-2xl">{ratings[selectedRating - 1].emoji}</span>
              <span className="font-semibold text-foreground">
                You rated this: {ratings[selectedRating - 1].label}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
