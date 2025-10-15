const router = require('express').Router();
const authMiddleware = require('../middlewares/authMiddleware');
const Chat = require('./../models/chat');
const Message = require('./../models/message');

/**
 * 📌 Create New Chat (Single or Group)
 */
router.post('/create-new-chat', authMiddleware, async (req, res) => {
    try {
        const { members, isGroupChat, groupName } = req.body;

        if (!members || members.length < 1) {
            return res.status(400).send({ success: false, message: "Members array is required." });
        }

        if (isGroupChat) {
            if (!groupName) {
                return res.status(400).send({ success: false, message: "Group name is required for group chat." });
            }
            if (members.length < 3) {
                return res.status(400).send({ success: false, message: "Group chat must have at least 3 members (including creator)." });
            }
        }

        const chat = new Chat({
            members,
            isGroupChat: isGroupChat || false,
            groupName: groupName || null,
            groupAdmins: isGroupChat ? [req.userId] : [],
        });

        const savedChat = await chat.save();
        await savedChat.populate('members');

        res.status(201).send({
            message: isGroupChat ? "Group chat created successfully" : "Chat created successfully",
            success: true,
            data: savedChat
        });

    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
});

/**
 * 📌 Get All Chats (Single + Groups)
 */
router.get('/get-all-chats', authMiddleware, async (req, res) => {
    try {
        const allChats = await Chat.find({ members: { $in: [req.userId] } })
            .populate('members')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        res.status(200).send({
            message: 'Chats fetched successfully',
            success: true,
            data: allChats,
        });
    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
});

/**
 * 📌 Add Member to Group Chat
 */
router.post('/add-member', authMiddleware, async (req, res) => {
    try {
        const { chatId, userId } = req.body;

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).send({ success: false, message: "Chat not found" });
        if (!chat.isGroupChat) return res.status(400).send({ success: false, message: "Not a group chat" });
        if (!chat.groupAdmins.includes(req.userId)) return res.status(403).send({ success: false, message: "Only admins can add members" });
        if (chat.members.includes(userId)) return res.status(400).send({ success: false, message: "User already in group" });

        chat.members.push(userId);
        await chat.save();
        await chat.populate('members');

        res.send({ success: true, message: "Member added successfully", data: chat });

    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

/**
 * 📌 Remove Member from Group Chat
 */
router.post('/remove-member', authMiddleware, async (req, res) => {
    try {
        const { chatId, userId } = req.body;

        const chat = await Chat.findById(chatId);
        if (!chat) return res.status(404).send({ success: false, message: "Chat not found" });
        if (!chat.isGroupChat) return res.status(400).send({ success: false, message: "Not a group chat" });
        if (!chat.groupAdmins.includes(req.userId)) return res.status(403).send({ success: false, message: "Only admins can remove members" });

        chat.members = chat.members.filter(member => member.toString() !== userId.toString());
        await chat.save();
        await chat.populate('members');

        res.send({ success: true, message: "Member removed successfully", data: chat });

    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

/**
 * 📌 Clear Unread Messages
 */
router.post('/clear-unread-message', authMiddleware, async (req, res) => {
    try {
        const { chatId } = req.body;

        const chat = await Chat.findById(chatId);
        if (!chat) return res.send({ success: false, message: "No chat found" });

        const updatedChat = await Chat.findByIdAndUpdate(chatId, { unreadMessageCount: 0 }, { new: true })
            .populate('members')
            .populate('lastMessage');

        await Message.updateMany({ chatId, read: false }, { read: true });

        res.send({ success: true, message: "Unread messages cleared", data: updatedChat });

    } catch (error) {
        res.send({ success: false, message: error.message });
    }
});

module.exports = router;
