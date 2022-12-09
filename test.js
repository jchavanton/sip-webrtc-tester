/*
 * Copyright (C) 2022 Julien Chavanton <jchavanton@gmail.com>
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program; if not, write to the Free Software
 * Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA  02111-1307  USA~
 */

const puppeteer = require('puppeteer');

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

(async() => {
	const browser = await puppeteer.launch({
	    args: [
	        '--no-sandbox', '--disable-setuid-sandbox',
	        '--headless', '--window-size=1200,800', '--disable-gpu',
	        '--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', '--use-file-for-fake-video-capture',
	        '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.132 Safari/537.36',
	        '--verbose', '--enable-logging=stderr','--v=1','>','/output/log.txt', '2>&1'
	    ]
	});

	await console.log("start...");
	const page = await browser.newPage();
	await page.goto('file:///getstats-sip.js/dist/puppeteer.html', {waitUntil: 'networkidle2'});
	await console.log("wait 15 seconds...");
	await sleep(20000);
	await console.log("click hangup...");
	await page.waitForSelector('button[id="hangup"]');
	await page.click('button[id="hangup"]');
	await console.log("wait 2 seconds...");
	await sleep(2000);
	await console.log("click disconnect...");
	await page.waitForSelector('button[id="disconnect"]');
	await page.click('button[id="disconnect"]');
	await console.log("screen shoot /output/screenshot.jpg");
	await page.screenshot({
		path: '/output/screenshot.jpg'
	});
	await page.close()
	await browser.close();
})();


