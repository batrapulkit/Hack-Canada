import dns from 'dns';

const HOSTS = ['google.com', 'api.amadeus.com', 'test.api.amadeus.com'];

console.log('--- Starting DNS Connectivity Check ---');

HOSTS.forEach(host => {
    dns.lookup(host, (err, address) => {
        if (err) {
            console.log(`[FAILED] ${host}: ${err.code}`);
        } else {
            console.log(`[SUCCESS] ${host}: ${address}`);
        }
    });
});
