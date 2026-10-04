import { ArrowLeftRight, Bell, CheckCircle2, MessageSquare, Star, XCircle } from 'lucide-react';
import { timeAgo } from '../lib/utils';

const ICONS = { request: ArrowLeftRight, accepted: CheckCircle2, completed: CheckCircle2, rejected: XCircle, review: Star, info: Bell, message: MessageSquare };

export default function NotificationItem({ item, onClick }) {
  const Icon = ICONS[item.type] || Bell;
  return (
    <button className={`notif ${item.read ? '' : 'unread'}`} onClick={() => onClick(item)}>
      <span className={`notif-icon ${item.type}`}><Icon size={17} /></span>
      <span className="grow">
        <p>{item.text}</p>
        <small>{timeAgo(item.createdAt)}</small>
      </span>
    </button>
  );
}
