export type UserRole = 'admin' | 'student' | 'faculty';

export type RoomStatus = 'free' | 'occupied' | 'extra';

export interface Booking {
  id: string;
  roomNumber: string;
  date: string;
  timeSlot: string;
  batchName: string;
  lectureName: string;
  status: RoomStatus;
}

export interface Classroom {
  roomNumber: string;
  floor: number;
  currentStatus: RoomStatus;
  currentBooking?: Booking;
  bookings: Booking[];
}

export interface Floor {
  number: number;
  classrooms: Classroom[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface Reply {
  id: string;
  content: string;
  author: string; // 'student' or 'faculty' or 'admin'
  authorName: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  description: string;
  date: string; // ISO date string
  teacherName?: string;
  batchName?: string;
  createdAt: string;
  replies?: Reply[];
}

export type LostFoundType = 'lost' | 'found';
export type ClaimStatus = 'pending' | 'approved' | 'rejected';

export interface LostFoundClaim {
  id: string;
  claimantName: string;
  claimantContact: string;
  proof: string;
  status: ClaimStatus;
  createdAt: string;
}

export interface LostFoundItem {
  id: string;
  type: LostFoundType;
  title: string;
  description: string;
  category: string;
  location: string;
  dateTime: string;
  reportedBy: string;
  contact: string;
  foundByName?: string;
  createdAt: string;
  claims: LostFoundClaim[];
}
