module.exports = function (RED) {
	const https = require('https');

	function WioGroveWs2812(config) {
		RED.nodes.createNode(this, config);
		var node = this;
		this.on('input', function (msg) {
			var hexColors = [];
			var count = Math.min(((config.mode == 'auto') ? msg.payload : config.count), config.count);
			var colors = config.colors.split(',');
			for (var i = 0; i < count; i++)
				if (colors[i]) hexColors.push(colors[i]);
			for (i = (hexColors.length - 1) ; i < config.count; i++)
				hexColors.push('000000');

			node.status({ fill: 'blue', shape: 'dot', text: 'requesting' });
			var req = https.request({
				hostname: config.server,
				port: 443,
				path: '/v1/node/GroveLedWs2812' + config.port + '/segment/'
					+ config.pos + '/' + hexColors.join('') + '?access_token=' + config.node,
				method: 'POST'
			}, function (res) {
				res.on('data', function (chunk) {
					msg.payload = JSON.parse(chunk)
					node.send(msg);
					node.status({});
				});
			});

			req.on('error', function (err) {
				msg.payload = err.toString();
				msg.statusCode = err.code;
				node.send(msg);
				node.status({ fill: 'red', shape: 'ring', text: err.code });
			});

			req.end();
		});
	}
	RED.nodes.registerType('wio-grove-ws2812', WioGroveWs2812);
}