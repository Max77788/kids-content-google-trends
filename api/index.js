const express = require('express');
const { ExploreTrendRequest, SearchProviders } = require('g-trends');


// Calculate averages
function calculateAverages(data) {
  const columnCount = data[0].length; // Number of columns (including the first column with dates)
  const totals = new Array(columnCount - 1).fill(0); // Initialize totals array (excluding first column)

  data.forEach(row => {
    for (let col = 1; col < columnCount; col++) {
      totals[col - 1] += Number(row[col]) || 0; // Accumulate values as numbers
    }
  });

  // Calculate averages
  return totals.map(total => Math.round(total / data.length));
}


const app = express();

// Middleware to parse JSON body
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello, World!');
});

// Endpoint to fetch trends
app.post('/api/trends', async (req, res) => {
    const { keywords } = req.body;

    console.log('[*] Fetching trend data for keywords:', keywords);

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
        return res.status(400).json({ error: 'Please provide a list of keywords in the "keywords" field.' });
    }

    try {
        const explorer = new ExploreTrendRequest();

        // Configure the request for the past 14 days
        explorer.past30Days();
        keywords.forEach(keyword => explorer.addKeyword(keyword));

        // Use YouTube as the search provider
        explorer.searchProvider(SearchProviders.YouTube);

        // Fetch CSV data
        let csvDataInitital = await explorer.download();

        // Get the last 14 elements of CSV data
        const csvData = csvDataInitital.slice(-14);

        console.log('[*] Fetched trend data:', csvData)

        const averages = calculateAverages(csvData);
        console.log('Column Averages:', averages);

        const dictionary = keywords.reduce((acc, key, index) => {
          acc[key] = averages[index];
          return acc;
        }, {});

        // Sort the keys based on their corresponding values in descending order
        const sortedKeys = Object.keys(dictionary).sort((a, b) => dictionary[b] - dictionary[a]);

        console.log('Sorted Keys:', sortedKeys);

        result = {
          averages: dictionary,
          sortedKeywords: sortedKeys
        };

        res.json(result);
    } catch (error) {
        console.error('[!] Error fetching trend data:', error);
        res.status(500).json({ error: 'Failed to fetch trend data.' });
    }
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

module.exports = app;
