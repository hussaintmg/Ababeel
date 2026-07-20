import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import QRCode from "qrcode";
import frontImageUrl from "@/public/course-id-card-bg-front.png";
import backImageUrl from "@/public/course-id-card-bg-back.png";
import webData from "@/constants";
import { buildPublicUrl } from "@/constants";

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

export const generateIDCardPDF = async (candidate, course, user) => {
  try {
    // 1. Prepare Data with Fallbacks
    const traineeId = candidate.traineeId || candidate.id || "";
    const certNumber =
      candidate.certificateNumber || candidate.certNumber || "N/A";
    const firstName = candidate.firstName || "";
    const lastName = candidate.lastName || "";
    const fullName = `${firstName} ${lastName}`.trim();

    const courseName = course?.courseName || "";
    const atcName = course?.atcName || "";

    const formatDate = (date) => {
      if (!date) return "";
      const d = new Date(date);
      return isNaN(d.getTime())
        ? ""
        : `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
    };

    const startDate = formatDate(course?.startDate);
    const endDate = formatDate(course?.endDate);
    const profileImgRawSrc =
      user?.profile?.url || user?.profileImage?.url || "";
    const candidateImgRawSrc = candidate?.profile?.url || null;

    // 2. Pre-generate all Base64 Assets
    // This solves the "Background not rendering" and "CORS" issues.
    const [frontBg, backBg, profileImg, qrCode, candidateImg] =
      await Promise.all([
        toBase64(frontImageUrl),
        toBase64(backImageUrl),
        profileImgRawSrc ? toBase64(profileImgRawSrc) : Promise.resolve(null),
        generateQRCode(candidate),
        candidateImgRawSrc
          ? toBase64(candidateImgRawSrc)
          : Promise.resolve(null),
      ]);

    // 3. Create rendering container
    const container = document.createElement("div");
    container.style.position = "absolute";
    container.style.left = "-9999px";
    container.style.top = "0";
    document.body.appendChild(container);

    // Front Card Style & Content
    const frontDiv = document.createElement("div");
    frontDiv.innerHTML = getFrontCardHTML({
      fullName,
      traineeId,
      certNumber,
      courseName,
      atcName,
      startDate,
      endDate,
      frontBg,
      profileImg,
      candidateImg,
    });

    // Back Card style & Content
    const backDiv = document.createElement("div");
    backDiv.innerHTML = getBackCardHTML({ backBg, qrCode });

    container.appendChild(frontDiv);
    container.appendChild(backDiv);

    // 4. Wait for fonts and high-quality capture
    await document.fonts.ready;
    await new Promise((r) => setTimeout(r, 400)); // Buffer for layout engine

    const captureOptions = {
      scale: 3, // High resolution (3x)
      useCORS: true,
      allowTaint: false,
      backgroundColor: "#ffffff",
      logging: false,
      imageTimeout: 15000,
      onclone: (clonedDoc) => {
        // Enforce font styles in the cloned document
        const style = clonedDoc.createElement("style");
        style.textContent = `
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Anton&display=swap');
          * { -webkit-font-smoothing: antialiased; }
        `;
        clonedDoc.head.appendChild(style);
      },
    };

    const [frontCanvas, backCanvas] = await Promise.all([
      html2canvas(frontDiv.firstElementChild, captureOptions),
      html2canvas(backDiv.firstElementChild, captureOptions),
    ]);

    // 5. Build PDF (8.2cm x 5cm)
    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "cm",
      format: [8.2, 5],
      compress: true,
    });

    // Add sides with high-quality rendering
    pdf.addImage(
      frontCanvas.toDataURL("image/png", 1.0),
      "PNG",
      0,
      0,
      8.2,
      5,
      undefined,
      "SLOW",
    );
    pdf.addPage([8.2, 5], "landscape");
    pdf.addImage(
      backCanvas.toDataURL("image/png", 1.0),
      "PNG",
      0,
      0,
      8.2,
      5,
      undefined,
      "SLOW",
    );

    // Cleanup
    document.body.removeChild(container);
    return pdf.output("blob");
  } catch (error) {
    console.error("Critical error in ID generation:", error);
    throw error;
  }
};

export const generateIDCardsZip = async (
  candidates,
  course,
  user,
  onProgress,
) => {
  try {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    let completed = 0;
    const total = candidates.length;

    // Sequential processing to avoid memory leaks
    for (const candidate of candidates) {
      try {
        const pdfBlob = await generateIDCardPDF(candidate, course, user);

        // Sanitize filename
        const fName = (candidate.firstName || "candidate").replace(
          /[^a-z0-9]/gi,
          "_",
        );
        const lName = (candidate.lastName || "").replace(/[^a-z0-9]/gi, "_");
        const fileName = `${fName}_${lName}_ID_Card.pdf`;

        const arrayBuffer = await pdfBlob.arrayBuffer();
        zip.file(fileName, arrayBuffer, { binary: true });

        completed++;
        if (onProgress) onProgress(Math.round((completed / total) * 100));
      } catch (err) {
        console.error(
          `Failed to process candidate ${candidate.firstName}:`,
          err,
        );
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

export const downloadMultipleIDCards = async (
  candidates,
  course,
  user,
  onProgress,
) => {
  try {
    const result = await generateIDCardsZip(
      candidates,
      course,
      user,
      onProgress,
    );
    const url = window.URL.createObjectURL(result.zipBlob);
    const link = document.createElement("a");
    link.href = url;
    const date = new Date().toISOString().split("T")[0];
    link.download = `ID_Cards_${course.referenceNumber || "bulk"}_${date}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => window.URL.revokeObjectURL(url), 1000);
    return { success: true, downloaded: result.completed, total: result.total };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

function getFrontCardHTML(data) {
  const {
    fullName,
    traineeId,
    certNumber,
    courseName,
    atcName,
    startDate,
    endDate,
    frontBg,
    profileImg,
    candidateImg,
  } = data;

  // Dynamic font sizing
  const nameWrap = fullName.length > 19 ? "normal" : "nowrap";
  const courseFS = courseName.length > 45 ? "5px" : "7px";
  const atcFS = atcName.length > 45 ? "5px" : "7px";

  return `
    <div style="width: 8.2cm; height: 5cm; position: relative; background-color: #ffffff; overflow: hidden; font-family: 'Montserrat', sans-serif; box-sizing: border-box;">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Anton&display=swap');
      </style>
      
      ${frontBg ? `<img src="${frontBg}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; left: 0; top: 0; z-index: 1;" />` : ""}
      
      ${profileImg ? `<img src="${profileImg}" style="position: absolute; top: 0.29cm; right: 0.29cm; max-width: 50px; max-height: 35px;width:auto; height:auto; object-fit: contain; z-index: 10;" />` : ""}
      ${candidateImg ? `<img src="${candidateImg}" style="position: absolute; top: 1.8cm; left: 0.3cm; max-width: 1.8cm; max-height: 2.2cm;width:auto; height:auto; object-fit: contain; z-index: 10; border-radius: 4px; border: 3px solid #082450;"/>` : ""}
      <div style="
  position: absolute;
  top: 1.5cm;
  left: 2.75cm;
  width: 4.9cm;
  height: 0.9cm;
  font-family: 'Anton', sans-serif;
  font-size: 10px;
  color: #11223e;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  line-height: 1;
  white-space: ${nameWrap};
">
  ${fullName}
</div>
      <div style="position: absolute; top: 2.7cm; left: 3.58cm; font-family: 'Montserrat', sans-serif; font-size: 7px; color: white; font-weight: bold; z-index: 20;">${traineeId}</div>
      <div style="position: absolute; top: 2.75cm; left: 5.11cm; font-family: 'Montserrat', sans-serif; font-size: ${courseFS}; color: white; font-weight: bold; z-index: 20; width: 3.1cm;height:0.5cm;line-height: 1;">
        ${courseName}
      </div>
      <div style="position: absolute; top: 3.45cm; left: 3.58cm; font-family: 'Montserrat', sans-serif; font-size: 7px; color: white; font-weight: bold; z-index: 20;">${certNumber}</div>
      <div style="position: absolute; top: 3.5cm; left: 5.11cm; font-family: 'Montserrat', sans-serif; font-size: ${atcFS}; color: white; font-weight: bold; z-index: 20; width: 3.1cm;height:auto; line-height: 1.1;">
        ${atcName}
      </div>
      
      <div style="position: absolute; top: 4.328cm; left: 7.3cm; font-family: 'Montserrat', sans-serif; font-size: 5px; font-weight: bold; color: white; z-index: 20; text-align: left;width:3cm;height:auto;">${startDate}</div>

      <div style="position: absolute; top: 4.493cm; left: 7.3cm; font-family: 'Montserrat', sans-serif; font-size: 5px; font-weight: bold; color: white; z-index: 20; text-align: left;width:3cm;height:auto;">${endDate}</div>
    </div>
  `;
}

function getBackCardHTML(data) {
  const { backBg, qrCode } = data;
  return `
    <div style="width: 8.2cm; height: 5cm; position: relative; background-color: #ffffff; overflow: hidden; box-sizing: border-box;">
      ${backBg ? `<img src="${backBg}" style="width: 100%; height: 100%; object-fit: cover; position: absolute; left: 0; top: 0; z-index: 1;" />` : ""}
      ${
        qrCode
          ? `
        <div style="position: absolute; top: 1.28cm; left: 50%; transform: translateX(-50%); background-color: white; width: 1.3cm; height: 1.3cm; z-index: 10; display: flex; align-items: center; justify-content: center;">
          <img src="${qrCode}" style="width: 1.25cm; height: 1.25cm;" />
        </div>
      `
          : ""
      }
    </div>
  `;
}

async function generateQRCode(candidate) {
  try {
    const fName = (candidate.firstName || "").replace(/\s+/g, "-");
    const lName = (candidate.lastName || "").replace(/\s+/g, "-");
    const traineeId = candidate.traineeId || candidate.id || "";
    const candidateId = candidate._id || "";
    const url = buildPublicUrl(`${webData.urls.certificateVerificationPath}/${fName}/${lName}/${traineeId}/${candidateId}`);
    return await QRCode.toDataURL(url, { width: 200, margin: 0 });
  } catch {
    return null;
  }
}

export default {
  generateIDCardPDF,
  generateIDCardsZip,
  downloadMultipleIDCards,
};
