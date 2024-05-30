# Crypto-GiggaChad

## App concept
My app is a crypto paper trading app. Practice trading with fake money. Upon launching the app you will be greeted to the Scanner view which will show the top 100 crypto currencies per coincap.com. You will see all the basic info for these currencies.

From here you can get a YTD chart for each crypto to help make your decision whether to buy or sell.

Once you are ready head over to the Wallet view where you can buy and sell crypto. Here you will be able to see your current holdings and the current value based on the latest pricing. You will also be able to top off your wallet with extra funds. 

For this app to run you need to start 2 JSON servers

Run: npm install -g json-server

Then run:
json-server --watch ./db/transactions.json --port 3001
json-server --watch ./db/wallet.json --port 3000

