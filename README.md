# PoliWebex-Web

Pretty much all the code is from https://github.com/sup3rgiu/PoliWebex

Simple Web application that, given a WeBeX meeting URL, returns the video URL ready to be downloaded

## Usage

```
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
