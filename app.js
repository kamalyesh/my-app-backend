var express = require('express')
var bodyParser = require('body-parser')
var cors = require('cors')
var app = express()

app.use(cors())

const Status = {
    'IN': 'logged in',
    'OUT': 'logged out',
}
Object.freeze(Status)

var users = [{
    name: 'user name',
    username: 'username',
    password: 'password',
    role: 'user',
    status: ''
}, {
    name: 'root',
    username: 'root',
    password: 'root',
    role: 'superuser',
    status: ''
}, {
    name: 'guest',
    username: 'guest',
    password: '',
    role: 'guest',
    status: ''
}]

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

app.get("/ping", function (request, response) {
    response.statusCode = 200
    response.send("pong");
})

app.post('/login', function (request, response) {
    const { username, password, otp } = request.body.data
    console.log({ username, password })
    let err = ""
    if (!username) {
        err = "Invalid username"
    } else if (!otp || otp != "0000") {
        err = "Invalid or incorrect otp"
    } else {
        let foundIndex = users.findIndex(aUser => aUser.username == username)
        if (foundIndex > -1) {
            if (users[foundIndex].role != "guest") {
                if (users[foundIndex].password == password) users[foundIndex].status = Status.IN
            }
        } else {
            err = "Incorrect username or password"
        }
    }

    if (err) {
        response.statusCode = 400
        console.log("login fail :: ", err)
        response.send({ message: err })
        return;
    } else {
        let token = JSON.stringify({ username })
        console.log("login success")
        response.statusCode = 200
        response.send({ token })
        return;
    }
    // response.json({ msg: 'This is CORS-enabled for all origins!' })
})

app.get('/getCurrentUser', function (request, response) {
    if (request.query.token) {
        let parsedBody = JSON.parse(request.query.token);
        if (parsedBody) {
            let { username } = parsedBody
            let foundIndex = users.findIndex(aUser => aUser.username == username)
            if (foundIndex > -1) {
                response.statusCode = 200
                let user = { ...users[foundIndex] }
                delete user.password
                response.send({ token: request.query.token, user })
                return;
            }
        }
        response.statusCode = 404
        response.send({ message: "Not found" })
        return;
    } else {
        response.statusCode = 400
        response.send({ message: "Invalid token" })
        return;
    }
})

app.get('/logout', function (request, response) {
    if (request.query.token) {
        let parsedBody = JSON.parse(request.query.token);
        let { username } = parsedBody
        if (username) {
            let foundIndex = users.findIndex(aUser => aUser.username == username)
            if (foundIndex != -1) {
                users[foundIndex].status = Status.OUT;
                response.statusCode = 200
                response.send({})
                return;
            }
            response.statusCode = 404
            response.send({ message: "Not found" })
            return;
        }
    }
    response.statusCode = 400
    response.send({ message: "Invalid token" })
    return;
    // res.json({ msg: 'This is CORS-enabled for all origins!' })
})

const PORT = 3030
var statsInterval;
var server = app.listen(PORT, function () {
    console.log('CORS-enabled web server listening on port', PORT)
    statsInterval = setInterval(() => {
        console.log(users.filter(i => i.status == Status.IN).length, "users logged in")
    }, 1000);
})


const graceful = () => {
    if (statsInterval) clearInterval(statsInterval)
    server.close(() => {
        console.log('\nHTTP server closed\n')
    })
}

process.on("SIGTERM", graceful)
process.on("SIGINT", graceful)
process.on('exit', graceful);