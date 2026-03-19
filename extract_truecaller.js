// extract_truecaller.js
// Uses your downloaded Truecaller JSON to get installationId directly
// Run: node extract_truecaller.js

const https = require('https');
const fs = require('fs');
const readline = require('readline');

// Read the JSON file
const jsonPath = process.argv[2] || 'D:\\HawkEye\\18119516122645936-972544741444.json';

let profileData;
try {
    profileData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    console.log('✅ JSON file loaded successfully');
} catch(e) {
    console.error('❌ Could not read JSON file:', e.message);
    process.exit(1);
}

const userId     = profileData.account.userId;
const phoneNumber = profileData.account.activationDetails[0].number;
const deviceId   = profileData.account.installations[0].installation.deviceDetails.deviceId;
const countryCode = profileData.profile.personalData.phoneNumbers[0].countryCode;

console.log(`📱 Phone: +${phoneNumber}`);
console.log(`🆔 UserId: ${userId}`);
console.log(`📱 DeviceId: ${deviceId}`);
console.log(`🌍 Country: ${countryCode}`);

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (q) => new Promise(r => rl.question(q, r));

const HEADERS = {
    'content-type': 'application/json; charset=UTF-8',
    'accept-encoding': 'gzip',
    'user-agent': 'Truecaller/11.75.5 (Android;10)',
    'clientsecret': 'lvc22mp3l1sfv6ujg83rd17btt',
};

function makeRequest(options, body) {
    return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
            const chunks = [];
            res.on('data', c => chunks.push(c));
            res.on('end', () => {
                try {
                    const raw = Buffer.concat(chunks).toString();
                    resolve({ status: res.statusCode, data: JSON.parse(raw) });
                } catch(e) {
                    resolve({ status: res.statusCode, data: {} });
                }
            });
        });
        req.on('error', reject);
        if (body) req.write(JSON.stringify(body));
        req.end();
    });
}

async function main() {
    console.log('\n📤 Sending OTP request to Truecaller...');

    const body = {
        countryCode: countryCode,
        dialingCode: parseInt(String(phoneNumber).substring(0, 3) === '972' ? 972 : 1),
        installationDetails: {
            app: { buildVersion: 5, majorVersion: 11, minorVersion: 75, store: 'GOOGLE_PLAY' },
            device: {
                deviceId: deviceId,
                language: 'en',
                manufacturer: 'samsung',
                model: 'SM-S721B',
                osName: 'Android',
                osVersion: '14',
                mobileServices: ['GMS']
            },
            language: 'en'
        },
        phoneNumber: String(phoneNumber).substring(3), // remove country code
        region: 'region-2',
        sequenceNo: 2  // sequenceNo 2 triggers voice call instead of SMS
    };

    const options = {
        hostname: 'account-asia-south1.truecaller.com',
        path: '/v2/sendOnboardingOtp',
        method: 'POST',
        headers: { ...HEADERS, 'Content-Type': 'application/json' }
    };

    try {
        const result = await makeRequest(options, body);
        console.log(`Status: ${result.status}`);
        console.log('Response:', JSON.stringify(result.data, null, 2));

        if (result.status === 200 || result.data.status === 1) {
            console.log('\n✅ OTP sent! Check your phone.');
            const otp = await question('Enter OTP: ');

            // Verify OTP
            const verifyBody = {
                countryCode: countryCode,
                dialingCode: 972,
                phoneNumber: String(phoneNumber).substring(3),
                otp: otp,
                installationDetails: body.installationDetails,
                firstName: 'Assaf',
                lastName: 'Gitit',
            };

            const verifyOptions = {
                hostname: 'account-asia-south1.truecaller.com',
                path: '/v2/verifyOnboardingOtp',
                method: 'POST',
                headers: { ...HEADERS, 'Content-Type': 'application/json' }
            };

            const verifyResult = await makeRequest(verifyOptions, verifyBody);
            console.log('\nVerify response:', JSON.stringify(verifyResult.data, null, 2));

            if (verifyResult.data.installationId) {
                const id = verifyResult.data.installationId;
                console.log('\n' + '='.repeat(50));
                console.log('✅ Got installationId!');
                console.log('='.repeat(50));
                console.log(`TRUECALLER_INSTALLATION_ID=${id}`);
                console.log('='.repeat(50));
                fs.writeFileSync('truecaller_creds.txt', `TRUECALLER_INSTALLATION_ID=${id}\n`);
                console.log('\nSaved to truecaller_creds.txt');
            }
        } else {
            console.log('\n❌ Could not send OTP.');
        }
    } catch(e) {
        console.error('Error:', e.message);
    }

    rl.close();
}

main();
