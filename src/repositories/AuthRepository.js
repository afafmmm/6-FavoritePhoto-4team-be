import prisma from "../config/prisma.js";

async function create(data) {
  return prisma.user.create({
    data,
    select: {
      id: true,
      email: true,
      nickname: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function findById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      nickname: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

async function findByIdWithPassword(id) {
  return prisma.user.findUnique({
    where: { id },
  });
}

async function findByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
  });
}

async function findByNickname(nickname) {
  return prisma.user.findUnique({
    where: { nickname },
    select: {
      id: true,
      nickname: true,
    },
  });
}

async function update(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      email: true,
      nickname: true,
      profileImage: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export default {
  create,
  findById,
  findByIdWithPassword,
  findByEmail,
  findByNickname,
  update,
};
