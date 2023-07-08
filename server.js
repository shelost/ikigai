// NODE.JS SERVER SIDE
// Heewon Ahn

// Initialize Socket.IO & Express
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = socketIO(server);

app.use(express.static(__dirname + '/public'));
const port = process.env.PORT || 4000;

// Pausable timer element
var Timer = function(callback, delay) {
    var timerId, start, remaining = delay;

    this.pause = function() {
        clearTimeout(timerId);
        remaining -= Date.now() - start;
    };

    this.resume = function() {
        start = Date.now();
        clearTimeout(timerId);
        timerId = setTimeout(callback, remaining);
    };

    this.resume();
};

// Questions
const W = []
// Initialize variables
var timers = []
var index = -1
var Rooms = []
var Users = []
var Q;

var Namespaces = []

// Server-client communication
io.on('connection', socket => {
    
    socket.emit('message', 'Anyone can click "Read" for the next question.')
    console.log('new connection');
    console.log(`${Users.length} connected`)

    // Log client onto server
    socket.on('go', args => {

        console.log(Rooms)

        socket.emit('welcome')

        let n = args[0]
        let r = args[1]
        let id = args[2]
        let score = parseInt(args[3])

        Users.push(id)

        let match = false
        let matc = false
        let roomIndex;

        socket.name = n
        socket.room = r
        socket.ident = id
       
        socket.tries = 0

        for (let i=0;i<Rooms.length;i++){
            // Room match
            if (Rooms[i][0] == socket.room){
                socket.emit('clear-chat')
                match = true
                roomIndex = i
                for (let j=0;j<Rooms[i][1].length;j++){
                    socket.emit('chat-update', [Rooms[i][1][j][0], Rooms[i][1][j][1]])
                }
                // Person match
                for (let h=0;h<Rooms[i][2].length;h++){
                    if (Rooms[i][2][h].name == n + id){
                        socket.score = Rooms[i][2][h].score
                        matc = true
        
                    }
                }
            }
        }

        Timer(()=>{
            if (!match){
                Rooms.push([socket.room, [], [
                    {
                        name: socket.name + socket.ident,
                        score: 0
                    }
                ]]);
            }

            if (match && !matc){
                Rooms[roomIndex][2].push(
                    {
                        name: socket.name + socket.ident,
                        score: 0
                    }
                )
                console.log('h')
            }
        },600)
       
        socket.join(socket.room);

        Roster()
        
    });

    // Receive question, send back text
    socket.on('read', arg => {

        index = -1
        Q = W[Math.floor(Math.random()*W.length)]

        Clear()

        Timer(()=>{
            io.sockets.in(socket.room).emit('message', 'Reading...')
        },500)
        
        let r = arg

        let powerRes = ''
        let res = ''

        let entry = Q

        var barr = entry.question.replace(/\r?\n|\r/gi,' ').split(' ')
        var arr = []
        
        for (let k=0;k<barr.length-1;k++){
            if (barr[k].length > 0){
                arr.push(barr[k])
            }
        }
        
        var powered = arr.findIndex(Powermark)

        function Powermark(val){
            return val == `(*)`
        }

        Timer(()=>{
            for (let i = 0; i < arr.length; i++) {

                if ( i < powered){
    
                    timers.push(new Timer(()=> {
                        powerRes += ' ' + arr[i]
                        io.sockets.in(r).emit('read-res', [powerRes, res])
                        index += 1
                    }, i*120))
    
                }else{
    
                    timers.push(new Timer(()=> {
                        res += ' ' + arr[i]
                        io.sockets.in(r).emit('read-res', [powerRes, res])
                        index += 1
    
                        if (i == arr.length-1){
    
                            Countdown(5, entry.official)
    
                        }
                    }, i*120))
                }
            }
        },300)


        io.sockets.in(r).emit('display', entry)
    })

    // Receive & process answer, send back result
    socket.on('submit', args => {
        let n = args[0]
        let r = args[1]
        let a = args[2].toUpperCase()
        let ten = args[3]

        let answers = Q.answers

        let correct = answers[0]
        let prompts = answers[1]

        var result = false
        var prompt = false

        for (let i=0; i<correct.length;i++){

            if (Array.isArray(correct[i])){
                let cor = true
                for (let j=0;j<correct[i].length; j++){
                    if (!a.includes(correct[i][j])){
                        cor = false
                    }
                    Timer(()=> {
                        if (cor){
                            result = true
                        }
                    }, 100)
                }
            }else{
                if (a.includes(correct[i])){
                    result = true
                }
            }
        }

        Timer(() => {
            if (!result){
                for (let i=0; i<prompts.length;i++){

                    if (Array.isArray(prompts[i])){
                        let cor = true
                        for (let j=0;j<prompts[i].length; j++){
                            if (!a.includes(prompts[i][j])){
                                cor = false
                            }
                            Timer(()=> {
                                if (cor){
                                    prompt = true
                                }
                            }, 100)
                        }
                    }else{
                        if (a.includes(prompts[i])){
                            prompt = true
                        }
                    }
                }
            }
        }, 150)

        Timer(() => {
            io.sockets.in(r).emit('message', result)

            if (!prompt){
                switch(result){
                    case true:
                        if (ten.length == 0){
                            socket.score += 15
                            updateScore(socket.room, socket.name, socket.ident, 15)
                            io.sockets.in(r).emit('message', `${a} is acceptable for power!`)
                        }else{
                            socket.score += 10
                            updateScore(socket.room, socket.name, socket.ident, 10)
                            io.sockets.in(r).emit('message', `${a} is acceptable!`)
                        }
                        Roster()
                        Timer(()=>{
                            io.sockets.in(r).emit('done')
                            io.sockets.in(r).emit('message', 'Anyone can click "Read" for the next question.')
                        },3000)
                        break;
                    case false:
                        io.sockets.in(r).emit('message', `${a} is incorrect.`)
                        socket.broadcast.to(r).emit('incorrect')
                        for (let j = index; j < timers.length; j++){
                            timers[j].resume()
                        }
                        socket.score -= 5
                        updateScore(socket.room, socket.name, socket.ident, -5)
                        Roster()
                        break;
                }
            }else if (socket.tries < 3){
                io.sockets.in(r).emit('message',`Prompt on ${a}.`)
                socket.emit('prompt')
                socket.tries ++
            }else{
                io.sockets.in(r).emit('message', `${a} is incorrect.`)
                socket.broadcast.to(r).emit('incorrect')
                for (let j = index; j < timers.length; j++){
                    timers[j].resume()
                }
                socket.score -= 5
                updateScore(socket.room, socket.name, socket.ident, -5)
                Roster()
            }
           
        },500)
        
        socket.emit('neg')
    })

    // Pause all clients & wait for answer
    socket.on('buzz', args => {
        socket.tries = 0
        let n = args[0]
        let r = args[1]
        P = true
    
        io.sockets.in(r).emit('message', `${n} buzzed!`)
        socket.broadcast.to(r).emit('buzzed')

        if (timers.length > 0){
            for (let j = index; j < timers.length; j++){
                timers[j].pause()
            }
        }
    })

    socket.on('finish', () => {
        var Names = []
        io.sockets.in(socket.room).clients(function(err, clients) {
            
            clients.forEach(client => {
                let user = io.sockets.connected[client];
                Names.push([user.name, user.score])
            });
            });
    
        Timer(() => {
            io.sockets.in(socket.room).emit('finished', Names)
        },50)
    })

    socket.on('next', () => {
        io.sockets.in(socket.room).emit('clear')
        Clear()
    })
    socket.on('end', () => {

        io.sockets.in(socket.room).clients(function(err, clients) {
            clients.forEach(client => {
                let user = io.sockets.connected[client];
                user.score = 0
        });
        });

        Roster()
    })

    socket.on('chat-message', arg => {
        if (arg[0].length > 0){
            io.sockets.in(socket.room).emit('chat-update', arg)
        }
        for (let i=0;i<Rooms.length;i++){
            if (Rooms[i][0] == socket.room){
                Rooms[i][1].push([arg[0], arg[1]])
            }
        }
    })

    // Disconnect client from server
    socket.on('disconnect', () => {
        socket.leave(socket.room)
        Users.splice(Users.indexOf(socket.id), 1)

        for (let i=0;i<Rooms.length;i++){
            if (Rooms[i][0] == socket.room){
                for (let j=0;j<Rooms[i][2].length;j++){
                    if (Rooms[i][2][j].name == socket.name + socket.ident){
                        Rooms[i][2].splice(0, j)
                    }
                }
            }
        }
        console.log('A user disconnected')
        console.log(`${Users.length} connected`)

        Roster()
    })

    function updateScore(room, personName, personID, increment){
        for (let i=0;i<Rooms.length;i++){
            // Room match
            if (Rooms[i][0] == room){
                for (let j=0;j<Rooms[i][2].length;j++){
                    if (Rooms[i][2][j].name = personName + personID){
                        Rooms[i][2][j].score += increment
                    }
                }
            }
        }
    }

    // Update all stats
    function Roster(){
        /*
        var Names = []
        io.sockets.in(socket.room).clients(function(err, clients) {
            clients.forEach(client => {
                let user = io.sockets.connected[client];
                Names.push([user.name + user.ident, user.score])
            });
            });
        Timer(() => {
            io.sockets.in(socket.room).emit('roster', Names)
        },100)
        */

        var Names = []

        for (let i=0;i<Rooms.length;i++){
            if (Rooms[i][0] == socket.room){
                for (let j=0;j<Rooms[i][2].length;j++){
                    Names.push([Rooms[i][2][j].name, Rooms[i][2][j].score])
                }
            }
        }

        Timer(() => {
            io.sockets.in(socket.room).emit('roster', Names)
        },100)

        
    }

    // Reset after countdown
    function Countdown(secs, ans){
        let t = secs
        let a = ans

        let ints = secs*10
        console.log(ints)

        for (let j=0;j<ints+2;j++){

            timers.push(new Timer(()=>{
                if (j < ints){
                    io.sockets.in(socket.room).emit('message', t.toString().substr(0,3))
                    t -= 0.1
                }else if (j == ints){
                    io.sockets.in(socket.room).emit('message', `Timeout! We were looking for ${a}.`)
                    t -= 0.1
                }else if (j == ints+1){
                    io.sockets.in(socket.room).emit('done')
                }
            }, j * 100))
        }
    }

    function Clear(){
        for (let h=0;h<timers.length;h++){
            timers[h].pause()
        }
        timers.splice(0, timers.length)
        io.sockets.in(socket.room).emit('message', 'NEW')
 
    }
})

// Listen on port
server.listen(port, () => {
    console.log(`Server is up on port ${port}!`);
});


// AIRTABLE

const API_KEY = 'keynqPuGbuuQdSZce';

var Airtable = require('airtable');
var base = new Airtable({apiKey: API_KEY}).base('appJDyLkCxXeXOmsX');

base('VBQ').select({
  
    maxRecords: 100,
    view: "Grid view"

}).eachPage(function page(records, fetchNextPage) {

    records.forEach(function(record) {
        if (record.get('Question') != undefined){

            let arr = [ [], []]
        
            let parts = record.get('Answers').split('//')
            let ans = parts[0].split('/')
    
            if (parts.length > 1){
            
                let prompts = parts[1].split('/')

                for (let i=0; i<prompts.length; i++){
                    if (prompts[i].includes('&')){
                        let words = prompts[i].split('&')
                        let miniArr = []
                        for (let j=0;j<words.length;j++){
                            miniArr.push(words[j])
                        }
                        arr[1].push(miniArr)
                    }else{
                        arr[1].push(prompts[i])
                    }
                }
            }

            for (let i=0; i<ans.length; i++){

                if (ans[i].includes('&')){
                    let words = ans[i].split('&')
                    let miniArr = []
                    for (let j=0;j<words.length;j++){
                        miniArr.push(words[j])
                    }
                    arr[0].push(miniArr)
                }else{
                    arr[0].push(ans[i])
                }
            }

            var obj = {
                set: record.get('Set'),
                difficulty: record.get('Difficulty'),
                question: record.get('Question'),
                answers: arr,
                official: record.get('Official')
            }

            W.push(obj)

        }
    });

    fetchNextPage();

}, function done(err) {
    if (err) { console.error(err); return; }
});

Timer(()=>{
    console.log(W)
}, 1000)
