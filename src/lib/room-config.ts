const ROOM_CAPACITIES: Record<string, number> = {
  'CSE-101': 30,
  'CSE-102': 30,
  'CSE-105': 40,
  'CSE-106': 40,
  'CSE-201': 100,
  'CSE-202': 80,
  'CSE-204': 60,
  'CSE-205': 60,
  'CSE-206': 60,
  'CSE-301': 20,
  'CSE-302': 20,
  'CSE-303': 24,
  'CSE-304': 24,
  'CSE-305': 30,
  'CSE-306': 30,
  'CSE-401': 15,
  'CSE-402': 15,
  'CSE-403': 18,
  'CSE-404': 18,
  'CSE-405': 20,
  'CSE-406': 20,
  'CSE-501': 25,
  'CSE-502': 25,
  'CSE-503': 30,
  'CSE-504': 30,
  'CSE-505': 30,
  'CSE-506': 30
}

export function getRoomCapacity(roomNumber: string): number {
  return ROOM_CAPACITIES[roomNumber] ?? 30
}

export function isMaintenanceSchedule(schedule: Record<string, { courseName?: string } | null>): boolean {
  return Object.values(schedule).some((booking) => booking?.courseName?.toLowerCase() === 'maintenance')
}
