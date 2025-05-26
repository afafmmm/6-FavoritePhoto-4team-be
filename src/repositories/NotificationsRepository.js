import prisma from '../config/prisma.js';

const NotificationsRepository = {
  // 알림 생성
  async createNotification({ userId, message }) {
    return prisma.notification.create({
      data: { userId, message }
    });
  },
  // 알림 전체 조회 (유저별)
  async getNotificationsByUser(userId) {
    return prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });
  },
  // 알림 단건 조회
  async getNotificationById(id) {
    return prisma.notification.findUnique({ where: { id } });
  },
  // 알림 읽음 처리
  async markAsRead(id) {
    return prisma.notification.update({
      where: { id },
      data: { read: true }
    });
  },
  // 알림 삭제
  async deleteNotification(id) {
    return prisma.notification.delete({ where: { id } });
  }
};

export default NotificationsRepository;
