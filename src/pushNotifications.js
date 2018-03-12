const PushNotifications = new require('node-pushnotifications');

class NotificationService {
	constructor() {
		this.config = {
			apn: {
				token: {
					key: process.env.APN_CERT,
					keyId: 'Andrew Archer Key',
					teamId: 'J39B2498YF',
				},
			},
			gcm: {
				id: null,
			},
		};

		this.push = new PushNotifications(this.config);
	}

	send(registrationIds, data) {
		console.log('preparing to send to registrationIds', registrationIds, data);
		if (!registrationIds || !registrationIds.length) return;
		console.log('sending iOS notification', registrationIds);

		this.push.send(registrationIds, data);
	}
}

module.exports = new NotificationService();
