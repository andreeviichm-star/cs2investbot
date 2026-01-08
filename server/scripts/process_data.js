const fs = require('fs');
const path = require('path');

const RAW_PATH = path.join(__dirname, '../data/raw_crates.json');
const OUT_PATH = path.join(__dirname, '../data/cases.json');

try {
    const rawData = fs.readFileSync(RAW_PATH, 'utf-8');
    const crates = JSON.parse(rawData);

    // Filter for Cases only (usually type 'Case')
    // ByMykel API structure might vary, let's inspect first few items if this fails, 
    // but usually it has 'type' field.

    // Filter for cases and collections
    // ByMykel types: "Case", "Collection", etc.
    // We want to exclude "Sticker Capsule", "Graffiti Box", "Pins", etc if user only wants cases/collections.
    // But user asked for "show all collections". "Collection" usually means map collections.

    const validCases = crates.filter(c => {
        if (!c.type) return false;
        const t = c.type.toLowerCase();
        return t.includes('case') || t.includes('collection') || t.includes('souvenir');
    });

    const processed = validCases.map(c => ({
        id: c.id,
        name: c.name,
        type: c.type, // Keep the type
        image: c.image,
        description: c.description,
        items: c.contains ? c.contains.map(item => ({
            name: item.name,
            rarity: item.rarity ? item.rarity.name : 'Common',
            image: item.image
        })) : []
    }));

    console.log(`Processed ${processed.length} items (Cases/Collections).`);
    fs.writeFileSync(OUT_PATH, JSON.stringify(processed, null, 2));

} catch (error) {
    console.error('Error processing data:', error);
}
