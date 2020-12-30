
const STATE_FIGHTING = 0;
const STATE_PREFIGHT = 1;
const STATE_POSTFIGHT = 2;
const STATE_PAUSED = 3;
const STATE_TIMEOUT = 4;
const STATE_PORTRAIT_MODE = 5;

const DEBUG = false;

const TIMER_SKETCH = (t) => {


    let tCanv;
    let tState = 0;
    let tPreviousState = 0;
    let tTime = 60000;
    let tAlarm = new p5.Oscillator(200, 'sine');
    let tTimeWarning = false;
    let tCountingUp = false;
    let tZeroTime = 0;
    let tButtons = [];
    let tCurPopup;

    let playerBlue;
    let playerRed;

    t.setup = () => {
        t.frameRate(30);
        tCanv = t.createCanvas(window.innerWidth, window.innerHeight);
        tCanv.parent('timer-area');

        playerRed = new Player('Player 1', Player.TEAM_RED);
        playerBlue = new Player('Player 2', Player.TEAM_BLUE);

        if (DEBUG) {
            playerBlue.chukoku();
            playerBlue.chukoku();
            playerRed.jogai();
            playerRed.jogai();
            playerRed.jogai();

            playerBlue.ippon();
            playerBlue.wazaari();
            playerRed.wazaari();
        }

        tState = STATE_PAUSED;
        tPreviousState = STATE_FIGHTING;
        tTime = 120000;

        tAlarm.amp(0.5);
        tAlarm.freq(220);

        t.draw();
        alert('Click on the timer or press space to start/stop time.\n\nClick on a player\'s name to change it.\n\nUse the left and right arrow keys to point to a player, then use:\n\n - i for Ippon\n - w for Waza-ari\n\n - h for Chukoku\n - m for Mubobi\n - j for Jogai.\n\nDoing so while holding shift will remove points/penalties.');
    };

    t.draw = () => {
        t.background(0);
        t.fill(255);
        t.textSize(32);
        t.textAlign(t.CENTER);
        t.text('Hello', t.width / 2, t.height / 2);

        update();
    };

    t.windowResized = () => {
        tCanv = t.resizeCanvas(window.innerWidth, window.innerHeight);
        checkPortraitMode();
    }

    t.keyTyped = () => {

        if (t.key === ' ') {
            pause();
        } else if (t.key === '-') {
            tCountingUp = !tCountingUp;
        } else if (t.key === 'f') {
            if (document.fullscreenEnabled) {
                let fs = t.fullscreen();
                if (fs && tState !== STATE_PAUSED) {
                    pause();
                }
                t.fullscreen(!fs);
            }
        }

        if (t.keyIsDown(t.LEFT_ARROW)) {
            checkKeys(playerBlue);
        }

        if (t.keyIsDown(t.RIGHT_ARROW)) {
            checkKeys(playerRed);
        }
    }

    t.mouseClicked = () => {
        for (let i = 0; i < tButtons.length; i++) {
            if (tButtons[i].clicked(t.mouseX, t.mouseY)) {
                tButtons[i].onclick(t.millis());
            }
        }
    }

    let checkPortraitMode = () => {
        if (t.width < t.height) {
            changeState(STATE_PORTRAIT_MODE);
        } else if (t.width >= t.height) {
            changeState(STATE_PAUSED);
        }
    };

    let pause = () => {
        if (!changeState(STATE_PAUSED)) {
            changeState(STATE_FIGHTING);
        }
    };

    let checkKeys = (player) => {

        if (t.key === 'i') {
            player.ippon();
            drawPopup(player.name.toUpperCase() + ', IPPON!');
        }
        if (t.key === 'I') {
            player.subtractPoints('ippon');
        }
        if (t.key === 'w') {
            player.wazaari();
            drawPopup(player.name.toUpperCase() + ', WAZA-ARI!');
        }
        if (t.key === 'W') {
            player.subtractPoints('wazaari');
        }
        if (t.key === 'h') {
            player.chukoku();
        }
        if (t.key === 'H') {
            player.removeChukoku()
        }
        if (t.key === 'm') {
            player.mubobi();
        }
        if (t.key === 'M') {
            player.removeMubobi();
        }
        if (t.key === 'j') {
            player.jogai();
        }
        if (t.key === 'J') {
            player.removeJogai();
        }
    }

    let changeState = (state) => {
        if (state !== tState) {
            tPreviousState = tState;
            tState = state;
            return true;
        }
        return false;
    }

    let update = () => {
        tButtons = [];

        if (tState !== STATE_PAUSED && tState !== STATE_PORTRAIT_MODE) {

            if (tCountingUp) {
                tTime += t.deltaTime;
            } else if (!tCountingUp) {
                tTime -= t.deltaTime;
                if (tTime - tZeroTime <= 0) {
                    tTime = 0;
                    tZeroTime = 0;
                    tCountingUp = true;
                }
            }
        }
        if (tTimeWarning === false && tTime - tZeroTime >= 5000) {
            /*setSpacedIntervals(() => {
                startPulse();
            }, 500, 3);
            window.setTimeout(() => {
                tTimeWarning = true;
            }, 1500);*/
        }
        t.ellipseMode(t.RADIUS);
        t.rectMode(t.CENTER);
        t.textAlign(t.CENTER);

        drawBoard(playerRed, playerBlue);

        if (tState === STATE_PORTRAIT_MODE) {
            drawStatePortraitMode();
        }


        // check for disqualification

        if (tCurPopup) {
            tCurPopup.draw(t);
        }


        if (document.fullscreenEnabled) {
            if (tState === STATE_FIGHTING && t.fullscreen() === false) {
                t.fullscreen(true);
            }
        }
    }

    let drawStatePortraitMode = () => {
        t.fill('grey');
        t.rect(t.width / 2, t.height / 2, t.width, t.height);
        t.noStroke();
        t.fill(255);
        t.textSize(16);
        t.text('Not wide enough.\nPlease rotate your device.', t.width / 2, t.height / 2);
    };

    let drawStatePrefight = () => {
        drawBoard(playerRed, playerBlue);
    };

    let drawBoard = (pRed, pBlue) => {
        drawPlayerPanel(0, 0, pBlue);
        drawPlayerPanel(t.width / 2, 0, pRed);
        drawTimer(t.width / 2, t.height / 14);
    }

    let drawPlayerPanel = (x, y, player) => {
        if (player.team === Player.TEAM_BLUE) {
            t.fill('blue');
        } else if (player.team === Player.TEAM_RED) {
            t.fill('red');
        } else if (player.team === Player.TEAM_WHITE) {
            t.fill('white');
        }
        t.noStroke();
        t.rect(x + t.width / 4, y + t.height / 2, t.width / 2, t.height);


        if (player.team === Player.TEAM_BLUE) {
            t.fill('white');
        } else if (player.team === Player.TEAM_RED) {
            t.fill('white');
        } else if (player.team === Player.TEAM_WHITE) {
            t.fill('black');
        }
        t.textStyle(t.NORMAL);
        t.textSize(t.height / 12);
        let textWid = t.textWidth(player.name);
        let hWidth = textWid / 1.5;
        let btX = x + hWidth;
        let btY = y + t.height / 12;
        if (player.team === Player.TEAM_RED) {
            btX = t.width - hWidth;
        }
        let nameButton = new Button(player.name, btX, btY, textWid, t.height / 12);
        nameButton.outlined = false;
        nameButton.draw(t);
        nameButton.setOnClick(() => { player.inputName(); });
        tButtons.push(nameButton);

        t.textSize(t.height / 2.5);
        let scoreX = x + t.width / 4;
        let scoreY = y + (t.height / 2.1);
        let scoreVal = (Math.abs(player.score) > 0 ? player.score.toFixed(1) : player.score).toString();
        let scoreSize = t.height / 14;
        t.text(scoreVal, scoreX, scoreY);
        drawPlusMinusButtons(scoreX + t.textWidth(scoreVal) / 2 + t.width / 32, scoreY - scoreSize, scoreSize, () => { player.wazaari(); }, () => { player.removeWazaari(); });

        drawPenaltySection(x, y, player);
    };

    let drawPenaltyIndicators = (x, y, n) => {
        t.ellipseMode(t.RADIUS);
        t.noStroke();
        for (let i = 0; i < n; i++) {
            t.circle(x, y + i * (t.height / 12) + t.height / 12, t.height / 30);
        }
    };

    let drawPenaltySection = (x, y, player) => {
        t.textStyle(t.BOLD);
        t.textSize(t.height / 8);
        t.noStroke();
        let yOffset = y + t.height * 4 / 6;
        let x1 = x + (t.width / 12) - t.textWidth('H') / 2;
        let x2 = x + (t.width / 4) - t.textWidth('M') / 2;
        let x3 = x + (t.width / 2) - (t.width / 8);
        t.text('H', x1, yOffset);
        t.text('M', x2, yOffset);
        t.text('J', x3, yOffset);

        drawPenaltyIndicators(x1, yOffset, player.penalties.chukoku)
        drawPenaltyIndicators(x2, yOffset, player.penalties.mubobi)
        drawPenaltyIndicators(x3, yOffset, player.penalties.jogai)

        let buttonSize = t.height / 14;
        let hPad = t.textWidth('H') * 1.1;
        let mPad = t.textWidth('M') * 1.1;
        let jPad = t.textWidth('J') * 1.25;
        t.textStyle(t.NORMAL);
        drawPlusMinusButtons(x1 + hPad, yOffset - buttonSize / 2, buttonSize, () => { player.chukoku(); checkDQ(); }, () => { player.removeChukoku(); });
        drawPlusMinusButtons(x2 + mPad, yOffset - buttonSize / 2, buttonSize, () => { player.mubobi(); checkDQ() }, () => { player.removeMubobi(); });
        drawPlusMinusButtons(x3 + jPad, yOffset - buttonSize / 2, buttonSize, () => { player.jogai(); checkDQ() }, () => { player.removeJogai(); });


    };

    let checkDQ = () => {
        if (playerRed.disqualified()) {
            drawPopup('Red Player Disqualified');
        }
        if (playerBlue.disqualified()) {
            drawPopup('Blue Player Disqualified');
        }
    }

    let drawTimer = (x, y) => {
        let rX = x
        let rY = y;
        t.fill(255);
        t.rect(rX, rY, (t.width / 4), t.height / 7, 0, 0, t.width / 40, t.height / 40);
        t.fill(0);
        t.textStyle(t.BOLDITALIC);
        let time = (tCountingUp ? '+' : '–') + timeToMMSS(t.abs(tTime));
        let buttonTime = new Button(time, x - t.width / 121, y + t.height / 80, (t.width / 4), t.width / 16);
        buttonTime.outlined = false;
        buttonTime.color = 'black';
        buttonTime.setOnClick(() => { pause(); });
        if (tState === STATE_PAUSED) {
            if (t.millis() % 1000 > 480) {
                buttonTime.draw(t);
            }
        } else if (tState === STATE_FIGHTING) {
            buttonTime.draw(t);
        }
        tButtons.push(buttonTime);
        t.textStyle(t.NORMAL);
        drawPlusMinusButtons(rX + t.width / 6.5, rY, t.height / 16, () => { tTime = tTime - (tTime % 1000) + 1000; }, () => { tTime = tTime - (tTime % 1000) - 1000; });
    };

    let drawPlusMinusButtons = (x, y, fontSize, cbPlus, cbMinus) => {
        let plus = new Button('+', x, y - fontSize / 2, fontSize, fontSize);
        let minus = new Button('–', x, y + fontSize / 2, fontSize, fontSize);
        plus.setOnClick(cbPlus);
        minus.setOnClick(cbMinus);
        plus.draw(t);
        minus.draw(t);
        tButtons.push(plus);
        tButtons.push(minus);
    }

    let drawPopup = (msg) => {
        if (!tCurPopup || tCurPopup.closable()) {
            let newPopup = new Popup(msg, t.width / 2, t.height / 2, t.width, t.height / 5);
            tCurPopup = newPopup;
        }
    }

    let timeToMMSS = (ms) => {
        let secs = parseInt(ms / 1000);
        secs = secs % 3600;
        let mins = parseInt(secs / 60);
        secs = secs % 60;
        return `${pad(mins, 2)}:${pad(secs, 2)}`;
    }

    let pad = (num, size) => {
        var s = "0" + num;
        return s.substr(s.length - size);
    }

    let startPulse = () => {
        tAlarm.start();
        /*window.setTimeout(() => {
            tAlarm.stop();
        }, 250);*/
    }

    let stopPulse = () => {
        tAlarm.stop();
    }

    let setSpacedIntervals = (callback, delay, repetitions) => {
        let x = 0;
        let intervalID = window.setInterval(function () {

            callback();

            if (++x === repetitions) {
                window.clearInterval(intervalID);
            }
        }, delay);
    }

    class Player {
        constructor(name, team) {
            this.name = name;
            this.team = team;
            this.score = 0;
            this.penalties = {
                chukoku: 0,
                mubobi: 0,
                jogai: 0
            }
            this.dq = false;
        }

        static get TEAM_RED() {
            return 0;
        }

        static get TEAM_BLUE() {
            return 1;
        }

        static get TEAM_WHITE() {
            return 2;
        }

        get toString() {
            return this.name.charAt(0).toUpperCase() + this.name.slice(1).toLowerCase();
        }

        get penaltyString() {
            let chukoku, mubobi, jogai;
            if (this.penalties.chukoku === 0) {
                chukoku = "Chukoku";
            } else if (this.penalties.chukoku === 1) {
                chukoku = "Chukoku Hansoku Chui";
            } else if (this.penalties.chokoku === 2) {
                chokoku = "Chukoku Hansoku";
            }

            if (this.penalties.mubobi === 0) {
                mubobi = "Mubobi";
            } else if (this.penalties.mubobi === 1) {
                mubobi = "Mubobi Hansoku Chui";
            } else if (this.penalties.mubobi === 2) {
                mubobi = "Mubobi Hansoku";
            }

            if (this.penalties.jogai === 0) {
                jogai = "Jogai";
            } else if (this.penalties.jogai === 1) {
                jogai = "Jogai Hansoku Chui";
            } else if (this.penalties.jogai === 2) {
                jogai = "Jogai Hansoku";
            }

            return { chukoku, mubobi, jogai };
        }

        inputName() {
            let input = window.prompt(`Enter new name for "${this.name}": `);
            if (input !== undefined && input !== null) {
                input = input.trim();
                if (input !== '') {
                    this.name = input;
                }
            }
        }

        wazaari() {
            this.score += 0.5;
        }

        removeWazaari() {
            this.score -= 0.5;
        }

        ippon() {
            this.score += 1.0;
        }

        removeIppon() {
            this.score -= 1.0;
        }

        chukoku() {
            return (this.penalties.chukoku < 3 ? ++this.penalties.chukoku : false);
        }

        removeChukoku() {
            return (this.penalties.chukoku > 0 ? --this.penalties.chukoku : false);
        }

        mubobi() {
            return (this.penalties.mubobi < 3 ? ++this.penalties.mubobi : false);
        }

        removeMubobi() {
            return (this.penalties.mubobi > 0 ? --this.penalties.mubobi : false);
        }

        jogai() {
            return (this.penalties.jogai < 3 ? ++this.penalties.jogai : false);
        }

        removeJogai() {
            return (this.penalties.jogai > 0 ? --this.penalties.jogai : false);
        }

        disqualified() {
            return (this.penalties.chukoku >= 3) || (this.penalties.mubobi >= 3) || (this.penalties.jogai >= 3);
        }

        subtractPoints(pts) {
            if (typeof pts == 'number') {
                return (this.score -= pts);
            }
            pts = pts.toUpperCase();
            if (pts === 'IPPON') {
                return --this.score;
            } else if (pts === 'WAZAARI') {
                return (this.score -= 0.5);
            }
        }
    }


    class Button {
        constructor(text, x, y, w, h) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.color = 'white';
            this.bg = 'rgba(0,0,0,0)';
            this.lastClickAt = -Button.CLICK_DELAY;
            this.outlined = true;
        }

        static get CLICK_DELAY() {
            return 1000;
        }

        draw(sk) {
            sk.fill(sk.color(this.bg));
            if (this.outlined) {
                sk.stroke(sk.color(this.color));
            } else {
                sk.noStroke();
            }
            sk.strokeWeight(t.height / 128);
            sk.rect(this.x, this.y, this.w, this.h);

            sk.noStroke();
            sk.fill(sk.color(this.color));
            sk.textSize(this.h)
            sk.text(this.text, this.x, this.y + this.h / 4);
        }

        clicked(x, y) {
            if (x > this.x - this.w / 2 &&
                x < this.x + this.w / 2 &&
                y > this.y - this.h / 2 &&
                y < this.y + this.h / 2) {
                return true;
            } else {
                return false;
            }
        }

        setOnClick(callback) {
            this.callback = callback;
        }

        onclick(frameTime) {
            let normalizedCallback = throttled(100, this.callback);
            normalizedCallback = debounced(50, normalizedCallback);
            normalizedCallback();

            /*if (frameTime - this.lastClickAt > Button.CLICK_DELAY) {
                this.callback();
                this.lastClickAt = frameTime;
            }*/
        }
    }

    class Popup {
        constructor(msg, x, y, w, h) {
            this.msg = msg;
            this.period = 100; //ms
            this.lifetime = 2000;
            this.curTime = 0;
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            this.finished = false;
            this.winner = false;
        }

        draw(sk) {
            let elapsed = 1;
            let nextW = this.w;
            let nextH = this.h;
            if (!this.finished) {
                if (this.curTime < this.period) {
                    elapsed = (this.curTime % this.period) / this.period;
                    nextW = this.w * elapsed;
                    nextH = this.h * elapsed;
                }
                this.curTime += sk.deltaTime;

                if (this.curTime >= this.lifetime) {
                    this.finished = true;
                    this.curTime = this.period;
                }
            }

            if (this.finished) {
                if (this.curTime > 0) {
                    this.curTime -= sk.deltaTime;
                }

                if (this.curTime < 0) {
                    this.curTime = 0;
                }
                elapsed = (this.curTime % this.period) / this.period;
                nextW = this.w * elapsed;
                nextH = this.h * elapsed;
            }

            if (!this.closable()) {
                sk.noStroke();
                sk.fill(sk.color(0, (128 * elapsed)));
                sk.rect(sk.width / 2, sk.height / 2, sk.width, sk.height);

                sk.fill(255);
                sk.rect(this.x, this.y, nextW, nextH, sk.width / 48);
                sk.fill(0);
                sk.textSize(sk.width / 24 * elapsed);
                sk.textAlign(sk.CENTER);
                sk.textStyle(sk.BOLDITALIC);
                sk.text(`${this.msg}`, this.x, this.y + nextH / 3, nextW, nextH);
            }
        }

        closable() {
            return this.finished && this.curTime == 0;
        }
    }

    let debounced = (delay, fn) => {
        let timerId;
        return function (...args) {
            if (timerId) {
                clearTimeout(timerId);
            }
            timerId = setTimeout(() => {
                fn(...args);
                timerId = null;
            }, delay);
        }
    }

    let throttled = (delay, fn) => {
        let lastCall = 0;
        return function (...args) {
            const now = (new Date).getTime();
            if (now - lastCall < delay) {
                return;
            }
            lastCall = now;
            return fn(...args);
        }
    }
}

let timer = new p5(TIMER_SKETCH);