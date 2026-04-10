import { Notification } from "../../database/models/index.js";
import { io } from "../../server.js";

export async function createNotification({ type, title, message, data }) {
  const notification = await Notification.create({
    type,
    title,
    message,
    data,
  });

  // 🔥 Emitir en tiempo real
  io.emit("notification:new", notification);

  return notification;
}

export async function getNotifications() {
  return Notification.findAll({
    order: [["createdAt", "DESC"]],
  });
}

export async function markAllNotificationsAsRead() {
  await Notification.update(
    { read: true },
    {
      where: {
        read: false,
      },
    }
  );

  return true;
}