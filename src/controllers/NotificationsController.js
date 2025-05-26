import express from 'express';
import NotificationsService from '../services/NotificationsService.js';
import passport from '../config/passport.js';
import { asyncHandler } from '../utils/async-handler.js';

const notificationsController = express.Router();

// 알림 생성
notificationsController.post(
  '/',
  passport.authenticate('access-token', { session: false }),
  asyncHandler(async (req, res) => {
    const { message } = req.body;
    const userId = req.user.id;
    const io = req.app.get('io');
    const notification = await NotificationsService.createNotification({ userId, message }, io);
    res.status(201).json(notification);
  })
);

// 유저별 알림 전체 조회
notificationsController.get(
  '/',
  passport.authenticate('access-token', { session: false }),
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const notifications = await NotificationsService.getNotificationsByUser(userId);
    res.json(notifications);
  })
);

// 알림 단건 조회
notificationsController.get(
  '/:id',
  passport.authenticate('access-token', { session: false }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const notification = await NotificationsService.getNotificationById(Number(id));
    if (!notification) return res.status(404).json({ message: '알림을 찾을 수 없습니다.' });
    res.json(notification);
  })
);

// 알림 읽음 처리
notificationsController.patch(
  '/:id/read',
  passport.authenticate('access-token', { session: false }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    const updated = await NotificationsService.markAsRead(Number(id));
    res.json(updated);
  })
);

// 알림 삭제
notificationsController.delete(
  '/:id',
  passport.authenticate('access-token', { session: false }),
  asyncHandler(async (req, res) => {
    const { id } = req.params;
    await NotificationsService.deleteNotification(Number(id));
    res.status(204).end();
  })
);

export default notificationsController;
