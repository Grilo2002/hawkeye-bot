// truecaller_login.js
// Uses truecallerjs library directly — handles region automatically
// Run: node truecaller_login.js

const readline = require('readline');
const path = require('path');

// Load truecallerjs from where npm installed it
let truecallerjs;
try {
    truecallerjs = require(path.join('D:\\nodejs\\node_modules\\truecallerjs'));
} catch(e) {
    try {
        truecallerjs = require('truecallerjs');
    } catch(e2) {
        console.error('Could not load truecallerjs. Make sure it is installed.');
        process.exit(1);
    }
}

// Handle both default and named exports
if (truecallerjs.default) truecallerjs = truecallerjs.default;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function question(prompt) {
    return new Promise(resolve => rl.question(prompt, resolve));
}

async function main() {
    console.log('\n🦅 HawkEye — Truecaller Login');
    console.log('================================');
    console.log('This uses the truecallerjs library which handles regions automatically.\n');

    const phoneNumber = await question('Enter phone number (e.g. +13253974850 or +972544741444): ');

    console.log(`\n📱 Sending OTP to ${phoneNumber}...`);

    let loginData;
    try {
        loginData = await truecallerjs.login(phoneNumber);
        console.log('\nServer response:', JSON.stringify(loginData, null, 2));
    } catch(e) {
        console.error('\n❌ Login request failed:', e.message);
        if (e.response) {
            console.error('Status:', e.response.status);
            console.error('Response data:', JSON.stringify(e.response.data, null, 2));
        }
        rl.close();
        return;
    }

    if (!loginData || loginData.status === undefined) {
        console.error('❌ Unexpected response from server');
        rl.close();
        return;
    }

    if (loginData.status === 1) {
        console.log('\n✅ OTP sent successfully!');
        console.log(`📧 Method: ${loginData.method || 'sms'}`);
        console.log(`🌍 Domain: ${loginData.domain}`);
    } else if (loginData.status === 9) {
        console.log('\n⏳ OTP request pending...');
    } else {
        console.log(`\n⚠️  Status: ${loginData.status} — ${loginData.message}`);
        if (loginData.status !== 1 && loginData.status !== 9) {
            console.log('Check if the number is valid and try again.');
            rl.close();
            return;
        }
    }

    const otp = await question('\nEnter the OTP code you received via SMS: ');

    console.log('\n🔐 Verifying OTP...');
    let verifyResult;
    try {
        verifyResult = await truecallerjs.verifyOtp(phoneNumber, loginData, otp);
        console.log('\nVerification response:', JSON.stringify(verifyResult, null, 2));
    } catch(e) {
        console.error('\n❌ Verification failed:', e.message);
        rl.close();
        return;
    }

    if (verifyResult && (verifyResult.status === 2 || verifyResult.installationId)) {
        const installationId = verifyResult.installationId || '';

        console.log('\n' + '='.repeat(50));
        console.log('✅ SUCCESS! Copy this into your .env file:');
        console.log('='.repeat(50));
        console.log(`TRUECALLER_INSTALLATION_ID=${installationId}`);
        console.log('='.repeat(50));

        // Save to file
        const fs = require('fs');
        const content = `TRUECALLER_INSTALLATION_ID=${installationId}\n`;
        fs.writeFileSync('truecaller_creds.txt', content);
        console.log('\n✅ Also saved to: truecaller_creds.txt');
        console.log('\nNow add this to your D:\\HawkEye\\.env file and restart the bot!');
    } else {
        console.log('\n❌ Verification failed. Response:', verifyResult);
    }

    rl.close();
}

main().catch(err => {
    console.error('Error:', err);
    rl.close();
});
