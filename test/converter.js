
var transformer = require('api-spec-transformer');

var postToSwagger = new transformer.Converter(transformer.Formats.AUTO, transformer.Formats.SWAGGER);

postToSwagger.loadFile('sasquatch.postman_collection.json', function(err) {
    if (err) {
        console.log(err.stack);
        return;
    }

    postToSwagger.convert('json')
    .then(function(convertedData) {
        // convertedData is swagger YAML string
        console.log(convertedData)
    })
    .catch(function(err){
        console.log(err);
    });
});