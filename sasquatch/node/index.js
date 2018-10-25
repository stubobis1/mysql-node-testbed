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

app.get('/manage/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let response = await sql.getSelectQueryPromise(id);
        res.send(response);
    }
    catch(e){res.send(e.message)}
});

app.post('/manage', async (req, res) => {
    try {
        let params = req.body; //TODO: params validation
        let response = await sql.getInsertQueryPromise(params, connection);
        res.send({message: "Success!", response: response});
    }
    catch(e){res.send(e.message)}
});

app.put('/manage/:id', async (req, res) => {
    try {
        let params = req.body;
        let id = req.params.id;
        let response = await sql.getUpdateQueryPromise(id, params);
        res.send({message: "Success!", response: response});
    }
    catch(e){res.send(e.message)}
});

app.delete('/manage/:id', async (req, res) => {
    try {
        let id = req.params.id;
        let response = await sql.getDeleteQueryPromise(id);
        res.send({message: "Success!", response: response});
    }
    catch(e){res.send(e.message)}
});

app.get('/related/:id', async (req, res) => {
    try {
        let target;
        //let id = req.query.id;
        let id = req.params.id;
        target = (await sql.getSelectQueryPromise(id))[0];
        let distance = Number.parseFloat(req.query.maxdistance) || 20;
        let limit = Number.parseFloat(req.query.limit) || 25;
        res.send(await sql.getNearQueryPromise(target, distance, limit));
    }
    catch(e){res.send(e.message)}
});

app.get('/distance', async (req, res) => {
    try {
        let id1 = req.query.id1;
        let id2 = req.query.id2;
        if (!id1 && id2) {
            res.send({error: "required param: IDs"});
        }
        else {
            let response = await sql.getDistance(id1, id2);
            res.send({Distance: response});
        }
    }
    catch(e){res.send(e.message)}
});
//Launch listening server on port 8081


app.listen(port, function () {
    sql.startSQLConnection(
        {
            tbl: "sightings",
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
