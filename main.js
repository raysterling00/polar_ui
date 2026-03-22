const $ = (id) => document.getElementById(id)
const $qa = (id) => document.querySelectorAll(id)
const varlist = {
	locked: true
}
let hidingNav
let openApps = []
const configureSimpleSwipe = ({
	axis,
	dir,
	element,
	threshold = 200,
	callback = () => {},
	startcall = () => {},
	duringMove = () => {},
	endcall = () => {}
}) => {
	const target = typeof element === "string" ? document.querySelector(element) : element
	if (!target) return

	let startX = 0
	let startY = 0
	let moveX = 0
	let moveY = 0
	let isDragging = false

	const start = (e) => {
		if (e.type === "touchstart") e.preventDefault()
		const point = e.touches[0] ?? e
		startX = point.clientX
		startY = point.clientY
		isDragging = true
		if (typeof startcall == "function") {
			startcall()
		}
	}

	const move = (e) => {
		if (!isDragging) return
		const point = e.touches ? e.touches[0] : e
		const swipeX = point.clientX - startX
		const swipeY = point.clientY - startY
		if (Math.abs(swipeY) > 5 || Math.abs(swipeX) > 5) {
			duringMove({ swipeX, swipeY })
		}
	}

	const end = (e) => {
		if (!isDragging) return
		isDragging = false
		const point = e.changedTouches[0] ?? e
		const endX = point.clientX
		const endY = point.clientY

		const diffX = endX - startX
		const diffY = endY - startY

		let success = false

		if (axis === "x") {
			if (dir === "left" && diffX <= -threshold) success = true
			if (dir === "right" && diffX >= threshold) success = true
		} else if (axis === "y") {
			if (dir === "up" && diffY <= -threshold) success = true
			if (dir === "down" && diffY >= threshold) success = true
		}

		if (success && typeof callback === "function") {
			duringMove({ success: true })
			setTimeout(callback, 100)
		} else {
			duringMove({ reset: true })
		}
		if (typeof endcall === "function") {
			endcall()
		}
	}

	;["touchstart", "mousedown"].forEach((ev) => {
		target.addEventListener(ev, start, { passive: false })
	})
	;["touchend", "mouseup"].forEach((ev) => {
		target.addEventListener(ev, end, { passive: false })
	})
	;["touchmove", "mousemove"].forEach((ev) => {
		window.addEventListener(ev, move)
	})
}

const moveLockScreen = ({ swipeY, reset, success }) => {
	const lock = $("s_lock")
	if (!lock) return
	if (reset) {
		if (varlist.locked === false) return
		lock.style.transition = "top calc(0.3s * var(--delta-time)) ease"
		lock.style.top = "0px"
		return
	}
	if (success) {
		lock.style.transition = "top calc(0.3s * var(--delta-time)) ease"
		lock.style.top = "-105%"
		/*if (navigator.vibrate) */ navigator.vibrate(30)
		return
	}
	if (varlist.locked === false) return
	lock.style.transition = "none"
	if (swipeY <= 2) {
		lock.style.top = `${swipeY}px`
	}
}
const showLockScreen = ({ swipeY, reset, success }) => {
	const lock = $("s_lock")
	if (!lock) return
	if (reset) {
		if (varlist.locked) return
		lock.style.transition = "top calc(0.3s * var(--delta-time)) ease"
		lock.style.top = "-105%"
		return
	}
	if (success) {
		lock.style.transition = "top calc(0.3s * var(--delta-time)) ease"
		lock.style.top = "0px"
		return
	}
	if (swipeY > 0 && swipeY < 576) {
		if (varlist.locked) return
		const screenH = $("screen")?.offsetHeight ?? 570
		lock.style.transition = "none"
		lock.style.top = `${-screenH + swipeY}px`
	}
}
$("h_st").classList.add("hidden")
$("s_home").classList.add("zoom-out")
configureSimpleSwipe({
	axis: "y",
	dir: "up",
	element: $("s_lock"),
	threshold: 50,
	callback: () => {
		if (!varlist.locked) return
		clearTimeout(hidingNav)
		$("n_bar").classList.add("visible")
		$("t_swipe").classList.add("visible")
		setTimeout(() => {
			$("n_bar").classList.add("lift")
		}, 450)
		setTimeout(() => {
			$("n_bar").classList.remove("lift")
			setTimeout(() => {
				$("n_bar").classList.remove("visible")
				$("t_swipe").classList.remove("visible")
			}, 450)
		}, 1200)
	}
})
$("n_bar").classList.remove("visible")
configureSimpleSwipe({
	axis: "y",
	dir: "up",
	element: $("n_container"),
	threshold: 40,
	callback: () => {
		const allApp = $qa(".app")
		if (varlist.locked === true) {
			//$("s_lock").classList.add("hidden")
			varlist.locked = false
			updateLockState()
			$("h_st").classList.remove("hidden")
			$("s_home").classList.remove("zoom-out")
		} else {
			closeApp()
		}
	},
	startcall: () => {
		//$("n_bar").classList.add("shrink")
		$("n_bar").classList.add("visible")
		navigator.vibrate(5)
	},
	duringMove: moveLockScreen,
	endcall: () => {
		//$("n_bar").classList.remove("shrink")
		clearTimeout(hidingNav)
		hidingNav = setTimeout(() => {
			$("n_bar").classList.remove("visible")
		}, 1205)
	}
})
configureSimpleSwipe({
	axis: "y",
	dir: "down",
	element: $("st_n"),
	threshold: 50,
	callback: () => {
		//$("s_lock").classList.remove("hidden")
		varlist.locked = true
		updateLockState()
		$("h_st").classList.add("hidden")
		$("s_home").classList.add("zoom-out")
	},
	duringMove: showLockScreen
})

const updateClock = () => {
	const curDate = new Date()
	let [hour, min, sec] = [
		curDate.getHours().toString(),
		curDate.getMinutes().toString().padStart(2, "0"),
		curDate.getSeconds().toString().padStart(2, "0")
	]
	let [day, month, year] = [curDate.getDate().toString(), curDate.getMonth() + 1, curDate.getFullYear().toString().padStart(2, "0")]
	let formattedMonth = month.toString()
	let curTimeHM = `${hour}:${min}`
	let curTimeHMS = `${hour}:${min}:${sec}`
	let curTimeDMY = `${day}:${formattedMonth}:${year}`
	let curTimeMDY = `${formattedMonth}/${day}/${year}`
	$qa(".h_hm").forEach((el) => {
		el.textContent = curTimeHM
	})
	$qa(".h_hms").forEach((el) => {
		el.textContent = curTimeHMS
	})
	$qa(".d_us").forEach((el) => {
		el.textContent = curTimeMDY
	})
}
setInterval(updateClock, 1000)
updateClock()

// Vibecoding section
const openApp = (i, w) => {
	const icon = i.currentTarget
	//const appWin = $("app_window")
	const appWin = $(w)
	const home = $("s_home")

	const rect = icon.getBoundingClientRect()
	const screenRect = $("screen").getBoundingClientRect()

	const centerX = rect.left + rect.width / 2 - screenRect.left
	const centerY = rect.top + rect.height / 2 - screenRect.top
	const screenMiddle = screenRect.width / 2

	appWin.style.transformOrigin = `${centerX}px ${centerY}px`

	const skVal = screenMiddle + centerX >= 300 ? 15 : -15
	/*appWin.style.transform = `skew(${skVal}deg)`*/
	appWin.classList.remove("hidden")
	appWin.style.pointerEvents = "auto"
	navigator.vibrate(20)
	home.classList.add("zoom-out")
	$("n_bar").classList.add("visible")
	clearTimeout(hidingNav)
	hidingNav = setTimeout(() => {
		$("n_bar").classList.remove("visible")
	}, 1205)
	if (!openApps.includes(w)) {
		openApps.push(w)
	}
}

$qa(".h_icon").forEach((icon) => {
	icon.addEventListener("click", (e) => {
		const targetAppId = icon.getAttribute("data-app")
		openApp(e, targetAppId)
	})
})
const closeApp = () => {
	const views = $qa(".app_view")
	const home = $("s_home")
	views.forEach((view) => {
		view.style.pointerEvents = "none"
		view.classList.add("hidden")
		$("s_home").classList.remove("zoom-out")
	})
}

if ("getBattery" in navigator) {
	navigator.getBattery().then((battery) => {
		updateBatteryStatus = () => {
			const level = Math.floor(battery.level * 100)
			$("b_ind").style.width = `${level}%`
			if (battery.charging) {
				$("b_ind").style.background = "#50F3A5"
			} else {
				if (level <= 15) {
					$("b_ind").style.background = "#F00"
				} else if (level <= 50) {
					$("b_ind").style.background = "#FF0"
				} else {
					$("b_ind").style.background = "#FFFFFF"
				}
			}
		}
		updateBatteryStatus()

		battery.addEventListener("levelchange", updateBatteryStatus)
		battery.addEventListener("chargingchange", updateBatteryStatus)
	})
} else {
	alert(
		"Battery API is not supported in this browser, this may be because you're on Firefox or using an iOS device. Sorry for the inconvinience."
	)
	$("b_ind").style.width = `100%` // Valor por defecto para que no se vea vacío
}

const updateLockState = () => {
	const lock = $("s_lock")
	lock.classList.toggle("locked", varlist.locked)
}
updateLockState()

const setWP = (src) => {
	if (!src) return

	localStorage.setItem("polar_wallpaper", src)
	document.documentElement.style.setProperty("--sys-bg", `url(${src})`)
}

const wallpaperInput = $("w_upload")
wallpaperInput.addEventListener("change", (e) => {
	const file = e.target.files[0]
	if (!file) return

	const reader = new FileReader()

	reader.onload = (ev) => {
		const img = new Image()

		img.onload = () => {
			const canvas = document.createElement("canvas")
			const maxW = 720
			const scale = maxW / img.width

			canvas.width = maxW
			canvas.height = img.height * scale

			const ctx = canvas.getContext("2d")
			ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

			const compressed = canvas.toDataURL("image/jpeg", 0.85)

			setWP(compressed)
		}

		img.src = ev.target.result
	}

	reader.readAsDataURL(file)
})

const savedWallpaper = localStorage.getItem("polar_wallpaper")

if (savedWallpaper) {
	setWP(savedWallpaper)
}
$qa(".img_wall").forEach((img) => {
	img.addEventListener("click", () => {
		const src = img.getAttribute("src")
		setWP(src)
	})
})

$qa(".sub-sel").forEach((el) => {
	el.addEventListener("click", () => {
		const shouldopen = el.getAttribute("data-subapp")
		$(shouldopen).classList.remove("hidden")
	})
})
$qa(".subapp_exit").forEach((el) => {
	el.addEventListener("click", () => {
		const shouldopen = el.getAttribute("data-closes")
		$(shouldopen).classList.add("hidden")
	})
})

const savedCStyle = localStorage.getItem("polar_cstyle") ?? "exclusion"
const listCStyle = ["exclusion", "hard-light", "overlay"]

listCStyle.forEach((st) => $("h_lo").classList.remove(st))
$("h_lo").classList.add(savedCStyle)
$("p_cstyle").value = savedCStyle

$("p_cstyle").addEventListener("change", (e) => {
	const newStyle = e.target.value
	listCStyle.forEach((st) => $("h_lo").classList.remove(st))
	$("h_lo").classList.add(newStyle)
	localStorage.setItem("polar_cstyle", newStyle)
})

$("bright-slider").addEventListener("input", () => {
	$("screen").style.filter = "brightness(" + $("bright-slider").value + ")"
})

window.addEventListener("load", () => {
	setTimeout(() => {
		setInterval(() => {
			// $("loading_title").textContent.slice(1)
			$("loading_title").textContent = $("loading_title").textContent.slice(0, -1)
		}, 125)
	}, 700)
	setTimeout(() => {
		setInterval(() => {
			$("loading_title").textContent = "PolarUI"
		}, 1100)
	}, 1000)
	randomStartNumber = Math.random() * 8
	if (randomStartNumber < 2.5) {
		startupTime = 2500
	} else {
		startupTime = randomStartNumber * 1000
	}
	console.log(startupTime)
	setTimeout(() => ($("loading_screen").style.display = "none"), startupTime)
})

hasSeenSetup = localStorage.getItem("polar_setupseen") ?? false
setTimeout(() => {
	if (hasSeenSetup) {
		subsetup_view.style.top = "150%"
		subsetup_view.style.opacity = "0"
		setup_view.style.top = "150%"
		setup_view.style.opacity = "0"
	}
}, 500)
