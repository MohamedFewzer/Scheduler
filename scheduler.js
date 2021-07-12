const { Client } = require('pg')
const nodemailer = require('nodemailer');
let cron = require('node-cron');
const fs = require('fs');
const { any } = require('ramda');

emailVal = [''];
obj: any;
errorMail = [''];


//Used to read db.txt file

fs.readFile('/Users/10072/Nodejs/Scheduler_prj/db.txt', 'utf8', (err, data) => {

    obj = JSON.parse(data);

    //Used connect DB table

    const client = new Client({
        user: obj.user,
        host: obj.host,
        database: obj.database,
        password: obj.password,
        port: obj.port,
    });
    client.connect()

    //get database table query value

    client.query('select * from scheduler_table', (err, res) => {
        var mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{​​​​​​​​|}​​​​​​​​~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
        res.rows.map(rowsVal => {
            //email validation  
            errorMail = obj.strVal + rowsVal.emailid;
            if (err == null && mailformat.test(rowsVal.emailid.trim())) {
                for (let i = 0; i < res.rows.length; i++) {
                    emailVal[i] = res.rows[i].emailid
                }
            } else {
                console.log(errorMail)
                client.query(
                    `INSERT INTO "error_Message"(error_message) VALUES ('${errorMail}')`
                );
            }
        })
    })

    //used to schedule timing of sending the mail 
    //For every 8 hour we have to use (* */8 * * *)

    cron.schedule('* * * * * *', () => {

        //Using nodemailer package we can send mail
        var mailChain = nodemailer.createTransport({
            service: obj.service,
            auth: {
                user: obj.userName,
                pass: obj.pass
            }
        });

        var mailOptions = {

            from: obj.userName,
            to: emailVal,
            subject: obj.subject,
            text: obj.text
        };

        mailChain.sendMail(mailOptions, function (error, info) {

            if (error) {
                client.query(
                    `INSERT INTO "error_Message"(error_message) VALUES ('${error}')`
                );
            }
            else {
                console.log('Email sent: ' + info.response);
            }
        });
        console.log('running a task every 1 minute');
    });
})