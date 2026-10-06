export type Tone = 'green' | 'amber' | 'red' | 'blue' | 'slate' | 'violet';

export type LeadStage = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Won';

export interface Customer {
  id: string;
  pentanaId?: string;
  name: string;
  initials: string;
  email: string;
  phone: string;
  mobile?: string;
  location: string;
  owner: string;
  stage: LeadStage;
  interest: string;
  lastContact: string;
  nextAction: string;
  source: 'CRM' | 'Pentana import' | 'Website' | 'Phone';
  consent: 'Confirmed' | 'Review needed' | 'Do not contact';
}

export interface Task {
  id: string;
  customerId: string;
  customer: string;
  title: string;
  due: string;
  time: string;
  priority: 'High' | 'Normal';
  type: 'Call' | 'Email' | 'Appointment' | 'Internal';
  completed?: boolean;
}

export interface Vehicle {
  id: string;
  stockNumber: string;
  year: number;
  make: string;
  model: string;
  variant: string;
  colour: string;
  price: string;
  kilometres: string;
  status: 'Available' | 'Demo' | 'In transit' | 'Reserved in Pentana';
  site: string;
  importedAt: string;
}

export interface ServiceAppointment {
  id: string;
  time: string;
  customer: string;
  vehicle: string;
  advisor: string;
  pentanaStatus: 'Booked' | 'Checked in' | 'Ready for collection' | 'No show';
  localTask: string;
}
