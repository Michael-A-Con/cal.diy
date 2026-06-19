// [looknbook] Customer history & loyalty — data access layer.
// Only this class knows about Prisma. No business logic here (grouping/loyalty live in the service/libs).
import type { PrismaClient } from "@calcom/prisma/client";
import { BookingStatus } from "@calcom/prisma/enums";

import type { CustomerBookingRecordDto } from "../types";

export interface ICustomerRepository {
  /**
   * Returns one record per (booking × attendee) for realized visits of the given host:
   * ACCEPTED bookings whose startTime is in the past. Flattened and mapped to a DTO.
   */
  findAttendeeVisitsByUserId(userId: number): Promise<CustomerBookingRecordDto[]>;
}

export class CustomerRepository implements ICustomerRepository {
  constructor(private prisma: PrismaClient) {}

  async findAttendeeVisitsByUserId(userId: number): Promise<CustomerBookingRecordDto[]> {
    // Uses @@index([userId, status, startTime]). select-only (never include) per repo conventions.
    const bookings = await this.prisma.booking.findMany({
      where: {
        userId,
        status: BookingStatus.ACCEPTED,
        // Realized visits only — upcoming bookings are intentionally excluded (future "upcoming" section).
        startTime: { lte: new Date() },
      },
      select: {
        id: true,
        startTime: true,
        eventType: {
          select: { id: true, title: true, slug: true },
        },
        attendees: {
          select: { email: true, name: true, phoneNumber: true, noShow: true },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Flatten to attendee-level records (a booking may have multiple attendees).
    const records: CustomerBookingRecordDto[] = [];
    for (const booking of bookings) {
      for (const attendee of booking.attendees) {
        records.push({
          bookingId: booking.id,
          startTime: booking.startTime,
          attendeeName: attendee.name,
          attendeeEmail: attendee.email,
          attendeePhone: attendee.phoneNumber ?? null,
          attendeeNoShow: attendee.noShow ?? false,
          eventType: booking.eventType
            ? { id: booking.eventType.id, title: booking.eventType.title, slug: booking.eventType.slug }
            : null,
        });
      }
    }
    return records;
  }
}
