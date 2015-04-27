# govscrape
Public domain tools for scraping data about the U.S. Congress concerning bills, roll call votes, and nominations.

#### Requirements
* Node.js

#### Getting Started
```
$ npm install
```

#### Running tests
```
$ npm test
```

## Bill List
Fetches a list of bill summaries, each with an href property pointing to the congress.gov page for that bill.
```
$ node bin\bill-list
```
#### Options
* ```-n, --congress <number>```
* ```-c, --chamber [house|senate]```
* ```-d, --directory <path>```
* ```-h, --help```
