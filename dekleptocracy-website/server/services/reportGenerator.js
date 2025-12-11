/**
 * PDF Report Generator
 * Generates downloadable reports for wallet shocks and cost drivers
 */

import PDFDocument from 'pdfkit';
import WalletShock from '../models/WalletShock.js';
import CostDriver from '../models/CostDriver.js';
import logger from '../utils/logger.js';

/**
 * Generate a PDF report for a specific state
 * @param {string} state - State name
 * @param {string} timePeriod - Time period (YoY, 3 months, 30 days)
 * @returns {Promise<PDFDocument>} PDF document stream
 */
export async function generateStateReport(state, timePeriod = 'YoY') {
  try {
    logger.info(`Generating PDF report for ${state}`);

    // Create PDF document
    const doc = new PDFDocument({
      size: 'LETTER',
      margins: { top: 60, bottom: 60, left: 60, right: 60 }
    });

    // Fetch data
    const walletShocks = await WalletShock.find({
      state: state,
      status: 'published'
    }).sort('-changePercent').limit(10).exec();

    const costDrivers = await CostDriver.find({
      state: state,
      timePeriod: timePeriod,
      status: 'published'
    }).sort('displayOrder').exec();

    // Color scheme
    const colors = {
      primary: '#1e3a8a',
      accent: '#3b82f6',
      positive: '#16a34a',
      negative: '#dc2626',
      gray: '#6b7280',
      lightGray: '#f3f4f6',
      border: '#e5e7eb'
    };

    // ==================== COVER PAGE ====================
    // Brand Header with background
    doc.rect(0, 0, doc.page.width, 180)
      .fill(colors.primary);

    doc.fontSize(36).font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('DEKLEPTOCRACY', 60, 50, { align: 'center' });

    doc.fontSize(16).font('Helvetica')
      .fillColor('#93c5fd')
      .text('Price Impact Analysis Report', 60, 95, { align: 'center' })
      .moveDown(3);

    // State Info Box
    doc.rect(80, 220, doc.page.width - 160, 120)
      .fillAndStroke('#f0f9ff', colors.accent);

    doc.fontSize(14).font('Helvetica-Bold')
      .fillColor(colors.primary)
      .text('REPORT DETAILS', 0, 240, { align: 'center' });

    doc.fontSize(20).font('Helvetica-Bold')
      .fillColor('#000')
      .text(state.toUpperCase(), 0, 270, { align: 'center' });

    doc.fontSize(11).font('Helvetica')
      .fillColor(colors.gray)
      .text(`Generated: ${new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}`, 0, 300, { align: 'center' })
      .text(`Analysis Period: ${timePeriod}`, 0, 318, { align: 'center' });

    // Executive Summary Stats
    const avgChange = walletShocks.reduce((sum, s) => sum + s.changePercent, 0) / walletShocks.length || 0;
    const maxChange = Math.max(...walletShocks.map(s => s.changePercent));
    const minChange = Math.min(...walletShocks.map(s => s.changePercent));
    const increasingCount = walletShocks.filter(s => s.changePercent > 0).length;

    doc.rect(60, 380, doc.page.width - 120, 200)
      .fillAndStroke(colors.lightGray, colors.border);

    doc.fontSize(16).font('Helvetica-Bold')
      .fillColor(colors.primary)
      .text('KEY INSIGHTS', 60, 400, { align: 'center', width: doc.page.width - 120 })
      .moveDown(1);

    // Stats in grid
    const statY = 440;
    const statWidth = (doc.page.width - 120) / 2;

    // Left column
    doc.fontSize(11).font('Helvetica')
      .fillColor(colors.gray)
      .text('Items Analyzed', 80, statY, { width: statWidth - 40 });
    doc.fontSize(24).font('Helvetica-Bold')
      .fillColor(colors.primary)
      .text(walletShocks.length.toString(), 80, statY + 20, { width: statWidth - 40 });

    doc.fontSize(11).font('Helvetica')
      .fillColor(colors.gray)
      .text('Average Change', 80, statY + 60, { width: statWidth - 40 });
    doc.fontSize(24).font('Helvetica-Bold')
      .fillColor(avgChange >= 0 ? colors.negative : colors.positive)
      .text(`${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(1)}%`, 80, statY + 80, { width: statWidth - 40 });

    // Right column
    const rightX = doc.page.width / 2 + 20;
    doc.fontSize(11).font('Helvetica')
      .fillColor(colors.gray)
      .text('Increasing Prices', rightX, statY, { width: statWidth - 40 });
    doc.fontSize(24).font('Helvetica-Bold')
      .fillColor(colors.negative)
      .text(`${increasingCount} / ${walletShocks.length}`, rightX, statY + 20, { width: statWidth - 40 });

    doc.fontSize(11).font('Helvetica')
      .fillColor(colors.gray)
      .text('Highest Change', rightX, statY + 60, { width: statWidth - 40 });
    doc.fontSize(24).font('Helvetica-Bold')
      .fillColor(maxChange >= 0 ? colors.negative : colors.positive)
      .text(`${maxChange >= 0 ? '+' : ''}${maxChange.toFixed(1)}%`, rightX, statY + 80, { width: statWidth - 40 });

    // Footer on cover
    doc.fontSize(8).font('Helvetica')
      .fillColor(colors.gray)
      .text('This report contains analysis of price changes across key consumer categories.',
        60, doc.page.height - 80,
        { align: 'center', width: doc.page.width - 120 });

    // ==================== WALLET SHOCKS PAGE ====================
    doc.addPage();

    // Page header
    doc.rect(0, 0, doc.page.width, 50)
      .fill(colors.primary);

    doc.fontSize(18).font('Helvetica-Bold')
      .fillColor('#ffffff')
      .text('Top Price Changes', 60, 15);

    doc.fontSize(10).font('Helvetica')
      .fillColor('#93c5fd')
      .text(`${state} • ${walletShocks.length} Items`, 60, 35);

    doc.moveDown(3);

    // Wallet shocks list
    walletShocks.forEach((shock, index) => {
      // Check if we need a new page (leave room for item + spacing)
      if (doc.y > 650) {
        doc.addPage();

        // Repeat header on new page
        doc.rect(0, 0, doc.page.width, 50)
          .fill(colors.primary);
        doc.fontSize(18).font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text('Top Price Changes (continued)', 60, 15);
        doc.moveDown(2);
      }

      const startY = doc.y;

      // Item box with subtle background
      doc.rect(60, startY, doc.page.width - 120, 85)
        .fillAndStroke(index % 2 === 0 ? '#ffffff' : colors.lightGray, colors.border);

      // Rank badge
      doc.circle(80, startY + 20, 15)
        .fill(colors.primary);
      doc.fontSize(12).font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text((index + 1).toString(), 68, startY + 14, { width: 25, align: 'center' });

      // Category icon and label
      doc.fontSize(9).font('Helvetica-Bold')
        .fillColor(colors.gray)
        .text(shock.category.toUpperCase(), 110, startY + 10);

      // Title
      doc.fontSize(11).font('Helvetica-Bold')
        .fillColor('#000')
        .text(shock.title, 110, startY + 25, { width: 360, lineGap: 2 });

      // Price and change side by side
      doc.fontSize(10).font('Helvetica')
        .fillColor(colors.gray)
        .text(`${shock.price} ${shock.unit}`, 110, startY + 60);

      const changeColor = shock.changePercent >= 0 ? colors.negative : colors.positive;
      doc.fontSize(14).font('Helvetica-Bold')
        .fillColor(changeColor)
        .text(shock.change, doc.page.width - 140, startY + 55);

      doc.moveDown(0.3);
    });

    // ==================== COST DRIVERS PAGE ====================
    if (costDrivers.length > 0) {
      doc.addPage();

      // Page header
      doc.rect(0, 0, doc.page.width, 50)
        .fill(colors.primary);

      doc.fontSize(18).font('Helvetica-Bold')
        .fillColor('#ffffff')
        .text('Cost Drivers Analysis', 60, 15);

      doc.fontSize(10).font('Helvetica')
        .fillColor('#93c5fd')
        .text(`Factors Contributing to Price Changes (${timePeriod})`, 60, 35);

      doc.moveDown(3);

      // Description
      doc.fontSize(10).font('Helvetica')
        .fillColor(colors.gray)
        .text('The following factors are contributing to price changes in your area:',
          60, doc.y, { width: doc.page.width - 120 })
        .moveDown(2);

      // Cost drivers with improved bars
      costDrivers.forEach((driver, index) => {
        const yPos = doc.y;
        const maxBarWidth = 350;
        const barWidth = (driver.percentage / 100) * maxBarWidth;

        // Label
        doc.fontSize(11).font('Helvetica-Bold')
          .fillColor('#000')
          .text(driver.label, 60, yPos);

        // Bar background
        doc.rect(60, yPos + 18, maxBarWidth, 24)
          .fillAndStroke(colors.lightGray, colors.border);

        // Bar fill
        doc.rect(60, yPos + 18, barWidth, 24)
          .fill(driver.color);

        // Percentage text on bar
        doc.fontSize(11).font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text(`${driver.percentage}%`, 60, yPos + 23, { width: maxBarWidth, align: 'center' });

        doc.moveDown(2.5);
      });

      // Legend/Note
      doc.moveDown(2);
      doc.fontSize(9).font('Helvetica')
        .fillColor(colors.gray)
        .text('Note: Percentages represent the relative contribution of each factor to overall price changes.',
          60, doc.y, { width: doc.page.width - 120, align: 'center' });
    }

    // ==================== FOOTER ON LAST PAGE ====================
    doc.fontSize(8).font('Helvetica')
      .fillColor(colors.gray)
      .text(`Report generated by Dekleptocracy.com • © ${new Date().getFullYear()} • Data accurate as of ${new Date().toLocaleDateString()}`,
        60,
        doc.page.height - 70,
        { align: 'center', width: doc.page.width - 120 }
      );

    logger.info(`PDF report generated successfully for ${state}`);
    return doc;

  } catch (error) {
    logger.error('Error generating PDF report', error, { state, timePeriod });
    throw error;
  }
}

/**
 * Generate a CSV export of wallet shocks
 * @param {string} state - State name
 * @returns {Promise<string>} CSV string
 */
export async function generateCSVExport(state) {
  try {
    const shocks = await WalletShock.find({
      state: state,
      status: 'published'
    }).sort('-changePercent').exec();

    // CSV header
    let csv = 'Category,Title,Price,Unit,Change,Change Percent,Date\n';

    // CSV rows
    shocks.forEach(shock => {
      csv += `"${shock.category}","${shock.title.replace(/"/g, '""')}","${shock.price}","${shock.unit}","${shock.change}",${shock.changePercent},"${new Date(shock.dataDate).toISOString()}"\n`;
    });

    return csv;

  } catch (error) {
    logger.error('Error generating CSV export', error, { state });
    throw error;
  }
}

export default {
  generateStateReport,
  generateCSVExport
};
