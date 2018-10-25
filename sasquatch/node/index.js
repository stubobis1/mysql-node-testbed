//Load express module with `require` directive
let express = require('express');
let app = express();
let sql = require('./sqlManager');
let bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//Define request response in root URL (/)

let connection;
let port = 8081;
let _log = true;

let dbOpts = {};


app.get('/manage', async (req, res) => {
    let id = req.query.id;
    if (!id) {
        res.send({error: "required param: ID"});
    }
    else {
        let response = await sql.getSelectQueryPromise(id);
        res.send(response);
    }
});

app.post('/manage', async (req, res) => {
    let params = req.body;

    if (_log) {
        console.log('params:', params);
        console.log('received PUT request');
    }
    //TODO: params validation
    let response = await sql.getInsertQueryPromise(params, connection);
    if (_log) {console.log('response:', response);}
    res.send(response);
});

app.put('/manage', async (req, res) => {
    let params = req.body;
    let id = params.id;
    if (!id) {
        res.send({error: "required param: ID"});
    }
    else {
        let response = await sql.getUpdateQueryPromise(id, params);
        res.send(response);
    }
});

app.delete('/manage', async (req, res) => {
    let params = req.query;
    let id = params.id;
    if (!id) {
        res.send({error: "required param: ID"});
    }
    else {
        let response = await sql.getDeleteQueryPromise(id);
        res.send(response);
    }
});

function GetHaversineDistance(lat1, long1, lat2, long2) {
    //gotten from https://www.movable-type.co.uk/scripts/latlong.html

    let R = 3959e3; //6371e3; // metres
    let φ1 = lat1.toRadians();
    let φ2 = lat2.toRadians();
    let Δφ = (lat2 - lat1).toRadians();
    let Δλ = (long2 - long1).toRadians();

    let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

app.get('/related', async (req, res) => {
    //change 3959 with 6371 to do kilometers
    //from https://stackoverflow.com/questions/4687312/querying-within-longitude-and-latitude-in-mysql

    let params = req.query;
    let target = await sql.getSelectQueryPromise(params.id);
    let lat = params;
    let lng = 1;
    let distance = 20;
    let limit = 25;

    let query = `SELECT id, (3959 * acos(cos(radians(${lat})) * cos(radians(lat)) * cos(radians(long) - radians(${long})) + sin(radians(${lat})) * sin(radians(lat)))) AS distance
                 FROM markers
                 HAVING distance < 25
                 ORDER BY distance
                 LIMIT 0 , 20;`;
});

//Launch listening server on port 8081


app.listen(port, function () {
    sql.startSQLConnection(
        {
            connectionSettings : {
                host: process.env.MYSQL_HOST,
                user: process.env.MYSQL_USER,
                password: process.env.MYSQL_PASSWORD,
                database: process.env.MYSQL_DATABASE,
            }
        }
    );
    console.log(`app listening on port ${port}!`);
});


/*

function exitHandler(options, exitCode) {
    console.log('exiting');
    //
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

// catches "kill pid" (for example: nodemon restart)
process.on('SIGUSR1', exitHandler.bind(null, {exit:true}));
process.on('SIGUSR2', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));*/
