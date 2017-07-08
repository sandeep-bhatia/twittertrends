var express = require('express');
var router = express.Router();
var XML = require('pixl-xml');
var Twitter = require('twitter');
var request = require('request');

var twitterClient = new Twitter({
  consumer_key: 'QrJTENTjzWQQClqnKNwEM1rzV',
  consumer_secret: 'iyxEADRcx0ITn4oIQIJ5w5jfLGsEokh5r31Knutr6UdbAMx0kF',
  access_token_key: '4707155724-CgFcT9TjxHRk2NvORbFR5t1LyXXRnDLOm9SQT88',
  access_token_secret: 'qpq0ks5uUh78hsVc3Yqhfg2GIPR7CbId86RdcLk769AXt'
});

var yahooAppId = "dj0yJmk9VGUzQ1RLTGJSQk1mJmQ9WVdrOWRraDZhR2R2TkcwbWNHbzlNQS0tJnM9Y29uc3VtZXJzZWNyZXQmeD1mZA--";

var getWoeId = function (city, res, onWoeIdSuccess) {
	var url = "http://where.yahooapis.com/v1/places.q(" + city + ")?appid=" + yahooAppId;
	console.log(url);
	request(url, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		var doc = XML.parse( body );
		if(doc) {
		  	console.log('Emerging trends in the city of ' + city);
		  	console.log('loc id is ' + doc.place.woeid);
		  	if(doc.place && doc.place.woeid) {
				onWoeIdSuccess(doc.place.woeid, res);
			} else {
				res.write('no data found');
			}
		} else {
			res.write('no data found');
			res.end();
		}
	  }
	})
}

var getTrends = function(locId, res) {
	var url = 'trends/place.json';
	var params = {id: locId};
	console.log('url requested is ' + url);

	twitterClient.get(url, params, function(error, tweet, response) {
		if(error) {
			console.log(JSON.stringify(error));
			console.log('error encountered ' + error);
		}
		var trendsJson = JSON.parse(response.body);
		if(trendsJson && trendsJson[0]) {
			for(var trend in trendsJson[0].trends) {

				console.log(trendsJson[0].trends[trend].name);
				res.write(trendsJson[0].trends[trend].name);
				res.write("\n");
			}
		} else {
			res.write("Could not find data");
		}

		res.end();
	});
}

router.get('/', function(req, res, next) {
	res.write("Setting up streaming pipeline...");
	twitterClient.stream('statuses/filter', {track: 'datomata'}, function(stream) {
	  stream.on('data', function(tweet) {
	    console.log(tweet.text);
	  });
	 
	  stream.on('error', function(error) {
	  });
	});
	res.write("Streaming setup complete...");
	res.end();
});


router.get('/trends', function(req, res, next) {
	var locId = req.query.locId;

	if(!locId) {
		var city = req.query.city;
		if(city) {
			getWoeId(city, res, getTrends);
		}
	} else { 
		res.write("Outputing trends at the passed in location");
		getTrends(locId, res);
	}
})

module.exports = router;
