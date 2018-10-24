//Load express module with `require` directive
let express = require('express');
let app = express();
let mysql = require('mysql');
let bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//Define request response in root URL (/)

let connection;
let port = 8081;
let _log = true;

let dbOpts = {};

function getQueryPromise(query, connection) {
    return new Promise((res, rej) => {
        connection.query(query, function (err, result) {
            if (err) {rej(err);}
            else {
                res(result);
            }
        });
    });
}


app.get('/manage', async (req, res) => {
    let params = req.query;
    let id = params.id;
    if (!id) {
        res.send({error: "required param: ID"});
    }
    else {
        let sql = `SELECT *
               FROM ${dbOpts.db}.${dbOpts.sightingsTbl} WHERE id =${id}`;
        if (_log) {
            console.log('params:', params);
            console.log('received get request');
            console.log('id:', id);
            console.log('sql:', sql);
        }
        let response = await getQueryPromise(sql, connection);
        console.log('response:', response);
        res.send(response);
    }
});

app.post('/manage', async (req, res) => {
    let params = req.body;

    if (_log) {
        console.log('params:', params);
        console.log('received PUT request');
    }
    //`test`.`Sightings` (`desc`, `lat`, `long`, `time`, `tags`) VALUES ('testing', 40, 111, 'NULL', 'NULL')

    //TODO: validation
    let sql = `INSERT INTO \`${dbOpts.db}\`.\`${dbOpts.sightingsTbl}\` (\`desc\`, \`lat\`, \`long\`, \`time\`, \`tags\`)
               VALUES (
               "${params.desc || "NULL"}"
               ,"${params.lat || "NULL"}"
               ,"${params.long || "NULL"}"
               ,"${params.time || "NULL"}"
               ,"${params.tags || "NULL"}")`;
    if (_log) {console.log('sql:', sql);}
    let response = await getQueryPromise(sql, connection);
    if (_log) {console.log('response:', response);}
    res.send(response);
});

app.put('/manage', async (req, res) => {
    let params = req.body;

    if (_log) {
        console.log('params:', params);
        console.log('received POST request');
    }
    //`test`.`Sightings` (`desc`, `lat`, `long`, `time`, `tags`) VALUES ('testing', 40, 111, 'NULL', 'NULL')

    let id = params.id;
    if (!id) {
        res.send({error: "required param: ID"});
    }
    else {
        let setValues = [];

        /*TODO: validation here*/
        params.desc ? setValues.push(`t.\`desc\` = '${params.desc}'`) : "";
        params.lat ? setValues.push(`t.\`lat\`   = ${params.lat}`) : "";
        params.long ? setValues.push(`t.\`long\` = ${params.long}`) : "";
        params.time ? setValues.push(`t.\`time\` = DATE('${params.time}')`) : "";
        params.tags ? setValues.push(`t.\`tags\` = '${params.tags}'`) : "";

        let sets = setValues.join(',');

        let sql =
            `UPDATE \`${dbOpts.db}\`.\`${dbOpts.sightingsTbl}\` t 
            SET ${sets}
            WHERE t.\`id\` = ${id}`;
        console.log('sql:', sql);
        let response = await getQueryPromise(sql, connection);
        console.log('response:', response);
        res.send(response);
    }
});


app.delete('/manage', async (req, res) => {
    let sql = `INSERT INTO test (name, address)
               VALUES ('Company Inc', 'Highway 37')`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
    });
});


app.get('/distance', (req, res) => {
    //change 3959 with 6371 to do kilometers
    //from https://stackoverflow.com/questions/4687312/querying-within-longitude-and-latitude-in-mysql
    let lat = 1;
    let lng = 1;
    let distance = 20;
    let limit = 25;

    let query = `SELECT id, ( 3959 * acos( cos( radians(37) ) * cos( radians( ${lat} ) ) * cos( radians( ${lng} ) - radians(-122) ) + sin( radians(37) ) * sin( radians( ${lat} ) ) ) ) AS distance FROM sightings HAVING distance < ${distance} ORDER BY distance LIMIT 0 , ${limit};`;
});

//Launch listening server on port 8081


app.listen(port, function () {
    dbOpts.con = {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    };
    dbOpts.db = process.env.MYSQL_DATABASE;
    dbOpts.sightingsTbl = "Sightings";
    connection = mysql.createConnection(dbOpts.con);
    connection.connect(function (err) {
        if (err) {
            console.log('unable to connect to MySQL - this is probobly because is isn\'t up yet');
            throw error('unable to connect to MySQL');
        } else {
            console.log('Connected to MySQL - Thread ' + connection.threadId);
        }
    });


    console.log(`app listening on port ${port}!`);
});


/*

function exitHandler(options, exitCode) {
    console.log('exiting');
    //connection.end();
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
