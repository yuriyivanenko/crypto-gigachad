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
let globalScan
let globalTransactions

const navigatePageViews = (e) => {
  console.log(e.target)
  console.log(e.target.parentElement.id)

  const activeLink = e.target.parentElement.id.split('-')[2]
  const allViewIds = ['scanner', 'chart', 'wallet']
  
  allViewIds.forEach(id => document.getElementById(`${id}`).style.display = 'none')
  document.getElementById(`${activeLink}`).style.display = 'block'
  //navLinks.forEach(link => link.classList.remove('active'))
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
  globalTransactions = transactionsArray//Might not need this
  const holdingsObject = {}
  transactionsArray.forEach(transaction => {
    if(holdingsObject.hasOwnProperty(transaction.crypto)){
      const ourSpecificCryptosMarketPrice = globalScan.find(crypto => crypto.id === transaction.crypto).priceUsd
      holdingsObject[transaction.crypto].tokens += transaction.tokensAmount
      const currentTokensValue = ourSpecificCryptosMarketPrice * transaction.tokensAmount
      // console.log(currentTokensValue)
      holdingsObject[transaction.crypto].marketValue += currentTokensValue 
    }else{
      holdingsObject[transaction.crypto] = {
        tokens: transaction.tokensAmount,
        marketValue: transaction.buyAmount
      }
    }
  })
  renderTable(holdingsObject)
}

const renderTable = (holdingsObject) => {
  for(const holding in holdingsObject){
    // console.log(holdingsObject[holding])
    const tr = document.createElement('tr')
    const value = usdFormatter.format(holdingsObject[holding].marketValue)
    const currentPrice = usdFormatter.format(globalScan.find(item => item.id === holding).priceUsd)
    // console.log(currentPrice)
    const nameOfHolding = holding.charAt(0).toUpperCase() + holding.slice(1)
    tr.innerHTML = `
      <td>${nameOfHolding}</td>
      <td>${holdingsObject[holding].tokens}</td>
      <td>${currentPrice}</td>
      <td>${value}</td>
      `
    document.querySelector('#holdings-table tbody').appendChild(tr)
  }
}

const handleUpdateWallet = (updateType) => {
  let fundsAmount = parseInt(document.querySelector('#funds-input').value)
  let buyAmount = parseFloat(document.querySelector('#crypto-buy-input').value)
  let updateWalletToThisAmount
  if(updateType === 'add'){
    updateWalletToThisAmount = fundsAmount + globalWallet.amount
    isNaN(fundsAmount) ? alert('Please enter a valid amount') : patchFundsToWallet(updateWalletToThisAmount)
  }else{
    updateWalletToThisAmount = globalWallet.amount - buyAmount
    isNaN(buyAmount) ? alert('Amount to buy is invalid') : patchFundsToWallet(updateWalletToThisAmount)
  } 
  
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
  if(!globalSearchResult){
    alert('You need to first search a crypto currency')
    return
  }
  const buyInfo = {
    buyAmount: parseInt(document.querySelector('#crypto-buy-input').value),
    tokensAmount: parseFloat(document.querySelector('#tokens-amount').textContent.split(' ')[3]),
    currentPrice: parseFloat(globalSearchResult.priceUsd),
    todaysDate: getCurrentDateFormatted(),
    crypto: globalSearchResult.id
  }
  buyInfo.buyValue = parseFloat(document.querySelector('#crypto-buy-input').value)
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
  handleUpdateWallet('reduce')
  document.querySelector('#crypto-search-input').value = ''
  document.querySelector('#crypto-buy-input').value = ''
  document.querySelector('#search-result').textContent = '-'
  document.querySelector('#tokens-amount').textContent = 'Order submitted successfully!'
  document.querySelector('#holdings-table tbody').innerHTML = ''
  getTransactions()
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

const handleFetchSuccess = (cryptoObject) => {
  globalScan = cryptoObject.data
  cryptoObject.data.forEach(renderCryptoCard)
  getTransactions()
}

const renderWalletBalance = (walletInfo) => {
  globalWallet = walletInfo[0]
  const walletElem = document.querySelector('#wallet-balance')
  const balanceUsd = usdFormatter.format(walletInfo[0].amount)
  walletElem.textContent = balanceUsd
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
      <button type="button" id="buy_${crypto.id}" class="btn btn-primary text-nowrap"><i class="bi bi-currency-bitcoin"></i> Buy </button>
    </div>
  </div>`
  allCryptoList.appendChild(cardDiv)
  document.getElementById(`chart-${crypto.id}`).addEventListener('click', chartSelectedCrypto)
  document.getElementById(`buy_${crypto.id}`).addEventListener('click', searchSelectedCrypto)
}

const searchSelectedCrypto = (e) => {
  const cryptoToSearch = e.target.id.split('_')[1]
  console.log(cryptoToSearch)
  navigateToWallet(cryptoToSearch)
}

const chartSelectedCrypto = (e) => {
  const cryptoData = {...e.target.dataset}
  navigateToChart(cryptoData)
}

const navigateToWallet = (cryptoToSearch) => {
  document.querySelector('#nav-link-wallet').childNodes[0].click()
  document.querySelector('#crypto-search-input').value = cryptoToSearch
}

const navigateToChart = (cryptoToChart) => {
  document.querySelector('#nav-link-chart').childNodes[0].click()
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
const startOfYear = new Date(new Date().getFullYear(), 0, 1).getTime();
const currentTime = Date.now();
const baseUrl = `https://api.coincap.io/v2/assets/${cryptoId}/history`
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
  // getTransactions()
  // getCryptoDataFromAPI()
  navLinks.forEach(link => link.addEventListener('click', navigatePageViews))
  addFundsBtn.addEventListener('click', () => handleUpdateWallet('add'))
  searchCryptoBtn.addEventListener('click', handleSearchCrypto)
  buyBtn.addEventListener('click', handleBuyCrypto)
  buyInputField.addEventListener('input', handleBuyInputChange)
}

initApp()
