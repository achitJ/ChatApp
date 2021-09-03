const express = require('express');
const http = require('http');
const path = require('path');
const socketio = require('socket.io');
const Filter = require('bad-words');
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { adduser, removeUser, getUser, getUsersInRoom } = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 3000;
const publicDirPath = path.join(__dirname, '../public');

app.use(express.static(publicDirPath));

io.on('connection', (socket) => {

    // //this emits the data to the specific connection
    // socket.emit('message', generateMessage("welcome")); 

    // //sends the message to everyone in the connection except the user that joined
    // socket.broadcast.emit('message', generateMessage("A new user has joined the chat"))

    socket.on('join', ({ username, room }, callback) => {

        const {error, user} = adduser({ id: socket.id, username, room });

        if(error)
        {
            return callback(error);
        }

        socket.join(room);

        socket.emit('message', generateMessage("Admin", "welcome")); 
        socket.broadcast.to(room).emit('message', generateMessage("Admin", `${user.username} has joined the chat`))
        
        io.to(user.room).emit('roomData', {

            room: user.room,
            users: getUsersInRoom(user.room)

        })

        callback();
    })

    socket.on('sendMessage', (message, callback) => {

        const { username, room } = getUser(socket.id);

        const filter = new Filter();

        if(filter.isProfane(message))
        {
            return callback('Profanity is not allowed');
        }

        io.to(room).emit('message', generateMessage(username, message)) //this emits to all the clients
        callback(); //acknowledgement that message was delivered

    })

    socket.on('sendLocation', (location, callback) => {

        const { username, room } = getUser(socket.id);

        io.to(room).emit('locationMessage', generateLocationMessage(username, `https://google.com/maps?q=${location.latitude},${location.longitude}`));
        callback();

    })

    //when the user disconnects from the socket
    socket.on('disconnect', () => {

        const user = removeUser(socket.id);

        if(user)
        {
            io.to(user.room).emit('message', generateMessage("Admin", `${user.username} has disconnected!`))
        
            io.to(user.room).emit('roomData', {

                room: user.room,
                users: getUsersInRoom(user.room)
    
            })
        }

    })

})

server.listen(port, () => {

    console.log("Server is running on port " + port);

})