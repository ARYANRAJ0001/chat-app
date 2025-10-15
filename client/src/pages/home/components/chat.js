import { useDispatch, useSelector } from "react-redux";
import { createNewMessage, getAllMessages } from "../../../apiCalls/message";
import { hideLoader, showLoader } from "../../../redux/loaderSlice";
import toast from "react-hot-toast";
import { useEffect, useState } from "react";
import { clearUnreadMessageCount } from './../../../apiCalls/chat';
import moment from "moment";
import store from './../../../redux/store';
import { setAllChats, setSelectedChat } from "../../../redux/usersSlice";
import EmojiPicker from "emoji-picker-react";

function ChatArea({ socket, onBack, isMobileView }){
    const dispatch = useDispatch();
    const { selectedChat, user, allChats } = useSelector(state => state.userReducer);
    const selectedUser = selectedChat?.members?.find( u => u._id !== user._id);
    const [message, setMessage] = useState('');
    const [allMessages, setAllMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [data, setData] = useState(null);

    const sendMessage = async (image) => {
        try{
            const newMessage = {
                chatId: selectedChat._id,
                sender: user._id,
                text: message,
                image: image
            }

            socket.emit('send-message', {
                ...newMessage,
                members: selectedChat.members.map(m => m._id),
                read: false,
                createdAt: moment().format("YYYY-MM-DD HH:mm:ss")
            })

            const response = await createNewMessage(newMessage);

            if(response.success){
                setMessage('');
                setShowEmojiPicker(false);
            }
        }catch(error){
            toast.error(error.message);
        }
    }

    const formatTime = (timestamp) => {
        const now = moment();
        const diff = now.diff(moment(timestamp), 'days')

        if(diff < 1){
            return `Today ${moment(timestamp).format('hh:mm A')}`;
        }else if(diff === 1){
            return `Yesterday ${moment(timestamp).format('hh:mm A')}`;
        }else {
            return moment(timestamp).format('MMM D, hh:mm A');
        }
    }

    const getMessages = async () => {
        try{
            dispatch(showLoader())
            const response = await getAllMessages(selectedChat._id);
            dispatch(hideLoader())

            if(response.success){
                setAllMessages(response.data);
            }
        }catch(error){
            dispatch(hideLoader());
            toast.error(error.message);
        }
    }

    const clearUnreadMessages = async () => {
        try{
            socket.emit('clear-unread-messages', {
                chatId: selectedChat._id,
                members: selectedChat.members.map(m => m._id)
            })
            const response = await clearUnreadMessageCount(selectedChat._id);

            if(response.success){
                allChats.map(chat => {
                    if(chat._id === selectedChat._id){
                        return response.data;
                    }
                    return chat;
                })
            }
        }catch(error){
            toast.error(error.message);
        }
    }

    function formatName(user){
        if (!user) return 'Unknown User';
        let fname = user.firstname?.charAt(0).toUpperCase() + user.firstname?.slice(1).toLowerCase();
        let lname = user.lastname?.charAt(0).toUpperCase() + user.lastname?.slice(1).toLowerCase();
        return fname + ' ' + lname;
    }

    const getChatName = () => {
        if (selectedChat.isGroupChat) {
            return selectedChat.groupName;
        } else {
            return formatName(selectedUser);
        }
    };

    const sendImage = async (e) => {
        const file = e.target.files[0];
        const reader = new FileReader(file);
        reader.readAsDataURL(file);

        reader.onloadend = async () => {
            sendMessage(reader.result);
        }
    }

    useEffect(() => {
        if (selectedChat) {
            getMessages();
            if(selectedChat?.lastMessage?.sender !== user._id){
             clearUnreadMessages();
            }
        }

        socket.off('receive-message').on('receive-message', (message) => {
            const selectedChat = store.getState().userReducer.selectedChat;
            if(selectedChat?._id === message.chatId){
                setAllMessages(prevmsg => [...prevmsg, message]);
            }

            if(selectedChat?._id === message.chatId && message.sender !== user._id){
                clearUnreadMessages();
            }
        })

        socket.on('message-count-cleared', data => {
            const selectedChat = store.getState().userReducer.selectedChat;
            const allChats = store.getState().userReducer.allChats;

            if(selectedChat?._id === data.chatId){
                const updatedChats = allChats.map(chat => {
                    if(chat._id === data.chatId){
                        return { ...chat, unreadMessageCount: 0}
                    }
                    return chat;
                })
                dispatch(setAllChats(updatedChats));

                setAllMessages(prevMsgs => {
                    return prevMsgs.map(msg => {
                        return {...msg, read: true}
                    })
                })
            }
        })

        socket.on('started-typing', (data) => {
            setData(data);
            if(selectedChat?._id === data.chatId && data.sender !== user._id){
                setIsTyping(true);
                setTimeout(() => {
                    setIsTyping(false);
                }, 2000)
            }
        })
    }, [selectedChat])

    useEffect(() => {
        const msgContainer = document.getElementById('main-chat-area');
        if (msgContainer) {
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }
    }, [allMessages, isTyping])

    if (!selectedChat) return null;

    return (
        <div className="app-chat-area">
            <div className="app-chat-area-header">
                {isMobileView && (
                    <button className="back-button" onClick={onBack}>
                        <i className="fa fa-arrow-left"></i>
                    </button>
                )}
                <span className="chat-header-name">{getChatName()}</span>
            </div>

            <div className="main-chat-area" id="main-chat-area">
                {allMessages.map((msg, index) => {
                    const isCurrentUserSender = msg.sender === user._id;

                    return (
                        <div 
                            className="message-container" 
                            key={msg._id || index}
                            style={isCurrentUserSender ? {justifyContent: 'flex-end'} : {justifyContent: 'flex-start'}}
                        >
                            <div className="message-wrapper">
                                <div className={isCurrentUserSender ? "send-message" : "received-message"}>
                                    {msg.text && <div className="message-text">{msg.text}</div>}
                                    {msg.image && <img src={msg.image} alt="sent" className="message-image" />}
                                </div>
                                <div className="message-timestamp">
                                    {formatTime(msg.createdAt)} 
                                    {isCurrentUserSender && msg.read && 
                                        <i className="fa fa-check-circle read-indicator" aria-hidden="true"></i>
                                    }
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div className="typing-indicator">
                    {isTyping && selectedChat?.members.map(m => m._id).includes(data?.sender) && <i>typing...</i>}
                </div>
            </div>

            {showEmojiPicker && 
                <div className="emoji-picker-container">
                    <EmojiPicker 
                        width={300} 
                        height={400} 
                        onEmojiClick={(e) => setMessage(message + e.emoji)}
                    />
                </div>
            }
            <div className="send-message-div">
                <input 
                    type="text" 
                    className="send-message-input" 
                    placeholder="Type a message"
                    value={message}
                    onChange={ (e) => { 
                        setMessage(e.target.value)
                        socket.emit('user-typing', {
                            chatId: selectedChat._id,
                            members: selectedChat.members.map(m => m._id),
                            sender: user._id
                        })
                    }}
                />
                
                <label htmlFor="file" className="file-input-label">
                    <i className="fa fa-picture-o send-image-btn"></i>
                    <input
                        type="file"
                        id="file"
                        className="file-input"
                        accept="image/jpg,image/png,image/jpeg,image/gif"
                        onChange={sendImage}
                    />
                </label>

                <button 
                    className="send-emoji-btn" 
                    onClick={ () => { setShowEmojiPicker(!showEmojiPicker)} }
                >
                    <i className="fa fa-smile-o"></i>
                </button>
                <button 
                    className="send-message-btn" 
                    onClick={ () => sendMessage('') }
                >
                    <i className="fa fa-paper-plane"></i>
                </button>
            </div>
        </div>
    );
}

export default ChatArea;