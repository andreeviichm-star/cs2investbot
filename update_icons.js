const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, 'server/data/cases.json');

const icons = {
    'collection-graphic-design-2024': 'https://wiki.cs.money/images/collections/collection-set-graphic-design.png',
    'collection-overpass-2024': 'https://wiki.cs.money/images/collections/collection-set-overpass-2024.png',
    'collection-sport-field-2024': 'https://wiki.cs.money/images/collections/collection-set-realism-camo.png'
};

try {
    const rawData = fs.readFileSync(casesPath, 'utf8');
    const cases = JSON.parse(rawData);

    let modified = false;

    cases.forEach(c => {
        if (icons[c.id]) {
            console.log(`Updating icon for ${c.name} -> ${icons[c.id]}`);
            c.image = icons[c.id];
            modified = true;
        }
    });

    if (modified) {
        fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
        console.log('Successfully updated collection official icons.');
    } else {
        console.log('No changes needed.');
    }

} catch (error) {
    console.error('Error updating icons:', error);
}
