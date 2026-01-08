const fs = require('fs');
const path = require('path');

const casesPath = path.join(__dirname, 'server/data/cases.json');

try {
    const rawData = fs.readFileSync(casesPath, 'utf8');
    const cases = JSON.parse(rawData);

    const initialCount = cases.length;

    // Filter out Souvenir packages
    // Check type "Souvenir" or name containing "Souvenir"
    const filteredCases = cases.filter(c => {
        const isSouvenirType = c.type === 'Souvenir';
        const isSouvenirName = c.name.toLowerCase().includes('souvenir');
        return !isSouvenirType && !isSouvenirName;
    });

    const finalCount = filteredCases.length;
    const removedCount = initialCount - finalCount;

    fs.writeFileSync(casesPath, JSON.stringify(filteredCases, null, 2));

    console.log(`Successfully removed ${removedCount} souvenir packages.`);
    console.log(`Remaining items: ${finalCount}`);

} catch (error) {
    console.error('Error removing souvenirs:', error);
}
