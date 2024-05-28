import { cryptoData } from "./api_data.js"

console.log(cryptoData)

const fetchCryptoData = () => {
  fetch('https://api.coincap.io/v2/assets')
    .then(res => res.json())
    .then(handleSuccess)
    .catch(handleError)
}

const handleSuccess = (data) => {
  console.log(data)
}

const handleError = (error) => {
  console.log(error)
  alert('Something wen wrong during fetch!')
}

// fetchCryptoData()
