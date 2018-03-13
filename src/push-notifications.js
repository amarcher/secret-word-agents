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
		console.log('preparing to send to registrationIds', registrationIds, data);
		if (!registrationIds || !registrationIds.length) return;
		console.log('sending iOS notification', registrationIds);

		this.push.send(registrationIds, data, (err, result) => {
			if (err) {
				console.log(err, err.message);
			} else {
			        console.log(result, result[0]);
			        console.log(result[0].message);
			}
		});
	}
}

module.exports = new NotificationService();
