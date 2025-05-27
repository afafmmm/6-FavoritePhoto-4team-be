import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // seeduser@example.com 비밀번호만 덮어씌우기
  const hashedPassword = await bcrypt.hash('seedpassword', 10);
  await prisma.user.update({
    where: { email: 'seeduser@example.com' },
    data: { password: hashedPassword }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
