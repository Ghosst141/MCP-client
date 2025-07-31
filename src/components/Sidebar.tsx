import { FaCommentAlt, FaUserCircle } from 'react-icons/fa';

interface Chat {
  id: string;
  title: string;
}

const chats: Chat[] = [
  // Example chat: { id: '1', title: 'Example Chat' }
];

export default function Sidebar() {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h2>MCP Client</h2>
      </div>
      <button className="sidebar-btn">
        <FaCommentAlt /> New chat
      </button>

      <div className="sidebar-chats">
        <h4>Chats</h4>
        <ul>
          {chats.map((chat) => (
            <li key={chat.id}>{chat.title}</li>
          ))}
        </ul>
      </div>

      <div className="sidebar-footer">
        <FaUserCircle size={28} />
        <div>
          User
        </div>
      </div>
    </div>
  );
}