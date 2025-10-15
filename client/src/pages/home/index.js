import { useSelector } from "react-redux";
import ChatArea from "./components/chat";
import Header from "./components/header";
import Sidebar from "./components/sidebar";
import { io } from 'socket.io-client';
import { useEffect, useState } from "react";

const socket = io('http://localhost:3001');

function Home(){
    const { selectedChat, user } = useSelector(state => state.userReducer);
    const [onlineUser, setOnlineUser] = useState([]); 
    const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 768);
    const [showChatArea, setShowChatArea] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth <= 768;
            setIsMobileView(mobile);
            
            if (!mobile && showChatArea) {
                setShowChatArea(false);
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [showChatArea]);

    useEffect(() => {
        if (selectedChat && isMobileView) {
            setShowChatArea(true);
        }
    }, [selectedChat, isMobileView]);

    useEffect(() => {
        if(user && user._id){
            socket.emit('join-room', user._id);
            socket.emit('user-login', user._id);

            socket.on('online-users', onlineusers => {
                setOnlineUser(onlineusers);
            });
            socket.on('online-users-updated', onlineusers => {
                setOnlineUser(onlineusers);
            });
        }
        
        return () => {
            socket.off('online-users');
            socket.off('online-users-updated');
        };
    }, [user])

    const handleBackToSidebar = () => {
        setShowChatArea(false);
    };

    if (!user) {
        return (
            <div className="home-page">
                <Header socket={socket}></Header>
                <div className="main-content loading">
                    <div>Loading...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="home-page">
            <Header socket={socket}></Header>
            <div className="main-content">
                {(!isMobileView || !showChatArea) && (
                    <Sidebar 
                        socket={socket} 
                        onlineUser={onlineUser}
                    />
                )}
               
                {selectedChat && (!isMobileView || showChatArea) && (
                    <ChatArea 
                        socket={socket} 
                        onBack={handleBackToSidebar}
                        isMobileView={isMobileView}
                    />
                )}

                {isMobileView && !selectedChat && !showChatArea && (
                    <div className="mobile-empty-state">
                        <div className="empty-state-content">
                            <h3>Welcome to Chat App</h3>
                            <p>Select a conversation to start chatting</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Home;