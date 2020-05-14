/* 
* You can look up Site Numbers at the USGS here:
* https://waterdata.usgs.gov/nwis/inventory
* Keep in mind it has to have gage and discharge data,
* and even then, it still may not parse correctly. 
*/
const site = '03433500';  // Harpeth River at Bellevue, Tn

const main = document.getElementById('main');
main.innerHTML = '<p>Loading...</p>';

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const url = `https://waterservices.usgs.gov/nwis/dv/?format=json&sites=${site}&parameterCd=00060,00065`;

fetch(url)
  .then((response) => response.json())
  .then((data) => main.innerHTML = getRiverInfo(data));

const getRiverInfo = (data) => {
  const siteName = data['value']['timeSeries'][0]['sourceInfo']['siteName'].split(' ')
    .map(w => w[0].toUpperCase() + w.substr(1).toLowerCase())
    .join(' ');
  const discharge = data['value']['timeSeries'][0]['values'][0]['value'][0]['value'];
  const gage = data['value']['timeSeries'][1]['values'][0]['value'][0]['value'];
  const dischargeInfo = getDischargeInfo(discharge);
  const gageInfo = getGageInfo(gage);

  const info = `
    <h1 class="cover-heading">${siteName}</h1>
    <br />
    <p class="lead">${dischargeInfo} (Discharging at ${discharge} ft&sup3; per second)</p>
    <p class="lead">${gageInfo} (Gage height of ${gage} ft)</p>
  `;
  return `${info}`;
};

function getDischargeInfo(discharge) {
    let result = null;
    if (discharge < 50) {
        result = 'The river is running super duper slow.';
    }
    if (50 < discharge && discharge < 150) {
        result = 'The river is running pretty slow today.';
    }
    if (150 < discharge  && discharge  < 300) {
        result = 'The river is running a little slow today.';
    }
    if (300 < discharge  && discharge  < 800) {
        result = 'The river is running great today.';
    }
    if (800 < discharge  && discharge  < 1100) {
        result = 'The river is running fast today.';
    }
    if (1100 < discharge  && discharge  < 2000) {
        result = 'The river is running very fast today.';
    }
    if (2000 < discharge  && discharge  < 4000) {
        result = 'The river is running extremely fast today. Be careful.';
    }
    if (discharge  > 4000) {
        result = 'The river is probably running too fast to kayak today.';
    }
    return result    
}

function getGageInfo(gage) {
    let result = null;
    if (gage < 1.5) {
        result ='It\'s bone dry and not possible to kayak.';
    }
    if (1.5 < gage && gage < 1.9) {
        result = 'You\'ll probaby have to portage some.';
    }
    if (1.9 < gage && gage < 2.3) {
        result = 'The water level is a little lower than average.';
    }
    if (2.3 < gage && gage < 2.8) {
        result = 'The water level is right around the average.';
    }
    if (2.8 < gage && gage < 3.5) {
        result = 'The water level is great, you should be fine.';
    }
    if (3.5 < gage && gage < 4.0) {
        result = 'The water level is a little high.';
    }
    if (4.0 < gage && gage < 4.5) {
        result = 'Be careful, the water is higher than normal.';
    }
    if (4.5 < gage && gage < 5.0) {
        result = 'Water is very high. Might be risky.';
    }
    if (5.0 < gage && gage < 6.0) {
        result = 'Probably not a good idea to kayak today.';
    }
    if (gage > 6.0) {
        result = 'The water is too damn high!';
    }
    return result
}
