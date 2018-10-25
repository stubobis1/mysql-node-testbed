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
        console.log('received POST request');
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

app.get('/related', async (req, res) => {
    let target;
    let id = req.query.id;
    if (!id) {
        res.send({error: "required param: ID"});
    }
    else {
        target = (await sql.getSelectQueryPromise(id))[0];
        let distance = Number.parseFloat(req.query.maxdistance) || 20;
        let limit = Number.parseFloat(req.query.limit) || 25;
        res.send(await sql.getNearQueryPromise(target, distance, limit));
    }
});

app.get('/distance', async (req, res) => {
    let id1 = req.query.id1;
    let id2 = req.query.id2;
    if (!id1 && id2) {
        res.send({error: "required param: IDs"});
    }
    else {
        let response = await sql.getDistance(id1, id2);
        res.send({Distance: response});
    }
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
