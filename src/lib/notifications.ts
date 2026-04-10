import { db } from "@/lib/db"

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  return db.notification.create({
    data: { userId, title, message, type, link },
  })
}

export async function notifyRole(
  role: string,
  title: string,
  message: string,
  type: string,
  link?: string
) {
  const users = await db.user.findMany({ where: { role } })
  for (const user of users) {
    await createNotification(user.id, title, message, type, link)
  }
}

export async function notifyStifin(
  title: string,
  message: string,
  type: string
) {
  return notifyRole("STIFIN", title, message, type)
}
