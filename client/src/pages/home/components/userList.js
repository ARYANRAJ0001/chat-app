import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { createNewChat } from '../../../apiCalls/chat';
import { hideLoader, showLoader } from "../../../redux/loaderSlice";
import { setAllChats, setSelectedChat } from '../../../redux/usersSlice';

function UsersList({ searchKey = "", onlineUser = [] }) {
  const dispatch = useDispatch();
  const { allUsers = [], allChats = [], user: currentUser, selectedChat } = useSelector(state => state.userReducer);
  
  const [loading, setLoading] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  // ---------- SORT GROUP CHATS ----------
  const sortedGroupChats = (allChats?.filter(c => c?.isGroupChat) || []).sort((a, b) => {
    const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : new Date(a.createdAt || 0).getTime();
    const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : new Date(b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // ---------- SORT INDIVIDUAL USERS ----------
  const getSortedIndividualUsers = () => {
    if (!currentUser || !allChats) return [];

    const individualChats = allChats.filter(
      c => !c.isGroupChat && c.members?.map(m => m._id).includes(currentUser._id)
    );

    let usersFromChats = individualChats.map(chat =>
      chat.members.find(m => m._id !== currentUser._id)
    ).filter(Boolean);

    // Remove duplicates
    usersFromChats = Array.from(new Map(usersFromChats.map(u => [u._id, u])).values());

    if (searchKey?.trim()) {
      const key = searchKey.toLowerCase();
      const searchUsers = allUsers.filter(u =>
        u._id !== currentUser._id &&
        (
          u.firstname?.toLowerCase().includes(key) ||
          u.lastname?.toLowerCase().includes(key) ||
          u.email?.toLowerCase().includes(key)
        )
      );
      const combined = [...usersFromChats, ...searchUsers];
      return Array.from(new Map(combined.map(u => [u._id, u])).values());
    }

    return usersFromChats;
  };

  const sortedIndividualUsers = getSortedIndividualUsers();

  // ---------- CHAT HANDLERS ----------
  const startNewChat = async (otherUserId) => {
    if (!currentUser) return toast.error("User not authenticated");
    try {
      setLoading(true);
      dispatch(showLoader());
      const response = await createNewChat({ members: [currentUser._id, otherUserId], isGroupChat: false });
      dispatch(hideLoader());
      setLoading(false);

      if (response.success) {
        toast.success(response.message || "Chat created!");
        dispatch(setAllChats([...allChats, response.data]));
        dispatch(setSelectedChat(response.data));
      }
    } catch (error) {
      dispatch(hideLoader());
      setLoading(false);
      toast.error(error.message || "Something went wrong!");
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const createGroup = async () => {
    if (!currentUser) return toast.error("User not authenticated");
    if (!groupName.trim()) return toast.error("Enter a group name");
    if (selectedUsers.length < 2) return toast.error("Select at least 2 users for a group chat");

    try {
      setLoading(true);
      dispatch(showLoader());
      const response = await createNewChat({
        members: [currentUser._id, ...selectedUsers],
        isGroupChat: true,
        groupName
      });
      dispatch(hideLoader());
      setLoading(false);

      if (response.success) {
        toast.success("Group created successfully!");
        dispatch(setAllChats([...allChats, response.data]));
        dispatch(setSelectedChat(response.data));

        setShowGroupModal(false);
        setGroupName("");
        setSelectedUsers([]);
      }
    } catch (error) {
      dispatch(hideLoader());
      setLoading(false);
      toast.error(error.message || "Failed to create group");
    }
  };

  // ---------- HELPERS ----------
  const isSelectedChat = (chatOrUser) => {
    if (!selectedChat || !chatOrUser) return false;
    if (chatOrUser._id && selectedChat._id) return selectedChat._id === chatOrUser._id;
    if (chatOrUser._id) return selectedChat.members?.map(m => m._id).includes(chatOrUser._id);
    return false;
  };

  const formatName = (user) => {
    if (!user) return "Unknown User";
    const fname = user.firstname?.charAt(0).toUpperCase() + user.firstname?.slice(1).toLowerCase();
    const lname = user.lastname?.charAt(0).toUpperCase() + user.lastname?.slice(1).toLowerCase();
    return `${fname} ${lname}`.trim();
  };

  const getUsersForGroupModal = () => {
    return allUsers.filter(u => u && u._id !== currentUser._id);
  };

  if (!currentUser) return <div className="users-list-loading">Loading user data...</div>;

  // ---------- UI ----------
  return (
    <>
      <div className="users-list-header">
        <button className="start-group-btn" onClick={() => setShowGroupModal(true)} disabled={loading}>
          {loading ? "Creating..." : "Create Group"}
        </button>
      </div>

      <div className="sidebar-scroll">
        {/* GROUP CHATS */}
        {sortedGroupChats.length > 0 && sortedGroupChats.map(chat => (
          <div
            key={chat._id}
            className={isSelectedChat(chat) ? "selected-user" : "filtered-user"}
            onClick={() => dispatch(setSelectedChat(chat))}
          >
            <div className="filter-user-display">
              <div className="user-default-avatar">{chat.groupName?.charAt(0)?.toUpperCase()}</div>
              <div className="filter-user-details">
                <div className="user-display-name">{chat.groupName}</div>
                <div className="user-display-email">{chat.lastMessage ? chat.lastMessage.text : `Members: ${chat.members?.length}`}</div>
              </div>
            </div>
          </div>
        ))}

        {/* INDIVIDUAL USERS */}
        {sortedIndividualUsers.length > 0 && sortedIndividualUsers.map(u => {
          const chat = allChats.find(c => !c.isGroupChat && c.members?.map(m => m._id).includes(u._id));
          return (
            <div
              key={u._id}
              className={isSelectedChat(chat || u) ? "selected-user" : "filtered-user"}
              onClick={() => chat ? dispatch(setSelectedChat(chat)) : startNewChat(u._id)}
            >
              <div className="filter-user-display">
                {u.profilePic ? (
                  <img
                    src={u.profilePic}
                    alt="Profile Pic"
                    className="user-profile-image"
                    style={onlineUser.includes(u._id) ? { border: '#82e0aa 3px solid' } : {}}
                  />
                ) : (
                  <div className="user-default-avatar" style={onlineUser.includes(u._id) ? { border: '#82e0aa 3px solid' } : {}}>
                    {u.firstname?.charAt(0).toUpperCase()}{u.lastname?.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="filter-user-details">
                  <div className="user-display-name">{formatName(u)}</div>
                  <div className="user-display-email">{u.email}</div>
                </div>
              </div>
            </div>
          )
        })}

        {(sortedGroupChats.length === 0 && sortedIndividualUsers.length === 0) && (
          <div className="no-users-found">No users or chats found.</div>
        )}
      </div>

      {/* GROUP MODAL */}
      {showGroupModal && (
        <div className="group-modal">
          <div className="group-modal-content">
            <h3>Create New Group</h3>
            <input
              type="text"
              placeholder="Enter group name"
              className="group-name-input"
              value={groupName}
              onChange={e => setGroupName(e.target.value)}
            />
            <div className="group-users-list">
              {getUsersForGroupModal().map(u => (
                <div
                  key={u._id}
                  className={`group-user ${selectedUsers.includes(u._id) ? "selected" : ""}`}
                  onClick={() => toggleUserSelection(u._id)}
                >
                  {formatName(u)}
                </div>
              ))}
            </div>
            <div className="group-modal-actions">
              <button className="cancel-btn" onClick={() => setShowGroupModal(false)} disabled={loading}>Cancel</button>
              <button className="create-btn" onClick={createGroup} disabled={loading}>{loading ? "Creating..." : "Create"}</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UsersList;
