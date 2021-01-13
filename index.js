const express = require('express');
const request = require('request-promise')
const cheerio = require('cheerio')
const cron = require('node-cron')
const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
require('dotenv').config();
const app = express();

app.use(express.static(__dirname + '/public'));


const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const myOAuth2Client = new OAuth2(
    process.env.CLIENT_ID,
    process.env.CLIENT_SECRET,
    "https://developers.google.com/oauthplayground"
    )

myOAuth2Client.setCredentials({
    refresh_token: process.env.REFRESH_TOKEN
});
const myAccessToken = myOAuth2Client.getAccessToken()

app.listen(process.env.PORT || 8080, () => {
    console.log('Server is starting');
});


let mailList = [];

mailList = ['leylakapi@gmail.com','muratrahmikurtul@gmail.com'];

//cron.schedule('0 */30 * * * *',() => {
    (async () => {
        let sagaData = []
        const response = await request({
            uri : "https://www.saga.hamburg/immobiliensuche?type=wohnungen",
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
                "accept-encoding": "gzip, deflate, br",
                "accept-language": "de-DE,de;q=0.9,en-US;q=0.8,en;q=0.7"
            },
            gzip: true
        });
    
        let $ = cheerio.load(response)
        adCount = $('div[class="teaser3 teaser3--listing teaser-simple--boxed"] > a > div > h3').length
        for (var i=0; i<adCount; i++){
            title = $('div[class="teaser3 teaser3--listing teaser-simple--boxed"] > a > div > h3').eq(i).text();
            description = $('div[class="teaser3 teaser3--listing teaser-simple--boxed"] > a > div > p').eq(i).text().trim()
            sagaData.push({
                title: title,
                description: description
            })
        }

        let transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                 type: "OAuth2",
                 user: process.env.EMAIL, //your gmail account you used to set the project up in google cloud console"
                 clientId: process.env.CLIENT_ID,
                 clientSecret: process.env.CLIENT_SECRET,
                 refreshToken: process.env.REFRESH_TOKEN,
                 accessToken: myAccessToken //access token variable we defined earlier
                }});
        
        
        transporter.use('compile', hbs({
            viewEngine: 'express-handlebars',
            viewPath: './views'
        }));
        
        

        let mailOptions = {
            from: 'saga-habercisi@gmail.com',
            to: mailList.toString(), 
            subject: 'Saga Evler',
            template: 'index',
            context: {
                sagaData: sagaData
            }
        };
        transporter.sendMail(mailOptions, (err, data) => {
            if (err) {
                return console.log(err.message);
            }
            return console.log('Email sent!!!');
        });     
    }
    
    )();
//});


