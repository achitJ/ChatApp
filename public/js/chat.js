const socket = io();

//Elements
const inputForm = document.getElementById('message-form');
const inputField = document.getElementById('userMessage');
const inputButton = document.getElementById('submitButton');
const locationButton = document.getElementById('send-location');
const messages = document.getElementById('messages');
const sidebar = document.getElementById('sidebar');

//Templates
const messageTemplate = document.getElementById('message-template').innerHTML;
const locationTemplate = document.getElementById('location-template').innerHTML;
const sidebarTemplate = document.getElementById('sidebar-template').innerHTML;

//Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true });

const autoscroll = () => {

    //New message element
    const newMessage = messages.lastElementChild;

    //Height of newMessage
    const newMessageStyles = getComputedStyle(newMessage);
    const newMessageMargin = parseInt(newMessageStyles.marginBottom);
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin; 

    //Visible Height
    const visibleHeight = messages.offsetHeight;

    //Height of messages container
    const containerHeight = messages.scrollHeight;

    //How far I have scrolled
    const scrollOffset = messages.scrollTop + visibleHeight;

    //if we were at the bottom, we would autoscroll
    if(containerHeight - newMessageHeight <= scrollOffset)
    {
        messages.scrollTop = messages.scrollHeight;
    }

}

socket.on('message', (message) => {

    console.log(message);

    const html = Mustache.render(messageTemplate, { 
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    });

    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();

})

socket.on('locationMessage', (location) => {

    console.log(location);

    const html = Mustache.render(locationTemplate, { 
        username: location.username,
        location: location.location,
        createdAt: moment(location.createdAt).format('h:m a')
    });

    messages.insertAdjacentHTML('beforeend', html);
    autoscroll();

})

socket.on('roomData', ({ room, users }) => {

    const html = Mustache.render(sidebarTemplate, {

        room,
        users

    })

    sidebar.innerHTML = html;

})

inputForm.addEventListener('submit', (event) => {

    event.preventDefault();

    inputButton.setAttribute('disabled', 'disabled'); //so that we cannot send another message while first one is still sending

    const message = event.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => { //we add the last callback function in order to call it for acknowledgement that the message was delivered

        inputButton.removeAttribute('disabled'); //so we can send more messages
        inputField.value = ''; //to clear out the message
        inputField.focus(); //to focus the inputfield

        if(error)
        {
            return console.log(error);
        }

        console.log("Message was delivered!");

    });

})

locationButton.addEventListener('click', () => {

    if(!navigator.geolocation)
    {
        return alert('Geolocation not supported by your browser.');
    }

    locationButton.setAttribute('disabled', 'disabled');

    navigator.geolocation.getCurrentPosition((position) => {

        // console.log(position.coords);

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, () => {

            locationButton.removeAttribute('disabled');
            console.log("location shared!")

        });

    })

})

socket.emit('join', { username, room}, (error) => {

    if(error) 
    {
        alert(error);
        location.href = '/';
    }

});