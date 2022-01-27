/**
 * This will return true if the name contains words that indicate it is a business.
 * 
 * @param name string Name of thing to check for business
 * @returns boolean
 */
 export function isBusinessCheck(name) {
    if (name.toLocaleLowerCase().includes('trust')
    || name.toLocaleLowerCase().includes('llc')
    || name.toLocaleLowerCase().includes('inc')
    || name.toLocaleLowerCase().includes('ltd')
    || name.toLocaleLowerCase().includes('llp')
    || name.toLocaleLowerCase().includes('estate')
    || name.toLocaleLowerCase().includes('family')
    || name.toLocaleLowerCase().includes('%')
    || name.toLocaleLowerCase().includes('&')
    || name.toLocaleLowerCase().includes(' and ')
    || name.toLocaleLowerCase().includes('heir')
    || name.toLocaleLowerCase().includes(' aka ')
    || name.toLocaleLowerCase().includes(' att ')
    || name.toLocaleLowerCase().includes('c/o')
    || name.toLocaleLowerCase().includes('attn')
    || name.toLocaleLowerCase().includes('dba')
    || name.toLocaleLowerCase().includes('invest')
    || name.toLocaleLowerCase().includes('express')
    || name.toLocaleLowerCase().includes('employment')
    || name.toLocaleLowerCase().includes('#')
    || name.toLocaleLowerCase().includes('corporation')
    || name.toLocaleLowerCase().includes('studio')
    || name.toLocaleLowerCase().includes('bank')
    || name.toLocaleLowerCase().includes('corp')
    || name.toLocaleLowerCase().includes('university')
    || name.toLocaleLowerCase().includes('city')
    || name.toLocaleLowerCase().includes('county')) {
        return true;
    }
    else {
        false;
    }
}

/**
 * Pauses execution of your script for this many milliseconds.
 * 
 * @param {number} ms 
 * @returns 
 */
export function timeout(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

/**
 * Use this function to stop the downloading of any images or stylesheets to try and save bandwidth.
 * Useful when bandwidth is being metered.
 * 
 * @param {puppeteer.Page} page 
 */
export async function saveBandwidth(page) {
	await page.setRequestInterception(true);
	page.on('request', async req => {
		// Let's not download images, stylesheets, or huge a datatable bundle
		if (req.resourceType() === 'image'
			|| req.resourceType() === 'stylesheet'
		) {
			await req.abort();
		}
		else {
			await req.continue();
		}
	});
}

/**
 * Expecting address like: 
 * 80 ADLER AVE<br> suite     2000 <br>CLOVIS CA 93612 <br>  UNITED STATES
 * 
 * Or
 * 
 * 1335 2ND AVE N\nSTE N\nFARGO, ND 58102-4215
 * 
 * @param address 
 * @returns 
 */
 export function parseAddressBrNewLine(address) {
	const formattedAddress = {
		street: '',
		city: '',
		state: '',
		zip: ''
	};
	// tests to see if the address contains numbers by using a regex function \d. If it doesn't it's pretty safe to assume that it isn't an address.
	if (address && /\d/.test(address)) {
		try {
			console.log('address in parse', address);
			// A very loooooong replacement of things that would mess up the system.
			let parsedAddress = address.trim().replace(/\t/, ' ').replace(/\n|<br><br>|<br> <br>/g, '<br>').replace(/  +/g, ' ').replace(/ *\([^)]*\) */g, ' ').replace(/<br>USA|<br>UNITED STATES|<br> USA|UNITED STATES|USA|,|\t|<address>|<\/address>|<span>|<\/span>/g, '').replace(/<br><br>|<br> <br>/g, ' ').trim();

			// This handles states with TwoNames putting the state in the proper location to find and not adding it to the city.
			const checkState = statesWithTwoNames.find(state => address.toLocaleUpperCase().includes(state?.toLocaleUpperCase()));
			if (checkState) {
				parsedAddress = parsedAddress.replace(checkState, abbreviateState(checkState));
			}

			// Handles if state and zip are split up by <br>
			if (parsedAddress.split('<br>').filter(Boolean).length > 3) {
				const stateZip = parsedAddress.split('<br>').filter(Boolean).splice(parsedAddress.split('<br>').filter(Boolean).length - 2);
				formattedAddress.state = abbreviateState(stateZip[0].trim());
				formattedAddress.zip = stateZip[1];
				const re = new RegExp(stateZip.join('|'), 'g');
				parsedAddress = parsedAddress.replace(re, '').replace('<br><br>', '');
				const countBrTags = parsedAddress.match(/<br>/g);
				parsedAddress = countBrTags.length > 1 ? parsedAddress.replace(' <br>', '') : parsedAddress;
			}

			const totalBRTags = parsedAddress.match(/<br>/g);
			// If there are two, let's replace one with empty string.
			// Used primarily for the street parsedAddress to work properly with PO/Suites.
			if (totalBRTags.length > 1 && parsedAddress.replace('<br>', '').split('<br>').filter(Boolean).length > 1) {
				parsedAddress = parsedAddress.replace('<br>', ' ').replace(/  +/g, ' ');
			}

			const splitAddress = parsedAddress.split('<br>');
			formattedAddress.street = splitAddress[0]?.trim();
			const cityStateZipSplit = splitAddress[1]?.trim().split(' ').filter(Boolean);

			// If the state is already set above we just need the city.
			if (!formattedAddress.state) {
				formattedAddress.city = cityStateZipSplit?.slice(0, cityStateZipSplit.length - 2)?.join(' ');
				formattedAddress.state = abbreviateState(cityStateZipSplit[cityStateZipSplit.length - 2]);
				formattedAddress.zip = cityStateZipSplit[cityStateZipSplit.length - 1];
			}
			else {
				formattedAddress.city = cityStateZipSplit[0];
			}

			if (formattedAddress.street === '' || formattedAddress.city === '' || formattedAddress.state === '' || formattedAddress.zip === '') {
				throw 'Parsing error';
			}
		} catch (e) {
			console.log('Address was not parsed correctly, returning address as streetAddress', e);
			formattedAddress.street = address.trim().replace(/\t/, ' ').replace(/\n|<br><br>|<br> <br>/g, ' ').replace(/  +/g, ' ').replace(/ *\([^)]*\) */g, ' ').replace(/<br>USA|<br>UNITED STATES|<br> USA|UNITED STATES|USA|,|\t|<address>|<\/address>|<span>|<\/span>/g, '').replace(/<br><br>|<br> <br>/g, ' ').trim();
			formattedAddress.city = '';
			formattedAddress.zip = '';
			formattedAddress.state = '';
		}
	}

	return formattedAddress;
}

/** 
* Expecting address like:
* 125 APAYAUK ST, BARROW, AK 99723
* 
* Or
* 
* 5100 Fox St, SUITE K, DENVER, CO, 80216, United States
* 
* @param address 
* @returns 
*/
export function parseAddressComma(address) {
	const formattedAddress = {
		street: '',
		city: '',
		state: '',
		zip: ''
	};
	// tests to see if the address contains numbers by using a regex function \d. If it doesn't it's pretty safe to assume that it isn't an address.
	if (address && /\d/.test(address)) {
		try {
			// Let's get rid of those pesky USA things and the other items that we don't want.
			let parsedAddress = address.replace(/, USA|, US/, '').replace(/\n|'&nbsp/g, '').replace(/\s\s+/g, ' ').trim();

			// This checks to see if the state and zip are split by a comma by checking if those positions are numbers.
			// This will then delete the comma between the two so the rest of the function flows properly.
			if (!isNaN(parseInt(parsedAddress.split(',')[3])) || !isNaN(parseInt(parsedAddress.split(',')[4]))) {
				parsedAddress = /\d/.test(parsedAddress.split(',')[3]) ? parsedAddress.split(',').slice(0, 4).join(',').replace(/, ([^,]*)$/, ' $1') : parsedAddress.split(',').slice(0, 5).join(',').replace(/, ([^,]*)$/, ' $1');
				console.log(parsedAddress);
			}

			const totalCommasAfter = parsedAddress.match(/,/g);
			// This ensures that that the street parsedAddress is correct if there is a po box.
			if (totalCommasAfter.length > 2) {
				parsedAddress = parsedAddress.replace(',', ' ').replace(/  +/g, ' ');
			}

			// This probably means that an parsedAddress like:
			// 921 FM 489 SHADY OAKWOOD, TX 75855-8427
			// Which makes the city parsing impossible and will be returned all in the streetAddress.
			if (totalCommasAfter.length === 1) {
				const splitOnCommas = parsedAddress.split(',');
				formattedAddress.street = splitOnCommas[0].trim();

				const stateAndZipSplit = splitOnCommas[1].trim().split(' ');
				formattedAddress.state = stateAndZipSplit[0].trim();
				formattedAddress.zip = stateAndZipSplit[1].trim();
				// We want to return here as the if statement belowe will catch that a city isn't present.
				return formattedAddress;
			}
			else {
				const splitOnCommas = parsedAddress.split(',');
				formattedAddress.street = splitOnCommas[splitOnCommas.length - 3].trim();
				formattedAddress.city = splitOnCommas[splitOnCommas.length - 2].trim();

				const stateAndZipSplit = splitOnCommas[splitOnCommas.length - 1].trim().split(' ');
				formattedAddress.state = stateAndZipSplit[0].trim();
				formattedAddress.zip = stateAndZipSplit[1].trim();
			}

			if (formattedAddress.street === '' || formattedAddress.city === '' || formattedAddress.state === '' || formattedAddress.zip === '') {
				throw 'Parsing error';
			}
		} catch (e) {
			console.log('Address was not parsed correctly, returning address as streetAddress', e);
			formattedAddress.street = address.replace(/, USA|, US/, '').replace(/\n|'&nbsp/g, '').replace(/\s\s+/g, ' ').trim();
			formattedAddress.city = '';
			formattedAddress.zip = '';
			formattedAddress.state = '';
		}
	}

	return formattedAddress;
}

/**
 * Take screenshot with Puppeteer and store it in s3
 * When using Puppeteer on AWS Lambda * 
 * 
 * @param {puppeteer.Page} page 
 */
export async function takeScreenshot(page) {
	const fileName = `${new Date()}.png`;
	const screenshot = await page.screenshot();

	const s3Params = {
		Bucket: 'failed-scripts',
		Key: `${fileName}`,
		Body: screenshot
	};

	await s3.putObject(s3Params).promise();
}