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

import type { Pressure } from './pressure.model';

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
  psi: number | null;
}

@Component({
  selector: 'app-pressure-chart',
  standalone: true,
  template: `
    <div class="chart-card" aria-labelledby="chart-heading">
      <div class="chart-header">
        <h2 id="chart-heading">PSI Pressure History</h2>
        @if (loading()) {
          <span class="status" aria-live="polite">Updating…</span>
        }
      </div>
      @if (hasData()) {
        <div class="chart-wrap">
          <canvas #canvas aria-label="PSI pressure line chart"></canvas>
        </div>
        <p class="chart-note">{{ chartNote() }}</p>
      } @else if (!loading()) {
        <p class="empty">No pressure readings to chart yet.</p>
      }
    </div>
  `,
  styles: `
    .chart-card {
      margin-bottom: 1.5rem;
      padding: 1rem 1.1rem;
      border: 1px solid #e5e7eb;
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
export class PressureChartComponent implements AfterViewInit, OnDestroy {
  readonly readings = input.required<Pressure[]>();
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

  private buildPoints(readings: Pressure[]): ChartPoint[] {
    return [...readings]
      .filter((reading) => reading.readtime)
      .sort((a, b) => {
        const aTime = new Date(a.readtime!).getTime();
        const bTime = new Date(b.readtime!).getTime();
        return aTime - bTime;
      })
      .map((reading) => ({
        label: this.formatAxisLabel(reading.readtime!),
        psi: this.toNumber(reading.psi),
      }));
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

    const config: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: points.map((point) => point.label),
        datasets: [
          {
            label: 'Pressure (PSI)',
            data: points.map((point) => point.psi),
            borderColor: '#0891b2',
            backgroundColor: 'rgba(8, 145, 178, 0.12)',
            yAxisID: 'y',
            tension: 0.25,
            pointRadius: points.length > 30 ? 0 : 3,
            pointHoverRadius: 4,
            spanGaps: true,
            fill: true,
          },
        ],
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
              text: 'Pressure (PSI)',
              color: '#0891b2',
            },
            ticks: {
              color: '#0891b2',
            },
            grid: {
              color: '#ecfeff',
            },
          },
        },
      },
    };

    this.chart = new Chart(canvas, config);
  }

  private destroyChart(): void {
    this.chart?.destroy();
    this.chart = null;
  }

  private toNumber(value: number | string | null | undefined): number | null {
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
