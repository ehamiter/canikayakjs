document.addEventListener('DOMContentLoaded', (event) => {
    const main = document.getElementById('main');
    const temp = document.getElementById('temp');

    const spinnerText = `
        <div class="spinner-border spinner-border-sm mr-1 text-light" role="status">
            <span class="sr-only">Fetching data from waterservices.usgs.gov...</span>
        </div>
    `;

    main.innerHTML = `<p>${spinnerText} Fetching real-time data from waterservices.usgs.gov...</p>`;
    if (temp) temp.innerHTML = `<p>${spinnerText} Loading temperature data...</p>`;

    const url = 'https://waterservices.usgs.gov/nwis/iv/?format=json&site=03433500&siteStatus=all';

    fetch(url, {
        headers: {
            'Accept-Encoding': 'gzip, deflate',
            'Accept': 'application/json',
            'User-Agent': 'CanIKayak-Web/1.0'
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        const riverInfo = getRiverInfo(data);
        const tempInfo = getTempInfo(data);

        main.innerHTML = riverInfo;
        if (temp) temp.innerHTML = tempInfo;
    })
    .catch(error => {
        console.error('Error fetching river data:', error);
        main.innerHTML = `<p class="lead text-danger">Error loading river conditions. Please try again later.</p>`;
        if (temp) temp.innerHTML = `<p class="lead text-warning">Temperature data unavailable.</p>`;
    });

    const getRiverInfo = (data) => {
        try {
            const timeSeries = data.value.timeSeries;
            if (!timeSeries || timeSeries.length === 0) {
                throw new Error('No time series data available');
            }

            const siteName = timeSeries[0].sourceInfo.siteName
                .split(',')[0]
                .split(' ')
                .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
                .join(' ');

            let discharge = null;
            let gageHeight = null;

            timeSeries.forEach(series => {
                const parameterCode = series.variable.variableCode[0].value;
                const values = series.values[0]?.value;

                if (!values || values.length === 0) return;

                const value = parseFloat(values[0].value);
                if (value === -999999) return;

                switch (parameterCode) {
                    case '00060': // Discharge (ft³/s)
                        discharge = value;
                        break;
                    case '00065': // Gage height (ft)
                        gageHeight = value;
                        break;
                }
            });

            if (discharge === null || gageHeight === null) {
                throw new Error('Required river data not available');
            }

            const dischargeInfo = getDischargeInfo(discharge);
            const gageInfo = getGageInfo(gageHeight);
            const timestamp = timeSeries.find(s => s.variable.variableCode[0].value === '00060')
                ?.values[0]?.value[0]?.dateTime;

            return `
                <h1 class="cover-heading">${siteName}</h1>
                <br />
                <p class="lead">${dischargeInfo} (Discharging at ${discharge} ft&sup3; per second)</p>
                <p class="lead">${gageInfo} (Gage height of ${gageHeight} ft)</p>
            `;
        } catch (error) {
            console.error('Error parsing river info:', error);
            return `<p class="lead text-danger">Unable to parse river conditions data.</p>`;
        }
    };

    const getTempInfo = (data) => {
        try {
            const timeSeries = data.value.timeSeries;

            // Find temperature data (parameter code 00010)
            const tempSeries = timeSeries.find(series =>
                series.variable.variableCode[0].value === '00010'
            );

            if (!tempSeries) {
                return `<p class="lead text-muted">Water temperature data not available for this site.</p>`;
            }

            const values = tempSeries.values[0]?.value;
            if (!values || values.length === 0) {
                return `<p class="lead text-muted">No recent temperature readings available.</p>`;
            }

            let waterTempCelsius = parseFloat(values[0].value);

            if (waterTempCelsius === -999999) {
                return `<p class="lead text-warning">Water temperature unknown; site undergoing maintenance.</p>`;
            }

            // Convert Celsius to Fahrenheit
            const waterTempF = Math.round(((waterTempCelsius * 9 / 5) + 32) * 10) / 10;
            const waterTempInfo = getWaterTempInfo(waterTempF);

            return `<p class="lead">${waterTempInfo} (${waterTempF}° F)</p>`;
        } catch (error) {
            console.error('Error parsing temperature info:', error);
            return `<p class="lead text-warning">Unable to parse temperature data.</p>`;
        }
    };

    // Water temperature interpretation (unchanged from your original)
    function getWaterTempInfo(waterTemp) {
        if (waterTemp <= 32.0) return 'The water is actually ice, so good luck with that.';
        if (waterTemp <= 45.0) return 'The water temperature is freezing cold!';
        if (waterTemp <= 50.0) return 'The water temperature is extremely cold!';
        if (waterTemp <= 55.0) return 'The water temperature is very cold.';
        if (waterTemp <= 60.0) return 'The water temperature is cold.';
        if (waterTemp <= 65.0) return 'The water temperature is just a little bit cold.';
        if (waterTemp <= 70.0) return 'The water temperature is pretty nice, just a touch chilly.';
        if (waterTemp <= 75.0) return 'The water temperature is very nice.';
        if (waterTemp <= 80.0) return 'The water temperature is super comfortable.';
        if (waterTemp <= 85.0) return 'The water temperature is really warm.';
        return 'The water temperature is almost like a hot tub!';
    }

    // Discharge interpretation (unchanged from your original)
    function getDischargeInfo(discharge) {
        if (discharge <= 50) return 'The river is running super duper slow.';
        if (discharge <= 150) return 'The river is running pretty slow today.';
        if (discharge <= 300) return 'The river is running a little slow today.';
        if (discharge <= 800) return 'The river is running great today.';
        if (discharge <= 1100) return 'The river is running fast today.';
        if (discharge <= 2000) return 'The river is running very fast today.';
        if (discharge <= 4000) return 'The river is running extremely fast today. Be careful.';
        return 'The river is probably running too fast to kayak today.';
    }

    // Gage height interpretation (unchanged from your original)
    function getGageInfo(gage) {
        if (gage <= 0.5) return 'It\'s bone dry and not possible to kayak.';
        if (gage <= 1.5) return 'You\'ll have to portage a lot.';
        if (gage <= 1.9) return 'You\'ll probably have to portage some.';
        if (gage <= 2.3) return 'The water level is a little lower than average.';
        if (gage <= 2.8) return 'The water level is right around the average.';
        if (gage <= 3.5) return 'The water level is great, you should be fine.';
        if (gage <= 4.0) return 'The water level is a little high.';
        if (gage <= 4.5) return 'Be careful, the water is higher than normal.';
        if (gage <= 5.0) return 'Water is very high. Might be risky.';
        if (gage <= 6.0) return 'Probably not a good idea to kayak today.';
        return 'The water is too damn high!';
    }
});
