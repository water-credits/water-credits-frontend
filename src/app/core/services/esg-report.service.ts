import { Injectable } from '@angular/core';
import type {
  TCreatedPdf,
  TDocumentDefinitions,
  Content,
  StyleDictionary,
  TVirtualFileSystem,
} from 'pdfmake/interfaces';

import { Retirement, EsgReportData, EsgReportOptions } from '../models/retirement.model';

interface PdfMakeApi {
  addVirtualFileSystem(vfs: TVirtualFileSystem): void;
  createPdf(documentDefinitions: TDocumentDefinitions): TCreatedPdf;
}

const STELLAR_EXPLORER = 'https://testnet.stellarchain.io/tx/';
const PRIMARY_BLUE = '#1a56db';
const TEXT_DARK = '#1e293b';
const TEXT_MID = '#475569';
const TEXT_LIGHT = '#94a3b8';
const BORDER_COLOR = '#cbd5e1';

@Injectable({ providedIn: 'root' })
export class EsgReportService {
  async generateReport(retirements: Retirement[], options: EsgReportOptions): Promise<void> {
    const reportData = this.aggregateReportData(retirements, options);
    const [pdfMakeModule, vfsModule] = await Promise.all([
      import('pdfmake/build/pdfmake'),
      import('pdfmake/build/vfs_fonts'),
    ]);

    const pdfMake = this.asPdfMake(pdfMakeModule);
    const vfs = (vfsModule as { default?: TVirtualFileSystem }).default;
    if (vfs) {
      pdfMake.addVirtualFileSystem(vfs);
    }

    const qrDataUrl = await this.buildQrDataUrl(reportData.reportId);
    const docDef = this.buildDocument(reportData, qrDataUrl);
    pdfMake.createPdf(docDef).download(this.filename(reportData));
  }

  aggregateReportData(retirements: Retirement[], options: EsgReportOptions): EsgReportData {
    const confirmedRetirements = retirements.filter((r) => r.status === 'confirmed');

    const projectBreakdown = this.calculateProjectBreakdown(confirmedRetirements);
    const totalCreditsRetired = projectBreakdown
      .reduce((sum, project) => sum + parseFloat(project.totalCredits), 0)
      .toFixed(2);

    return {
      reportId: this.generateReportId(),
      userAddress: options.userAddress,
      startDate: options.startDate.toISOString(),
      endDate: options.endDate.toISOString(),
      generatedAt: new Date().toISOString(),
      totalCreditsRetired,
      totalRetirements: confirmedRetirements.length,
      projectBreakdown,
      retirements: confirmedRetirements,
    };
  }

  private calculateProjectBreakdown(retirements: Retirement[]): Array<{
    projectId: string;
    projectName: string;
    totalCredits: string;
    retirementCount: number;
    environmentalCoBenefits?: string[];
  }> {
    const projectMap = new Map<
      string,
      {
        projectId: string;
        projectName: string;
        totalCredits: number;
        retirementCount: number;
      }
    >();

    retirements.forEach((retirement) => {
      const existing = projectMap.get(retirement.projectId);
      if (existing) {
        existing.totalCredits += parseFloat(retirement.amount);
        existing.retirementCount += 1;
      } else {
        projectMap.set(retirement.projectId, {
          projectId: retirement.projectId,
          projectName: retirement.projectName || retirement.projectId,
          totalCredits: parseFloat(retirement.amount),
          retirementCount: 1,
        });
      }
    });

    return Array.from(projectMap.values()).map((project) => ({
      ...project,
      totalCredits: project.totalCredits.toFixed(2),
      environmentalCoBenefits: this.getEnvironmentalCoBenefits(project.projectName),
    }));
  }

  private getEnvironmentalCoBenefits(projectName?: string): string[] {
    const benefits: string[] = [];
    const name = projectName?.toLowerCase() || '';

    if (name.includes('water') || name.includes('watershed')) {
      benefits.push('Water Quality Improvement');
      benefits.push('Ecosystem Restoration');
    }
    if (name.includes('carbon') || name.includes('forest')) {
      benefits.push('Carbon Sequestration');
      benefits.push('Biodiversity Protection');
    }
    if (name.includes('ocean') || name.includes('marine')) {
      benefits.push('Ocean Conservation');
      benefits.push('Marine Life Protection');
    }

    return benefits.length > 0 ? benefits : ['Environmental Impact'];
  }

  private generateReportId(): string {
    return `esg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  async buildQrDataUrl(reportId: string): Promise<string> {
    const QRCode = await import('qrcode');
    const verificationUrl = `${STELLAR_EXPLORER}esg-report/${reportId}`;
    return QRCode.toDataURL(verificationUrl, { width: 120, margin: 0 });
  }

  private asPdfMake(module: unknown): PdfMakeApi {
    const withDefault = module as { default?: PdfMakeApi };
    return (withDefault.default ?? module) as PdfMakeApi;
  }

  buildDocument(reportData: EsgReportData, qrDataUrl: string): TDocumentDefinitions {
    const startDateStr = new Date(reportData.startDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const endDateStr = new Date(reportData.endDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const generatedAtStr = new Date(reportData.generatedAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    return {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 40],
      content: [
        this.header(),
        this.titleBlock(),
        this.separator(),
        this.reportSummary(reportData, startDateStr, endDateStr),
        this.separator(),
        this.totalsSection(reportData),
        this.separator(),
        this.projectBreakdownSection(reportData.projectBreakdown),
        this.separator(),
        this.retirementDetailsSection(reportData.retirements),
        this.separator(),
        this.verificationSection(reportData, generatedAtStr, qrDataUrl),
      ],
      styles: this.styles(),
    };
  }

  private header(): Content {
    return {
      columns: [
        {
          width: '*',
          stack: [
            { text: 'WATER CREDITS', style: 'brandTitle' },
            { text: 'Verified Environmental Impact', style: 'brandSubtitle' },
          ],
        },
        {
          width: 'auto',
          text: 'ESG REPORT',
          style: 'reportLabel',
        },
      ],
      margin: [0, 0, 0, 20] as [number, number, number, number],
    };
  }

  private titleBlock(): Content {
    return { text: 'Environmental, Social & Governance Report', style: 'title' };
  }

  private separator(): Content {
    return {
      canvas: [
        { type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: BORDER_COLOR },
      ],
      margin: [0, 10, 0, 10] as [number, number, number, number],
    };
  }

  private reportSummary(
    reportData: EsgReportData,
    startDateStr: string,
    endDateStr: string,
  ): Content {
    return {
      stack: [
        { text: 'REPORT SUMMARY', style: 'sectionHeader' },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Report Period', style: 'fieldLabel' },
                { text: `${startDateStr} - ${endDateStr}`, style: 'fieldValue' },
              ],
            },
            {
              width: '*',
              stack: [
                { text: 'Generated', style: 'fieldLabel' },
                { text: generatedAtStr, style: 'fieldValue' },
              ],
            },
          ],
          columnGap: 20,
        },
      ],
      margin: [0, 0, 0, 16] as [number, number, number, number],
    };
  }

  private totalsSection(reportData: EsgReportData): Content {
    return {
      stack: [
        { text: 'TOTAL IMPACT', style: 'sectionHeader' },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Total Credits Retired', style: 'fieldLabel' },
                { text: `${reportData.totalCreditsRetired} WQC`, style: 'highlightValue' },
              ],
            },
            {
              width: '*',
              stack: [
                { text: 'Total Retirements', style: 'fieldLabel' },
                { text: reportData.totalRetirements.toString(), style: 'fieldValue' },
              ],
            },
          ],
          columnGap: 20,
        },
      ],
      margin: [0, 0, 0, 16] as [number, number, number, number],
    };
  }

  private projectBreakdownSection(
    breakdown: Array<{
      projectName: string;
      totalCredits: string;
      retirementCount: number;
      environmentalCoBenefits?: string[];
    }>,
  ): Content {
    const projectRows = breakdown.map((project) => ({
      columns: [
        {
          width: '40%',
          text: project.projectName,
          style: 'tableCell',
        },
        {
          width: '20%',
          text: `${project.totalCredits} WQC`,
          style: 'tableCell',
          alignment: 'right',
        },
        {
          width: '20%',
          text: `${project.retirementCount} retirements`,
          style: 'tableCell',
          alignment: 'right',
        },
        {
          width: '20%',
          text: project.environmentalCoBenefits?.join(', ') || '—',
          style: 'tableCell',
        },
      ],
      margin: [0, 4, 0, 4] as [number, number, number, number],
    }));

    return {
      stack: [
        { text: 'PROJECT BREAKDOWN', style: 'sectionHeader' },
        {
          columns: [
            { width: '40%', text: 'Project', style: 'tableHeader' },
            { width: '20%', text: 'Credits', style: 'tableHeader', alignment: 'right' },
            { width: '20%', text: 'Retirements', style: 'tableHeader', alignment: 'right' },
            { width: '20%', text: 'Co-Benefits', style: 'tableHeader' },
          ],
          margin: [0, 8, 0, 4] as [number, number, number, number],
        },
        ...projectRows,
      ],
      margin: [0, 0, 0, 16] as [number, number, number, number],
    };
  }

  private retirementDetailsSection(retirements: Retirement[]): Content {
    const retirementRows = retirements.map((retirement) => {
      const dateStr = new Date(retirement.retiredAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });

      return {
        columns: [
          {
            width: '15%',
            text: dateStr,
            style: 'tableCell',
          },
          {
            width: '35%',
            text: retirement.projectName || retirement.projectId,
            style: 'tableCell',
          },
          {
            width: '20%',
            text: `${retirement.amount} WQC`,
            style: 'tableCell',
            alignment: 'right',
          },
          {
            width: '30%',
            text: retirement.purpose,
            style: 'tableCell',
          },
        ],
        margin: [0, 3, 0, 3] as [number, number, number, number],
      };
    });

    return {
      stack: [
        { text: 'RETIREMENT DETAILS', style: 'sectionHeader' },
        {
          columns: [
            { width: '15%', text: 'Date', style: 'tableHeader' },
            { width: '35%', text: 'Project', style: 'tableHeader' },
            { width: '20%', text: 'Amount', style: 'tableHeader', alignment: 'right' },
            { width: '30%', text: 'Purpose', style: 'tableHeader' },
          ],
          margin: [0, 8, 0, 4] as [number, number, number, number],
        },
        ...retirementRows,
      ],
      margin: [0, 0, 0, 16] as [number, number, number, number],
    };
  }

  private verificationSection(
    reportData: EsgReportData,
    generatedAtStr: string,
    qrDataUrl: string,
  ): Content {
    return {
      stack: [
        { text: 'VERIFICATION', style: 'sectionHeader' },
        {
          columns: [
            {
              width: '*',
              stack: [
                { text: 'Report ID', style: 'fieldLabel' },
                { text: reportData.reportId, style: 'monoValue' },
                {
                  text: `Account Address: ${reportData.userAddress}`,
                  style: 'monoValue',
                  margin: [0, 4, 0, 0] as [number, number, number, number],
                },
                {
                  text: `Generated: ${generatedAtStr}`,
                  style: 'idValue',
                  margin: [0, 2, 0, 0] as [number, number, number, number],
                },
              ],
            },
            {
              width: 130,
              stack: [
                { text: 'Scan to verify report', style: 'qrLabel' },
                {
                  image: qrDataUrl,
                  width: 120,
                  height: 120,
                  margin: [0, 4, 0, 0] as [number, number, number, number],
                },
              ],
            },
          ],
          columnGap: 20,
        },
      ],
      margin: [0, 0, 0, 20] as [number, number, number, number],
    };
  }

  private styles(): StyleDictionary {
    return {
      brandTitle: {
        fontSize: 18,
        bold: true,
        color: PRIMARY_BLUE,
        margin: [0, 0, 0, 2] as [number, number, number, number],
      },
      brandSubtitle: { fontSize: 9, color: TEXT_MID },
      reportLabel: {
        fontSize: 10,
        bold: true,
        color: PRIMARY_BLUE,
        alignment: 'right',
        margin: [0, 4, 0, 0] as [number, number, number, number],
      },
      title: {
        fontSize: 16,
        bold: true,
        color: TEXT_DARK,
        alignment: 'center',
        margin: [0, 0, 0, 8] as [number, number, number, number],
      },
      sectionHeader: {
        fontSize: 11,
        bold: true,
        color: PRIMARY_BLUE,
        margin: [0, 0, 0, 8] as [number, number, number, number],
      },
      fieldLabel: {
        fontSize: 8,
        color: TEXT_LIGHT,
        margin: [0, 0, 0, 3] as [number, number, number, number],
      },
      fieldValue: { fontSize: 11, bold: true, color: TEXT_DARK },
      highlightValue: {
        fontSize: 16,
        bold: true,
        color: PRIMARY_BLUE,
      },
      tableHeader: {
        fontSize: 9,
        bold: true,
        color: TEXT_DARK,
        margin: [0, 0, 0, 4] as [number, number, number, number],
      },
      tableCell: {
        fontSize: 9,
        color: TEXT_MID,
      },
      monoValue: { fontSize: 8, color: TEXT_MID },
      idValue: { fontSize: 8, color: TEXT_LIGHT },
      qrLabel: { fontSize: 7, color: TEXT_LIGHT, alignment: 'center' },
    };
  }

  filename(reportData: EsgReportData): string {
    const startDate = new Date(reportData.startDate).toISOString().split('T')[0];
    const endDate = new Date(reportData.endDate).toISOString().split('T')[0];
    return `esg-report-${startDate}-to-${endDate}.pdf`;
  }
}
