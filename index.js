import { cryptoData } from "./api_data.js"
import { cryptoHistory } from "./history.js";

const allCryptoList = document.querySelector('#all-crypto-list')
const navLinks = document.querySelectorAll('.nav-link')
const ctx = document.getElementById('myChart');
console.log(ctx)

const navigatePageViews = (e) => {
  console.log('navigatePageViews')
  const activeLink = e.target.id.split('-')[2]
  const allViewIds = ['scanner', 'research', 'transact']
  allViewIds.forEach(id => document.getElementById(`${id}`).style.display = 'none')
  document.getElementById(`${activeLink}`).style.display = 'block'
  navLinks.forEach(link => link.classList.remove('active'))
}

const handleError = (error) => {
  console.log(error)
  alert('Something wen wrong during fetch!')
}

const getCryptoDataFromAPI = () => {
  fetch('https://api.coincap.io/v2/assets')
    .then(res => res.json())
    .then(handleFetchSuccess)
    .catch(handleError)
}

const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

const last24HrFormatter = (crypto) => {
  if(crypto.changePercent24Hr.slice(0,1) === '-'){
    return `${crypto.changePercent24Hr.slice(0,5)}`
  }else{
    return`+${crypto.changePercent24Hr.slice(0,4)}`
  }
}

const handleFetchSuccess = (cryptoObject) => {
  cryptoObject.data.forEach(renderCryptoCard)
}

const renderCryptoCard = (crypto) => {  
  const cardDiv = document.createElement('div')
  cardDiv.classList.add('crypto-card', 'mb-3')
  cardDiv.innerHTML = `
  <div class="icon">
        <img width="50px" alt="${crypto.id}" src="./64/${crypto.id}.png" />
    </div>
    <div class="details">
      <div class="title">${crypto.name}</div>
      <div class="info">
        <div class="icon-text"><i class="bi bi-clock px-2"></i> 24h Change: ${last24HrFormatter(crypto)}%</div>
    </div>
    </div>
    <div class="d-flex w-100 justify-content-between align-items-center px-3 py-2">
    <div class="price-container px-3">
      <div class="icon-text">Price: ${priceFormatter.format(crypto.priceUsd)}</div>
    </div>
    <div class="px-3">
      <button type="button" class="btn btn-secondary text-nowrap"><i class="bi bi-graph-down"></i> Research</button>
    </div>
    <div class="px-3">
      <button type="button" class="btn btn-primary text-nowrap"><i class="bi bi-currency-bitcoin"></i> Buy / Sell</button>
    </div>
  </div>`
  allCryptoList.appendChild(cardDiv)
  
}

const fetchCryptoHistory = (cryptoId, interval) => {
  // Get the start of the year
const startOfYear = new Date(new Date().getFullYear(), 4, 1).getTime();
// Get the current time
const currentTime = Date.now();
// Construct the query URL
const baseUrl = 'https://api.coincap.io/v2/assets/bitcoin/history';
//const interval = 'd1'; // daily interval
const query = `?interval=${interval}&start=${startOfYear}&end=${currentTime}`;
const endpoint = `${baseUrl}${query}`;

  fetch(endpoint)
    .then(res => res.json())
    .then(console.log)
    .catch(handleError)
}

// fetchCryptoHistory('bitcoin', 'd1')

const chartPriceData = []
const chartLabels = []

const constructChartData = (priceHistory) => {
  priceHistory.data.forEach(interval => {
    // console.log(interval.priceUsd)
    chartPriceData.push(interval.priceUsd)
    chartLabels.push(interval.date.slice(0,10))
  })
  console.log(chartPriceData)

  new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [{
        label: 'Crypt Price',
        data: chartPriceData,
        borderWidth: 1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: false
        }
      }
    }
  });
}

constructChartData(cryptoHistory)

const initApp = () => {
  handleFetchSuccess(cryptoData)
  // getCryptoDataFromAPI()
  navLinks.forEach(link => link.addEventListener('click', navigatePageViews))
}

initApp()
