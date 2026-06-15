"use server";

import { PrismaClient, Notification, AlertLevel } from "@prisma/client";
import { executeTransaction, Result } from "../transactions";
import { getTenantIdFromRequest } from "../server-context";
import { z } from "zod";

const prisma = new PrismaClient();
const UUIDSchema = z.string().min(1);

/**
 * Get all notifications for the authenticated user.
 * Filters by session tenantId, orders by createdAt DESC.
 * 
 * Requirements: 20.3
 * 
 * @returns Result containing array of notifications or error
 * 
 * @example
 * ```typescript
 * const result = await getNotifications();
 * if (result.success) {
 *   console.log('Notifications:', result.data);
 * }
 * ```
 */
export async function getNotifications(): Promise<Result<Notification[]>> {
  try {
    const tenantId = await getTenantIdFromRequest();

    const notifications = await prisma.notification.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return { success: true, data: notifications };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch notifications",
    };
  }
}

/**
 * Mark a notification as read.
 * Validates tenantId ownership and notificationId is valid UUID.
 * 
 * Requirements: 20.4
 * 
 * @param notificationId - UUID of the notification
 * @returns Result indicating success or error
 * 
 * @example
 * ```typescript
 * const result = await markNotificationRead("550e8400-e29b-41d4-a716-446655440000");
 * if (result.success) {
 *   console.log('Notification marked as read');
 * }
 * ```
 */
export async function markNotificationRead(
  notificationId: string
): Promise<Result<void>> {
  try {
    const tenantId = await getTenantIdFromRequest();
    UUIDSchema.parse(notificationId);

    // Verify notification ownership
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId },
      select: { tenantId: true },
    });

    if (!notification || notification.tenantId !== tenantId) {
      return { success: false, error: "Notification not found or access denied" };
    }

    return await executeTransaction(async (tx) => {
      await tx.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid notification ID" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark notification as read",
    };
  }
}

/**
 * Mark all notifications as read for the authenticated user.
 * Filters by session tenantId.
 * 
 * Requirements: 20.5
 * 
 * @returns Result indicating success or error
 * 
 * @example
 * ```typescript
 * const result = await markAllNotificationsRead();
 * if (result.success) {
 *   console.log('All notifications marked as read');
 * }
 * ```
 */
export async function markAllNotificationsRead(): Promise<Result<void>> {
  try {
    const tenantId = await getTenantIdFromRequest();

    return await executeTransaction(async (tx) => {
      await tx.notification.updateMany({
        where: { 
          tenantId,
          isRead: false,
        },
        data: { isRead: true },
      });
    });
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark all notifications as read",
    };
  }
}

/**
 * Create a notification for an alert.
 * Helper function to be called when alertLevel changes to DANGER.
 * 
 * Requirements: 6.5, 20.1
 * 
 * @param courseId - UUID of the course triggering the alert
 * @param tenantId - UUID of the tenant to notify
 * @param alertLevel - Alert level (NORMAL, WARNING, DANGER)
 * @param message - Notification message content
 * @returns Result containing created notification or error
 * 
 * @example
 * ```typescript
 * const result = await createAlertNotification(
 *   "course-uuid",
 *   "tenant-uuid",
 *   "DANGER",
 *   "Required score for Database Systems exceeds 100%. Target grade A is no longer achievable."
 * );
 * ```
 */
export async function createAlertNotification(
  courseId: string,
  tenantId: string,
  alertLevel: AlertLevel,
  message: string
): Promise<Result<Notification>> {
  try {
    UUIDSchema.parse(courseId);
    UUIDSchema.parse(tenantId);

    return await executeTransaction(async (tx) => {
      return await tx.notification.create({
        data: {
          courseId,
          tenantId,
          alertLevel,
          message,
          isRead: false,
        },
      });
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: "Invalid course ID or tenant ID" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create notification",
    };
  }
}
