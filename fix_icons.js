const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, 'server/data/cases.json');

try {
    const rawData = fs.readFileSync(casesPath, 'utf8');
    const cases = JSON.parse(rawData);
    let modified = false;

    // Map of Collection ID -> New Icon URL (using the Covert skin as the icon)
    // These URLs are from the populated items in cases.json (I assume they are populated now)
    // Actually, I can just find the Covert item in the collection and use its image!

    cases.forEach(c => {
        if (c.id === 'collection-graphic-design-2024') {
            const covert = c.items.find(i => i.rarity === 'Covert');
            if (covert && covert.image) {
                console.log(`Updating Graphic Design icon to ${covert.name}`);
                c.image = covert.image;
                modified = true;
            }
        }
        if (c.id === 'collection-sport-field-2024') {
            const covert = c.items.find(i => i.rarity === 'Covert');
            if (covert && covert.image) {
                console.log(`Updating Sport & Field icon to ${covert.name}`);
                c.image = covert.image;
                modified = true;
            }
        }
        if (c.id === 'collection-overpass-2024') {
            const covert = c.items.find(i => i.rarity === 'Covert');
            if (covert && covert.image) {
                console.log(`Updating Overpass 2024 icon to ${covert.name}`);
                c.image = covert.image;
                modified = true;
            }
        }
    });

    if (modified) {
        fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
        console.log('Successfully updated collection icons.');
    } else {
        console.log('No changes made (maybe covert items have no images yet?).');
    }

} catch (error) {
    console.error('Error updating icons:', error);
}
