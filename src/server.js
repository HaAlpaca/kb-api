import express from 'express'

const app = express()
const hostname = 'localhost'
const port = 8017

app.get('/', function (req, res) {
    res.send(`<h1>Hello Alpaca API</h1>`)
})

app.listen(port, hostname, () => {
    console.log(`HaAlpaca api runing server at http(s)://${hostname}:${port}/`)
})