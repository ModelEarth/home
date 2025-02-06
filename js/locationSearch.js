document.addEventListener('DOMContentLoaded', function () {
  const input = document.getElementById('autocomplete-input');
  const resultsContainer = document.getElementById('autocomplete-results');
  const loading = document.getElementById('loading');

  let items = [];
  let zip = "";
  let country = "";
  const requestsDiv = document.getElementById('requests');

  // Address auto-complete using hereapi.com
  async function fetchLocations(inputValue) {
    if (!inputValue) return;
    loading.style.display = 'block';
    try {
      const response = await fetch(`https://autocomplete.search.hereapi.com/v1/autocomplete?apiKey=14B6Yr62CTa_mKKoYViJQClxjjA32S6pL4Ir2ehCMcY&q=${inputValue}&maxresults=8`);
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

      console.log('Selected item', item);

      // Try fetching lat/lon using a simplified address query
      const searchQuery = `${item.address.city}, ${item.address.state}, ${item.address.postalCode}`; // Simplified query
      console.log(`Searching lat/lon for: ${searchQuery}`);
      
      try {
        const response = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`);
        const data = await response.json();
        if (data.length > 0) {
          const location = data[0];
          console.log(`Latitude: ${location.lat}, Longitude: ${location.lon}`);

          // Display address details with lat/lon
          let addressDetails = '';

          if (item.address.city) addressDetails += `<b>City:</b> ${item.address.city}<br>`;
          if (item.address.countryName) addressDetails += `<b>Country:</b> ${item.address.countryName}<br>`;
          if (item.address.postalCode) addressDetails += `<b>Postal Code:</b> ${item.address.postalCode}<br>`;
          if (item.address.state) addressDetails += `<b>State:</b> ${item.address.state}<br>`;
          if (item.address.label) addressDetails += `<b>Formatted Address:</b> ${item.address.label}<br>`;
          if (location) {
            addressDetails += `<b>Latitude:</b> ${location.lat}<br>`;
            addressDetails += `<b>Longitude:</b> ${location.lon}<br>`;
          }

          requestsDiv.innerHTML = addressDetails;
        } else {
          console.log('No lat/lon found for this address');
          requestsDiv.innerHTML = `
            <b>City:</b> ${item.address.city || 'N/A'}<br>
            <b>Country:</b> ${item.address.countryName || 'N/A'}<br>
            <b>Postal Code:</b> ${item.address.postalCode || 'N/A'}<br>
            <b>State:</b> ${item.address.state || 'N/A'}<br>
            <b>Formatted Address:</b> ${item.address.label || 'N/A'}<br>
            <b>Latitude:</b> Not available<br>
            <b>Longitude:</b> Not available
          `;
        }
      } catch (error) {
        console.error('Error fetching lat/lon:', error);
        requestsDiv.innerHTML = `
          <b>City:</b> ${item.address.city || 'N/A'}<br>
          <b>Country:</b> ${item.address.countryName || 'N/A'}<br>
          <b>Postal Code:</b> ${item.address.postalCode || 'N/A'}<br>
          <b>State:</b> ${item.address.state || 'N/A'}<br>
          <b>Formatted Address:</b> ${item.address.label || 'N/A'}<br>
          <b>Latitude:</b> Error fetching<br>
          <b>Longitude:</b> Error fetching
        `;
      }

      resultsContainer.innerHTML = ''; // Clear the autocomplete suggestions
    });

    resultsContainer.appendChild(li); // Append each list item to results
  });
}




  input.addEventListener('input', function () {
    const value = input.value;
    fetchLocations(value);
  });

  document.getElementById("autocomplete-button").addEventListener("click", function() {
    window.location.href = "/planet/repo/#country=" + country;
  });
});

var globalAddress = "";

function updateGlobalAddress() {
  var inputField = document.getElementById("autocomplete-input");
  globalAddress = inputField.value;
  console.log("Global Address Updated: " + globalAddress);
}
