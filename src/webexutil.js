'use strict'

const puppeteer = require('puppeteer')
const request = require('request')
var xml2js = require('xml2js')
var URL = require('url').URL // for node.js version <= 8

const timeout = 1

exports.getVideoDownloadURL = async function (videoUrl, videoPwd) {
  if (videoUrl == '') throw new Error('Empty video URL')

  var credentials = {
    codicePersona: process.env.CODICE_PERSONA,
    email: process.env.EMAIL,
    password: process.env.PASSWORD,
  }
  console.log(
    '\nLaunching headless Chrome to perform the OpenID Connect dance...'
  )
  const browser = await puppeteer.launch({
    // Switch to false if you need to login interactively
    headless: true,
    args: ['--disable-dev-shm-usage', '--lang=it-IT'],
  })

  var page = await login(credentials, browser)
  await sleep(3000 * timeout)
  const cookie = await extractCookies(page)
  console.log('Got required authentication cookies.')
  console.log("\nAt this point Chrome's job is done, shutting it down...")
  await browser.close() // browser is no more required. Free up RAM!

  var headers = {
    Cookie: cookie,
    accessPwd: videoPwd,
  }

  try {
    if (extractRCID(videoUrl) != null) {
      // check if the videoUrl is in the new format https://politecnicomilano.webex.com/politecnicomilano/ldr.php?RCID=15abe8b5bcf02a50a20b056cc2263211
      var options = {
        url: videoUrl,
        headers: headers,
      }
      var redirectUrl = await getRedirectUrl(options) // get videoUrl in the usual format. Needed to obtain the correct videoID , in order to use in the API
      if (redirectUrl !== null) {
        videoUrl = redirectUrl
      }
    }

    var videoID = extractVideoID(videoUrl)
    if (videoID === null) throw new Error("Can't find video ID.")

    var options = {
      url:
        'https://politecnicomilano.webex.com/webappng/api/v1/recordings/' +
        videoID +
        '/stream?siteurl=politecnicomilano',
      headers: headers,
    }
    var response = await doRequest(options)
  } catch (e) {
    throw new Error('Undefined URL request response')
  }

  try {
    var obj = JSON.parse(response)
  } catch (e) {
    throw new Error('Error downloading.')
  }

  const recordingDir = obj.mp4StreamOption.recordingDir
  const timestamp = obj.mp4StreamOption.timestamp
  const token = obj.mp4StreamOption.token

  const html5ApiUrl =
    'https://nln1vss.webex.com/apis/html5-pipeline.do?recordingDir=' +
    recordingDir +
    '&timestamp=' +
    timestamp +
    '&token=' +
    token +
    '&xmlName=recording.xml'

  try {
    var options = {
      url: html5ApiUrl,
    }
    var xmlResponse = await doRequest(options)
  } catch (e) {
    throw new Error("Can't get current video XML-URL.")
  }

  const jsonObj = await xmlToJSON(xmlResponse, {})

  const filename = jsonObj.HTML5Pipeline.RecordingXML[0].Screen[0].Sequence[0]._ // maybe there could be more resolutions here?

  if (!filename.endsWith('.mp4')) {
    throw new Error("Can't parse XML correctly.")
  }

  console.log('Done!')

  return `https://nln1vss.webex.com/apis/download.do?recordingDir=${recordingDir}&timestamp=${timestamp}&token=${token}&fileName=${filename}`
}

async function login(credentials, browser) {
  const page = await browser.newPage()
  console.log('Navigating to WebEx login page...')
  await page.goto(
    'https://politecnicomilano.webex.com/mw3300/mywebex/login/login.do?siteurl=politecnicomilano-it&viewFrom=modern',
    {
      waitUntil: 'networkidle2',
    }
  )

  await page.waitForSelector('input[type="email"]')
  await page.keyboard.type(credentials.email)
  await page.click('button[name="btnOK"]')

  console.log('Filling in Servizi Online login form...')
  await page.waitForSelector('input[id="login"]')
  await page.type('input#login', credentials.codicePersona) // mette il codice persona
  await page.type('input#password', credentials.password) // mette la password
  await page.click('button[name="evn_conferma"]') // clicca sul tasto "Accedi"

  try {
    await page.waitForSelector('div[class="Message ErrorMessage"]', {
      timeout: 1000 * timeout,
    })
    throw new Error('Bad credentials.')
  } catch (error) {
    // tutto ok
  }

  try {
    await page.waitForSelector('button[name="evn_continua"]', {
      timeout: 1000 * timeout,
    }) // password is expiring
    await page.click('button[name="evn_continua"]')
  } catch (error) {
    // password is not expiring
  }

  try {
    await page.waitForSelector(
      '#dati_applicativi_autorizzazioniXSceltaMatricolaColl',
      {
        timeout: 2000 * timeout,
      }
    )
    await page.click(
      '#dati_applicativi_autorizzazioniXSceltaMatricolaColl > tbody > tr:nth-child(1) > td:nth-child(1) > a'
    ) // clicca sulla prima matricola
  } catch (error) {
    // scelta della matricola non apparsa, ok...
  }

  await browser.waitForTarget(
    (target) => target.url().includes('politecnicomilano.webex.com/'),
    {
      timeout: 90000,
    }
  )
  console.log('We are logged in. ')
  return page
}

function doRequest(options) {
  return new Promise(function (resolve, reject) {
    request(options, function (error, res, body) {
      if (!error && (res.statusCode == 200 || res.statusCode == 403)) {
        resolve(body)
      } else {
        reject(error)
      }
    })
  })
}

function xmlToJSON(str, options) {
  return new Promise((resolve, reject) => {
    xml2js.parseString(str, options, (err, jsonObj) => {
      if (err) {
        return reject(err)
      }
      resolve(jsonObj)
    })
  })
}

function extractVideoID(videoUrl) {
  var url = new URL(videoUrl)
  var pathnameArray = url.pathname.split('/')
  for (let part of pathnameArray) {
    if (part.length == 32) {
      return part
    } else if (part.length > 32) {
      var char32 = part.slice(0, 32)
      if (char32.match(/^[a-z0-9]+$/i))
        // first 32 char are alphanumeric
        return char32
    }
  }
  return null
}

function extractRCID(videoUrl) {
  var url = new URL(videoUrl)
  return url.searchParams.get('RCID')
}

async function getRedirectUrl(options) {
  var body = await doRequest(options)
  return body.match(/location\.href='(.*?)';/)[1]
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function extractCookies(page) {
  var jar = await page.cookies('https://.webex.com')
  var ticketCookie = jar.filter((c) => c.name === 'ticket')[0]
  if (ticketCookie == null) {
    await sleep(5000)
    var jar = await page.cookies('https://.webex.com')
    ticketCookie = jar.filter((c) => c.name === 'ticket')[0]
  }
  if (ticketCookie == null) {
    throw new Error(
      'Unable to read cookies. Try launching one more time, this is not an exact science.'
    )
  }
  return `ticket=${ticketCookie.value}`
}
