import { cryptoData } from "./api_data.js"
import { cryptoHistory } from "./history.js";

const allCryptoList = document.querySelector('#all-crypto-list')
const navLinks = document.querySelectorAll('.nav-link')
const ctx = document.getElementById('myChart');
const addFundsBtn = document.querySelector('#add-funds-button')
const searchCryptoBtn = document.querySelector('#search-crypto-button')
const buyBtn = document.querySelector('#buy-crypto-button')
const buyInputField = document.querySelector('#crypto-buy-input')
let chartInstance

let globalWallet = {}
let globalSearchResult
let globalTransactions

const navigatePageViews = (e) => {
  const activeLink = e.target.parentElement.id.split('-')[2]
  const allViewIds = ['scanner', 'chart', 'wallet']
  allViewIds.forEach(id => document.getElementById(`${id}`).style.display = 'none')
  document.getElementById(`${activeLink}`).style.display = 'block'
  navLinks.forEach(link => link.classList.remove('active'))
}

const handleError = (error) => {
  console.log(error)
  alert('Something went wrong while trying to retrieve data!')
}

const getCryptoDataFromAPI = () => {
  fetch('https://api.coincap.io/v2/assets')
    .then(res => res.json())
    .then(handleFetchSuccess)
    .catch(handleError)
}

const getWalletInfo = () => {
  fetch('http://localhost:3000/wallet')
    .then(res => res.json())
    .then(renderWalletBalance)
    .catch(handleError)
}

const getTransactions = () => {
  fetch('http://localhost:3001/transactions')
    .then(res => res.json())
    .then(handleGetTransactionsSuccess)
    .catch(handleError)
}

const handleGetTransactionsSuccess = (transactionsArray) => {
  globalTransactions = transactionsArray
  //Just like green grocer we need a globalHoldings object
  //It will hold each crypto and the value of it today
}

const renderTable = (transaction) => {

}

const handleFundsSubmit = () => {
  let fundsAmount = parseInt(document.querySelector('#funds-input').value)
  fundsAmount += globalWallet.amount
  isNaN(fundsAmount) ? alert('Please enter a valid amount') : patchFundsToWallet(fundsAmount)
}

const handleSearchCrypto = () => {
  const tokenName = document.querySelector('#crypto-search-input').value.toLowerCase()
  tokenName === '' ? alert('Please enter a valid crypto currency') : getCryptoPricing(tokenName)
}

const handleBuyInputChange = (e) => {
  const buyAmount = e.target.value
  let tokensToBuy
  if(globalSearchResult){
    // console.log(globalSearchResult)
    tokensToBuy = (buyAmount / globalSearchResult.priceUsd)
    const tokensAmount = document.querySelector('#tokens-amount')
    tokensAmount.textContent = 
      `Tokens to buy: ${tokensToBuy}`
  }
}

const handleBuyCrypto = () => {
  const buyInfo = {
    buyAmount: parseInt(document.querySelector('#crypto-buy-input').value),
    tokensAmount: parseFloat(document.querySelector('#tokens-amount').textContent.split(' ')[3]),
    currentPrice: parseFloat(globalSearchResult.priceUsd),
    todaysDate: getCurrentDateFormatted(),
    crypto: globalSearchResult.id
  }
  buyInfo.buyValue = buyInfo.tokensAmount * buyInfo.currentPrice
  if(buyInfo.buyAmount <= globalWallet.amount){
    // console.log('You have enough to buy')
    if(!globalSearchResult){
      alert('You need to first search a crypto currency')
    }else{
      postBuyTransaction(buyInfo)
    }
  }else if(isNaN(buyInfo.buyAmount)){
    alert('Please enter a valid number')
  }
  else{
    alert(`You're poor! Get some more funds!`)
  }
}

const postBuyTransaction = (buyInfo) => {
  fetch('http://localhost:3001/transactions',{
  method: "POST",
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify(buyInfo)
  })
    .then(res => res.json())
    .then(handleBuySuccess)
    .catch(handleError)
}

const handleBuySuccess = () => {
  document.querySelector('#crypto-search-input').value = ''
  document.querySelector('#crypto-buy-input').value = ''
  document.querySelector('#search-result').textContent = '-'
  document.querySelector('#tokens-amount').textContent = 'Order submitted successfully!'
}

const getCurrentDateFormatted= () => {
  const date = new Date();
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const year = date.getFullYear()
  const formattedDate = `${month}/${day}/${year}`
  return formattedDate
}

const getCryptoPricing = (tokenName) => {
  fetch(`https://api.coincap.io/v2/assets/${tokenName}`)
    .then(res => res.json())
    .then(renderSearchResult)
    .catch(handleError)
}

const renderSearchResult = (cryptoData) => {
  // console.log(cryptoData)
  const searchResult = document.querySelector('#search-result')
  searchResult.textContent = ''
  if(cryptoData.error){
    searchResult.textContent = cryptoData.error
  }else{
    searchResult.textContent = `Current Price: ${usdFormatter.format(cryptoData.data.priceUsd)} - ${cryptoData.data.symbol}`
    globalSearchResult = cryptoData.data
  }
}

const patchFundsToWallet = (fundsAmount) => {
  fetch('http://localhost:3000/wallet/balance',{
  method: "PATCH",
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({amount: fundsAmount})
  })
    .then(res => res.json())
    .then(data => renderWalletBalance([data]))
    .catch(handleError)
  document.querySelector('#funds-input').value = ''
}

const usdFormatter = new Intl.NumberFormat('en-US', {
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

const handleFetchSuccess = (cryptoObject) => cryptoObject.data.forEach(renderCryptoCard)

const renderWalletBalance = (walletInfo) => {
  globalWallet = walletInfo[0]
  const walletElem = document.querySelector('#wallet-balance')
  const balanceUsd = usdFormatter.format(walletInfo[0].amount)
  walletElem.textContent = balanceUsd
  // console.log('Global wallet after re-render:',globalWallet)
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
      <div class="icon-text">Current Price: ${usdFormatter.format(crypto.priceUsd)}</div>
    </div>
    <div class="px-3">
      <button type="button" id="chart-${crypto.id}" data-name="${crypto.name}" 
        data-icon="./64/${crypto.id}.png" data-ticker="${crypto.id}" class="btn btn-secondary text-nowrap">
        Chart
      </button>
    </div>
    <div class="px-3">
      <button type="button" class="btn btn-primary text-nowrap"><i class="bi bi-currency-bitcoin"></i> Buy / Sell</button>
    </div>
  </div>`
  allCryptoList.appendChild(cardDiv)
  document.getElementById(`chart-${crypto.id}`).addEventListener('click', chartSelectedCrypto)
}

const chartSelectedCrypto = (e) => {
  const cryptoData = {...e.target.dataset}
  navigateToChart(cryptoData)
}

const navigateToChart = (cryptoToChart) => {
  document.querySelector('#nav-link-chart').childNodes[0].click()
  // console.log(document.querySelector('#nav-link-chart').childNodes[0])
  const chartInfo = document.querySelector('#chart-info')
  chartInfo.innerHTML =`
    <div class="d-flex">
        <img width="50px" alt="${cryptoToChart.name}" src="${cryptoToChart.icon}" />
    <h1 class="px-3">${cryptoToChart.name}</h1>
    </div>
    `
  fetchCryptoHistory(cryptoToChart.ticker, 'd1', cryptoToChart.name)
}

const fetchCryptoHistory = (cryptoId, interval, cryptoName) => {
  // Get the start of the year
const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
// Get the current time
const currentTime = Date.now();
// Construct the query URL
const baseUrl = `https://api.coincap.io/v2/assets/${cryptoId}/history`
//const interval = 'd1'; // daily interval
const query = `?interval=${interval}&start=${startOfYear}&end=${currentTime}`;
const endpoint = `${baseUrl}${query}`;

  fetch(endpoint)
    .then(res => res.json())
    .then(data => renderChart(data, cryptoName))
    .catch(handleError)
}

const renderChart = (priceHistory, cryptoName) => {
  constructChartData(priceHistory, cryptoName)
}

const constructChartData = (priceHistory, cryptoName) => {
  const chartPriceData = []
  const chartLabels = []
  priceHistory.data.forEach(interval => {
    chartPriceData.push(interval.priceUsd)
    chartLabels.push(interval.date.slice(0,10))
  })
  if(chartInstance){
    chartInstance.destroy()
  }
  chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: chartLabels,
      datasets: [{
        label: `${cryptoName} YTD`,
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

const initApp = () => {
  handleFetchSuccess(cryptoData)
  getWalletInfo()
  getTransactions()
  // getCryptoDataFromAPI()
  navLinks.forEach(link => link.addEventListener('click', navigatePageViews))
  addFundsBtn.addEventListener('click', handleFundsSubmit)
  searchCryptoBtn.addEventListener('click', handleSearchCrypto)
  buyBtn.addEventListener('click', handleBuyCrypto)
  buyInputField.addEventListener('input', handleBuyInputChange)
}

initApp()
