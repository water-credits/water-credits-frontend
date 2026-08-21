import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { OracleAnalyticsComponent } from './oracle-analytics.component';
import { AnalyticsService } from '../../../core/services/analytics.service';
import { LoggingService } from '../../../core/services/logging.service';
import {
  generateOracleAnomalies,
  generateOracleNodes,
  generateOracleSubmissions,
  generateOracleTimeseries,
} from '../../../core/services/oracle-metrics.mock';

describe('OracleAnalyticsComponent', () => {
  let component: OracleAnalyticsComponent;
  let fixture: ComponentFixture<OracleAnalyticsComponent>;

  const mockAnalytics = {
    getOracleNodes: vi.fn().mockResolvedValue(generateOracleNodes()),
    getOracleTimeseries: vi.fn().mockResolvedValue(generateOracleTimeseries(30)),
    getOracleSubmissions: vi.fn().mockResolvedValue(
      generateOracleSubmissions({ page: 1, limit: 10 }),
    ),
    getOracleAnomalies: vi.fn().mockResolvedValue(generateOracleAnomalies()),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OracleAnalyticsComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: mockAnalytics },
        { provide: LoggingService, useValue: { error: vi.fn() } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OracleAnalyticsComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('loads nodes, timeseries, submissions and anomalies on init', () => {
    expect(mockAnalytics.getOracleNodes).toHaveBeenCalled();
    expect(mockAnalytics.getOracleTimeseries).toHaveBeenCalled();
    expect(component.nodes.length).toBeGreaterThan(0);
    expect(component.submissions.length).toBeGreaterThan(0);
    expect(component.anomalies.length).toBeGreaterThan(0);
  });

  it('renders the dashboard heading and anomaly section', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Oracle Analytics');
    expect(text).toContain('Anomaly alerts');
  });

  it('builds chart series from the timeseries', () => {
    expect(component.submissionVolumeSeries.length).toBe(2);
    expect(component.latencySeries.length).toBe(1);
    expect(component.uptimeSeries.length).toBe(1);
    expect(component.successRateSeries.length).toBe(1);
    expect(component.submissionVolumeSeries[0].data.length).toBe(component.timeseries.length);
  });

  it('sorts displayed submissions by the selected column', () => {
    component.sortColumn = 'latencyMs';
    component.sortDirection = 'asc';
    const sorted = component.displayedSubmissions;
    for (let i = 1; i < sorted.length; i++) {
      expect(sorted[i].latencyMs).toBeGreaterThanOrEqual(sorted[i - 1].latencyMs);
    }
  });

  it('filters submissions by status through the service', async () => {
    component.statusFilter = 'failed';
    await component.onStatusChange();
    expect(mockAnalytics.getOracleSubmissions).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' }),
    );
  });

  it('reloads timeseries when the node filter changes', async () => {
    component.selectedNodeId = 'node-aurora';
    await component.onNodeChange();
    expect(mockAnalytics.getOracleTimeseries).toHaveBeenCalledWith(30, 'node-aurora');
  });
});
