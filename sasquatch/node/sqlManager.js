let mysql = require('mysql');



let dbOpts = {};

function startSQLConnection(options){
    options = options || {};
    dbOpts = Object.assign({}, options);
    dbOpts.connectionSettings = Object.assign({}, options.connectionSettings);
    dbOpts.db = dbOpts.connectionSettings.database;
    dbOpts.tbl = options.tbl || "Sightings";
    dbOpts.connection = mysql.createConnection(dbOpts.connectionSettings);
    dbOpts.connection.connect(function (err) {
        if (err) {
            console.log('unable to connect to MySQL - this is probably because is isn\'t up yet');
            throw error('unable to connect to MySQL');
        } else {
            console.log('Connected to MySQL - Thread ' + dbOpts.connection.threadId);
        }
    });
}

function closeSQLConnection(){
    dbOpts.connection.end();
}

function getQueryPromise(query, connection) {
    return new Promise((res, rej) => {
        connection.query(query, function (err, result) {
            if (err) {rej(err);}
            else {
                if(_log) {
                    console.log('----------------------------');
                    console.log('query:', query);
                    console.log('result:', result);
                    console.log('----------------------------');
                }
                res(result);
            }
        });
    });
}

function getSelectQueryPromise(id, options){
    console.log('select query for id:',id);
    let opts = Object.assign({}, options, dbOpts);
    return getQueryPromise(
    `SELECT *
    FROM ${opts.db}.${opts.tbl}
    WHERE id =${id}`, opts.connection)
}
function getInsertQueryPromise(values, options){
    let opts = Object.assign({}, options, dbOpts);
    let query = `INSERT INTO \`${dbOpts.db}\`.\`${dbOpts.tbl}\` (\`desc\`, \`lat\`, \`long\`, \`time\`, \`tags\`)
               VALUES (
               "${values.desc || "NULL"}"
               ,"${values.lat || "NULL"}"
               ,"${values.long || "NULL"}"
               ,"${values.time || "NULL"}"
               ,"${values.tags || "NULL"}")`;
    return getQueryPromise(query, opts.connection);
}

function getUpdateQueryPromise(id, values, options){
    let opts = Object.assign({}, options, dbOpts);
    let setValues = [];
    values.desc ? setValues.push(`t.\`desc\` = '${params.desc}'`) : "";
    values.lat ? setValues.push(`t.\`lat\`   = ${params.lat}`) : "";
    values.long ? setValues.push(`t.\`long\` = ${params.long}`) : "";
    values.time ? setValues.push(`t.\`time\` = DATE('${params.time}')`) : "";
    values.tags ? setValues.push(`t.\`tags\` = '${params.tags}'`) : "";
    let sets = setValues.join(',');

    let sql =
        `UPDATE \`${dbOpts.db}\`.\`${dbOpts.tbl}\` t 
            SET ${sets}
            WHERE t.\`id\` = ${id}`;
    return getQueryPromise(sql, opts.connection);
}

function getDeleteQueryPromise(id, options){
    let opts = Object.assign({}, options, dbOpts);
    let sql =
        `DELETE FROM ${dbOpts.db}.${dbOpts.tbl} WHERE id=${id}`;
    return getQueryPromise(sql, opts.connection);
}

function getNearQueryPromise(target, distance, limit, options) {
    let opts = Object.assign({}, options, dbOpts);

    let target_lat = target.lat;
    let target_long = target.long;

    //change 3959 with 6371 to do kilometers
    //from https://stackoverflow.com/questions/4687312/querying-within-longitude-and-latitude-in-mysql

    let query = `SELECT id, (3959 * acos(cos(radians(${target_lat})) * cos(radians(lat)) * cos(radians(\`long\`) - radians(${target_long})) + sin(radians(${target_lat})) * sin(radians(lat)))) AS distance
                 FROM ${dbOpts.db}.${dbOpts.tbl}
                 HAVING distance < ${distance}
                 ORDER BY distance
                 LIMIT 0 , ${limit};`;
    console.log('query:', query);
    return new Promise(async (res,rej) => {
        let results = await getQueryPromise(query, opts.connection);
        let promises = [];
        results.map(row => {
            promises.push(new Promise((res,rej) => {getSelectQueryPromise(row.id)}).then(
                result => {return {result: result, distance: row.distance}}
            ));
        });


        let nearby = await Promise.all(promises);
        console.log('------- results:', nearby);
        res(nearby);


    });
}

function getHaversineDistance(lat1, long1, lat2, long2) {
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

async function getDistance(target1ID, target2ID) {
    let target1;
    let target2;
    await Promise.all([
        getSelectQueryPromise(target1ID).then(value => {target1 = value[0]; return value;}),
        getSelectQueryPromise(target2ID).then(value => {target2 = value[0]; return value;})
    ]);
    let lat1 = target1.lat;
    let long1 = target1.long;
    let lat2 = target2.lat;
    let long2 = target2.long;
    return getHaversineDistance(lat1,long1,lat2,long2);
}

module.exports= {
    dbOpts : dbOpts,
    connection: dbOpts.connection,
    getQueryPromise : getQueryPromise,
    getSelectQueryPromise : getSelectQueryPromise,
    getInsertQueryPromise : getInsertQueryPromise,
    getUpdateQueryPromise : getUpdateQueryPromise,
    getDeleteQueryPromise : getDeleteQueryPromise,
    getNearQueryPromise : getNearQueryPromise,
    getDistance : getDistance,
    startSQLConnection : startSQLConnection,
};