const DEBUG = false;
const MAX_RETRIES = 6;
const NUMBER_OF_CODES = 8; // Number of codes to generate
const users = ['Heng', 'Godz', 'Leng'];

const games = {
    BIKE: {
        appToken: 'd28721be-fd2d-4b45-869e-9f253b554e50',
        promoId: '43e35910-c168-4634-ad4f-52fd764a843f',
        delay: 20_000,
        retry: 20_000,
        keys: 8, // Adjusted keys to match the number of codes you want to generate
    },
    CLONE: {
        appToken: '74ee0b5b-775e-4bee-974f-63e7f4d5bacb',
        promoId: 'fe693b26-b342-4159-8808-15e3ff7f8767',
        delay: 120_000,
        retry: 20_000,
        keys: 8,
    },
    CUBE: {
        appToken: 'd1690a07-3780-4068-810f-9b5bbf2931b2',
        promoId: 'b4170868-cef0-424f-8eb9-be0622e8e8e3',
        delay: 20_000,
        retry: 20_000,
        keys: 8,
    },
    TRAIN: {
        appToken: '82647f43-3f87-402d-88dd-09a90025313f',
        promoId: 'c4480ac7-e178-4973-8061-9ed5b2e17954',
        delay: 120_000,
        retry: 20_000,
        keys: 8,
    },
};

function debug() {
    if (!DEBUG) {
        return;
    }

    console.log.apply(null, arguments);
}

function info(message) {
    const logOutput = document.getElementById('log-output');
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = message;
    logOutput.appendChild(logEntry);
}

function uuidv4() {
    return '10000000-1000-4000-8000-100000000000'.replace(
        /[018]/g,
        c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16),
    );
}

async function delay(ms) {
    debug(`Waiting ${ms}ms`);
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchApi(path, authTokenOrBody = null, body = null) {
    const options = {
        method: 'POST',
        cache: 'no-store',
    };

    if (typeof authTokenOrBody === 'string') {
        options.headers = {
            ...(options.headers ?? {}),
            authorization: `Bearer ${authTokenOrBody}`,
        };
    }

    if ((authTokenOrBody !== null && typeof authTokenOrBody !== 'string') || body !== null) {
        options.headers = {
            ...(options.headers ?? {}),
            'content-type': 'application/json',
        };

        options.body = JSON.stringify(body ?? authTokenOrBody);
    }

    const url = `https://api.gamepromo.io${path}`;
    debug(url, options);
    const res = await fetch(url, options);

    if (!res.ok) {
        if (DEBUG) {
            const data = await res.text();
            debug(data);
        }

        throw new Error(`${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    debug(data);
    return data;
}

async function getPromoCode(gameKey) {
    const gameConfig = games[gameKey];
    const clientId = uuidv4();

    const loginClientData = await fetchApi('/promo/login-client', {
        appToken: gameConfig.appToken,
        clientId,
        clientOrigin: 'ios',
    });

    await delay(gameConfig.delay);

    const authToken = loginClientData.clientToken;
    let promoCode = null;

    for (let i = 0; i < MAX_RETRIES; i++) {
        const registerEventData = await fetchApi('/promo/register-event', authToken, {
            promoId: gameConfig.promoId,
            eventId: uuidv4(),
            eventOrigin: 'undefined'
        });

        if (!registerEventData.hasCode) {
            await delay(gameConfig.retry);
            continue;
        }

        const createCodeData = await fetchApi('/promo/create-code', authToken, {
            promoId: gameConfig.promoId,
        });

        promoCode = createCodeData.promoCode;
        break;
    }

    if (promoCode === null) {
        throw new Error(`Unable to get ${gameKey} promo`);
    }

    return promoCode;
}

async function displayPromoCodes(gameKey) {
    const gameConfig = games[gameKey];
    const promoCodes = [];

    for (let i = 0; i < NUMBER_OF_CODES; i++) {
        const code = await getPromoCode(gameKey);
        promoCodes.push(code);
    }

    promoCodes.forEach(code => info(code));
}

async function main() {
    const gameSelect = document.getElementById('game-select');
    const generateBtn = document.getElementById('generate-btn');
    const logOutput = document.getElementById('log-output');
    const loadingMessage = document.getElementById('loading-message');

    function clearLog() {
        logOutput.innerHTML = '';
    }

    gameSelect.addEventListener('change', () => {
        generateBtn.disabled = !gameSelect.value;
    });

    generateBtn.addEventListener('click', async () => {
        const selectedGame = gameSelect.value;

        if (!selectedGame) {
            alert('Please select a game.');
            return;
        }

        clearLog();
        info(`Generating ${NUMBER_OF_CODES} codes for ${selectedGame}`);
        
        loadingMessage.style.display = 'block'; // Show the loading message

        try {
            await displayPromoCodes(selectedGame);
        } catch (error) {
            info(`Error: ${error.message}`);
        } finally {
            loadingMessage.style.display = 'none'; // Hide the loading message
        }
    });
}

main().catch(console.error);
