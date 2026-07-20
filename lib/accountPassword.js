import crypto from "crypto";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";

const BCRYPT_COST = 12;

// Excludes look-alike characters (0/O, 1/l/I) so the password can be read out
// or retyped from an email without ambiguity.
const PASSWORD_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";

/**
 * Generate an 8-character random password using rejection sampling, so every
 * character is uniformly distributed (a plain `% alphabet.length` would bias
 * the earlier characters).
 */
export function generateAccountPassword(length = 8) {
  const alphabet = PASSWORD_ALPHABET;
  const max = 256 - (256 % alphabet.length);
  let out = "";
  while (out.length < length) {
    const byte = crypto.randomBytes(1)[0];
    if (byte >= max) continue;
    out += alphabet[byte % alphabet.length];
  }
  return out;
}

export async function hashPassword(plain) {
  return bcrypt.hash(plain, BCRYPT_COST);
}

function buildTransporter() {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT, 10),
    secure: true,
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
}

/**
 * Email a newly generated password to the account holder.
 *
 * Returns { sent, error } rather than throwing: the password has already been
 * saved by the time this runs, so a mail failure must not make the caller
 * think the reset itself failed.
 */
export async function sendNewPasswordEmail({ to, username, password, loginUrl }) {
  if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER) {
    return { sent: false, error: "Email is not configured on the server" };
  }

  try {
    const transporter = buildTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject: "Your new Ababeel password",
      html: `
        <div style="font-family: Arial, Helvetica, sans-serif; max-width: 560px; margin: 0 auto; color: #1f2937;">
          <h2 style="color: #1d4ed8; margin-bottom: 8px;">Your password has been reset</h2>
          <p>Hello ${username || "there"},</p>
          <p>An administrator has generated a new password for your Ababeel account.</p>
          <div style="background: #f3f4f6; border-radius: 10px; padding: 16px; margin: 20px 0; text-align: center;">
            <p style="margin: 0 0 6px; font-size: 13px; color: #6b7280;">Your new password</p>
            <p style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px; font-family: monospace;">${password}</p>
          </div>
          <p style="margin: 0 0 16px;">
            Sign in with your email <strong>${to}</strong> and the password above.
          </p>
          ${loginUrl ? `<p><a href="${loginUrl}" style="display: inline-block; background: #2563eb; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Go to login</a></p>` : ""}
          <p style="font-size: 13px; color: #6b7280; margin-top: 24px;">
            For your security, please change this password after signing in.
            If you were not expecting this email, contact your administrator.
          </p>
        </div>
      `,
    });
    return { sent: true, error: null };
  } catch (err) {
    // Never include the password in the logged message.
    console.error("Failed to send new password email:", err.message);
    return { sent: false, error: "Failed to send the email" };
  }
}
