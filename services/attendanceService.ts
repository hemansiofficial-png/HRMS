import { prisma } from '@/lib/prisma';

export async function checkIn(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date: today } },
    update: { checkIn: new Date(), status: 'PRESENT' },
    create: { employeeId, date: today, checkIn: new Date(), status: 'PRESENT' }
  });
}

export async function checkOut(employeeId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return prisma.attendance.update({
    where: { employeeId_date: { employeeId, date: today } },
    data: { checkOut: new Date() }
  });
}
