
This part of the code base is bundled into 3 bundles for the config, main code and npm dependencies.
Some other functionality is included in the html as basic js scripts.

The html files currently expect 3 files with the `.min.js` extension in the root folder.
`bundle.min.js`  Main code without config and npm node_modules  
`bundle.config.min.js` npm node_modules, mainly code from ethers.js  
`bundle.modules.min.js` Bundle of config files


The following procedures are defined in package.json and can be run as:
`npm run build`  
`npm run build-min`


##### Simple build
Use `browserify` to combine the code for client side usage.

`browserify ./deltabalances.js --s bundle -x ./config.js -x ./ethersWrapper.js -x bignumber.js > ./bundle.js`  
`browserify -r ./ethersWrapper.js -r bignumber.js > ./bundle.modules.js`  
`browserify -r ./config.js > ./bundle.config.js`

##### minified
For basic minification replace `>` with `| terser -c > ` in the above commands.
Current builds use the following commands:

`browserify -g uglifyify  -r ./config.js |terser -c > ./bundle.config.min.js`  
`browserify -g uglifyify ./deltabalances.js --s bundle -x ./config.js -x ./ethersWrapper.js -x bignumber.js -p browser-pack-flat/plugin | terser -cm > ./bundle.min.js`  
`browserify -g unassertify -g uglifyify -r ./ethersWrapper.js -r bignumber.js -p common-shakeify -p browser-pack-flat/plugin | terser -cm > ./bundle.modules.min.js`  


##### npm installing requirements  
The package.json definition should be enough, but here are all npm packages being used.

`npm install -g browserify`  
`npm install -g terser`  

`npm install --save-dev unnasertify`  
`npm install --save-dev uglifyify`  
`npm install --save-dev common-shakeify`  
`npm install --save-dev browser-pack-flat`  


