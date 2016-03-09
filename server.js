var express = require('express');
var app = express();
app.use(express.static(__dirname + '/dist'));

console.log("Listening on port 2000…");
app.listen(process.env.PORT || 2000);
