async function fetchMigrationData(municipalityId, isPositive) {
  const migrationData = { positive: 100, negative: 50 };
  return isPositive ? migrationData.positive : migrationData.negative;
}

function calculateHSLColor(positiveMigration, negativeMigration) {
  const ratio = Math.pow(positiveMigration / negativeMigration, 3);
  const hue = Math.min(ratio * 60, 120);
  return `hsl(${hue}, 75%, 50%)`;
}

function initializeCode() {
  const map = L.map("map").setView([65.0, 25.0], 5);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  fetch(
    "https://geo.stat.fi/geoserver/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=tilastointialueet:kunta4500k&outputFormat=json&srsName=EPSG:4326"
  )
    .then((response) => response.json())
    .then((data) => {
      const geojsonLayer = L.geoJSON(data, {
        style: function (feature) {
          // Get the migration data for the municipality
          const municipalityId = feature.properties.kuntaTunnus;
          const positiveMigration = fetchMigrationData(municipalityId, true);
          const negativeMigration = fetchMigrationData(municipalityId, false);

          // Calculate the HSL color based on the migration data
          const color = calculateHSLColor(positiveMigration, negativeMigration);

          // Return the style object for the municipality
          return {
            weight: 2,
            fillColor: color,
            fillOpacity: 0.7,
            color: "black"
          };
        },
        onEachFeature: function (feature, layer) {
          // Add a tooltip with the name of the municipality
          layer.bindTooltip(feature.properties.nimi, {
            permanent: false,
            direction: "top"
          });

          // Add a popup with migration data when clicking on the municipality
          layer.on("click", async function () {
            const municipalityId = feature.properties.kuntaTunnus;
            const positiveMigration = await fetchMigrationData(
              municipalityId,
              true
            );
            const negativeMigration = await fetchMigrationData(
              municipalityId,
              false
            );

            // Create the popup content
            const popupContent = `
              <b>${feature.properties.nimi}</b><br>
              Positive Migration: ${positiveMigration}<br>
              Negative Migration: ${negativeMigration}
            `;

            // Display the popup on the map
            layer.bindPopup(popupContent).openPopup();
          });
        }
      }).addTo(map);

      // Fit the map to the bounds of the GeoJSON data
      map.fitBounds(geojsonLayer.getBounds());
    })
    .catch((error) => console.error("Error fetching data:", error));
}

// Check if the document is ready and initialize the code
if (document.readyState !== "loading") {
  console.log("Document is ready!");
  initializeCode();
} else {
  document.addEventListener("DOMContentLoaded", function () {
    console.log("Document is ready after waiting!");
    initializeCode();
  });
}
