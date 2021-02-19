const defaultSettings = {
	up: 87,
	down: 83,
	left: 65,
	right: 68,
	home: 81,
	sub: 69,
};

let visibleEL = undefined;
const handleClick = (element) => {
	if (visibleEL == element) {
		visibleEL = undefined;
	} else {
		visibleEL = element;
	}
};
Array.from(document.querySelectorAll("button")).forEach((element) => {
	element.onclick = () => handleClick(element);
	chrome.storage.sync.get(element.id, function (result) {
		console.log(result);
		element.querySelector("span").innerText = result[element.id]
			? String.fromCharCode(result[element.id])
			: defaultSettings[element.id];
	});
});

document.addEventListener("keydown", (event) => {
	if (visibleEL) {
		visibleEL.querySelector("span").innerText = String.fromCharCode(
			event.keyCode
		);
		chrome.storage.sync.set({ [visibleEL.id]: event.keyCode }, function () {
			console.log(" set to ", event.keyCode);
		});
		visibleEL = undefined;
	}
});
