import { cryptoData } from "./api_data.js"

const allCryptoList = document.querySelector('#all-crypto-list')

const getCryptoDataFromAPI = () => {
  fetch('https://api.coincap.io/v2/assets')
    .then(res => res.json())
    .then(handleFetchSuccess)
    .catch(handleError)
}

const handleFetchSuccess = (cryptoObject) => {
  console.log(cryptoObject.data)
  cryptoObject.data.forEach(crypto => {
    let changeOverLast24
    if(crypto.changePercent24Hr.slice(0,1) === '-'){
      changeOverLast24 = `${crypto.changePercent24Hr.slice(0,5)}`
    }else{
      changeOverLast24 = `+${crypto.changePercent24Hr.slice(0,4)}`
    } 
    const cardDiv = document.createElement('div')
    cardDiv.classList.add('crypto-card', 'mb-3')
    cardDiv.innerHTML = `
            <div class="icon">
                <img width="50px" src="./64/${crypto.id}.png" />
            </div>
            <div class="details">
                <div class="title">${crypto.name}</div>
                <div class="info">
                    <div class="icon-text">
                        <i class="bi bi-clock"></i> 24h Change: ${changeOverLast24}%
                    </div>
                    <div class="icon-text">
                        <i class="bi bi-geo-alt"></i> Current Price: $40,000
                    </div>
                </div>
    `
    allCryptoList.appendChild(cardDiv)
  })
}

const handleError = (error) => {
  console.log(error)
  alert('Something wen wrong during fetch!')
}

const initApp = () => {
  handleFetchSuccess(cryptoData)
}

initApp()
