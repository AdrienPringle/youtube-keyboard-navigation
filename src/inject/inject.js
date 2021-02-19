let settings = {
	up: 87,
	down: 83,
	left: 65,
	right: 68,
	home: 81,
	sub: 69,
};
chrome.storage.sync.get(settings, (result) => {
	settings = result;
});

const config = [
	{
		//home
		location: /^\/$/,
		linkId: "#video-title-link",
		getWidth: (el) => {
			return el
				? parseInt(
						document.defaultView
							.getComputedStyle(el)
							.getPropertyValue("--ytd-rich-grid-items-per-row")
				  )
				: 1;
		},
	},
	{
		// subscriptions
		location: /^\/feed\/subscriptions/,
		linkId: "a#video-title",
		getWidth: (el) => {
			const els = Array.from(el.closest("#items").childNodes);
			const baseOffset = els[0].offsetTop;
			const breakIndex = els.findIndex((item) => item.offsetTop > baseOffset);
			return breakIndex === -1 ? els.length : breakIndex;
		},
	},
	{
		// video
		location: /^\/watch/,
		linkId: "ytd-compact-video-renderer a.yt-simple-endpoint:not(#thumbnail)",
		getWidth: (el) => 1,
	},
	{
		// default
		location: "",
		linkId: undefined,
		getWidth: (el) => 0,
	},
];

let sidebarEls = [];
let sidebarPos = -1;

let els = [];
let pos = -1;

let width;
let linkId;
let getWidth;

const getEls = () => document.querySelectorAll(linkId);
const observer = new ResizeObserver(() => {
	width = getWidth(els[0]);
});

const toggleDrawer = () => {
	document.querySelector("#guide-icon").closest("button").click();
};
const isDrawerOpen = () => {
	//return document.querySelector("#scrim").classList.contains("visible")
	return !!document.querySelector("#contentContainer").attributes.opened;
};

const reset = () => {
	if (els[pos]) {
		els[pos].style.backgroundColor = "";
	}

	({ linkId, getWidth } = config.find(({ location }) =>
		document.location.pathname.match(location)
	));
	els = getEls();
	width = getWidth(els[0]);

	pos = -1;
	if (els[0]) {
		observer.disconnect();
		observer.observe(els[0].closest("#contents"));
	}
};
const checkReset = () => {
	({ linkId } = config.find(({ location }) =>
		window.location.pathname.match(location)
	));
	if (!els[0]?.matches(linkId)) {
		reset();
	}
};
const style = (el) => {
	if (el) {
		el.style.backgroundColor = "red";
		el.addEventListener("focusout", (event) => {
			event.target.style.backgroundColor = "";
		});
	}
};
const destyle = (el) => {
	if (el) {
		el.style.backgroundColor = "";
	}
};
const focusNext = (distance) => {
	if (isDrawerOpen()) {
		toggleDrawer();
	}
	checkReset();
	if (pos + distance <= -1) {
		window.scrollTo(0, 0);
		destyle(els[pos]);
		if (els[pos]) {
			els[pos].blur();
		}
		pos = -1;
		return;
	}

	if (pos >= els.length - 2 - Math.abs(distance)) {
		els = getEls();
	}

	destyle(els[pos]);

	if (pos === -1 && distance >= 1) {
		pos = 0;
	} else if (els[pos + distance]) {
		pos += distance;
	}
	if (els[pos]) {
		els[pos].focus();
		style(els[pos]);
	}
};
const focusOn = (index) => {
	destyle(els[pos]);
	style(els[index]);
	pos = index;
};

const sidebarFocusNext = (distance) => {
	if (!isDrawerOpen()) {
		toggleDrawer();
	}
	if (!sidebarEls.length) {
		sidebarEls = document.querySelector("#items").querySelectorAll("#endpoint");
	}
	if (sidebarEls[sidebarPos + distance]) {
		destyle(sidebarEls[sidebarPos]);
		sidebarPos += distance;
		sidebarEls[sidebarPos].focus();
		style(sidebarEls[sidebarPos]);
	}
};

const sidebarFocusOn = (index) => {
	if (!isDrawerOpen()) {
		toggleDrawer();
	}
	if (!sidebarEls.length) {
		sidebarEls = document.querySelector("#items").querySelectorAll("#endpoint");
	}

	destyle(sidebarEls[sidebarPos]);
	style(sidebarEls[index]);
	sidebarEls[index].focus();
	sidebarPos = index;

	destyle(els[pos]);
};

const addKeyListeners = () => {
	document.addEventListener("keydown", (event) => {
		const { up, down, left, right, home, sub } = settings;
		const drawerOpen = isDrawerOpen();
		switch (event.altKey && event.keyCode) {
			case up:
				drawerOpen ? sidebarFocusNext(-1) : focusNext(-width);
				break;
			case down:
				drawerOpen ? sidebarFocusNext(1) : focusNext(width);
				break;
			case left:
				drawerOpen ? focusNext(0) : focusNext(-1);
				break;
			case right:
				drawerOpen ? focusNext(0) : focusNext(1);
				break;
			case home:
				drawerOpen && sidebarPos === 0 ? toggleDrawer() : sidebarFocusOn(0);
				break;
			case sub:
				drawerOpen && sidebarPos === 2 ? toggleDrawer() : sidebarFocusOn(2);
				break;
		}
	});

	document.addEventListener(
		"focusin",
		(event) => {
			const index = Array.prototype.indexOf.call(els, event.target);
			if (index !== -1 && index !== pos) {
				focusOn(index);
				return;
			}

			const sidebarIndex = Array.prototype.indexOf.call(
				sidebarEls,
				event.target
			);
			if (sidebarIndex !== -1 && sidebarIndex !== sidebarPos) {
				focusOn(sidebarIndex);
				return;
			}
		},
		true
	);
};

chrome.extension.sendMessage({}, function (response) {
	var readyStateCheckInterval = setInterval(function () {
		if (document.readyState === "complete") {
			clearInterval(readyStateCheckInterval);
			addKeyListeners();
		}
	}, 10);
});
