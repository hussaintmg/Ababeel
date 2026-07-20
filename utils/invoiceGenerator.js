import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import webData from "@/constants";
import { buildPublicUrl } from "@/constants";

export const downloadInvoicePDF = async (
  invoice,
  referenceMap,
  setDownloadingId,
) => {
  if (setDownloadingId) setDownloadingId(invoice._id);

  try {
    // Helper function to get reference details (course only)
    const getReferenceDetails = (invoice) => {
      const refId =
        invoice.courseId?._id ||
        invoice.courseId;
      return referenceMap ? referenceMap[refId] : null;
    };

    // Helper to format currency
    const formatCurrency = (amount) => {
      return `£ ${parseFloat(amount || 0)
        .toFixed(2)
        .replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
    };

    // Helper to format date
    const formatInvoiceDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-PK", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    };

    const referenceDetails = getReferenceDetails(invoice);
    const paidDate =
      invoice.transactions && invoice.transactions.length > 0
        ? new Date(invoice.transactions[invoice.transactions.length - 1].date)
        : new Date(invoice.updatedAt || Date.now());

    const referenceId =
      invoice.details?.referenceNumber ||
      invoice.courseId?._id ||
      invoice.courseId ||
      "N/A";

    const displayName =
      invoice.details?.courseName ||
      invoice.courseId?.courseName ||
      invoice.displayName ||
      "Course Name Not Available";

    // Create a temporary div for the invoice design
    const tempDiv = document.createElement("div");
    tempDiv.id = "temp-invoice-pdf";
    tempDiv.style.width = "800px";
    tempDiv.style.backgroundColor = "#ffffff";
    tempDiv.style.position = "absolute";
    tempDiv.style.left = "-9999px";
    tempDiv.style.top = "0";

    // Add CSS styles based on user's preferred design
    const style = document.createElement("style");
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap');
      @import url('https://fonts.cdnfonts.com/css/evolventa');
      
      .invoice-container {
        font-family: 'Montserrat', sans-serif;
        max-width: 800px;
        margin: 0 auto;
        background: white;
        border-radius: 12px;
        box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        position: relative;
        overflow: hidden;
        min-height: 1050px;
        display: flex;
        flex-direction: column;
      }
      
      .invoice-header {
        background: linear-gradient(135deg, #1d4796 0%, #2962b9 100%);
        color: white;
        padding: 30px;
        border-radius: 12px 12px 0 0;
        position: relative;
        overflow: hidden;
      }
      
      .invoice-header::after {
        content: '';
        position: absolute;
        top: -50%;
        right: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        transform: rotate(30deg);
      }
      
      .invoice-title {
        font-size: 32px;
        font-weight: 700;
        margin-bottom: 8px;
        position: relative;
        z-index: 1;
      }
      
      .invoice-subtitle {
        font-size: 14px;
        opacity: 0.9;
        position: relative;
        z-index: 1;
      }
      
      .invoice-logo {
        position: absolute;
        right: 30px;
        top: 30px;
        width: 120px;
        height: auto;
        z-index: 1;
      }
      
      .invoice-content {
        padding: 30px;
        position: relative;
        z-index: 2;
        flex-grow: 1;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-bottom: 30px;
        background: #f8fafc;
        padding: 20px;
        border-radius: 10px;
      }
      
      .info-item {
        display: flex;
        flex-direction: column;
      }
      
      .info-label {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 4px;
        font-weight: 500;
      }
      
      .info-value {
        font-size: 16px;
        font-weight: 600;
        color: #1e293b;
      }
      
      .course-details {
        background: #f1f5f9;
        padding: 20px;
        border-radius: 10px;
        margin-bottom: 30px;
        border-left: 4px solid #1d4796;
      }
      
      .course-name {
        font-size: 18px;
        font-weight: 700;
        color: #1d4796;
        margin-bottom: 10px;
      }
      
      .amount-section {
        text-align: right;
        margin-bottom: 0;
        min-width: 250px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 20px;
        background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
        border-radius: 10px;
      }
      
      .amount-label {
        font-size: 14px;
        color: #64748b;
        margin-bottom: 5px;
      }
      
      .amount-value {
        font-size: 36px;
        font-weight: 700;
        color: #1d4796;
      }
      
      .payment-info {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 15px;
        margin-bottom: 0;
        padding: 20px;
        border: 1px solid #e2e8f0;
        border-radius: 10px;
        flex: 1;
      }
      
      .payment-item {
        display: flex;
        flex-direction: column;
      }
      
      .payment-label {
        font-size: 12px;
        color: #64748b;
        margin-bottom: 4px;
      }
      
      .payment-value {
        font-size: 14px;
        font-weight: 600;
        color: #1e293b;
        word-break: break-all;
      }
      
      .invoice-footer {
        margin-top: auto;
        padding: 30px;
        border-top: 2px solid #f1f5f9;
        text-align: center;
      }

      .footer-message {
        font-size: 13px;
        font-weight: 500;
        color: #1d4796;
        background: #eff6ff;
        padding: 15px;
        border-radius: 8px;
        line-height: 1.6;
        margin-bottom: 15px;
      }

      .company-info {
        font-size: 11px;
        color: #94a3b8;
        line-height: 1.5;
      }
      
      .watermark {
        position: absolute;
        top: 50%;
        left: 50%;
        opacity: 0.04;
        font-size: 110px;
        font-weight: 800;
        color: #1d4796;
        transform: translate(-50%, -50%) rotate(-30deg);
        font-family: 'Evolventa', sans-serif;
        pointer-events: none;
        white-space: nowrap;
        z-index: 0;
        text-transform: uppercase;
      }
    `;

    tempDiv.appendChild(style);

    // Build the HTML structure based on user's preferred design
    tempDiv.innerHTML += `
      <div class="invoice-container">
        <div class="watermark">PAID</div>
        <div class="invoice-header">
          <div class="invoice-title">PAYMENT RECEIPT</div>
          <div class="invoice-subtitle">Transaction Confirmation</div>
          ${referenceDetails?.logo ? `<img src="${referenceDetails.logo}" alt="Logo" class="invoice-logo" onerror="this.style.display='none'">` : ""}
        </div>
        
        <div class="invoice-content">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">Invoice Number</span>
              <span class="info-value">${invoice.invoiceNumber}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Invoice Date</span>
              <span class="info-value">${formatInvoiceDate(invoice.invoiceDate)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Payment Date</span>
              <span class="info-value">${formatInvoiceDate(paidDate)}</span>
            </div>
            <div class="info-item">
              <span class="info-label">Payment Status</span>
              <span class="info-value" style="color: #10b981;">Paid</span>
            </div>
          </div>
          
          <div class="course-details">
            <div class="course-name">${displayName}</div>
            <div style="font-size: 14px; color: #475569; margin-top: 10px;">
              <strong>Course Type:</strong> ${displayName}
            </div>
            <div style="font-size: 14px; color: #475569; margin-top: 5px;">
              <strong>Reference ID:</strong> ${referenceId}
            </div>
            ${
              invoice.details?.trainerName
                ? `
              <div style="font-size: 14px; color: #475569; margin-top: 5px;">
                <strong>Trainer:</strong> ${invoice.details.trainerName}
              </div>
            `
                : ""
            }
            ${
              invoice.details?.atcName
                ? `
              <div style="font-size: 14px; color: #475569; margin-top: 5px;">
                <strong>ATC:</strong> ${invoice.details.atcName}
              </div>
            `
                : ""
            }
          </div>
          
          <div style="display: flex; gap: 20px; align-items: stretch;">
            <div class="payment-info">
              <div class="payment-item">
                <span class="payment-label">Subtotal</span>
                <span class="payment-value">${formatCurrency(invoice.subtotal || invoice.totalAmount || 0)}</span>
              </div>
              <div class="payment-item">
                <span class="payment-label">Discount</span>
                <span class="payment-value" style="color: #10b981;">-${formatCurrency(invoice.discount || 0)}</span>
              </div>
              <div class="payment-item">
                <span class="payment-label">Tax / VAT</span>
                <span class="payment-value">${formatCurrency(invoice.tax || 0)}</span>
              </div>
              <div class="payment-item">
                <span class="payment-label">Balance Due</span>
                <span class="payment-value" style="color: ${invoice.balanceDue > 0 ? "#ef4444" : "#64748b"};">${formatCurrency(invoice.balanceDue || 0)}</span>
              </div>
            </div>

            <div class="amount-section">
              <div class="amount-label">Amount Paid</div>
              <div class="amount-value">${formatCurrency(invoice.amountPaid || invoice.totalAmount || 0)}</div>
            </div>
          </div>
        </div>

        <div class="invoice-footer">
          <div class="footer-message">
            This is an e-invoice and is valid without a physical stamp. For any inquiries or assistance, please contact us at ${webData.contact.infoEmail || webData.contact.supportEmail}
          </div>
          <div class="company-info">
            Thank you for choosing ${webData.brand.name}. We appreciate your business!<br/>
            Verification ID: ${invoice._id}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(tempDiv);

    // Wait for fonts and images to load
    await document.fonts.ready;
    const images = tempDiv.getElementsByTagName("img");
    const imagePromises = Array.from(images).map((img) => {
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.onload = resolve;
        img.onerror = resolve;
      });
    });
    await Promise.all(imagePromises);

    // Capture the invoice
    const canvas = await html2canvas(tempDiv, {
      scale: 3, // Higher scale for better quality
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      allowTaint: true,
    });

    // Calculate PDF dimensions
    const imgWidth = 210; // A4 width in mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    // Create PDF
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    pdf.addImage(
      canvas.toDataURL("image/png"),
      "PNG",
      0,
      0,
      imgWidth,
      imgHeight,
      undefined,
      "FAST",
    );

    // Save PDF
    pdf.save(`${webData.documents.invoicePrefix}-${invoice.invoiceNumber}.pdf`);

    // Clean up
    document.body.removeChild(tempDiv);
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Please try again.");
  } finally {
    if (setDownloadingId) setDownloadingId(null);
  }
};
