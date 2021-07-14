const { Client } = require('pg')
const nodemailer = require('nodemailer');
let cron = require('node-cron');
const fs = require('fs');
const { any, ifElse } = require('ramda');
const dotenv = require('dotenv');
const { Console } = require('console');
dotenv.config()


emailVal = [];

//Used to read db.txt file
//Used connect DB table

const client = new Client({
    user: process.env.DB_user,
    host: process.env.DB_host,
    database: process.env.DB_name,
    password: process.env.DB_pwd,
    port: process.env.DB_port,
});

client.connect()

 
cron.schedule('*/5 * * * *', (res) => {
        console.log('NormalCronFlow');
        //data fetching
        connectingMail()
});

cron.schedule('*/8 * * * *', () => {
    console.log('ErrorUpdate');
    erroHandling()
});


//get database table query value
function connectingMail(){
        client.query('select * from scheduler_table', (err, res) => {
            if(err){
                errorCatch(err.message, "ConnectionError", "Pending");
            }else{
            var mailformat = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{​​​​​​​​|}​​​​​​​​~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/;
            res.rows.map(rowsVal => {
                errorMail = [''];
                
                //email validation  
                errorMail = process.env.mail_strVal + rowsVal.emailid;
                if (err == null && mailformat.test(rowsVal.emailid.trim())) {
                    for (let i = 0; i < res.rows.length; i++) {
                        emailVal[i] = res.rows[i].emailid

                    }
                    mailSend(emailVal)
                } else {
                    errorCatch(errorMail, "emailValidationError","Pending");
                }
            })
        }
        })
}

   //Using nodemailer package we can send mail
   var mailChain = nodemailer.createTransport({
    service: process.env.mail_service,
    auth: {
        user: process.env.mail_userName,
        pass: process.env.mail_pwd
    }
});



//used to schedule timing of sending the mail 
//For every 8 hour we have to use (* */8 * * *)

function mailSend(emailVal){
    console.log(emailVal)
    var mailOptions = {

        from: process.env.mail_userName,
        to: emailVal,
        subject: process.env.mail_sub,
        text: process.env.mail_txt
    };
    mailChain.sendMail(mailOptions, function (error, info) {
        if (error) {
            errorCatch(error, "ConfigurationError","Pending");
        }
        else {
            console.log('Email sent: ' + info.response);
        }
    });
    console.log('running a task every 1 minute');
}


  
function errorCatch(error, errorType,errorStatus) {
    var today = new Date();
    client.query(
        `INSERT INTO "error_catch"(error_type, date,error_message,"errorStatus")VALUES('${errorType}','${today}','${error}','${errorStatus}')`,
    );
}


function erroHandling(){

    let today = new Date()
    let compleRow = ['']
    let currentTime = new Date()
    let timePeriod = new Date(currentTime.setMinutes(currentTime.getMinutes() - 8));


    client.query(`SELECT * from "error_catch" WHERE error_type != 'emailValidationError' AND "errorStatus" != 'Success' AND date <= '${today}' AND date >= '${timePeriod}'`
        ,
        (err, res) => {
            if(err){
                errorCatch(err, 'reschedule', 'Pending')
            }else {
                currentTime = res.rows
                for (let rowCatch of currentTime) {
                    reScheduling(rowCatch);
                }
            }
        })
    }

    function reScheduling(row) {
        console.log(row);
        var mailOptions = {

            from: process.env.mail_userName,
            to: emailVal,
            subject: process.env.mail_sub,
            text: process.env.mail_txt
        };
        mailChain.sendMail(mailOptions, function (error, info) {
            if (error) {
                updateStatus(row, 'Success')
            } else {
                console.log('Email resent: ' + info.response);
                updateStatus(row, 'Failed') 
            }
        });
    }

    function updateStatus(row, status) {
        let errId = parseInt(row.id)
        client.query(
            `UPDATE  "error_catch" SET "errorStatus" = '${status}' WHERE "id"= '${errId}'`,
           
            (err, res) => {
                console.log(`UPDATE  "error_catch" SET "errorStatus" = '${status}' WHERE "id"= '${errId}'`)
                //console.log(`UPDATE  schedule_error SET status = '${status}' WHERE "errorId"= '${errorId}'`);
                if (err) {
                    errorCatch(err, 'rescheduling updation failed', 'Failed')
                }
                else{
                    //client.end()
                }
            }
        );
    }

    

    
    
 