//Load express module with `require` directive
let express = require('express');
let app = express();
let mysql = require('mysql');
//Define request response in root URL (/)

let connection;
let port = 90;
let _log = true;

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




let tableName = "sasquatch-data";
let dbName = "test";

app.get('/manage', async (req, res) => {
    let params = req.params;
    let id= req.params;
    let sql = `SELECT * FROM ${dbName}.${tableName} WHERE id=${id}`;
    if(_log) {
        console.log('params:', params);
        console.log('recieved get request');
        console.log('id:', id);
        console.log('sql:', sql);
    }
    //let response = await getQueryPromise(sql, connection);
    //res.send(response)
    res.send('hey world!')
});

app.post('/manage', async (req, res) => {
    let id= req.param('id');
    let sql = `INSERT INTO test (name, address) VALUES ('Company Inc', 'Highway 37')`;
    let response = await getQueryPromise(sql, connection);
    res.send(response);



    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
    });
});
app.put('/manage', async (req, res) => {
    let sql = `INSERT INTO test (name, address) VALUES ('Company Inc', 'Highway 37')`;
    connection.query(sql, function (err, result) {
        if (err) throw err;
        console.log("1 record inserted");
    });
});
app.delete('/manage', async (req, res) => {
    let sql = `INSERT INTO test (name, address) VALUES ('Company Inc', 'Highway 37')`;
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

    let query = `SELECT id, ( 3959 * acos( cos( radians(37) ) * cos( radians( ${lat} ) ) * cos( radians( ${lng} ) - radians(-122) ) + sin( radians(37) ) * sin( radians( ${lat} ) ) ) ) AS distance FROM sightings HAVING distance < ${distance} ORDER BY distance LIMIT 0 , ${limit};`
});

//Launch listening server on port 8081

let dbOptions;

app.listen(port, function () {
    dbOptions = {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USER,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DATABASE,
    };
    dbName = dbOptions.database;
    connection = mysql.createConnection(dbOptions);
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