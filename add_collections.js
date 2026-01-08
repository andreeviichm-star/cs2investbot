const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, 'server/data/cases.json');

const newCollections = [
    {
        "id": "collection-graphic-design-2024",
        "name": "The Graphic Design Collection",
        "type": "Collection",
        "image": "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsUFJ5KBFZv668FFU4naamJwwQuN_jx4ywk6T1MO-ClDJS7cEk3rnF9InxjVWxqRVqm-fJ9tT00Azg_0Q6Ym76d9OLMlhoN1lXQv4/360fx360f",
        "description": "Introduced in The Armory Update (October 2024)",
        "items": [
            { "name": "AWP | CMYK", "rarity": "Covert" },
            { "name": "Desert Eagle | Starcade", "rarity": "Classified" },
            { "name": "AUG | Lil' Pig", "rarity": "Classified" },
            { "name": "P90 | Attack Vector", "rarity": "Restricted" },
            { "name": "M4A4 | Polysoup", "rarity": "Restricted" },
            { "name": "CZ75-Auto | Slalom", "rarity": "Restricted" },
            { "name": "XM1014 | Halftone Shift", "rarity": "Mil-Spec Grade" },
            { "name": "SG 553 | Berry Gel Coat", "rarity": "Mil-Spec Grade" },
            { "name": "SCAR-20 | Wild Berry", "rarity": "Mil-Spec Grade" },
            { "name": "AK-47 | Crossfade", "rarity": "Mil-Spec Grade" },
            { "name": "SSG 08 | Halftone Whorl", "rarity": "Industrial Grade" },
            { "name": "P2000 | Coral Halftone", "rarity": "Industrial Grade" },
            { "name": "MP7 | Astrolabe", "rarity": "Industrial Grade" },
            { "name": "M249 | Spectrogram", "rarity": "Industrial Grade" },
            { "name": "Galil AR | NV", "rarity": "Industrial Grade" },
            { "name": "FAMAS | Halftone Wash", "rarity": "Industrial Grade" }
        ]
    },
    {
        "id": "collection-sport-field-2024",
        "name": "The Sport and Field Collection",
        "type": "Collection",
        "image": "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsUFJ5KBFZv668FFU4naa0OAg17d-yx4ywk6T1MO-ClDJS7cEk3rnF9InxjVWxqRVqm-fJ9tT00Azg_0Q6Ym76d9OLMlhoN1lXQv4/360fx360f",
        "description": "Introduced in The Armory Update (October 2024)",
        "items": [
            { "name": "M4A1-S | Fade", "rarity": "Covert" },
            { "name": "Glock-18 | AXIA", "rarity": "Classified" },
            { "name": "Galil AR | Rainbow Spoon", "rarity": "Classified" },
            { "name": "UMP-45 | Crimson Foil", "rarity": "Restricted" },
            { "name": "MP9 | Arctic Tri-Tone", "rarity": "Restricted" },
            { "name": "Five-SeveN | Heat Treated", "rarity": "Restricted" },
            { "name": "USP-S | Alpine Camo", "rarity": "Mil-Spec Grade" },
            { "name": "SSG 08 | Zeno", "rarity": "Mil-Spec Grade" },
            { "name": "Nova | Yorkshire", "rarity": "Mil-Spec Grade" },
            { "name": "P250 | Small Game", "rarity": "Mil-Spec Grade" },
            { "name": "AK-47 | Olive Polycam", "rarity": "Industrial Grade" },
            { "name": "FAMAS | Half Sleeve", "rarity": "Industrial Grade" },
            { "name": "PP-Bizon | Cold Cell", "rarity": "Industrial Grade" },
            { "name": "Tec-9 | Tiger Stencil", "rarity": "Industrial Grade" },
            { "name": "MAG-7 | Wildwood", "rarity": "Industrial Grade" },
            { "name": "MP5-SD | Savannah Halftone", "rarity": "Industrial Grade" }
        ]
    },
    {
        "id": "collection-overpass-2024",
        "name": "The Overpass 2024 Collection",
        "type": "Collection",
        "image": "https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXU5A1PIYQNqhpOSV-fRPasw8rsUFJ5KBFZv668FFU4naa0OAg17d-yx4ywk6T1MO-ClDJS7cEk3rnF9InxjVWxqRVqm-fJ9tT00Azg_0Q6Ym76d9OLMlhoN1lXQv4/360fx360f",
        "description": "Introduced in The Armory Update (October 2024)",
        "items": [
            { "name": "AK-47 | B the Monster", "rarity": "Covert" },
            { "name": "AWP | Crakow!", "rarity": "Classified" },
            { "name": "Zeus x27 | Dragon Snore", "rarity": "Classified" },
            { "name": "AUG | Eye of Zapems", "rarity": "Restricted" },
            { "name": "Dual Berettas | Sweet Little Angels", "rarity": "Restricted" },
            { "name": "XM1014 | Monster Melt", "rarity": "Restricted" },
            { "name": "Galil AR | Metallic Squeezer", "rarity": "Mil-Spec Grade" },
            { "name": "Glock-18 | Teal Graf", "rarity": "Mil-Spec Grade" },
            { "name": "MAC-10 | Pipsqueak", "rarity": "Mil-Spec Grade" },
            { "name": "Nova | Wurst Hölle", "rarity": "Mil-Spec Grade" },
            { "name": "Desert Eagle | Tilted", "rarity": "Industrial Grade" },
            { "name": "Five-SeveN | Midnight Paintover", "rarity": "Industrial Grade" },
            { "name": "M4A1-S | Wash me plz", "rarity": "Industrial Grade" },
            { "name": "MP5-SD | Neon Squeezer", "rarity": "Industrial Grade" },
            { "name": "Negev | Wall Bang", "rarity": "Industrial Grade" },
            { "name": "P90 | Wash me", "rarity": "Industrial Grade" }
        ]
    }
];

// Helper to guess image URLs (using a placeholder for now as I don't have the hashes)
// The frontend will try to load them via item.image if present, else fallback.
// Since I don't have item images, I'll leave item.image undefined.
// But the frontend now prioritizes item.image.
// "const iconUrl = item.image || ..."
// So if I assume the frontend will fallback to search if item.image is missing?
// NO, my previous change made it:
// const iconUrl = item.image || (fetched?.asset_description?.icon_url ? ... : null);
// So if I don't provide item.image, it will use the fetched one from price check!
// Perfect. I should NOT provide item.image for these new items, so the frontend fetches them.
// Wait, the frontend logic:
// const iconUrl = item.image || (fetched?.asset_description?.icon_url ? `https://community.cloudflare.steamstatic.com/economy/image/${fetched.asset_description.icon_url}/360fx360f` : null);
// Yes. If I leave item.image undefined in json, it falls back to 'fetched'.
// Fetch happens via `searchItems(item.name)` which goes to `fetchSteamPrice` which might find it?
// Wait, `searchItems` calls `/api/search` which calls steam search.
// If steam search works for these items, we get the icon.
// Yes, that should work.

try {
    let cases = JSON.parse(fs.readFileSync(casesPath, 'utf8'));

    // Check if they already exist
    const ids = new Set(cases.map(c => c.id));
    let count = 0;

    newCollections.forEach(col => {
        if (!ids.has(col.id)) {
            // Unshift to put them at the top (newest first)
            cases.unshift(col);
            count++;
        }
    });

    fs.writeFileSync(casesPath, JSON.stringify(cases, null, 2));
    console.log(`Added ${count} new collections.`);
} catch (error) {
    console.error('Error updating cases:', error);
}
