const express = require('express');
const request = require('request-promise')
const cheerio = require('cheerio')
const cron = require('node-cron')
const nodemailer = require("nodemailer");
const hbs = require('nodemailer-express-handlebars');
require('dotenv').config();
const app = express();

app.listen(process.env.PORT || 8080, () => {
    console.log('Server is starting');
});

cron.schedule('0 */30 * * * *',() => {
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
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });
        
        
        transporter.use('compile', hbs({
            viewEngine: 'express-handlebars',
            viewPath: './views'
        }));
        
        let mailOptions = {
            from: 'saga-habercisi@gmail.com',
            to: 'leylakapi@gmail.com', 
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
});


