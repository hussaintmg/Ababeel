import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import webData from "@/constants";

export const generateTrainingCatalogPDF = (courseCategories) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Colors
  const primaryColor = [30, 64, 175]; // Blue-900
  const secondaryColor = [59, 130, 246]; // Blue-500
  const accentColor = [16, 185, 129]; // Green-500
  const textColor = [31, 41, 55]; // Gray-800
  const lightColor = [243, 244, 246]; // Gray-100

  // Add watermark
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(60);
  doc.text(webData.brand.shortName.toUpperCase(), 105, 150, { angle: 45, align: 'center' });
  doc.setTextColor(...textColor);

  // Header Section
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 35, 'F');
  
  // Logo/Title
  doc.setFontSize(28);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text(`${webData.brand.shortName.toUpperCase()} TRAINING`, 105, 18, { align: 'center' });
  
  doc.setFontSize(12);
  doc.text('Professional Safety Certification Programs', 105, 26, { align: 'center' });

  // Catalog Title
  doc.setFontSize(22);
  doc.setTextColor(...primaryColor);
  doc.text('PROFESSIONAL TRAINING CATALOG', 105, 45, { align: 'center' });

  // Date and Catalog ID
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleDateString('en-PK', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  })}`, 20, 55);
  
  doc.text(`Catalog ID: ${webData.documents.catalogPrefix}-${Date.now().toString().slice(-8)}`, 160, 55, { align: 'right' });

  // Divider line
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(0.5);
  doc.line(20, 60, 190, 60);

  // Executive Summary
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('EXECUTIVE SUMMARY', 20, 70);

  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.setFont('helvetica', 'normal');
  
  const summaryText = `${webData.brand.shortName} Professional Training Center offers comprehensive safety certification programs designed to meet international industry standards. Our training portfolio includes ${courseCategories.length} specialized courses covering various aspects of workplace safety, environmental management, and risk assessment.`;
  
  const summaryLines = doc.splitTextToSize(summaryText, 170);
  doc.text(summaryLines, 20, 78);

  // Quick Stats
  const statsY = 70 + summaryLines.length * 5 + 15;
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('PROGRAM STATISTICS', 20, statsY);

  autoTable(doc, {
    startY: statsY + 5,
    head: [['Parameter', 'Value']],
    body: [
      ['Total Training Programs', `${courseCategories.length}`],
      ['Course Categories', '15+'],
      ['Average Modules per Course', '6-8'],
      ['Training Duration', '4-6 Weeks'],
      ['Certification Type', 'Professional Certificate'],
      ['Training Format', 'Hybrid (Online & In-person)'],
      ['Language Support', 'English / Urdu'],
      ['Industry Recognition', 'Globally Accepted'],
    ],
    theme: 'grid',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 9
    },
    alternateRowStyles: {
      fillColor: lightColor
    },
    margin: { left: 20, right: 20 }
  });

  // Course Categories Section
  const coursesY = doc.lastAutoTable.finalY + 20;
  doc.setFontSize(16);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('TRAINING PROGRAMS CATALOG', 20, coursesY);

  // Add page for courses if needed
  if (coursesY > 250) {
    doc.addPage();
  }

  let currentY = coursesY + 10;

  courseCategories.forEach((course, index) => {
    // Check if we need a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }

    // Course Header
    doc.setFontSize(12);
    doc.setTextColor(...primaryColor);
    doc.setFont('helvetica', 'bold');
    doc.text(`CP-${(index + 1).toString().padStart(2, '0')}: ${course.name}`, 20, currentY);

    // Course Description
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.setFont('helvetica', 'normal');
    
    const descLines = doc.splitTextToSize(course.description, 170);
    doc.text(descLines, 25, currentY + 8);

    // Course Details Table
    const detailsY = currentY + 8 + (descLines.length * 4) + 5;
    
    autoTable(doc, {
      startY: detailsY,
      head: [['Module No.', 'Module Name', 'Duration']],
      body: course.subCategories.map((module, i) => [
        `M${i + 1}`,
        module,
        '6-8 Hours'
      ]),
      theme: 'grid',
      headStyles: {
        fillColor: secondaryColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8
      },
      bodyStyles: {
        textColor: textColor,
        fontSize: 8
      },
      alternateRowStyles: {
        fillColor: lightColor
      },
      margin: { left: 25, right: 20 },
      tableWidth: 165,
      columnStyles: {
        0: { cellWidth: 20 },
        2: { cellWidth: 20 }
      }
    });

    currentY = doc.lastAutoTable.finalY + 15;
  });

  // Training Methodology
  if (currentY > 200) {
    doc.addPage();
    currentY = 20;
  }

  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('LEARNING METHODOLOGY', 20, currentY);

  const methods = [
    'Interactive video lectures with industry experts',
    'Live virtual classroom sessions',
    'Practical hands-on assignments',
    'Real-world case studies',
    'Group discussions and peer learning',
    'Regular assessment quizzes',
    'Comprehensive final examination',
    'Performance tracking and feedback'
  ];

  let methodY = currentY + 8;
  methods.forEach((method, index) => {
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.text(`• ${method}`, 25, methodY);
    methodY += 5;
  });

  // Certification Benefits
  const certY = methodY + 10;
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('CERTIFICATION BENEFITS', 20, certY);

  const benefits = [
    'Globally recognized professional certification',
    'Enhanced career opportunities and advancement',
    'Industry-standard skills and knowledge',
    'Practical application in workplace safety',
    'Increased professional credibility',
    'Networking with industry professionals',
    'Continuous learning and skill development'
  ];

  let benefitY = certY + 8;
  benefits.forEach((benefit, index) => {
    doc.setFontSize(9);
    doc.setTextColor(...textColor);
    doc.text(`✓ ${benefit}`, 25, benefitY);
    benefitY += 5;
  });

  // Batch Schedule Options
  const scheduleY = benefitY + 10;
  doc.setFontSize(14);
  doc.setTextColor(...primaryColor);
  doc.setFont('helvetica', 'bold');
  doc.text('BATCH SCHEDULE OPTIONS', 20, scheduleY);

  autoTable(doc, {
    startY: scheduleY + 5,
    head: [['Batch Type', 'Schedule', 'Duration', 'Availability']],
    body: [
      ['Morning Batch', '9:00 AM - 12:00 PM', '4 Weeks', 'Weekdays'],
      ['Evening Batch', '6:00 PM - 9:00 PM', '4 Weeks', 'Weekdays'],
      ['Weekend Batch', 'Saturday & Sunday', '6 Weeks', 'Weekends'],
      ['Online Self-paced', '24/7 Access', 'Flexible', 'Anytime']
    ],
    theme: 'grid',
    headStyles: {
      fillColor: accentColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      textColor: textColor,
      fontSize: 8
    },
    alternateRowStyles: {
      fillColor: lightColor
    },
    margin: { left: 20, right: 20 }
  });

  // Footer
  const footerY = 280;
  doc.setDrawColor(...secondaryColor);
  doc.setLineWidth(0.3);
  doc.line(20, footerY, 190, footerY);

  doc.setFontSize(8);
  doc.setTextColor(107, 114, 128);
  
  const footerText = `This catalog contains complete details of ${webData.brand.shortName} Professional Training Programs.`;
  const footerLines = doc.splitTextToSize(footerText, 170);
  doc.text(footerLines, 105, footerY + 5, { align: 'center' });
  
  doc.text(`Document ID: ${webData.documents.catalogPrefix}-${Date.now().toString().slice(-8)}`, 105, footerY + 15, { align: 'center' });

  // Page numbers
  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
  }

  // Save PDF
  doc.save(`${webData.documents.catalogPrefix}_Training_Catalog_${new Date().toISOString().split('T')[0]}.pdf`);
};