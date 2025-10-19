import { useSelector } from "react-redux";
import ChatArea from "./components/chat";
import Header from "./components/header";
import Sidebar from "./components/sidebar";
import { io } from 'socket.io-client';
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setSelectedChat } from "./../../../redux/usersSlice";
const dispatch = useDispatch();

const socket = io('http://localhost:3001');

function Home() {
    const { selectedChat, user } = useSelector(state => state.userReducer);
    const [onlineUser, setOnlineUser] = useState([]);
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const [showChatArea, setShowChatArea] = useState(false);
    const [searchKey, setSearchKey] = useState("");

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobileView(mobile);
            if (!mobile && showChatArea) setShowChatArea(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showChatArea]);

    // Show chat area in mobile view when chat is selected
    useEffect(() => {
        if (selectedChat && isMobileView) setShowChatArea(true);
    }, [selectedChat, isMobileView]);

    // Socket setup
    useEffect(() => {
        if (user && user._id) {
            socket.emit('join-room', user._id);
            socket.emit('user-login', user._id);

            socket.on('online-users', onlineusers => setOnlineUser(onlineusers));
            socket.on('online-users-updated', onlineusers => setOnlineUser(onlineusers));
        }

        return () => {
            socket.off('online-users');
            socket.off('online-users-updated');
        };
    }, [user]);

  const handleBackToSidebar = () => {
    dispatch(setSelectedChat(null)); // CLEAR selected chat
    setShowChatArea(false);          // Hide chat area
};
const sidebar = document.querySelector('.sidebar-scroll');
if (sidebar) sidebar.scrollTop = 0;


    if (!user) {
        return (
            <div className="home-page">
                <Header socket={socket} />
                <div className="main-content loading">
                    <div>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="home-page">
            <Header socket={socket} />
            <div className="main-content">
                {(!isMobileView || !showChatArea) && (
                    <Sidebar 
                        socket={socket} 
                        onlineUser={onlineUser} 
                        searchKey={searchKey} 
                        setSearchKey={setSearchKey} 
                    />
                )}

                {selectedChat && (!isMobileView || showChatArea) && (
                    <ChatArea 
                        socket={socket} 
                        onBack={handleBackToSidebar} 
                        isMobileView={isMobileView} 
                    />
                )}
            </div>
        </div>
    );
}

export default Home;

