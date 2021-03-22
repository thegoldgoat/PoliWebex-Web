const API_PORT = process.env.PORT || 8008

if (
  !process.env.CODICE_PERSONA ||
  !process.env.EMAIL ||
  !process.env.PASSWORD
) {
  console.error('Missing ENV variables for authentication')
  process.exit(1)
}

const express = require('express')
const path = require('path')
const { getVideoDownloadURL } = require('./webexutil.js')

var app = express()
app.use(express.json())

app.get('/', (_, res) => {
  return res.sendFile('index.html', { root: path.join(__dirname, '../dist') })
})

app.get('/bootstrap.min.css', (_, res) => {
  return res.sendFile('/bootstrap.min.css', {
    root: path.join(__dirname, '../dist'),
  })
})

app.post('/geturl', async (req, res) => {
  if (!req.body.url) return res.sendStatus(400)
  try {
    return res.send(
      await getVideoDownloadURL(req.body.url, req.body.videoPwd || '')
    )
  } catch (error) {
    console.error(error)
    res.send(error.message)
    return res.status(500)
  }
})

app.listen(API_PORT)
console.log(`Listening on port ${API_PORT}`)
