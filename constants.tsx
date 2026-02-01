
import { Member, Visit, VisitStatus } from './types';

export const MEMBERS: Member[] = [
  { id: '1', name: 'Maria Gonzalez', role: 'Elder', lastVisit: 'Oct 12, 2023', status: VisitStatus.FOLLOW_UP, avatar: 'https://picsum.photos/id/64/150/150' },
  { id: '2', name: 'Juan Perez', role: 'Member', lastVisit: 'Nov 01, 2023', status: VisitStatus.GOOD, avatar: 'https://picsum.photos/id/91/150/150' },
  { id: '3', name: 'Elena Rodriguez', role: 'Deaconess', lastVisit: 'Sept 28, 2023', status: VisitStatus.URGENT, avatar: 'https://picsum.photos/id/177/150/150' },
  { id: '4', name: 'Carlos Silva', role: 'Choir Director', lastVisit: 'Dec 15, 2023', status: VisitStatus.GOOD, avatar: 'https://picsum.photos/id/203/150/150' },
  { id: '5', name: 'Ana Nuñez', role: 'Youth Leader', lastVisit: 'Aug 20, 2023', status: VisitStatus.FOLLOW_UP, avatar: 'https://picsum.photos/id/342/150/150' },
];

export const VISITS: Visit[] = [
  { id: '1', memberName: 'Juan Perez', type: 'Hospital Visit', time: '2:00 PM', status: 'upcoming', avatar: 'https://picsum.photos/id/91/150/150' },
  { id: '2', memberName: 'Maria Gonzales', type: 'Home Bible Study', time: '4:30 PM', status: 'upcoming', avatar: 'https://picsum.photos/id/64/150/150' },
  { id: '3', memberName: 'Roberto Silva', type: 'Elderly Care', time: 'Completed 10:00 AM', status: 'completed', avatar: 'https://picsum.photos/id/325/150/150' },
];
