import type { Customer, ServiceAppointment, Task, Vehicle } from './crm-types';

export const customers: Customer[] = [
  { id: 'C-1048', pentanaId: '00018492', name: 'Olivia Bennett', initials: 'OB', email: 'olivia.bennett@example.com', phone: '(02) 5550 0148', mobile: '0412 884 210', location: 'Parramatta', owner: 'Maya Chen', stage: 'Quote', interest: '2025 Mazda CX-5 Akera', lastContact: 'Today, 9:42 am', nextAction: 'Confirm test drive', source: 'Website', consent: 'Confirmed' },
  { id: 'C-1039', pentanaId: '00017731', name: 'Noah Williams', initials: 'NW', email: 'noah.williams@example.com', phone: '0433 706 229', location: 'North Sydney', owner: 'Daniel Reed', stage: 'Appraisal', interest: '2024 Toyota RAV4 Cruiser', lastContact: 'Yesterday, 4:18 pm', nextAction: 'Send valuation estimate', source: 'Pentana', consent: 'Review needed' },
  { id: 'C-1032', name: 'Amelia Singh', initials: 'AS', email: 'amelia.singh@example.com', phone: '0408 221 196', location: 'Chatswood', owner: 'Maya Chen', stage: 'Contacted', interest: '2025 Kia Sportage GT-Line', lastContact: 'Yesterday, 11:05 am', nextAction: 'Call after 2 pm', source: 'Phone', consent: 'Confirmed' },
  { id: 'C-1025', pentanaId: '00016502', name: 'Ethan Walker', initials: 'EW', email: 'ethan.walker@example.com', phone: '0421 300 882', location: 'Parramatta', owner: 'Jordan Lee', stage: 'New enquiry', interest: 'Used Subaru Outback', lastContact: '2 days ago', nextAction: 'First contact attempt', source: 'Pentana', consent: 'Do not contact' },
  { id: 'C-1018', name: 'Sophie Martin', initials: 'SM', email: 'sophie.martin@example.com', phone: '0419 188 045', location: 'Parramatta', owner: 'Daniel Reed', stage: 'Awaiting delivery', interest: '2024 Hyundai Tucson', lastContact: '3 days ago', nextAction: 'Prepare delivery checklist', source: 'Email', consent: 'Confirmed' },
  { id: 'C-1007', pentanaId: '00015119', name: 'Jack Thompson', initials: 'JT', email: 'jack.thompson@example.com', phone: '0402 533 817', location: 'North Sydney', owner: 'Maya Chen', stage: 'Appointment', interest: '2025 Mazda 3 G25', lastContact: '5 days ago', nextAction: 'Follow up finance enquiry', source: 'Pentana', consent: 'Confirmed' },
];

export const initialTasks: Task[] = [
  { id: 'T-81', customerId: 'C-1048', customer: 'Olivia Bennett', title: 'Confirm Saturday test drive', due: 'Today', time: '10:30 am', priority: 'High', type: 'Call' },
  { id: 'T-82', customerId: 'C-1039', customer: 'Noah Williams', title: 'Send trade-in valuation estimate', due: 'Today', time: '11:45 am', priority: 'Normal', type: 'Email' },
  { id: 'T-83', customerId: 'C-1032', customer: 'Amelia Singh', title: 'Discuss Sportage availability', due: 'Today', time: '2:00 pm', priority: 'Normal', type: 'Call' },
  { id: 'T-84', customerId: 'C-1025', customer: 'Ethan Walker', title: 'First contact attempt', due: 'Overdue', time: 'Yesterday', priority: 'High', type: 'Call' },
  { id: 'T-85', customerId: 'C-1018', customer: 'Sophie Martin', title: 'Verify handover documents', due: 'Today', time: '4:30 pm', priority: 'Normal', type: 'Internal' },
];

export const vehicles: Vehicle[] = [
  { id: 'V-201', stockNumber: 'PZ-2841', year: 2025, make: 'Mazda', model: 'CX-5', variant: 'Akera AWD', colour: 'Soul Red Crystal', price: '$56,420', kilometres: '12 km', status: 'Available', site: 'Parramatta', importedAt: 'Today, 6:00 am' },
  { id: 'V-202', stockNumber: 'NS-1928', year: 2024, make: 'Toyota', model: 'RAV4', variant: 'Cruiser Hybrid', colour: 'Frosted White', price: '$52,990', kilometres: '4,820 km', status: 'Demo', site: 'North Sydney', importedAt: 'Today, 6:00 am' },
  { id: 'V-203', stockNumber: 'PZ-2865', year: 2025, make: 'Kia', model: 'Sportage', variant: 'GT-Line HEV', colour: 'Jungle Wood Green', price: '$57,180', kilometres: '8 km', status: 'In transit', site: 'Parramatta', importedAt: 'Today, 6:00 am' },
  { id: 'V-204', stockNumber: 'CH-1182', year: 2024, make: 'Hyundai', model: 'Tucson', variant: 'Elite N Line', colour: 'Titan Grey', price: '$47,600', kilometres: '1,340 km', status: 'Reserved in Pentana', site: 'Chatswood', importedAt: 'Yesterday, 4:00 pm' },
  { id: 'V-205', stockNumber: 'NS-1944', year: 2025, make: 'Mazda', model: '3', variant: 'G25 Astina', colour: 'Machine Grey', price: '$43,210', kilometres: '18 km', status: 'Available', site: 'North Sydney', importedAt: 'Today, 6:00 am' },
  { id: 'V-206', stockNumber: 'PZ-U449', year: 2022, make: 'Subaru', model: 'Outback', variant: 'Touring AWD', colour: 'Crystal Black', price: '$41,850', kilometres: '31,420 km', status: 'Available', site: 'Parramatta', importedAt: 'Today, 6:00 am' },
];

export const serviceAppointments: ServiceAppointment[] = [
  { id: 'A-4491', time: '8:00 am', customer: 'Grace Wilson', vehicle: '2021 Mazda CX-30 · BKJ-81P', advisor: 'Priya Nair', pentanaStatus: 'Checked in', localTask: 'Send diagnosis update by 11:00 am' },
  { id: 'A-4492', time: '9:15 am', customer: 'Liam Harris', vehicle: '2023 Kia Sorento · FDT-92L', advisor: 'Priya Nair', pentanaStatus: 'Booked', localTask: 'Confirm courtesy vehicle' },
  { id: 'A-4494', time: '11:00 am', customer: 'Isla Thomas', vehicle: '2020 Toyota Corolla · EQR-17N', advisor: 'Sam Ortiz', pentanaStatus: 'No show', localTask: 'Call and offer reschedule' },
  { id: 'A-4498', time: '2:30 pm', customer: 'Henry Young', vehicle: '2022 Hyundai i30 · ELY-62Q', advisor: 'Sam Ortiz', pentanaStatus: 'Ready for collection', localTask: 'Collection follow-up at 4:00 pm' },
];

export const pipelineStages = ['New enquiry', 'Contacted', 'Appointment', 'Appraisal', 'Quote', 'Order', 'Awaiting delivery', 'Delivered'] as const;
