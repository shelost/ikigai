// LANDING PAGE
// Heewon Ahn

var Alphabet = [
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'
]

var SESSION_ID = Alphabet[Math.floor(Math.random()*Alphabet.length)] + Alphabet[Math.floor(Math.random()*Alphabet.length)] + (Math.floor(Math.random()*90)+10).toString() + (Math.floor(Math.random()*90)+10).toString()

const New = Id('new')
const Room = Id('room')
const Join = Id('join')
const Go = Id('go')
const Name = Id('name')

New.onclick = () => {
    sessionStorage.setItem('Room', SESSION_ID)
    Next()
}

// Store room name
Join.onclick = () => {
    sessionStorage.setItem('Room', Room.value)
    sessionStorage.setItem('ID', SESSION_ID)
    sessionStorage.setItem('score', 0)
    Next()
}

// Go to QB page
Go.onclick = () => {
    socket.emit('go', [Name.value, sessionStorage.getItem('Room')])
    sessionStorage.setItem('Name', Name.value)
    setTimeout(() => {
        window.location.href = 'qb.html'
    }, 500);
}

// Room ID => Username
function Next(){
    Class('container')[0].classList.add('hidden')
    Class('container')[1].classList.remove('hidden')
}