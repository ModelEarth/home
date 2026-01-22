document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('autocomplete-input');
  const resultsContainer = document.getElementById('autocomplete-results');
  const loading = document.getElementById('loading');
  const autocompleteContainer = document.querySelector('.autocomplete-container');

  let items = [];
  let zip = "";
  let country = "";
  let addressLabel = "";

  const requestsDiv = document.getElementById('requests');

  // Hide placeholder when clicking anywhere on the autocomplete container
  if (autocompleteContainer) {
    autocompleteContainer.addEventListener('click', function () {
      input.setAttribute('placeholder', '');
    });
  }

  // Address auto-complete using hereapi.com
  async function fetchLocations(inputValue) {
    if (!inputValue) return;
    loading.style.display = 'block';
    try {
      const response = await fetch(`https://autocomplete.search.hereapi.com/v1/autocomplete?apiKey=fqe1Boy0RrwDPIXwzutkFL5Ljo0QJJT6Xb-KoehiUe0&q=${inputValue}&maxresults=8`);
      const data = await response.json();
      console.log('data.items line 17', data.items)
      items = data.items.map(item => ({
        id: item.id,
        title: item.title,
        address: {
          label: item.address.label,
          city: item.address.city,
          countryName: item.address.countryName,
          postalCode: item.address.postalCode,
          state: item.address.state,
          stateCode: item.address.stateCode
        },
        zip: item.address.postalCode || 'No ZIP Code',
        country: item.address.countryName || 'No Country Name'
      }));
      loading.style.display = 'none';
      renderResults();
    } catch (error) {
      console.error('Error fetching data:', error);
      loading.style.display = 'none';
      items = [];
      renderResults();
    }
  }


function renderResults() {
  resultsContainer.innerHTML = '';
  items.forEach((item) => {
    const li = document.createElement('li');
    li.textContent = item.title;
    li.className = 'autocomplete-item';

    li.addEventListener('click', async () => {
      input.value = item.title;
      globalAddress = item.address;
      zip = item.zip || "";  // Capture the zip code
      country = item.country || ""; // Capture country name
      addressLabel = ""; // Reset addressLabel for new selection

      console.log('Selected item', item);

      // Try fetching lat/lon using a simplified address query
      const searchQuery = `${item.address.city}, ${item.address.state}, ${item.address.postalCode}`; // Simplified query
      console.log(`Searching lat/lon for: ${searchQuery}`);
      
      const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
      const data = await response.json();
      let addressDetails = '';
      if (item.address.city) addressDetails += `<b>City:</b> ${item.address.city}<br>`;
      if (item.address.countryName) addressDetails += `<b>Country:</b> ${item.address.countryName}<br>`;
      if (item.address.postalCode) addressDetails += `<b>Postal Code:</b> ${item.address.postalCode}<br>`;
      if (item.address.state) addressDetails += `<b>State:</b> ${item.address.state}<br>`;
      if (item.address.label != item.address.countryName) {
        if (item.address.label) addressDetails += `<b>Formatted Address:</b> ${item.address.label}<br>`;
        addressLabel = item.address.label;
      }

      // Check for lat/lon and add to address details if found
      let latitude = null;
      let longitude = null;
      if (data.length > 0) {
        const location = data[0];
        latitude = parseFloat(location.lat);
        longitude = parseFloat(location.lon);
        console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);
        addressDetails += `<b>Latitude:</b> ${latitude}<br>`;
        addressDetails += `<b>Longitude:</b> ${longitude}<br>`;
      } else {
        console.log('No lat/lon found for this address.');
      }

      // Generate MCP (Model Context Protocol) output - always generate even without coordinates
      const mcpData = {
        context_type: "location",
        location: {
          name: item.title,
          formatted_address: addressLabel || item.address.label,
          components: {
            city: item.address.city || null,
            state: item.address.state || null,
            state_code: item.address.stateCode || null,
            postal_code: item.address.postalCode || null,
            country: item.address.countryName || null
          },
          coordinates: {
            latitude: latitude,
            longitude: longitude
          }
        },
        timestamp: new Date().toISOString(),
        source: "hereapi.com + openstreetmap.org"
      };

      // Store MCP data for copy button
      const mcpJsonString = JSON.stringify(mcpData, null, 2);

      // Display MCP output
      addressDetails += `<br><b>Model Context Protocol (MCP):</b><br>`;
      addressDetails += `<pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${mcpJsonString}</pre>`;

      // Create simple location string for AI chat interfaces
      const locationParts = [];
      if (item.address.countryName) locationParts.push(item.address.countryName);
      if (item.address.postalCode) locationParts.push(item.address.postalCode);
      if (item.address.city) locationParts.push(item.address.city);
      else if (item.address.state) locationParts.push(item.address.state);
      const simpleLocation = locationParts.join(', ');
      const aiPrompt = encodeURIComponent(simpleLocation || item.title);

      // Add links to AI chat interfaces
      addressDetails += `<br><b>Send to AI:</b><br>`;
      addressDetails += `<div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px;">`;
      addressDetails += `<a href="https://claude.ai/new?q=${aiPrompt}" target="_blank" style="padding: 6px 12px; background-color: #6366f1; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">Claude</a>`;
      addressDetails += `<a href="https://chatgpt.com/?q=${aiPrompt}" target="_blank" style="padding: 6px 12px; background-color: #10a37f; color: white; text-decoration: none; border-radius: 4px; font-size: 14px;">ChatGPT</a>`;
      addressDetails += `<button onclick="copyMcpToClipboard()" data-mcp='${mcpJsonString.replace(/'/g, "&apos;")}' id="copyMcpButton" style="padding: 6px 12px; background-color: #64748b; color: white; border: none; border-radius: 4px; font-size: 14px; cursor: pointer;">Copy MCP</button>`;
      addressDetails += `</div>`;

      requestsDiv.innerHTML = addressDetails;

      resultsContainer.innerHTML = ''; // Clear the autocomplete suggestions
    });

    resultsContainer.appendChild(li); // Append each list item to results
  });
}

  input.addEventListener('input', function () {
    const value = input.value;
    // Clear previous MCP output when search changes
    requestsDiv.innerHTML = '';
    fetchLocations(value);
  });

  document.getElementById("autocomplete-button").addEventListener("click", function() {
    let promptForURL = addressLabel;
    if (!promptForURL) {
      promptForURL = country;
    }
    window.location.href = "https://chatgpt.com/?prompt=" + promptForURL;
  });
});

var globalAddress = "";

function updateGlobalAddress() {
  var inputField = document.getElementById("autocomplete-input");
  globalAddress = inputField.value;
  console.log("Global Address Updated: " + globalAddress);
}

function copyMcpToClipboard() {
  const button = document.getElementById('copyMcpButton');
  const mcpData = button.getAttribute('data-mcp');
  navigator.clipboard.writeText(mcpData).then(() => {
    const originalText = button.textContent;
    button.textContent = 'Copied!';
    setTimeout(() => {
      button.textContent = originalText;
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy:', err);
    alert('Failed to copy to clipboard');
  });
}
