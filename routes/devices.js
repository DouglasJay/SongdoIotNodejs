var express = require('express');
var router = express.Router();

var mysql      = require('mysql');
var connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'test1234',
  database : 'iot'
});
 
connection.connect();
//------------2017-11-07 mongodb adding----------------
var MongoClient = require('mongodb').MongoClient;
 
// Connection URL
var url = 'mongodb://localhost:27017/iot';
var dbObj = null;
// Use connect method to connect to the Server
MongoClient.connect(url, function(err, db) {
  console.log("Connected correctly to server");
  dbObj = db;  
});
//--------------------mongodb end----------------------
//-------------2017-11-07 mqtt adding------------------
var mqtt = require('mqtt')
var client  = mqtt.connect('mqtt://192.168.0.35') //mqtt ip
 
client.on('connect', function () {
  client.subscribe('test')  // topic test 변경
  client.subscribe('arduino')
  client.publish('test', 'Hello mqtt')  // topic test 변경
})
 
client.on('message', function (topic, message) {
  // message is Buffer
  console.log(topic+":"+message.toString())
  if (topic == 'arduino') {
  	var dht11Logs = dbObj.collection('dht11Logs');
  	var json = JSON.parse(message.toString());
  	json.device = 'arduino';
  	json.sensor = 'dht11';
  	json.created_at = new Date();
  	dht11Logs.save(json, function(err, results) {});
  }
  //client.end()
})
//--------------------mqtt end----------------------------
 
//-------------2017-11-07 buzzer adding------------------
router.post('/:buzzer/:flag', function(req, res, next) {
	if (req.params.flag == 'on') {
		client.publish('test', '1');
		res.send(JSON.stringify({buzzer:'on'}));		
	} else {
		client.publish('test', '0');
		res.send(JSON.stringify({buzzer:'off'}));
	}
});
//-------------------buzzer end----------------------------

router.get('/:device/:sensor', function(req, res, next) {
	var dht11Logs = dbObj.collection('dht11Logs');
	dht11Logs.find({device:req.params.device,sensor:req.params.sensor}).toArray(function(err, results) {
		if (err) res.send(JSON.stringify(err));
		else res.send(JSON.stringify(results));
	});
});

/* GET devices 전체 listing. */
router.get('/', function(req, res, next) {
	connection.query('select * from device',
		function(err, results, fields) {
			if (err) {
				res.send(JSON.stringify(err));
			} else {
				res.send(JSON.stringify(results));
			}
		});  
});

/* GET devices 특정 정보 조회 */
router.get('/:id', function(req, res, next) {
	connection.query('select * from device where id=?', [ req.params.id ],
		function(err, results, fields) {
			if (err) {
				res.send(JSON.stringify(err));
			} else {
				if (results.length > 0) {
					res.send(JSON.stringify(results[0]));
				} else {
					res.send(JSON.stringify({}));
				}
			}
		});  
});

/* POST devices 등록 */
router.post('/', function(req, res, next) {
  var user_id = req.body.user_id;
  var mac_address = req.body.mac_address;
  connection.query('insert into device(user_id,mac_address) values(?,?)', [ user_id, mac_address ],
		function(err, results) {
			if (err) {
				res.send(JSON.stringify(err));
			} else {
				res.send(JSON.stringify(results));
			}
	});
});

/* DELETE devices 제거 */
router.delete('/:id', function(req, res, next) {
	connection.query('delete from device where id=?', [ req.params.id ],
		function(err, results) {
			if (err) res.send(JSON.stringify(err));
			else res.send(JSON.stringify(results));
	});  
});

module.exports = router;