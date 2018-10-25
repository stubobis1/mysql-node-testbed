let mysql = require('mysql');



let dbOpts = {};

function startSQLConnection(options){
    options = options || {};
    dbOpts = Object.assign({}, options);
    dbOpts.connectionSettings = Object.assign({}, options.connectionSettings);
    dbOpts.db = dbOpts.connectionSettings.db;
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
function getInsertQueryPromise(values, options){
    let opts = options || dbOpts;
    let con = connection || connection;
    let query = `INSERT INTO \`${dbOpts.db}\`.\`${dbOpts.tbl}\` (\`desc\`, \`lat\`, \`long\`, \`time\`, \`tags\`)
               VALUES (
               "${values.desc || "NULL"}"
               ,"${values.lat || "NULL"}"
               ,"${values.long || "NULL"}"
               ,"${values.time || "NULL"}"
               ,"${values.tags || "NULL"}")`;
    return getQueryPromise(query, con);
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

module.exports= {
    dbOpts : dbOpts,
    connection: dbOpts.connection,
    getQueryPromise : getQueryPromise,
    getSelectQueryPromise : getSelectQueryPromise,
    getInsertQueryPromise : getInsertQueryPromise,
    getUpdateQueryPromise : getUpdateQueryPromise,
    getDeleteQueryPromise : getDeleteQueryPromise,
    startSQLConnection : startSQLConnection,


};