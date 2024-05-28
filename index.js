import { cryptoData } from "./api_data.js"

const allCryptoList = document.querySelector('#all-crypto-list')

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

const handleError = (error) => {
  console.log(error)
  alert('Something wen wrong during fetch!')
}

const initApp = () => {
  handleFetchSuccess(cryptoData)
}

initApp()
