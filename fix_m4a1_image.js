const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, 'server/data/cases.json');
const rawData = fs.readFileSync(casesPath, 'utf8');
const cases = JSON.parse(rawData);

let modified = false;

cases.forEach(c => {
    if (c.id === 'collection-sport-field-2024') {
        const item = c.items.find(i => i.name === 'M4A1-S | Fade');
        if (item) {
            console.log(`Updating image for ${item.name}`);
            item.image = 'https://pub-5f12f7508ff04ae5925853dee0438460.r2.dev/data/csgo/resource/flash/econ/default_generated/weapon_m4a1_silencer_aa_fade_m4a1s_light_png.png';
            modified = true;
        }
    }
});

if (modified) {
    fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
    console.log('Successfully updated M4A1-S | Fade image.');
} else {
    console.log('Item not found or no changes needed.');
}
