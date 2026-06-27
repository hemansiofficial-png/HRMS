import { prisma } from '@/lib/prisma';

export interface CreateNotificationParams {
  userId: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  category: 'GENERAL' | 'LEAVE' | 'ATTENDANCE' | 'PAYROLL' | 'PERFORMANCE' | 'RESIGNATION' | 'TERMINATION' | 'PROMOTION' | 'TRANSFER' | 'TASK' | 'ANNOUNCEMENT';
  title: string;
  message: string;
  link?: string;
  expiresAt?: Date;
}

/**
 * Create a single notification
 */
export async function createNotification(data: CreateNotificationParams) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        category: data.category,
        title: data.title,
        message: data.message,
        link: data.link || null,
        expiresAt: data.expiresAt || null
      }
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

/**
 * Create notifications for multiple users (e.g., all employees in a department)
 */
export async function createBulkNotifications(
  userIds: string[],
  data: Omit<CreateNotificationParams, 'userId'>
) {
  try {
    const notifications = await Promise.all(
      userIds.map(userId =>
        prisma.notification.create({
          data: {
            userId,
            type: data.type,
            category: data.category,
            title: data.title,
            message: data.message,
            link: data.link || null,
            expiresAt: data.expiresAt || null
          }
        })
      )
    );

    return notifications;
  } catch (error) {
    console.error('Error creating bulk notifications:', error);
    return [];
  }
}

/**
 * Send resignation notification to manager
 */
export async function sendResignationNotification(
  employeeName: string,
  managerId: string,
  resignationId: string
) {
  return createNotification({
    userId: managerId,
    type: 'WARNING',
    category: 'RESIGNATION',
    title: 'New Resignation Submitted',
    message: `${employeeName} has submitted their resignation. Please review and take action.`,
    link: `/resignations`
  });
}

/**
 * Send approval/rejection notification to employee
 */
export async function sendResignationDecisionNotification(
  employeeId: string,
  employeeName: string,
  decision: 'APPROVED' | 'REJECTED',
  managerName: string
) {
  return createNotification({
    userId: employeeId,
    type: decision === 'APPROVED' ? 'SUCCESS' : 'ERROR',
    category: 'RESIGNATION',
    title: decision === 'APPROVED' ? 'Resignation Approved' : 'Resignation Rejected',
    message: decision === 'APPROVED'
      ? `Your resignation has been approved by ${managerName}. Please proceed with the handover process.`
      : `Your resignation has been rejected by ${managerName}. Please contact them for further discussion.`,
    link: `/profile`
  });
}

/**
 * Send leave approval notification
 */
export async function sendLeaveDecisionNotification(
  employeeId: string,
  employeeName: string,
  decision: 'APPROVED' | 'REJECTED',
  managerName: string
) {
  return createNotification({
    userId: employeeId,
    type: decision === 'APPROVED' ? 'SUCCESS' : 'ERROR',
    category: 'LEAVE',
    title: `Leave Request ${decision === 'APPROVED' ? 'Approved' : 'Rejected'}`,
    message: decision === 'APPROVED'
      ? `Your leave request has been approved by ${managerName}.`
      : `Your leave request has been rejected by ${managerName}.`,
    link: `/leave`
  });
}

/**
 * Send payroll notification (e.g., payslip generated)
 */
export async function sendPayrollNotification(
  employeeId: string,
  employeeName: string,
  month: string
) {
  return createNotification({
    userId: employeeId,
    type: 'SUCCESS',
    category: 'PAYROLL',
    title: 'Payslip Generated',
    message: `Your payslip for ${month} has been generated. You can view it in the Payroll section.`,
    link: `/payroll/payslips`
  });
}

/**
 * Send task assignment notification
 */
export async function sendTaskAssignmentNotification(
  employeeId: string,
  taskTitle: string,
  assignedBy: string
) {
  return createNotification({
    userId: employeeId,
    type: 'INFO',
    category: 'TASK',
    title: 'New Task Assigned',
    message: `You have been assigned a new task: "${taskTitle}" by ${assignedBy}.`,
    link: `/tasks`
  });
}

/**
 * Send announcement to all employees
 */
export async function sendCompanyAnnouncement(
  title: string,
  message: string,
  employeeIds: string[]
) {
  return createBulkNotifications(employeeIds, {
    type: 'INFO',
    category: 'ANNOUNCEMENT',
    title,
    message,
    link: `/announcements`
  });
}

/**
 * Send promotion notification
 */
export async function sendPromotionNotification(
  employeeId: string,
  employeeName: string,
  newDesignation: string,
  previousDesignation: string
) {
  return createNotification({
    userId: employeeId,
    type: 'SUCCESS',
    category: 'PROMOTION',
    title: 'Congratulations on Your Promotion!',
    message: `You have been promoted from ${previousDesignation} to ${newDesignation}.`,
    link: `/profile`
  });
}

/**
 * Send termination notification to employee
 */
export async function sendTerminationNotification(
  employeeId: string,
  employeeName: string,
  hrName: string
) {
  return createNotification({
    userId: employeeId,
    type: 'ERROR',
    category: 'TERMINATION',
    title: 'Employment Termination',
    message: `Your employment has been terminated by ${hrName}. Please contact HR for further details.`,
    link: `/profile`
  });
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await prisma.notification.count({
      where: {
        userId,
        isRead: false
      }
    });

    return count;
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}
