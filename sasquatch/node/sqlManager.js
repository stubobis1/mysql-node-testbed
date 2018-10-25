let mysql = require('mysql');

let dbOpts = {};
let _log = true;

function startSQLConnection(options){
    _log = options.log !== undefined ? options.log : _log;
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
    let opts = Object.assign({}, options, dbOpts);
    return getQueryPromise(
    `SELECT *
    FROM ${opts.db}.${opts.tbl}
    WHERE id =${id}`, opts.connection)
}

function getSelectArrayQueryPromise(id, options){
    let opts = Object.assign({}, options, dbOpts);
    return getQueryPromise(
    `SELECT *
    FROM ${opts.db}.${opts.tbl}
    WHERE id IN (${id.join(',')})`, opts.connection)
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
    values.desc ? setValues.push(`t.\`desc\` = '${values.desc}'`) : "";
    values.lat ? setValues.push(`t.\`lat\`   = ${values.lat}`) : "";
    values.long ? setValues.push(`t.\`long\` = ${values.long}`) : "";
    values.time ? setValues.push(`t.\`time\` = DATE('${values.time}')`) : "";
    values.tags ? setValues.push(`t.\`tags\` = '${values.tags}'`) : "";
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
    let target_id = target.id;

    //change 3959 with 6371 to do kilometers
    //from https://stackoverflow.com/questions/4687312/querying-within-longitude-and-latitude-in-mysql

    let query = `SELECT *, (3959 * acos(cos(radians(${target_lat})) * cos(radians(lat)) * cos(radians(\`long\`) - radians(${target_long})) + sin(radians(${target_lat})) * sin(radians(lat)))) AS distance
                 FROM ${dbOpts.db}.${dbOpts.tbl}
                 WHERE id!=${target_id}
                 HAVING distance < ${distance}
                 ORDER BY distance
                 LIMIT 0 , ${limit};`;
    return getQueryPromise(query, opts.connection);
}

/*function getHaversineDistance(lat1, long1, lat2, long2) {
    //gotten from https://www.movable-type.co.uk/scripts/latlong.html

    let R = 3959e3; //6371e3; // metres
    let φ1 = Math.toRadians(lat1);
    let φ2 = Math.toRadians(lat2);
    let Δφ = (lat2 - lat1).toRadians();
    let Δλ = (long2 - long1).toRadians();

    let a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}*/

// Passed to function:
//   lat1, lon1 = Latitude and Longitude of point 1 (in decimal degrees)
//   lat2, lon2 = Latitude and Longitude of point 2 (in decimal degrees)
//   unit = the unit you desire for results
//          where: 'M' is statute miles (default)
//                 'K' is kilometers
//                 'N' is nautical miles
function distance(lat1, lon1, lat2, lon2, unit = "M") {
    let radlat1 = Math.PI * lat1/180
    let radlat2 = Math.PI * lat2/180
    let theta = lon1-lon2
    let radtheta = Math.PI * theta/180
    let dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);
    if (dist > 1) {
        dist = 1;
    }
    dist = Math.acos(dist);
    dist = dist * 180/Math.PI;
    dist = dist * 60 * 1.1515
    if (unit=="K") { dist = dist * 1.609344 }
    if (unit=="N") { dist = dist * 0.8684 }
    return dist
}

async function getDistance(target1ID, target2ID) {
    let results = await getSelectArrayQueryPromise([target1ID, target2ID]);
    let target1 = results[0];
    let target2 = results[1];

    let lat1 =  Number.parseFloat(target1.lat);
    let lat2 =  Number.parseFloat(target2.lat);
    let long1 = Number.parseFloat(target1.long);
    let long2 = Number.parseFloat(target2.long);
    return distance(lat1,long1,lat2,long2);
}

module.exports= {
    dbOpts : dbOpts,
    connection: dbOpts.connection,
    getQueryPromise : getQueryPromise,
    getSelectArrayQueryPromise : getSelectArrayQueryPromise,
    getSelectQueryPromise : getSelectQueryPromise,
    getInsertQueryPromise : getInsertQueryPromise,
    getUpdateQueryPromise : getUpdateQueryPromise,
    getDeleteQueryPromise : getDeleteQueryPromise,
    getNearQueryPromise : getNearQueryPromise,
    getDistance : getDistance,
    startSQLConnection : startSQLConnection,
};