import { axiosInstance, url } from "./index";

import axios from "axios";

export const getLoggedUser = async () => {
  try {
    const response = await axios.get(url+"/api/user/get-logged-user", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const getAllUsers = async () => {
  try {
    const response = await axios.get(url +"/api/user/get-all-users", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    return response.data;
  } catch (error) {
    return error.response?.data || { success: false, message: error.message };
  }
};

export const uploadProfilePic = async (image) => {
    try{
        const response = await axiosInstance.post(url + '/api/user/upload-profile-pic', { image });
        return response.data;
    }catch(error){
        return error;
    }
}