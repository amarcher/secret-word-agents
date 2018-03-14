/* eslint-disable no-console, no-new-require */

const PushNotifications = new require('node-pushnotifications');

class NotificationService {
	constructor() {
		this.config = {
			apn: {
				token: {
					key: process.env.APN_CERT,
					keyId: 'JRYHCAHRHF',
					teamId: 'J39B2498YF',
				},
			},
		};

		this.push = new PushNotifications(this.config);
	}

	send(registrationIds, data) {
		if (!registrationIds || !registrationIds.length) return;

		console.log('sending iOS notification', registrationIds, data);

		this.push.send(registrationIds, data, (err, result) => {
			if (err) {
				console.log(err);
			} else {
				console.log(result[0].message);
			}
		});
	}
}

module.exports = new NotificationService();
