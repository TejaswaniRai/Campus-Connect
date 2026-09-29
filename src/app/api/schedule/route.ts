import { NextResponse } from 'next/server';
import { getScheduleStore, saveSchedule, TIME_SLOTS, type TimeSlot, getScheduleForDate, getMergedScheduleForDate, hasRecurringConflict, isStaffRoom } from '@/lib/schedule-store';

export const dynamic = 'force-dynamic';

// GET /api/schedule
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');

  if (date) {
    // Return schedule for specific date merged with recurring regular classes
    const scheduleForDate = getMergedScheduleForDate(date);
    return NextResponse.json(scheduleForDate);
  }

  // Return today's schedule if no date specified
  const today = new Date().toISOString().split('T')[0];
  const scheduleForToday = getMergedScheduleForDate(today);
  return NextResponse.json(scheduleForToday);
}

// POST /api/schedule
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { roomNumber, timeSlot, batchName, teacherName, courseName, date } = body;

    // Validate required fields
    if (!roomNumber || !timeSlot || !batchName || !date) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const bookingDate = new Date(date);

    // Validate date
    if (bookingDate < new Date() || bookingDate.getDay() === 0 || bookingDate.getDay() === 6) {
      return NextResponse.json(
        { error: 'Invalid booking date. Must be a future weekday' },
        { status: 400 }
      );
    }

    // Get schedule for the date
    const scheduleForDate = getScheduleForDate(date);

    // Check if time slot is valid
    if (!TIME_SLOTS.includes(timeSlot as TimeSlot)) {
      return NextResponse.json(
        { error: 'Invalid time slot' },
        { status: 400 }
      );
    }

    const validTimeSlot = timeSlot as TimeSlot;

    // Block if the room is a staff room
    if (isStaffRoom(roomNumber)) {
      return NextResponse.json(
        { error: 'This room is reserved for Teachers Department CSE-AI' },
        { status: 409 }
      );
    }

    // Block if recurring regular class exists for this room and time on that weekday
    if (hasRecurringConflict(date, roomNumber, validTimeSlot)) {
      return NextResponse.json(
        { error: 'Room is unavailable due to regular classes at this time' },
        { status: 409 }
      );
    }

    // Check if room is already booked for this date and time (ad-hoc bookings)
    if (scheduleForDate[roomNumber]?.[validTimeSlot]) {
      return NextResponse.json(
        { error: 'Room is already booked for this time slot on the selected date' },
        { status: 409 }
      );
    }

    // Update the schedule with booking details
    if (!scheduleForDate[roomNumber]) {
      scheduleForDate[roomNumber] = {};
    }
    scheduleForDate[roomNumber][validTimeSlot] = {
      batchName,
      teacherName,
      courseName
    };

    // Save the updated schedule
    const fullSchedule = getScheduleStore();
    fullSchedule.dates[date] = scheduleForDate;
    saveSchedule(fullSchedule);

    return NextResponse.json({
      success: true,
      data: scheduleForDate[roomNumber]
    });
  } catch (error) {
    console.error('Error processing booking:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
