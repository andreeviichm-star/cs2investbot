const skinport = require('./services/skinport');

async function test() {
    await skinport.init();

    console.log("Searching 'Fever Case'...");
    const results = skinport.search('Fever Case');
    console.log("Results found:", results.length);
    console.log(results);
}

test();
