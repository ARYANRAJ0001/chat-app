import { axiosInstance, url } from './index';
import axios from "axios";

// Get all chats
export const getAllChats = async () => {
  try {
    const response = await axios.get(url + "/api/chat/get-all-chats", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

// Create single or group chat
// chatData: { members: [], isGroupChat: true/false, groupName: "" }
export const createNewChat = async (chatData) => {
  try {
    const response = await axiosInstance.post(url + '/api/chat/create-new-chat', chatData);
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

// Clear unread message count
export const clearUnreadMessageCount = async (chatId) => {
  try {
    const response = await axiosInstance.post(url + '/api/chat/clear-unread-message', { chatId });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};
