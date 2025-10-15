import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,          // Logged-in user info
  allUsers: [],        // List of all users
  allChats: [],        // All single & group chats
  selectedChat: null,  // Currently selected chat
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload;
    },
    setAllUsers: (state, action) => {
      state.allUsers = action.payload;
    },
    setAllChats: (state, action) => {
      state.allChats = action.payload;
    },
    addChat: (state, action) => {
      state.allChats.push(action.payload);
    },
    setSelectedChat: (state, action) => {
      state.selectedChat = action.payload;
    },
    updateChatMessages: (state, action) => {
      // Replace messages for a chat
      const { chatId, messages } = action.payload;
      const chat = state.allChats.find(c => c._id === chatId);
      if (chat) chat.messages = messages;
    },
    addMessageToChat: (state, action) => {
      const message = action.payload;
      const chat = state.allChats.find(c => c._id === message.chatId);
      if (chat) {
        if (!chat.messages) chat.messages = [];
        chat.messages.push(message);
      }
      if (state.selectedChat && state.selectedChat._id === message.chatId) {
        state.selectedChat = { ...state.selectedChat, messages: chat.messages };
      }
    }
  },
});

export const {
  setUser,
  setAllUsers,
  setAllChats,
  addChat,
  setSelectedChat,
  updateChatMessages,
  addMessageToChat,
} = userSlice.actions;

export default userSlice.reducer;
