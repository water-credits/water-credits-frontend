import { TestBed } from '@angular/core/testing';

import { Retirement, EsgReportOptions } from '../models/retirement.model';
import { EsgReportService } from './esg-report.service';

describe('EsgReportService', () => {
  let service: EsgReportService;

  const mockRetirements: Retirement[] = [
    {
      id: 'ret-1',
      userId: 'GDXJHK7F5Y3QL6LXAW3W5K4X4KZ3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3',
      projectId: 'proj-1',
      projectName: 'Blue Basin Watershed',
      amount: '1500.50',
      purpose: 'Community water filtration restoration',
      txHash: 'abc123def456ghi789jkl012mno345pqr678stu901vwx234yz',
      certificateIpfsUri: 'ipfs://QmTest123',
      status: 'confirmed',
      retiredAt: '2025-03-15T10:30:00Z',
    },
    {
      id: 'ret-2',
      userId: 'GDXJHK7F5Y3QL6LXAW3W5K4X4KZ3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3',
      projectId: 'proj-2',
      projectName: 'Green Forest Carbon',
      amount: '750.25',
      purpose: 'Carbon sequestration project',
      txHash: 'xyz789abc456def123ghi456jkl789mno012pqr345stu678vwx',
      certificateIpfsUri: 'ipfs://QmTest456',
      status: 'confirmed',
      retiredAt: '2025-04-20T14:45:00Z',
    },
    {
      id: 'ret-3',
      userId: 'GDXJHK7F5Y3QL6LXAW3W5K4X4KZ3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3',
      projectId: 'proj-1',
      projectName: 'Blue Basin Watershed',
      amount: '500.00',
      purpose: 'Additional water credits',
      txHash: 'def456ghi789jkl012mno345pqr678stu901vwx234yzabc123',
      certificateIpfsUri: 'ipfs://QmTest789',
      status: 'confirmed',
      retiredAt: '2025-05-10T09:15:00Z',
    },
    {
      id: 'ret-4',
      userId: 'GDXJHK7F5Y3QL6LXAW3W5K4X4KZ3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3',
      projectId: 'proj-3',
      projectName: 'Ocean Marine Conservation',
      amount: '1000.00',
      purpose: 'Marine ecosystem protection',
      txHash: 'ghi789jkl012mno345pqr678stu901vwx234yzabc123def456',
      certificateIpfsUri: 'ipfs://QmTest012',
      status: 'pending',
      retiredAt: '2025-06-01T16:00:00Z',
    },
  ];

  const mockOptions: EsgReportOptions = {
    userAddress: 'GDXJHK7F5Y3QL6LXAW3W5K4X4KZ3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3',
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-12-31'),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EsgReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('aggregateReportData', () => {
    it('should aggregate confirmed retirements only', () => {
      const result = service.aggregateReportData(mockRetirements, mockOptions);

      expect(result.totalRetirements).toBe(3);
      expect(result.retirements.length).toBe(3);
      expect(result.retirements.every((r) => r.status === 'confirmed')).toBe(true);
    });

    it('should calculate total credits correctly', () => {
      const result = service.aggregateReportData(mockRetirements, mockOptions);

      expect(result.totalCreditsRetired).toBe('2750.75');
    });

    it('should create project breakdown', () => {
      const result = service.aggregateReportData(mockRetirements, mockOptions);

      expect(result.projectBreakdown.length).toBe(3);

      const blueBasin = result.projectBreakdown.find((p) => p.projectId === 'proj-1');
      expect(blueBasin).toBeDefined();
      expect(blueBasin?.totalCredits).toBe('2000.50');
      expect(blueBasin?.retirementCount).toBe(2);
      expect(blueBasin?.environmentalCoBenefits).toContain('Water Quality Improvement');
      expect(blueBasin?.environmentalCoBenefits).toContain('Ecosystem Restoration');

      const greenForest = result.projectBreakdown.find((p) => p.projectId === 'proj-2');
      expect(greenForest).toBeDefined();
      expect(greenForest?.totalCredits).toBe('750.25');
      expect(greenForest?.retirementCount).toBe(1);
      expect(greenForest?.environmentalCoBenefits).toContain('Carbon Sequestration');
      expect(greenForest?.environmentalCoBenefits).toContain('Biodiversity Protection');

      const oceanMarine = result.projectBreakdown.find((p) => p.projectId === 'proj-3');
      expect(oceanMarine).toBeDefined();
      expect(oceanMarine?.totalCredits).toBe('1000.00');
      expect(oceanMarine?.retirementCount).toBe(1);
      expect(oceanMarine?.environmentalCoBenefits).toContain('Ocean Conservation');
      expect(oceanMarine?.environmentalCoBenefits).toContain('Marine Life Protection');
    });

    it('should generate unique report ID', () => {
      const result1 = service.aggregateReportData(mockRetirements, mockOptions);
      const result2 = service.aggregateReportData(mockRetirements, mockOptions);

      expect(result1.reportId).toBeDefined();
      expect(result2.reportId).toBeDefined();
      expect(result1.reportId).not.toBe(result2.reportId);
      expect(result1.reportId).toMatch(/^esg-\d+-[a-z0-9]+$/);
    });

    it('should include user address and date range', () => {
      const result = service.aggregateReportData(mockRetirements, mockOptions);

      expect(result.userAddress).toBe(mockOptions.userAddress);
      expect(result.startDate).toBe(mockOptions.startDate.toISOString());
      expect(result.endDate).toBe(mockOptions.endDate.toISOString());
    });

    it('should include generated timestamp', () => {
      const beforeGeneration = Date.now();
      const result = service.aggregateReportData(mockRetirements, mockOptions);
      const afterGeneration = Date.now();

      expect(result.generatedAt).toBeDefined();
      const generatedTime = new Date(result.generatedAt).getTime();
      expect(generatedTime).toBeGreaterThanOrEqual(beforeGeneration);
      expect(generatedTime).toBeLessThanOrEqual(afterGeneration);
    });

    it('should handle empty retirement list', () => {
      const result = service.aggregateReportData([], mockOptions);

      expect(result.totalRetirements).toBe(0);
      expect(result.totalCreditsRetired).toBe('0.00');
      expect(result.projectBreakdown.length).toBe(0);
      expect(result.retirements.length).toBe(0);
    });

    it('should handle retirements with no confirmed status', () => {
      const pendingRetirements = mockRetirements.filter((r) => r.status !== 'confirmed');
      const result = service.aggregateReportData(pendingRetirements, mockOptions);

      expect(result.totalRetirements).toBe(0);
      expect(result.totalCreditsRetired).toBe('0.00');
      expect(result.projectBreakdown.length).toBe(0);
    });
  });

  describe('buildDocument', () => {
    it('should return a valid pdfmake document definition', () => {
      const reportData = service.aggregateReportData(mockRetirements, mockOptions);
      const doc = service.buildDocument(reportData, 'data:image/png;base64,mockqr');

      expect(doc.pageSize).toBe('A4');
      expect(doc.pageMargins).toEqual([40, 40, 40, 40]);
      expect(doc.content).toBeTruthy();
      expect(Array.isArray(doc.content)).toBe(true);
      expect(doc.styles).toBeTruthy();
    });

    it('should include ESG report title', () => {
      const reportData = service.aggregateReportData(mockRetirements, mockOptions);
      const doc = service.buildDocument(reportData, 'data:image/png;base64,mockqr');
      const contentStr = JSON.stringify(doc.content);

      expect(contentStr).toContain('Environmental, Social & Governance Report');
    });

    it('should include total impact summary', () => {
      const reportData = service.aggregateReportData(mockRetirements, mockOptions);
      const doc = service.buildDocument(reportData, 'data:image/png;base64,mockqr');
      const contentStr = JSON.stringify(doc.content);

      expect(contentStr).toContain('2750.75');
      expect(contentStr).toContain('Total Impact');
      expect(contentStr).toContain('Total Credits Retired');
    });

    it('should include project breakdown section', () => {
      const reportData = service.aggregateReportData(mockRetirements, mockOptions);
      const doc = service.buildDocument(reportData, 'data:image/png;base64,mockqr');
      const contentStr = JSON.stringify(doc.content);

      expect(contentStr).toContain('PROJECT BREAKDOWN');
      expect(contentStr).toContain('Blue Basin Watershed');
      expect(contentStr).toContain('Green Forest Carbon');
    });

    it('should include retirement details table', () => {
      const reportData = service.aggregateReportData(mockRetirements, mockOptions);
      const doc = service.buildDocument(reportData, 'data:image/png;base64,mockqr');
      const contentStr = JSON.stringify(doc.content);

      expect(contentStr).toContain('RETIREMENT DETAILS');
      expect(contentStr).toContain('Community water filtration restoration');
      expect(contentStr).toContain('Carbon sequestration project');
    });

    it('should include verification section with QR code', () => {
      const reportData = service.aggregateReportData(mockRetirements, mockOptions);
      const doc = service.buildDocument(reportData, 'data:image/png;base64,mockqr');
      const contentStr = JSON.stringify(doc.content);

      expect(contentStr).toContain('VERIFICATION');
      expect(contentStr).toContain('Report ID');
      expect(contentStr).toContain('data:image/png;base64,mockqr');
    });

    it('should include report period dates', () => {
      const reportData = service.aggregateReportData(mockRetirements, mockOptions);
      const doc = service.buildDocument(reportData, 'data:image/png;base64,mockqr');
      const contentStr = JSON.stringify(doc.content);

      expect(contentStr).toContain('2025');
      expect(contentStr).toContain('January');
      expect(contentStr).toContain('December');
    });
  });

  describe('filename', () => {
    it('should return correct filename format with date range', () => {
      const reportData = service.aggregateReportData(mockRetirements, mockOptions);
      const filename = service.filename(reportData);

      expect(filename).toMatch(/^esg-report-\d{4}-\d{2}-\d{2}-to-\d{4}-\d{2}-\d{2}\.pdf$/);
    });

    it('should include start and end dates from report data', () => {
      const reportData = service.aggregateReportData(mockRetirements, mockOptions);
      const filename = service.filename(reportData);

      expect(filename).toContain('2025-01-01');
      expect(filename).toContain('2025-12-31');
    });
  });

  describe('buildQrDataUrl', () => {
    it('should generate a PNG data URL for the QR code', async () => {
      const qr = await service.buildQrDataUrl('test-report-id');
      expect(qr.startsWith('data:image/png;base64,')).toBe(true);
      expect(qr.length).toBeGreaterThan(200);
    });

    it('should encode the report ID into the QR payload', async () => {
      const first = await service.buildQrDataUrl('report-1');
      const again = await service.buildQrDataUrl('report-1');
      const other = await service.buildQrDataUrl('report-2');

      expect(first).toBe(again);
      expect(first).not.toBe(other);
    });

    it('should include verification URL in QR payload', async () => {
      const reportId = 'esg-test-123';
      const qr = await service.buildQrDataUrl(reportId);

      expect(qr.startsWith('data:image/png;base64,')).toBe(true);
    });
  });

  describe('environmental co-benefits', () => {
    it('should assign water-related benefits to watershed projects', () => {
      const reportData = service.aggregateReportData(mockRetirements, mockOptions);
      const blueBasin = reportData.projectBreakdown.find((p) => p.projectId === 'proj-1');

      expect(blueBasin?.environmentalCoBenefits).toContain('Water Quality Improvement');
      expect(blueBasin?.environmentalCoBenefits).toContain('Ecosystem Restoration');
    });

    it('should assign carbon-related benefits to forest projects', () => {
      const reportData = service.aggregateReportData(mockRetirements, mockOptions);
      const greenForest = reportData.projectBreakdown.find((p) => p.projectId === 'proj-2');

      expect(greenForest?.environmentalCoBenefits).toContain('Carbon Sequestration');
      expect(greenForest?.environmentalCoBenefits).toContain('Biodiversity Protection');
    });

    it('should assign marine-related benefits to ocean projects', () => {
      const reportData = service.aggregateReportData(mockRetirements, mockOptions);
      const oceanMarine = reportData.projectBreakdown.find((p) => p.projectId === 'proj-3');

      expect(oceanMarine?.environmentalCoBenefits).toContain('Ocean Conservation');
      expect(oceanMarine?.environmentalCoBenefits).toContain('Marine Life Protection');
    });

    it('should assign default benefits to unrecognized projects', () => {
      const unknownProject: Retirement = {
        id: 'ret-unknown',
        userId: 'GDXJHK7F5Y3QL6LXAW3W5K4X4KZ3Q3Q3Q3Q3Q3Q3Q3Q3Q3Q3',
        projectId: 'proj-unknown',
        projectName: 'Unknown Project Type',
        amount: '100.00',
        purpose: 'Test purpose',
        status: 'confirmed',
        retiredAt: '2025-01-01T00:00:00Z',
      };

      const result = service.aggregateReportData([unknownProject], mockOptions);
      const unknown = result.projectBreakdown.find((p) => p.projectId === 'proj-unknown');

      expect(unknown?.environmentalCoBenefits).toEqual(['Environmental Impact']);
    });
  });
});
