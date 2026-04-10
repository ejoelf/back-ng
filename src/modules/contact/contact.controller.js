import { createNotification } from "../notifications/notifications.service.js";

export async function createContact(req, res) {
  try {
    const name = String(req.body?.name || "").trim();
    const email = String(req.body?.email || "").trim();
    const message = String(req.body?.message || "").trim();

    if (!name || !email || !message) {
      return res.status(400).json({
        ok: false,
        message: "Faltan datos obligatorios",
      });
    }

    try {
      const formData = new URLSearchParams();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("message", message);

      const response = await fetch(
        "https://nicogaliciastylistmens.com/send-mail.php",
        {
          method: "POST",
          body: formData,
        }
      );

      const result = await response.text();
      console.log("📩 PHP RESPONSE:", result);
    } catch (err) {
      console.error("❌ Error enviando email:", err.message);
    }

    await createNotification({
      type: "contact",
      title: "Nuevo mensaje",
      message: `${name} envió un mensaje`,
      data: { email, name },
    });

    return res.json({ ok: true });
  } catch (err) {
    console.error("❌ CONTACT ERROR:", err);
    return res.status(500).json({
      ok: false,
      message: "Error interno",
    });
  }
}