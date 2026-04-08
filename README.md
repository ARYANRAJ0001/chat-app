https://chat-app-iota-virid-44.vercel.app/





# Full Stack Internship Task Submission

## Overview
This project was built as part of a Full Stack Developer internship assignment.

It is a simple full-stack application where posts are fetched from a public API, stored in a database, and displayed on a frontend. It also includes a real-time search feature using WebSockets.

---

## Live Links

Frontend (Vercel):  
https://chat-app-iota-virid-44.vercel.app/

Backend:  
(put your backend link here)

GitHub Repository:  
https://github.com/ARYANRAJ0001/chat-app.git

---

## Tech Stack

Frontend:
- React.js
- Axios
- Socket.io-client

Backend:
- Node.js
- Express.js
- Socket.io
- MongoDB + Mongoose

Database:
- MongoDB Atlas

---

## Features

- Fetches posts from JSONPlaceholder API
- Stores posts in MongoDB database
- Displays posts on the frontend
- REST APIs for getting posts
- Real-time search using WebSockets

---

## How it works

When the server starts, it fetches posts from:
https://jsonplaceholder.typicode.com/posts

Then it stores them in MongoDB.  
The frontend fetches data from the backend and shows it on the UI.

For search, WebSocket is used so results update instantly as the user types.

---

## Setup Instructions

### Backend
