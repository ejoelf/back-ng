import nodemailer from "nodemailer";
import { env } from "../config/env.js";

const ARG_TZ = "America/Argentina/Cordoba";
const BRAND_LOGO_URL = "https://nicogaliciastylistmens.com/LogoNG.png";

let transporterPromise = null;

function hasMailerConfig() {
  return Boolean(
    env.mailEnabled &&
      env.mailHost &&
      env.mailPort &&
      env.mailUser &&
      env.mailPass &&
      env.mailFrom
  );
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDateAR(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ARG_TZ,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function formatTimeAR(value) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-AR", {
    timeZone: ARG_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

async function getTransporter() {
  if (!hasMailerConfig()) return null;

  if (!transporterPromise) {
    transporterPromise = Promise.resolve(
      nodemailer.createTransport({
        host: env.mailHost,
        port: Number(env.mailPort) || 587,

        secure: Number(env.mailPort) === 465,

        auth: {
          user: env.mailUser,
          pass: env.mailPass,
        },

        requireTLS: true,

        tls: {
          rejectUnauthorized: false,
        },

        connectionTimeout: 20000,
        greetingTimeout: 20000,
        socketTimeout: 20000,
      })
    );
  }

  return transporterPromise;
}

function buildLogoBlock() {
  return `
    <div style="margin:0 0 14px;">
      <img
        src="${BRAND_LOGO_URL}"
        alt="Logo Peluquería NG"
        style="display:block;max-width:140px;height:auto;border:0;outline:none;text-decoration:none;"
      />
    </div>
  `;
}

function buildShellHtml({ eyebrow, title, intro, bodyHtml, footerHtml }) {
  return `
    <div style="margin:0;padding:24px;background:#0f1115;font-family:Arial,Helvetica,sans-serif;color:#f9fafb;">
      <div style="max-width:620px;margin:0 auto;background:#161a22;border:1px solid #272d3a;border-radius:18px;overflow:hidden;">
        <div style="padding:28px 28px 20px;background:linear-gradient(135deg,#1f2937,#111827);border-bottom:1px solid #272d3a;">
          ${buildLogoBlock()}
          <p style="margin:0 0 10px;font-size:12px;letter-spacing:1.8px;text-transform:uppercase;color:#9ca3af;">${eyebrow}</p>
          <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;">${title}</h1>
          <p style="margin:12px 0 0;font-size:15px;line-height:1.6;color:#d1d5db;">${intro}</p>
        </div>

        <div style="padding:28px;">
          ${bodyHtml}
          ${footerHtml}
        </div>
      </div>
    </div>
  `;
}

function buildDetailCardHtml({ lines, accent = "#93c5fd", title = "Detalle del turno" }) {
  const rows = lines
    .map(
      (line) => `
        <p style="margin:0 0 10px;font-size:15px;color:#f9fafb;">
          <strong>${escapeHtml(line.label)}:</strong> ${escapeHtml(line.value)}
        </p>
      `
    )
    .join("");

  return `
    <div style="background:#0f172a;border:1px solid #23304a;border-radius:16px;padding:20px;">
      <p style="margin:0 0 12px;font-size:14px;color:${accent};text-transform:uppercase;letter-spacing:1px;">${escapeHtml(title)}</p>
      ${rows}
    </div>
  `;
}

function buildInfoFooterHtml({ message, businessWhatsapp }) {
  const whatsappText = escapeHtml(businessWhatsapp || env.businessWhatsapp || "");

  const whatsappLine = whatsappText
    ? `<p style="margin:0 0 8px;color:#d1d5db;font-size:14px;"><strong>WhatsApp del salón:</strong> ${whatsappText}</p>`
    : "";

  return `
    <div style="margin-top:22px;padding:18px;border-radius:14px;background:#111827;border:1px solid #272d3a;">
      <p style="margin:0 0 8px;color:#f3f4f6;font-size:14px;">${message}</p>
      ${whatsappLine}
    </div>
  `;
}

function baseAppointmentLines(appointment) {
  return [
    { label: "Servicio", value: appointment?.serviceName || "Servicio" },
    { label: "Profesional", value: appointment?.staffName || "Staff" },
    { label: "Fecha", value: formatDateAR(appointment?.startAt) },
    { label: "Hora", value: `${formatTimeAR(appointment?.startAt)} hs` },
    { label: "Cliente", value: appointment?.clientName || "Cliente" },
    { label: "Teléfono", value: appointment?.clientPhone || "—" },
    { label: "Email", value: appointment?.clientEmail || "—" },
    { label: "Observaciones", value: appointment?.notes || "Sin observaciones" },
  ];
}

function buildAppointmentEmailHtml({ appointment, businessName, businessWhatsapp }) {
  const clientName = escapeHtml(appointment?.clientName || "Cliente");
  const businessText = escapeHtml(businessName || env.businessPublicName);

  return buildShellHtml({
    eyebrow: "Confirmación de turno",
    title: businessText,
    intro: `Hola ${clientName}, tu turno fue reservado correctamente. Te dejamos el detalle para que lo tengas a mano.`,
    bodyHtml: buildDetailCardHtml({
      title: "Detalle del turno",
      accent: "#93c5fd",
      lines: baseAppointmentLines(appointment),
    }),
    footerHtml: buildInfoFooterHtml({
      message:
        "<strong>Importante:</strong> si necesitás modificar o cancelar el turno, escribinos con tiempo así podemos ayudarte.",
      businessWhatsapp,
    }),
  });
}

function buildAppointmentEmailText({ appointment, businessName, businessWhatsapp }) {
  return [
    businessName || env.businessPublicName,
    "",
    `Hola ${appointment?.clientName || "Cliente"}, tu turno fue reservado correctamente.`,
    "",
    `Servicio: ${appointment?.serviceName || "Servicio"}`,
    `Profesional: ${appointment?.staffName || "Staff"}`,
    `Fecha: ${formatDateAR(appointment?.startAt)}`,
    `Hora: ${formatTimeAR(appointment?.startAt)} hs`,
    `Cliente: ${appointment?.clientName || "Cliente"}`,
    `Teléfono: ${appointment?.clientPhone || "—"}`,
    `Email: ${appointment?.clientEmail || "—"}`,
    `Observaciones: ${appointment?.notes || "Sin observaciones"}`,
    businessWhatsapp || env.businessWhatsapp
      ? `WhatsApp del salón: ${businessWhatsapp || env.businessWhatsapp}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");
}

function buildCancellationEmailHtml({ appointment, businessName, businessWhatsapp }) {
  const clientName = escapeHtml(appointment?.clientName || "Cliente");
  const businessText = escapeHtml(businessName || env.businessPublicName);

  return buildShellHtml({
    eyebrow: "Cancelación de turno",
    title: businessText,
    intro: `Hola ${clientName}, queremos avisarte que tu turno fue cancelado. Te dejamos el detalle para que lo tengas presente.`,
    bodyHtml: buildDetailCardHtml({
      title: "Turno cancelado",
      accent: "#fca5a5",
      lines: baseAppointmentLines(appointment),
    }),
    footerHtml: buildInfoFooterHtml({
      message:
        "<strong>Importante:</strong> para más información o para coordinar un nuevo turno, comunicate con la peluquería.",
      businessWhatsapp,
    }),
  });
}

function buildCancellationEmailText({ appointment, businessName, businessWhatsapp }) {
  return [
    businessName || env.businessPublicName,
    "",
    `Hola ${appointment?.clientName || "Cliente"}, tu turno fue cancelado.`,
    "",
    `Servicio: ${appointment?.serviceName || "Servicio"}`,
    `Profesional: ${appointment?.staffName || "Staff"}`,
    `Fecha original: ${formatDateAR(appointment?.startAt)}`,
    `Hora original: ${formatTimeAR(appointment?.startAt)} hs`,
    `Cliente: ${appointment?.clientName || "Cliente"}`,
    businessWhatsapp || env.businessWhatsapp
      ? `WhatsApp del salón: ${businessWhatsapp || env.businessWhatsapp}`
      : null,
    "",
    "Para más información o para coordinar un nuevo turno, comunicate con la peluquería.",
  ]
    .filter(Boolean)
    .join("\n");
}

function buildRescheduledEmailHtml({
  previousAppointment,
  updatedAppointment,
  businessName,
  businessWhatsapp,
}) {
  const clientName = escapeHtml(updatedAppointment?.clientName || previousAppointment?.clientName || "Cliente");
  const businessText = escapeHtml(businessName || env.businessPublicName);

  const oldLines = [
    { label: "Servicio", value: previousAppointment?.serviceName || "Servicio" },
    { label: "Profesional", value: previousAppointment?.staffName || "Staff" },
    { label: "Fecha", value: formatDateAR(previousAppointment?.startAt) },
    { label: "Hora", value: `${formatTimeAR(previousAppointment?.startAt)} hs` },
  ];

  const newLines = [
    { label: "Servicio", value: updatedAppointment?.serviceName || "Servicio" },
    { label: "Profesional", value: updatedAppointment?.staffName || "Staff" },
    { label: "Nueva fecha", value: formatDateAR(updatedAppointment?.startAt) },
    { label: "Nueva hora", value: `${formatTimeAR(updatedAppointment?.startAt)} hs` },
    { label: "Cliente", value: updatedAppointment?.clientName || "Cliente" },
    { label: "Teléfono", value: updatedAppointment?.clientPhone || "—" },
    { label: "Email", value: updatedAppointment?.clientEmail || "—" },
    { label: "Observaciones", value: updatedAppointment?.notes || "Sin observaciones" },
  ];

  return buildShellHtml({
    eyebrow: "Reprogramación de turno",
    title: businessText,
    intro: `Hola ${clientName}, tu turno fue reprogramado. Te compartimos el horario anterior y el nuevo horario actualizado.`,
    bodyHtml: `
      ${buildDetailCardHtml({
        title: "Turno anterior",
        accent: "#fbbf24",
        lines: oldLines,
      })}
      <div style="height:16px;"></div>
      ${buildDetailCardHtml({
        title: "Nuevo turno",
        accent: "#86efac",
        lines: newLines,
      })}
    `,
    footerHtml: buildInfoFooterHtml({
      message:
        "<strong>Importante:</strong> si necesitás otra modificación o tenés alguna duda, comunicate con la peluquería.",
      businessWhatsapp,
    }),
  });
}

function buildRescheduledEmailText({
  previousAppointment,
  updatedAppointment,
  businessName,
  businessWhatsapp,
}) {
  return [
    businessName || env.businessPublicName,
    "",
    `Hola ${updatedAppointment?.clientName || previousAppointment?.clientName || "Cliente"}, tu turno fue reprogramado.`,
    "",
    "Turno anterior:",
    `- Servicio: ${previousAppointment?.serviceName || "Servicio"}`,
    `- Profesional: ${previousAppointment?.staffName || "Staff"}`,
    `- Fecha: ${formatDateAR(previousAppointment?.startAt)}`,
    `- Hora: ${formatTimeAR(previousAppointment?.startAt)} hs`,
    "",
    "Nuevo turno:",
    `- Servicio: ${updatedAppointment?.serviceName || "Servicio"}`,
    `- Profesional: ${updatedAppointment?.staffName || "Staff"}`,
    `- Fecha: ${formatDateAR(updatedAppointment?.startAt)}`,
    `- Hora: ${formatTimeAR(updatedAppointment?.startAt)} hs`,
    `- Cliente: ${updatedAppointment?.clientName || "Cliente"}`,
    businessWhatsapp || env.businessWhatsapp
      ? `WhatsApp del salón: ${businessWhatsapp || env.businessWhatsapp}`
      : null,
    "",
    "Si necesitás otra modificación o tenés alguna duda, comunicate con la peluquería.",
  ]
    .filter(Boolean)
    .join("\n");
}

async function sendMail({ to, subject, text, html }) {
  const recipient = String(to || "").trim();

  if (!recipient) {
    return { sent: false, skipped: true, reason: "missing-recipient" };
  }

  const transporter = await getTransporter();

  if (!transporter) {
    return { sent: false, skipped: true, reason: "mailer-disabled" };
  }

  await transporter.sendMail({
    from: env.mailFromName
      ? `"${env.mailFromName}" <${env.mailFrom}>`
      : env.mailFrom,
    to: recipient,
    replyTo: env.mailFrom,
    subject,
    text,
    html,
  });

  return { sent: true, skipped: false };
}

export async function sendAppointmentConfirmationEmail({
  appointment,
  businessName,
  businessWhatsapp,
}) {
  const finalBusinessName = businessName || env.businessPublicName;
  const subject = `Confirmación de turno - ${finalBusinessName}`;

  return sendMail({
    to: appointment?.clientEmail,
    subject,
    text: buildAppointmentEmailText({
      appointment,
      businessName: finalBusinessName,
      businessWhatsapp,
    }),
    html: buildAppointmentEmailHtml({
      appointment,
      businessName: finalBusinessName,
      businessWhatsapp,
    }),
  });
}

export async function sendAppointmentCancellationEmail({
  appointment,
  businessName,
  businessWhatsapp,
}) {
  const finalBusinessName = businessName || env.businessPublicName;
  const subject = `Tu turno fue cancelado - ${finalBusinessName}`;

  return sendMail({
    to: appointment?.clientEmail,
    subject,
    text: buildCancellationEmailText({
      appointment,
      businessName: finalBusinessName,
      businessWhatsapp,
    }),
    html: buildCancellationEmailHtml({
      appointment,
      businessName: finalBusinessName,
      businessWhatsapp,
    }),
  });
}

export async function sendAppointmentRescheduledEmail({
  previousAppointment,
  updatedAppointment,
  businessName,
  businessWhatsapp,
}) {
  const finalBusinessName = businessName || env.businessPublicName;
  const subject = `Tu turno fue reprogramado - ${finalBusinessName}`;

  return sendMail({
    to: updatedAppointment?.clientEmail || previousAppointment?.clientEmail,
    subject,
    text: buildRescheduledEmailText({
      previousAppointment,
      updatedAppointment,
      businessName: finalBusinessName,
      businessWhatsapp,
    }),
    html: buildRescheduledEmailHtml({
      previousAppointment,
      updatedAppointment,
      businessName: finalBusinessName,
      businessWhatsapp,
    }),
  });
}