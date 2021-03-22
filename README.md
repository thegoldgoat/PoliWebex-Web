# PoliWebex-Web

Pretty much all the code is from https://github.com/sup3rgiu/PoliWebex

Simple Web application that, given a WeBeX meeting URL, returns the video URL ready to be downloaded

## Usage

```

# Clone this repo

git clone https://github.com/thegoldgoat/PoliWebex-Web.git
cd PoliWebex-Web

# Install dependencies

npm i

# Run server: set environment variables

env CODICE_PERSONA=12345678 EMAIL=name.surname@mail.polimi.it PASSWORD=yourpassword PORT=8008 node src/index.js

```

1. Open your browser and go to http://localhost:8008
2. Enter recording URL
3. (optional) Enter recording password
4. Wait for it to finish
5. Enjoy your download link ;)

## Deploy (Heroku)

You can deploy this app for free on [Heroku](https://heroku.com):

1. Create an Heroku app
2. Add 'jontewks/puppeteer' buildpack
3. Push to Heroku

Example with [Heroku-CLI](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)

```
# Create Heroku repo

heroku create --buildpack jontewks/puppeteer

# Push the code to Heroku

git push heroku master

```