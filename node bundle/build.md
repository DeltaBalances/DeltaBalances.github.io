How everything is built:

Requires `npm` and `browserify`

bundle.js:
`npm run-script build-bundle` or `browserify ./deltabalances.js --s bundle -x ./config.js > bundle.js`

configBundle.js:
`npm run-script build-config`  or `browserify -o configBundle.js -r ./config.js`

bundle.min.js 
is made using google closure compiler 'simple' on bundle.js

