import NotificationsRepository from '../repositories/NotificationsRepository.js';

const NotificationsService = {
  // 알림 생성
  async createNotification({ userId, message }) {
    return NotificationsRepository.createNotification({ userId, message });
  },
  // 알림 전체 조회 (유저별)
  async getNotificationsByUser(userId) {
    return NotificationsRepository.getNotificationsByUser(userId);
  },
  // 알림 단건 조회
  async getNotificationById(id) {
    return NotificationsRepository.getNotificationById(id);
  },
  // 알림 읽음 처리
  async markAsRead(id) {
    return NotificationsRepository.markAsRead(id);
  },
  // 알림 삭제
  async deleteNotification(id) {
    return NotificationsRepository.deleteNotification(id);
  }
};

export default NotificationsService;
