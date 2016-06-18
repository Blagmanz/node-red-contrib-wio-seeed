module.exports = function (RED) {
	const https = require('https');

	function WioPwm(config) {
		RED.nodes.createNode(this, config);
		var node = this;
		node.connection = RED.nodes.getCredentials(config.connection);

		if (node.connection) {
			this.on('input', function (msg) {
				var request = '';
				if (config.mode == 'manualdutyfrequency') {
					request = 'pwm_with_freq/' + parseFloat(config.duty) + '/' + parseInt(config.frequency);
				} else if (config.mode == 'manualduty') {
					request = 'pwm_with_freq/' + parseFloat(config.duty) + '/' + parseInt(msg.payload);
				} else if (config.mode == 'manualfrequency') {
					request = 'pwm_with_freq/' + parseFloat(msg.payload) + '/' + parseInt(config.frequency);
				} else if (config.mode == 'manual') {
					request = 'pwm/' + parseFloat(config.duty);
				} else {
					request = 'pwm/' + parseFloat(msg.payload);
				}

				node.status({ fill: 'blue', shape: 'dot', text: 'requesting' });
				var req = https.request({
					hostname: node.connection.server,
					port: 443,
					path: '/v1/node/' + config.port.replace(/:/g, '') + '/'
						+ request + '?access_token=' + config.node,
					method: 'POST'
				}, function (res) {
					msg.payload = '';
					res.on('data', function (chunk) {
						try { msg.payload = JSON.parse(chunk); }
						catch (e) { node.warn('api error'); }
						node.status({});
						node.send(msg);
					});
				});

				req.on('error', function (err) {
					msg.payload = err.toString();
					node.status({ fill: 'red', shape: 'ring', text: err.code });
					node.send(msg);
				});

				req.end();
			});
		} else {
			node.status({ fill: 'red', shape: 'ring', text: 'missing connection' });
		}
	}
	RED.nodes.registerType('wio-pwm', WioPwm);
}