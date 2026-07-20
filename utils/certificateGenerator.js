// utils/certificateGenerator.js
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import webData from "@/constants";
import { buildPublicUrl } from "@/constants";

/**
 * Robust helper to convert any image (URL or Path) to Base64.
 */
async function toBase64(imgSrc) {
  if (!imgSrc) return null;
  const src = typeof imgSrc === "object" ? imgSrc.src : imgSrc;
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.error("Image to Base64 conversion failed for:", src, err);
    return src;
  }
}

/**
 * Generate a single certificate PDF and return as Blob
 */
export const generateCertificatePDF = async (candidate, course, user) => {
  try {
    // 1. Prepare Data
    const fullName = `${candidate.firstName || ""} ${candidate.lastName || ""}`.trim();
    const courseName = course?.courseName || "";
    const atcName = course?.atcName || user?.atcDetails?.atcName || "Provider Name";

    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      if (isNaN(d.getTime())) return date;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const issueDate = formatDate(course?.startDate);
    const validUntil = formatDate(course?.endDate);
    const uniqueId = candidate?.certificateNumber;

    // 2. Pre-generate QR and Base64 Assets
    const profileImgRawSrc = user?.profileImage?.url || "/placeholder-user.png";
    const bgImgSrc = "/cert-bg.png";

    const [bgImg, profileImg, qrCode] = await Promise.all([
      toBase64(bgImgSrc),
      toBase64(profileImgRawSrc),
      generateQRCode(candidate),
    ]);

    // 3. Create rendering container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    // Certificate Content
    const certDiv = document.createElement("div");
    certDiv.innerHTML = getCertificateHTML({
      fullName,
      courseName,
      atcName,
      issueDate,
      validUntil,
      uniqueId,
      bgImg,
      profileImg,
      qrCode,
    });

    container.appendChild(certDiv);

    // 4. Wait for fonts and rendering
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 500));

    const canvas = await html2canvas(certDiv.firstElementChild, {
      scale: 3,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    // 5. Create PDF (11.7in x 8.3in)
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "in",
      format: [11.7, 8.3],
      compress: true,
    });

    const imgData = canvas.toDataURL("image/png", 1.0);
    pdf.addImage(imgData, "PNG", 0, 0, 11.7, 8.3);

    // Cleanup
    document.body.removeChild(container);

    return pdf.output("blob");
  } catch (error) {
    console.error("Critical error in certificate generation:", error);
    throw error;
  }
};

/**
 * Bulk generation of certificates with JSZip
 */
export const generateCertificatesZip = async (candidates, course, user, onProgress) => {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    let completed = 0;
    const total = candidates.length;

    for (const candidate of candidates) {
      try {
        const pdfBlob = await generateCertificatePDF(candidate, course, user);
        const fileName = `Certificate-${candidate.firstName || "candidate"}-${candidate.lastName || ""}.pdf`;
        const arrayBuffer = await pdfBlob.arrayBuffer();
        zip.file(fileName, arrayBuffer, { binary: true });

        completed++;
        if (onProgress) onProgress(Math.round((completed / total) * 100));
      } catch (err) {
        console.error(`Failed to process candidate ${candidate.firstName}:`, err);
      }
    }

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    return { zipBlob, completed, total };
  } catch (error) {
    console.error("ZIP construction failed:", error);
    throw error;
  }
};

/**
 * Download multiple certificates as ZIP
 */
export const downloadMultipleCertificates = async (candidates, course, user, onProgress) => {
  try {
    const result = await generateCertificatesZip(candidates, course, user, onProgress);
    const url = window.URL.createObjectURL(result.zipBlob);
    const link = document.createElement("a");
    link.href = url;
    const date = new Date().toISOString().split("T")[0];
    link.download = `Certificates_${course.referenceNumber || "bulk"}_${date}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    return { success: true, downloaded: result.completed, total: result.total };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * Generate QR Code
 */
async function generateQRCode(candidate) {
  try {
    const fName = (candidate.firstName || "").replace(/\s+/g, "-");
    const lName = (candidate.lastName || "").replace(/\s+/g, "-");
    const validationUrl = buildPublicUrl(`${webData.urls.certificateVerificationPath}/${fName}/${lName}/${candidate.traineeId || ""}/${candidate._id || ""}`);
    return await QRCode.toDataURL(validationUrl, {
      width: 150,
      margin: 1,
      color: { dark: "#000000", light: "#ffffff" },
    });
  } catch {
    return null;
  }
}

/**
 * Certificate HTML Template
 */
function getCertificateHTML(data) {
  const { fullName, courseName, atcName, issueDate, validUntil, uniqueId, bgImg, profileImg, qrCode } = data;

  return `
    <div style="
      width: 11.7in;
      height: 8.3in;
      background-color: #ffffff;
      position: relative;
      box-sizing: border-box;
      font-family: 'Source Sans 3', sans-serif;
      overflow: hidden;
    ">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;600;700&display=swap');
        @import url('https://fonts.cdnfonts.com/css/georgia-pro-cond');
      </style>

      <!-- Background -->
      ${bgImg ? `<img src="${bgImg}" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; object-fit: cover; z-index: -1;" />` : ""}

      <!-- Candidate Name -->
      <div style="position: absolute; top: 2.69in; width: 100%; text-align: center; font-family: 'Georgia', Georgia, serif; font-size: 23px; color: #000000;">
        ${fullName}
      </div>

      <!-- Course Name -->
      <div style="position: absolute; top: 3.81in; width: 100%; text-align: center; font-family: 'Georgia', Georgia, serif; font-size: 19.6px; color: #000000;">
        ${courseName}
      </div>

      <!-- Provider Name -->
      <div style="position: absolute; top: 5.56in; width: 100%; text-align: center; font-family: 'Georgia Pro', Georgia, serif; font-size: 9px; color: #000000;">
        ${atcName}
      </div>

      <!-- Certificate Number -->
      <div style="position: absolute; left: 1.31in; top: 7.48in; font-family: 'Georgia Pro', Georgia, serif; font-size: 9px; color: #000000;">
        ${uniqueId}
      </div>
  
      <!-- Start Date -->
      <div style="position: absolute; left: 1.31in; top: 7.65in; font-family: 'Georgia Pro', Georgia, serif; font-size: 9px; color: #000000;">
        ${issueDate}
      </div>

      <!-- End Date -->
      <div style="position: absolute; left: 1.31in; top: 7.83in; font-family: 'Georgia Pro', Georgia, serif; font-size: 9px; color: #000000;">
        ${validUntil}
      </div>

      <!-- Profile Image -->
      <div style="position: absolute; top: 0.43in; right: 0.55in; width: 1.2in; height: 1.2in; display: flex; align-items: center; justify-content: center;">
        ${profileImg ? `<img src="${profileImg}" style="width: 1.2in; height: 1.2in; object-fit: contain;" />` : ""}
      </div>

      <!-- QR Code -->
      ${qrCode ? `<img src="${qrCode}" style="position: absolute; top: 6.82in; left: 0.84in; width: 0.41in; height: 0.41in;" />` : ""}
    </div>
  `;
}

export default {
  generateCertificatePDF,
  generateCertificatesZip,
  downloadMultipleCertificates,
};
