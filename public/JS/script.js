// CLIENT SIDE
// Heewon Ahn

// Initialize DOM elments
const Name = Id('name'),
    Room = Id('room'),
    Question = Id('question'),
    Text = Id('text'),
    Power = Id('power'),
    Ten = Id('ten'),
    Sett = Id('set'),
    Diff = Id('diff'),
    Buzzer = Id('buzz'),
    Answer = Id('answer'),
    Message = Id('message'),
    Reader = Id('read'),
    Inputbox = Id('input'),
    Submit = Id('submit'),
    Bubbles = Id('bubbles'),
    Finisher = Id('finish'),
    Popup = Id('popup'),
    Nexter = Id('next'),
    Buzzbox = Id('buzzbox'),
    Toggler = Id('toggle'),
    Slide = Id('slide'),
    App = Id('app'),
    ChatInput = Id('chat-input'),
    ChatSender = Id('chat-send'),
    Chat = Id('chat')

var Ok = Class('ok')[0];

// For User Bubbles
const Colors = [
    '#7000FF', // Purple
    '#3800CC', // Blue
    '#CC00CC', // Pink
    '#00C172', // Green
    '#E70000', // Red
]

// SERVER COMMUNICATION
console.log(sessionStorage)

// Log onto server
socket.emit('go', [sessionStorage.getItem('Name'), sessionStorage.getItem('Room'), sessionStorage.getItem('ID'), sessionStorage.getItem('score')])

// Display message
socket.on('message', msg => {
    Message.innerHTML = msg
})

// Display question
socket.on('read-res', args => {
    Power.innerHTML = args[0]
    Ten.innerHTML = args[1]
    Reader.disabled = true
    Buzzbox.classList.remove('hidden')
    Reader.classList.add('hidden')
})

// Personal neg
socket.on('neg', () => {
    Buzzer.disabled = true
})

// Server is done reading
socket.on('done', () => {
    Power.innerHTML = ''
    Ten.innerHTML = ''

    Reader.disabled = false
    Buzzer.disabled = false
    Buzzbox.classList.add('hidden')
    Reader.classList.remove('hidden')
    

    console.log('done')
})

socket.on('clear-chat', () => {
    Chat.innerHTML = ''
})

// Connected into room
socket.on('welcome', () => {
    Room.innerHTML = `ROOM <span class = 'highlight'> ${sessionStorage.getItem('Room')} </span>`
    Name.innerHTML = ` NAME <span class = 'highlight'> ${sessionStorage.getItem('Name')} </span>`
})

socket.on('prompt', () => {
    Buzzbox.classList.add('hidden')
    Inputbox.classList.remove('hidden')
    console.log('bro')
})

socket.on('chat-update', arg => {

    let m = arg[0]
    let n = arg[1]
    let dv = El('div')
    Classes(dv, 'chat-tem')
    let msg = El('p')
    msg.innerHTML = m
    let name = El('h3')
    name.innerHTML = n
    Add(dv, [msg, name])
    Add(Chat, [dv])

    setTimeout(() => {
        if (Math.abs(Chat.scrollTop - Chat.scrollHeight) < 1000){
            Chat.scrollTop = Chat.scrollHeight
        }
    },100)
    
})

// Receive list of everyone in room
socket.on('roster', args => {

    Bubbles.innerHTML = ''

    for (let y=0;y<args.length;y++){

        let div = El('div')
        div.classList.add('avatar')

        let bubble = El('h2')
        bubble.classList.add('bubble')
        bubble.innerHTML = args[y][0].substr(0,2).toUpperCase()
        bubble.style.backgroundColor = Colors[y]

        let score = El('p')
        score.innerHTML = args[y][1]

        Add(div, [bubble, score])
        Add(Bubbles, [div])
        console.log(args)

        if (args[y][0] == sessionStorage.getItem('Name') + sessionStorage.getItem('ID')){
            sessionStorage.setItem('score', args[y][1])
            console.log(args[y][0])
        }
    }
})

// Display packet & difficulty
socket.on('display', entry => {
    Sett.innerHTML = entry.set
    Diff.innerHTML = entry.difficulty
})

// Can't buzz when someone already has
socket.on('buzzed', () => {
    Buzzer.disabled = true
    console.log('buzzed')
})

// Someone else got it wrong, can buzz again
socket.on('incorrect', () => {
    Buzzer.disabled = false
})

socket.on('finished', args => {

    let arg = args

    Popup.innerHTML = ''

    var h1 = El('h1')
    h1.innerHTML = 'Results'
    Add(Popup, [h1])

    let counts = []

    for (let n=0;n<arg.length;n++){
        counts.push(arg[n][1])
    }

    let ordered = counts.sort((a,b) => { return b-a; })

    let newArr = []

    for (let v=0;v<ordered.length;v++){
        if (arg[v][1] == ordered[v]){
            newArr.push(arg[v])
        }
    }

    setTimeout(()=> {

        for (let y=0;y<newArr.length;y++){

            let div = El('div')
            div.classList.add('avatar')
    
            let bubble = El('h2')
            bubble.classList.add('bubble')
            bubble.innerHTML = newArr[y][0].substr(0,2).toUpperCase()
            bubble.style.backgroundColor = Colors[y]
    
            let score = El('p')
            score.innerHTML = newArr[y][1]
    
            Add(div, [bubble, score])
            Add(Popup, [div])
    
            if (newArr[y][0] == sessionStorage.getItem('Name')){
                sessionStorage.setItem('score', newArr[y][1])
            }
        }

    }, 50)

    setTimeout(()=>{
        let button = El('button')
        button.innerHTML = 'OK'
        button.classList.add('ok')
        Add(Popup, [button])
    },100)
    
})

socket.on('clear', () => {
    Power.innerHTML = ''
    Ten.innerHTML = ''
})

// Send Buzz to server
function Buzz(){
    Buzzbox.classList.add('hidden')
    Inputbox.classList.remove('hidden')
    Answer.value = ''
    socket.emit('buzz', [sessionStorage.getItem('Name'), sessionStorage.getItem('Room')])
}

// Submit answer to server
function submitAnswer(){
    Buzzbox.classList.remove('hidden')
    Inputbox.classList.add('hidden')
    socket.emit('submit', [sessionStorage.getItem('Name'), sessionStorage.getItem('Room'), Answer.value, Ten.innerHTML])
}

// Send question for server to read
function Read() {
    socket.emit('read', sessionStorage.getItem('Room'))
    Buzzer.disabled = false
    Reader.disabled = true
    Buzzbox.classList.remove('hidden')
    Reader.classList.add('hidden')
   
}

function Finish(){
    socket.emit('finish')
    Popup.classList.add('popup-zoom')
    Popup.classList.remove('popup-dorm')
    Popup.classList.remove('invisible')
}

function End(){
    Popup.classList.remove('popup-zoom')
    Popup.classList.add('popup-dorm')
    socket.emit('end')
    setTimeout(()=>{
        Popup.classList.add('invisible')
    }, 300)
    localStorage.setItem('score', 0)
}

function Next(){
    socket.emit('next')
}

function ChatSend(){
    socket.emit('chat-message', [ChatInput.value, sessionStorage.getItem('Name')])
    console.log('sent')
    ChatInput.value = ''
}

function Toggle(){
    Slide.classList.toggle('slide-out')
    App.classList.toggle('app-slide')
    Chat.scrollTop = Chat.scrollHeight;
}

// Button interactivity

Buzzer.onclick = Buzz
Submit.onclick = submitAnswer
Reader.onclick = Read
Finisher.onclick = Finish

Nexter.onclick = Read

ChatSender.onclick = ChatSend
Toggler.onclick = Toggle

const loop = () => {
    Ok = Class('ok')[0]
    if (Ok){
        Ok.onclick = End
    }

}

setInterval(loop, 1000/30)


