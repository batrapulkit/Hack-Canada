import axios from 'axios';

async function testHttp() {
    console.log('Testing HTTP GET http://localhost:5000/api/resorts/search?destination=Paris');
    try {
        const res = await axios.get('http://localhost:5000/api/resorts/search', {
            params: {
                destination: 'Paris',
                budget_level: 2,
                amenities: ''
            }
        });
        console.log('Status:', res.status);
        console.log('Data:', res.data);
    } catch (err) {
        console.error('HTTP Request Failed!');
        if (err.response) {
            console.error('Status:', err.response.status);
            console.error('Data:', JSON.stringify(err.response.data, null, 2));
        } else {
            console.error('Error:', err.message);
        }
    }
}

testHttp();
