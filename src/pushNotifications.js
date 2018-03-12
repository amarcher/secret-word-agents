const PushNotifications = new require('node-pushnotifications');

class NotificationService {
	constructor() {
		this.config = {
			apn: {
				token: {
					key: process.env.APN_CERT,
					keyId: '0D B3 8B 47 2F 20 65 2D AB D1 A5 64 9C 35 ED 09 A0 8A 16 FD',
					teamId: 'JRYHCAHRHF',
				},
			},
		};

		this.push = new PushNotifications(this.config);
	}

	send(registrationIds, data) {
		console.log('preparing to send to registrationIds', registrationIds, data);
		if (!registrationIds || !registrationIds.length) return;
		console.log('sending iOS notification', registrationIds);

		this.push.send(registrationIds, data, (err, result) => {
			if (err) {
				console.log(err);
			} else {
			        console.log(result);
			}
		});
	}
}

module.exports = new NotificationService();
