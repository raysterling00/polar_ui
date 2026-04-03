/* PolarUI logic javascript file */
/* 2026 - RayRyxel */

// --- 1. utils and selectors ---
const $ = (id) => document.getElementById(id)
const $q = (id) => document.querySelector(id)
const $qa = (id) => document.querySelectorAll(id)

// --- 2. config and globals ---
const varlist = {
	locked: true
}
let hidingNav
let openApps = []

let versionCodeName = "Esclera"
let versionCode = "NP-260403"
let versionName = "26.2.2"
let versionNameShorthand = "26"

let password = localStorage.getItem("polar_pwd") ?? ""
let enteredPassword = ""
let canUnlockAnim = false
let lightScheme = localStorage.getItem("polar_darkscheme") === "true"

loa_txt = "PolarUI"
loa_index = 0
canEffectStartUp = true

const hasSeenSetup = localStorage.getItem("polar_setupseen") === "true"

const savedLock = localStorage.getItem("polar_wp_lock")
const savedHome = localStorage.getItem("polar_wp_home")

const savedCStyle = localStorage.getItem("polar_cstyle") ?? "glass"
const listCStyle = ["normal", "normal-dark", "inversion", "glass"]
const savedCFont = localStorage.getItem("polar_cfont") ?? "long"
const listCFont = ["long", "short"]

let currentAudio = new Audio()
let isPlaying = false
let volume = 100
let volumeTimeout

let expression = ""
let justCalculated = false

const mUpload = $("m_upload")
const mPlayBtn = $("m_play")
const camPlayBtn = $("cam_play")
const mainDisplay = $("mainDisplay")
const previewDisplay = $("previewDisplay")
const wallpaperInput = $("w_upload")

// --- 3. ui init ---
$qa(".vName").forEach((el) => (el.textContent = versionName))
$qa(".vNameShort").forEach((el) => (el.textContent = versionNameShorthand))
$qa(".vCode").forEach((el) => (el.textContent = versionCode))
$qa(".vCodeName").forEach((el) => (el.textContent = versionCodeName))

document.documentElement.classList.toggle("light", lightScheme)
document.body.classList.toggle("light", lightScheme)

$("s_home").classList.add("zoom-out")
$("h_fav_bar").classList.add("zoom-out")
$("n_bar").classList.remove("visible")
$("h_st").classList.add("hidden")

listCStyle.forEach((st) => $("h_lo").classList.remove(st))
$("h_lo").classList.add(savedCStyle)
$("p_cstyle").value = savedCStyle

listCFont.forEach((st) => $("h_lo").classList.remove(st))
$("h_lo").classList.add(savedCFont)
$("p_cfont").value = savedCFont

// --- 4. core functions and engines ---
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

	target.addEventListener("touchstart", start, { passive: false })
	target.addEventListener("mousedown", start, { passive: false })
	target.addEventListener("touchend", end, { passive: false })
	target.addEventListener("mouseup", end, { passive: false })
	window.addEventListener("touchmove", move, { passive: false })
	window.addEventListener("mousemove", move, { passive: false })
}

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
	$("b_sect").style.display = "none"
}

const applyDynamicTilt = (event, elementId) => {
	const screen = $("screen")
	const rect = screen.getBoundingClientRect()
	const centerX = rect.left + rect.width / 2
	const centerY = rect.top + rect.height / 2
	const clickX = event.clientX
	const clickY = event.clientY
	const targetApp = $(elementId)
	const isTop = clickY < centerY
	const isLeft = clickX < centerX

	if ((isTop && isLeft) || (!isTop && !isLeft)) {
		targetApp.classList.add("tilt-left")
	} else {
		targetApp.classList.add("tilt-right")
	}

	setTimeout(() => {
		targetApp.classList.remove("tilt-left", "tilt-right")
	}, 200)
}

// --- 5. system and screen logic ---
const updateLockState = () => {
	const lock = $("s_lock")
	lock.classList.toggle("locked", varlist.locked)
	if (lock.classList.contains("locked")) {
		$("h_st").classList.add("hidden")
	} else {
		$("h_st").classList.remove("hidden")
	}
}
updateLockState()

const moveLockScreen = ({ swipeY, reset, success }) => {
	const lock = $("s_lock")
	if (!lock) return
	if (reset) {
		if (varlist.locked === false) return
		lock.style.transition = "top 0.3s ease"
		lock.style.top = "0px"
		return
	}
	if (success) {
		lock.style.transition = "top 0.3s ease"
		lock.style.top = "-105%"
		navigator.vibrate(40)

		if (password === "") canUnlockAnim = true
		if (canUnlockAnim) {
			$("s_home").classList.remove("zoom-out")
			$("h_fav_bar").classList.remove("zoom-out")
		}
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
		lock.style.transition = "top 0.3s ease"
		lock.style.top = "-105%"
		return
	}
	if (success) {
		lock.style.transition = "top 0.3s ease"
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

const setWP = (src, target = "both") => {
	if (!src) return
	if (target === "lock" || target === "both") {
		localStorage.setItem("polar_wp_lock", src)
		document.documentElement.style.setProperty("--sys-bg-lock", `url(${src})`)
	}
	if (target === "home" || target === "both") {
		localStorage.setItem("polar_wp_home", src)
		document.documentElement.style.setProperty("--sys-bg-home", `url(${src})`)
	}
}

if (savedLock) setWP(savedLock, "lock")
if (savedHome) setWP(savedHome, "home")

const showDialoguePopUp = (title, btn1, cb1, btn2, cb2, btn3, cb3) => {
	$("dialoguebox").classList.remove("hidden")
	$("dialoguetext").textContent = title

	if (!btn2) {
		$q(".dialoguebutton.second").style.display = "none"
	} else {
		$q(".dialoguebutton.second").style.display = "block"
	}
	if (!btn3) {
		$q(".dialoguebutton.third").style.display = "none"
	} else {
		$q(".dialoguebutton.third").style.display = "block"
	}

	$q(".dialoguebutton.first").textContent = btn1
	$q(".dialoguebutton.first").onclick = () => {
		cb1()
		hideDialoguePopUp()
	}

	$q(".dialoguebutton.second").textContent = btn2
	$q(".dialoguebutton.second").onclick = () => {
		cb2()
		hideDialoguePopUp()
	}

	$q(".dialoguebutton.third").textContent = btn3
	$q(".dialoguebutton.third").onclick = () => {
		cb3()
		hideDialoguePopUp()
	}
}
const hideDialoguePopUp = () => $("dialoguebox").classList.add("hidden")

// --- 6. app mngmnt ---
const openApp = (i, w) => {
	const icon = i.currentTarget
	const appWin = $(w)
	const home = $("s_home")
	const favs = $("h_fav_bar")
	const rect = icon.getBoundingClientRect()
	const screenRect = $("screen").getBoundingClientRect()
	const centerX = rect.left + rect.width / 2 - screenRect.left
	const centerY = rect.top + rect.height / 2 - screenRect.top

	appWin.style.transformOrigin = `${centerX}px ${centerY}px`

	appWin.classList.remove("hidden")
	appWin.style.pointerEvents = "auto"
	appWin.style.translate = "0% 20%"
	setTimeout(() => {
		appWin.style.translate = ""
	}, 180)
	navigator.vibrate(35)
	home.classList.add("zoom-out")
	favs.classList.add("zoom-out")
	$("n_bar").classList.add("visible")
	clearTimeout(hidingNav)
	hidingNav = setTimeout(() => {
		$("n_bar").classList.remove("visible")
	}, 1205)
	if (!openApps.includes(w)) {
		openApps.push(w)
	}
}

const closeApp = () => {
	const views = $qa(".app_view")
	const home = $("s_home")
	views.forEach((view) => {
		view.style.pointerEvents = "none"
		view.classList.add("hidden")
		$("s_home").classList.remove("zoom-out")
		$("h_fav_bar").classList.remove("zoom-out")
	})
}

// --- 7. swipe gestures ---
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

configureSimpleSwipe({
	axis: "y",
	dir: "up",
	element: $("n_container"),
	threshold: 40,
	callback: () => {
		const allApp = $qa(".app")
		if (varlist.locked === true) {
			varlist.locked = false
			updateLockState()
			if (canUnlockAnim) {
				$("s_home").classList.remove("zoom-out")
				$("h_fav_bar").classList.remove("zoom-out")
			}
			if (password === "") {
				canUnlockAnim = true
			}
			if (canUnlockAnim) {
				$("s_home").classList.remove("zoom-out")
				$("h_fav_bar").classList.remove("zoom-out")
			}
		} else {
			closeApp()
		}
	},
	startcall: () => {
		$("n_bar").classList.add("visible")
		navigator.vibrate(25)
		if (password === "" && varlist.locked === true) $("s_sublock").classList.add("hidden")
	},
	duringMove: (data) => {
		moveLockScreen(data)
	},
	endcall: () => {
		if (canUnlockAnim) {
			$("s_home").classList.remove("zoom-out")
			$("h_fav_bar").classList.remove("zoom-out")
		}
		setTimeout(() => {
			if (canUnlockAnim) {
				$("s_home").classList.remove("zoom-out")
				$("h_fav_bar").classList.remove("zoom-out")
			}
		}, 20)
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
		varlist.locked = true
		updateLockState()
		$("s_home").classList.add("zoom-out")
		$("h_fav_bar").classList.add("zoom-out")
	},
	duringMove: showLockScreen
})

// --- 8. global user events ---
window.addEventListener("load", () => {
	const loa_txt = "PolarUI"
	const titleEl = $("loading_title")

	const deleteEffect = () => {
		let text = titleEl.textContent
		const delInterval = setInterval(() => {
			if (text.length > 0) {
				text = text.slice(0, -1)
				titleEl.textContent = text
			} else {
				clearInterval(delInterval)
				setTimeout(typeEffect, 200)
			}
		}, 100)
	}

	const typeEffect = () => {
		let i = 0
		const typeInterval = setInterval(() => {
			if (i < loa_txt.length) {
				titleEl.textContent += loa_txt[i]
				i++
			} else {
				clearInterval(typeInterval)
				setTimeout(deleteEffect, 1000)
			}
		}, 120)
	}

	setTimeout(deleteEffect, 800)

	let randomStartNumber = Math.random() * 11
	let startupTime = randomStartNumber < 2.5 ? 2500 : randomStartNumber * 1000

	setTimeout(() => {
		$("loading_screen").style.opacity = "0"
		setTimeout(() => ($("loading_screen").style.display = "none"), 500)
	}, startupTime)
})

setTimeout(() => {
	if (hasSeenSetup) {
		subsetup_view.style.top = "150%"
		subsetup_view.style.opacity = "0"
		setup_view.style.top = "150%"
		setup_view.style.opacity = "0"
	}
}, 500)

$qa(".h_icon").forEach((icon) => {
	icon.addEventListener("click", (e) => {
		const targetAppId = icon.getAttribute("data-app")
		openApp(e, targetAppId)
		// applyDynamicTilt(e, targetAppId)
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

			showDialoguePopUp(
				"Select scope",
				"Lock screen only",
				() => {
					setWP(compressed, "lock")
				},
				"Home screen only",
				() => {
					setWP(compressed, "home")
				},
				"Both screens",
				() => {
					setWP(compressed, "lock")
					setWP(compressed, "home")
				}
			)
		}

		img.src = ev.target.result
	}

	reader.readAsDataURL(file)
})

$qa(".img_wall").forEach((img) => {
	img.addEventListener("click", () => {
		const src = img.getAttribute("src")
		showDialoguePopUp(
			"Select scope",
			"Home screen only",
			() => {
				setWP(src, "home")
			},
			"Lock screen only",
			() => {
				setWP(src, "lock")
			},
			"Both screens",
			() => {
				setWP(src, "lock")
				setWP(src, "home")
			}
		)
	})
})

$("p_cstyle").addEventListener("change", (e) => {
	const newStyle = e.target.value
	listCStyle.forEach((st) => $("h_lo").classList.remove(st))
	$("h_lo").classList.add(newStyle)
	localStorage.setItem("polar_cstyle", newStyle)
})
$("p_cfont").addEventListener("change", (e) => {
	const newStyle = e.target.value
	listCFont.forEach((st) => $("h_lo").classList.remove(st))
	$("h_lo").classList.add(newStyle)
	localStorage.setItem("polar_cfont", newStyle)
})

$("bright-slider").addEventListener("input", () => {
	$("screen").style.filter = "brightness(" + $("bright-slider").value + ")"
})

$("schemebutton").onclick = () => {
	lightScheme = !lightScheme
	document.documentElement.classList.toggle("light", lightScheme)
	document.body.classList.toggle("light", lightScheme)
	localStorage.setItem("polar_darkscheme", lightScheme)
}

$("pwr_btn").onclick = () => {
	const isOff = !$("s_black").classList.contains("hidden")

	if (isOff) {
		$("s_black").classList.add("hidden")
		navigator.vibrate(20)
	} else {
		varlist.locked = true
		updateLockState()

		$("s_home").classList.add("zoom-out")
		$("h_fav_bar").classList.add("zoom-out")

		canUnlockAnim = false

		if (password !== "") {
			$("s_sublock").classList.remove("hidden")
			$qa(".pwd_dot").forEach((dot) => dot.classList.remove("filled"))
			enteredPassword = ""
		}

		$("s_lock").style.top = "0px"
		$("s_black").classList.remove("hidden")

		navigator.vibrate(30)
	}
}

const updateVolumeUI = () => {
	volume = Math.max(0, Math.min(100, volume))
	const audioLevel = volume / 100

	$("volume_bar").classList.remove("hidden")
	$("volume_slider").style.height = `${volume}%`

	clearTimeout(volumeTimeout)
	volumeTimeout = setTimeout(() => {
		$("volume_bar").classList.add("hidden")
	}, 3000)
	if (currentAudio) {
		currentAudio.volume = audioLevel
	}
}

$("vo1_btn").addEventListener("click", () => {
	volume += 10
	updateVolumeUI()
	navigator.vibrate(10)
})

$("vo2_btn").addEventListener("click", () => {
	volume -= 10
	updateVolumeUI()
	navigator.vibrate(10)
})

$("setpwdtrigger").onclick = () => {
	let newPassword = prompt("Insert new password (4 digits), or leave empty to clear:")

	if (newPassword === null) return

	if (newPassword.trim() === "") {
		password = ""
		localStorage.setItem("polar_pwd", "")
		console.log("Password cleared")
		return
	}

	if (isNaN(newPassword)) {
		alert("Only numbers accepted")
	} else if (newPassword.length < 4) {
		alert("Insufficient digits (need 4)")
	} else {
		let appliedPassword = newPassword.substring(0, 4)
		password = appliedPassword
		localStorage.setItem("polar_pwd", appliedPassword)
		console.log("New password set: " + appliedPassword)
	}
}

$qa(".pwd_btn").forEach((btn) => {
	btn.addEventListener("click", () => {
		let digit = btn.getAttribute("data-digit")

		if (digit === "bksp") {
			enteredPassword = enteredPassword.slice(0, -1)
		} else if (digit === "check") {
		} else if (enteredPassword.length < 4) {
			enteredPassword += digit
		}

		const dots = $qa(".pwd_dot")
		dots.forEach((dot, index) => {
			if (index < enteredPassword.length) {
				dot.classList.add("filled")
			} else {
				dot.classList.remove("filled")
			}
		})

		if (enteredPassword.length === 4) {
			if (enteredPassword === password) {
				$("s_sublock").classList.add("hidden")
				canUnlockAnim = true
				$("s_home").classList.remove("zoom-out")
				$("h_fav_bar").classList.remove("zoom-out")
				enteredPassword = ""
			} else {
				dots.forEach((dot) => {
					dot.classList.remove("filled")
					dot.classList.add("wrong")
					setTimeout(() => dot.classList.remove("wrong"), 350)
				})

				navigator.vibrate(100)
				$("pwd_dots").style.animation = "backAndForth 0.3s forwards"
				setTimeout(() => {
					$("pwd_dots").style.animation = ""
				}, 350)
				enteredPassword = ""
			}
		}
	})
})

// --- 9. especific modules ---

// --- calc  ---
function formatScreen(str) {
	if (!str) return "0"
	return str.toString().replace(/\*/g, "×").replace(/\//g, ":")
}

function safeEval(str) {
	try {
		const result = new Function("return " + str)()
		return result === undefined || isNaN(result) ? null : result
	} catch {
		return null
	}
}

$qa(".calc_btn.number").forEach((btn) => {
	btn.onclick = () => {
		if (justCalculated) {
			expression = ""
			justCalculated = false
		}
		expression += btn.textContent.trim()
		mainDisplay.textContent = formatScreen(expression)
		const val = safeEval(expression)
		previewDisplay.textContent = val !== null ? val : ""
		navigator.vibrate(15)
	}
})

$qa(".calc_btn.operator").forEach((btn) => {
	btn.onclick = () => {
		let op = btn.getAttribute("data-op")

		if (op === "+-") {
			const currentVal = safeEval(expression)
			if (currentVal !== null) {
				expression = String(currentVal * -1)
				mainDisplay.textContent = formatScreen(expression)
			}
			return
		}

		if (!expression && op !== "-") return

		const lastChar = expression.slice(-1)
		if ("+-*/".includes(lastChar)) {
			expression = expression.slice(0, -1)
		}

		expression += op
		mainDisplay.textContent = formatScreen(expression)
		justCalculated = false
		navigator.vibrate(15)
	}
})

$qa("[data-action='clear']").forEach((btn) => {
	btn.onclick = () => {
		expression = ""
		mainDisplay.textContent = "0"
		previewDisplay.textContent = ""
		navigator.vibrate(20)
	}
})

$qa("[data-action='backspace']").forEach((btn) => {
	btn.onclick = () => {
		expression = expression.slice(0, -1)
		mainDisplay.textContent = formatScreen(expression)
		const val = safeEval(expression)
		previewDisplay.textContent = val !== null ? val : ""
		navigator.vibrate(10)
	}
})

$qa("[data-action='equal']").forEach((btn) => {
	btn.onclick = () => {
		const result = safeEval(expression)
		if (result !== null) {
			mainDisplay.textContent = result
			previewDisplay.textContent = ""
			expression = String(result)
			justCalculated = true
			navigator.vibrate(30)
		}
	}
})

// --- music player logic ---
mUpload.addEventListener("change", (e) => {
	const file = e.target.files[0]
	if (!file) return

	const audioUrl = URL.createObjectURL(file)
	currentAudio.src = audioUrl

	$("track_name").textContent = file.name
	$("cam_track").textContent = file.name

	$("cam_content").classList.remove("hidden")
})

const togglePlay = () => {
	if (currentAudio.paused) {
		currentAudio.play()
		mPlayBtn.textContent = "❚❚"
		camPlayBtn.textContent = "❚❚"
		$("camera").classList.add("expanded")
	} else {
		currentAudio.pause()
		mPlayBtn.textContent = "▶"
		camPlayBtn.textContent = "▶︎"
		$("camera").classList.remove("expanded")
	}
}

mPlayBtn.onclick = togglePlay
camPlayBtn.onclick = togglePlay
