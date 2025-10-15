const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    isGroupChat: { type: Boolean, default: false },
    groupName: { type: String, default: null },
    groupAdmins: [{ type: mongoose.Schema.Types.ObjectId, ref: "users" }],
    lastMessage: { type: mongoose.Schema.Types.ObjectId, ref: "messages" },
    unreadMessageCount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("chats", chatSchema);
