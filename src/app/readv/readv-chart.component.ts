import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LineController,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartConfiguration,
} from 'chart.js';

import type { VoltBatter } from './volt-batter.model';

Chart.register(
  LineController,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
  Filler,
);

interface ChartPoint {
  label: string;
  voltage: number | null;
  current: number | null;
  power: number | null;
}

@Component({
  selector: 'app-readv-chart',
  standalone: true,
  template: `
    <div class="chart-card" aria-labelledby="readv-chart-heading">
      <div class="chart-header">
        <h2 id="readv-chart-heading">Voltage, current &amp; power</h2>
        @if (loading()) {
          <span class="status" aria-live="polite">Updating…</span>
        }
      </div>
      @if (hasData()) {
        <div class="chart-wrap">
          <canvas #canvas aria-label="Battery voltage and current line chart"></canvas>
        </div>
        <p class="chart-note">{{ chartNote() }}</p>
      } @else if (!loading()) {
        <p class="empty">No readings to chart yet.</p>
      }
    </div>
  `,
  styles: `
    .chart-card {
      margin-bottom: 1.5rem;
      padding: 1rem 1.1rem;
      border: 1px solid #fde68a;
      border-radius: 10px;
      background: #fff;
    }

    .chart-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }

    h2 {
      font-size: 1rem;
      font-weight: 600;
      margin: 0;
      color: #92400e;
    }

    .status {
      font-size: 0.875rem;
      color: #5c5c5c;
    }

    .chart-wrap {
      position: relative;
      height: 280px;
    }

    canvas {
      display: block;
      width: 100% !important;
      height: 100% !important;
    }

    .chart-note {
      margin: 0.65rem 0 0;
      font-size: 0.8rem;
      color: #6b7280;
    }

    .empty {
      margin: 0;
      font-size: 0.9rem;
      color: #6b7280;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReadvChartComponent implements AfterViewInit, OnDestroy {
  readonly readings = input.required<VoltBatter[]>();
  readonly loading = input(false);
  readonly paginated = input(false);

  private readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly viewReady = signal(false);
  private chart: Chart | null = null;

  readonly hasData = signal(false);

  constructor() {
    effect(() => {
      if (!this.viewReady()) {
        return;
      }
      const points = this.buildPoints(this.readings());
      this.hasData.set(points.length > 0);
      this.renderChart(points);
    });
  }

  ngAfterViewInit(): void {
    this.viewReady.set(true);
  }

  ngOnDestroy(): void {
    this.destroyChart();
  }

  chartNote(): string {
    if (this.paginated()) {
      return 'Chart shows the current page of readings. Use date range filter for a full-period view.';
    }
    return 'Readings sorted oldest to newest (left to right).';
  }

  private buildPoints(readings: VoltBatter[]): ChartPoint[] {
    return [...readings]
      .filter((reading) => reading.readtime)
      .sort((a, b) => {
        const aTime = new Date(a.readtime!).getTime();
        const bTime = new Date(b.readtime!).getTime();
        return aTime - bTime;
      })
      .map((reading) => ({
        label: this.formatAxisLabel(reading.readtime!),
        voltage: this.toNumber(reading.v),
        current: this.toNumber(reading.i),
        power: this.toNumber(reading.p),
      }));
  }

  private hasPowerData(points: ChartPoint[]): boolean {
    return points.some((point) => point.power != null);
  }

  private renderChart(points: ChartPoint[]): void {
    const canvas = this.canvasRef()?.nativeElement;
    if (!canvas) {
      return;
    }

    this.destroyChart();

    if (points.length === 0) {
      return;
    }

    const showPower = this.hasPowerData(points);
    const datasets: ChartConfiguration<'line'>['data']['datasets'] = [
      {
        label: 'Voltage (V)',
        data: points.map((point) => point.voltage),
        borderColor: '#d97706',
        backgroundColor: 'rgba(217, 119, 6, 0.12)',
        yAxisID: 'y',
        tension: 0.25,
        pointRadius: points.length > 30 ? 0 : 3,
        pointHoverRadius: 4,
        spanGaps: true,
        fill: false,
      },
      {
        label: 'Current (A)',
        data: points.map((point) => point.current),
        borderColor: '#059669',
        backgroundColor: 'rgba(5, 150, 105, 0.12)',
        yAxisID: 'y1',
        tension: 0.25,
        pointRadius: points.length > 30 ? 0 : 3,
        pointHoverRadius: 4,
        spanGaps: true,
        fill: false,
      },
    ];

    if (showPower) {
      datasets.push({
        label: 'Power (W)',
        data: points.map((point) => point.power),
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124, 58, 237, 0.12)',
        yAxisID: 'y2',
        tension: 0.25,
        pointRadius: points.length > 30 ? 0 : 3,
        pointHoverRadius: 4,
        spanGaps: true,
        fill: false,
      });
    }

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: points.map((point) => point.label),
        datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            position: 'top',
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const value = ctx.parsed.y;
                if (value == null || Number.isNaN(value)) {
                  return `${ctx.dataset.label}: —`;
                }
                return `${ctx.dataset.label}: ${value.toFixed(2)}`;
              },
            },
          },
        },
        scales: {
          x: {
            ticks: {
              maxRotation: 45,
              minRotation: 0,
              autoSkip: true,
              maxTicksLimit: 8,
            },
            grid: {
              color: '#f3f4f6',
            },
          },
          y: {
            type: 'linear',
            position: 'left',
            title: {
              display: true,
              text: 'Voltage (V)',
              color: '#d97706',
            },
            ticks: {
              color: '#d97706',
            },
            grid: {
              color: '#fef3c7',
            },
          },
          y1: {
            type: 'linear',
            position: 'right',
            title: {
              display: true,
              text: 'Current (A)',
              color: '#059669',
            },
            ticks: {
              color: '#059669',
            },
            grid: {
              drawOnChartArea: false,
            },
          },
          ...(showPower
            ? {
                y2: {
                  type: 'linear' as const,
                  position: 'right' as const,
                  offset: true,
                  title: {
                    display: true,
                    text: 'Power (W)',
                    color: '#7c3aed',
                  },
                  ticks: {
                    color: '#7c3aed',
                  },
                  grid: {
                    drawOnChartArea: false,
                  },
                },
              }
            : {}),
        },
      },
    };

    this.chart = new Chart(canvas, config);
  }

  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private toNumber(value: number | string | null): number | null {
    if (value == null || value === '') {
      return null;
    }
    const num = Number(value);
    return Number.isFinite(num) ? num : null;
  }

  private formatAxisLabel(value: string): string {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return value;
    }
    return date.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
