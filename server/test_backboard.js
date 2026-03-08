import axios from 'axios';

const BACKBOARD_API_KEY = "espr_8UaJhrqmiiv8UPM74T1n9WSVUw6hUCsMu8dVCxwkgT0";
const BACKBOARD_BASE_URL = 'https://app.backboard.io/api';

async function test() {
    try {
        console.log('Sending request to Backboard...');
        const response = await axios.post(
            `${BACKBOARD_BASE_URL}/chat/completions`,
            {
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are a helpful assistant.' },
                    { role: 'user', content: 'Say hello!' }
                ],
            },
            {
                headers: {
                    'Authorization': `Bearer ${BACKBOARD_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        console.log('SUCCESS:', response.data);
    } catch (err) {
        console.error('ERROR RESPONSE:', err.response?.data || err.message);
    }
}

test();
