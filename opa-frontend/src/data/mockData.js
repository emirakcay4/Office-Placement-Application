export const mockStats = {
  totalOffices: 48,
  occupied: 35,
  available: 10,
  conflicts: 3,
};

export const mockRecentAssignments = [
  { id: 1, officeNo: 'A-101', occupant: 'Dr. İbrahim Adeshola', department: 'Software Engineering', date: 'Mar 10, 2025' },
  { id: 2, officeNo: 'B-204', occupant: 'Dr. Ceren Ustaoğlu', department: 'Mathematics', date: 'Mar 9, 2025' },
  { id: 3, officeNo: 'A-305', occupant: 'Dr. Sara Kanzi', department: 'Physics', date: 'Mar 8, 2025' },
  { id: 4, officeNo: 'C-102', occupant: 'Dr. Imane Boumedra', department: 'Software Engineering', date: 'Mar 7, 2025' },
  { id: 5, officeNo: 'B-110', occupant: 'Dr. Selin Arslan', department: 'Chemistry', date: 'Mar 6, 2025' },
];

export const mockFlaggedOffices = [
  { id: 1, officeNo: 'A-202', building: 'Block A', capacity: 2, current: 3 },
  { id: 2, officeNo: 'C-305', building: 'Block C', capacity: 1, current: 2 },
  { id: 3, officeNo: 'B-401', building: 'Block B', capacity: 2, current: 4 },
];

export const mockUser = {
  name: 'Çağla',
  role: 'Department Admin',
  initials: 'ÇA',
};