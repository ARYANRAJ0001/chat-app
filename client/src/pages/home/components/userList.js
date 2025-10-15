import { useState } from "react";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { createNewChat } from './../../../apiCalls/chat';
import { hideLoader, showLoader } from "../../../redux/loaderSlice";
import { setAllChats, setSelectedChat } from '../../../redux/usersSlice';
import moment from "moment";

function UsersList({ searchKey, onlineUser }) {
  const { allUsers, allChats, user: currentUser, selectedChat } = useSelector(state => state.userReducer);
  const dispatch = useDispatch();

  // ---------- SINGLE CHAT ----------
  const startNewChat = async (otherUserId) => {
    try {
      dispatch(showLoader());
      const response = await createNewChat({
        members: [currentUser._id, otherUserId],
        isGroupChat: false
      });
      dispatch(hideLoader());

      if (response.success) {
        toast.success(response.message);
        const updatedChats = [...allChats, response.data];
        dispatch(setAllChats(updatedChats));
        dispatch(setSelectedChat(response.data));
      }
    } catch (error) {
      toast.error(error.message);
      dispatch(hideLoader());
    }
  };

  // ---------- GROUP CHAT ----------
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedUsers, setSelectedUsers] = useState([]);

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]);
  };

  const createGroup = async () => {
    if (selectedUsers.length < 2) {
      toast.error("Select at least 2 users for a group chat!");
      return;
    }
    if (!groupName.trim()) {
      toast.error("Please enter a group name");
      return;
    }

    try {
      dispatch(showLoader());
      const response = await createNewChat({
        members: [currentUser._id, ...selectedUsers],
        isGroupChat: true,
        groupName
      });
      dispatch(hideLoader());

      if (response.success) {
        toast.success("Group created successfully!");
        const updatedChats = [...allChats, response.data];
        dispatch(setAllChats(updatedChats));
        dispatch(setSelectedChat(response.data));

        setShowGroupModal(false);
        setGroupName("");
        setSelectedUsers([]);
      }
    } catch (error) {
      toast.error(error.message);
      dispatch(hideLoader());
    }
  };

  // ---------- HELPERS ----------
  const isSelectedChat = (chatOrUser) => {
    if (!selectedChat) return false;
    if (chatOrUser.members) return selectedChat._id === chatOrUser._id;
    return selectedChat.members.map(m => m._id).includes(chatOrUser._id);
  };

  const getLastMessageTimeStamp = (chat) => {
    return chat?.lastMessage ? moment(chat.lastMessage.createdAt).format('hh:mm A') : "";
  };

  const getLastMessageText = (chat) => {
    if (!chat || !chat.lastMessage) return "";
    const prefix = chat.lastMessage.sender === currentUser._id ? "You: " : "";
    return prefix + chat.lastMessage.text.substring(0, 25);
  };

  const getUnreadMessageCount = (chat) => {
    if (chat && chat.unreadMessageCount && chat.lastMessage?.sender !== currentUser._id) {
      return <div className="unread-message-counter">{chat.unreadMessageCount}</div>;
    }
    return null;
  };

  const formatName = (user) => {
    const fname = user.firstname?.charAt(0).toUpperCase() + user.firstname?.slice(1).toLowerCase();
    const lname = user.lastname?.charAt(0).toUpperCase() + user.lastname?.slice(1).toLowerCase();
    return `${fname} ${lname}`;
  };

  // ---------- FILTER USERS BASED ON SEARCH ----------
  const getUsersToDisplay = () => {
    let users = allUsers.filter(u => u._id !== currentUser._id);
    if (searchKey) {
      users = users.filter(user =>
        user.firstname?.toLowerCase().includes(searchKey.toLowerCase()) ||
        user.lastname?.toLowerCase().includes(searchKey.toLowerCase())
      );
    }
    return users;
  };

  // ---------- UI ----------
  return (
    <>
      <div className="users-list-header">
        <button className="start-group-btn" onClick={() => setShowGroupModal(true)}>Create Group</button>
      </div>

      <div className="sidebar-scroll">
        {/* GROUP CHATS */}
        {allChats.filter(chat => chat.isGroupChat).map(chat => (
          <div
            key={chat._id}
            className={isSelectedChat(chat) ? "selected-user" : "filtered-user"}
            onClick={() => dispatch(setSelectedChat(chat))}
          >
            <div className="filter-user-display">
              <div className="user-default-avatar">{chat.groupName.charAt(0).toUpperCase()}</div>
              <div className="filter-user-details">
                <div className="user-display-name">{chat.groupName}</div>
                <div className="user-display-email">
                  {chat.lastMessage ? getLastMessageText(chat) : `Members: ${chat.members.map(m => m.firstname).join(", ")}`}
                </div>
              </div>
              <div>
                {getUnreadMessageCount(chat)}
                <div className="last-message-timestamp">{getLastMessageTimeStamp(chat)}</div>
              </div>
            </div>
          </div>
        ))}

        {/* SINGLE USERS */}
        {getUsersToDisplay().map(user => {
          const chat = allChats.find(c =>
            !c.isGroupChat && c.members.map(m => m._id).includes(user._id)
          );

          return (
            <div
              key={user._id}
              className={isSelectedChat(chat || user) ? "selected-user" : "filtered-user"}
              onClick={() => chat ? dispatch(setSelectedChat(chat)) : startNewChat(user._id)}
            >
              <div className="filter-user-display">
                {user.profilePic ? (
                  <img
                    src={user.profilePic}
                    alt="Profile Pic"
                    className="user-profile-image"
                    style={onlineUser.includes(user._id) ? { border: '#82e0aa 3px solid' } : {}}
                  />
                ) : (
                  <div
                    className="user-default-avatar"
                    style={onlineUser.includes(user._id) ? { border: '#82e0aa 3px solid' } : {}}
                  >
                    {user.firstname.charAt(0).toUpperCase() + user.lastname.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="filter-user-details">
                  <div className="user-display-name">{formatName(user)}</div>
                  <div className="user-display-email">{user.email}</div>
                </div>
                <div>
                  {getUnreadMessageCount(chat)}
                  <div className="last-message-timestamp">{chat ? getLastMessageTimeStamp(chat) : ""}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ---------- GROUP MODAL ---------- */}
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
              {getUsersToDisplay().map(u => (
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
              <button className="cancel-btn" onClick={() => setShowGroupModal(false)}>Cancel</button>
              <button className="create-btn" onClick={createGroup}>Create</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default UsersList;
