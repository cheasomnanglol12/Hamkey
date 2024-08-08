const DEBUG = false;
const MAX_RETRIES = 6;
const users = ['User 1', 'User 2', 'User 3'];

const games = {
    BIKE: {
        appToken: 'd28721be-fd2d-4b45-869e-9f253b554e50',
        promoId: '43e35910-c168-4634-ad4f-52fd764a843f',
        delay: 20_000,
        retry: 20_000,
        keys: 4,
    },
    CLONE: {
        appToken: '74ee0b5b-775e-4bee-974f-63e7f4d5bacb',
        promoId: 'fe693b26-b342-4159-8808-15e3ff7f8767',
        delay: 120_000,
        retry: 20_000,
        keys: 4,
    },
    CUBE: {
        appToken: 'd1690a07-3780-4068-810f-9b5bbf2931b2',
        promoId: 'b4170868-cef0-424f-8eb9-be0622e8e8e3',
        delay: 20_000,
        retry: 20_000,
        keys: 4,
    },
    TRAIN: {
        appToken: '82647f43-3f87-402d-88dd-09a90025313f',
        promoId: 'c4480ac7-e178-4973-8061-9ed5b2e17954',
        delay: 120_000,
        retry: 20_000,
        keys: 4,
    },
};

function debug() {
    if (!DEBUG) return;
    console.log.apply(null, arguments);
}

function info() {
    console.info.apply(null, arguments);
}

function uuidv4() {
    return '10000000-1000-4000-8000-100000000000'.replace(
        /[018]/g,
        c => (+c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> +c / 4).toString(16)
    );
}

async function delay(ms) {
    debug(`Waiting ${ms}ms`);
    return new Promise(resolve => setTimeout(resolve, ms));
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

async function displayPromoCode(gameKey, updateProgress) {
    const gameConfig = games[gameKey];
    let totalKeys = gameConfig.keys;
    
    for (let i = 0; i < totalKeys; i++) {
        const code = await getPromoCode(gameKey);
        info(code);
        updateProgress((i + 1) / totalKeys * 100);
    }
}

async function main() {
    let totalGames = Object.keys(games).length;
    let totalUsers = users.length;
    let completedUsers = 0;
    let completedGames = 0;

    const updateProgress = (percentage) => {
        document.getElementById('progress').textContent = `${Math.round(percentage)}%`;
        document.querySelector('.loading-bar').style.width = `${percentage}%`;
    };

    for (const user of users) {
        info(`- Running for ${user}`);
        completedGames = 0;

        for (const gameKey of Object.keys(games)) {
            info(`-- Game ${gameKey}`);
            await displayPromoCode(gameKey, (progress) => {
                const userProgress = ((completedGames + progress / 100) / totalGames) * 100;
                updateProgress(userProgress);
            });

            completedGames++;
        }

        completedUsers++;
        info('====================');
    }

    updateProgress(100); // Ensure progress reaches 100% at the end
}

document.getElementById('startButton').addEventListener('click', () => {
    main().catch(console.error);
});
