
export enum VisitStatus {
  URGENT = 'Urgent',
  FOLLOW_UP = 'Requires Follow-up',
  GOOD = 'Good Standing',
  COMPLETED = 'Completed'
}

export interface Member {
  id: string;
  name: string;
  role: string;
  lastVisit: string;
  status: VisitStatus;
  avatar?: string;
}

export interface Visit {
  id: string;
  memberName: string;
  type: string;
  time: string;
  status: 'upcoming' | 'completed';
  avatar?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}
