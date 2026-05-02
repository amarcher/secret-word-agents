const GRANTED = 'granted';

function requestPermission() {
	if (window.Notification && Notification.permission !== GRANTED) {
		return Notification.requestPermission((status) => {
			if (Notification.permission !== status) {
				Notification.permission = status;
			}
		});
	}

	return Promise.resolve();
}

export function enableNotifications() {
	requestPermission();
}

export function sendNotification(text) {
	if (!document.hasFocus() && window.Notification && Notification.permission === GRANTED) {
		const notification = new Notification(text, {
			icon: 'apple-icon.png',
		});

		notification.onclick = () => {
			window.parent.focus();
			window.focus();
			notification.close();
		};
	}
}
