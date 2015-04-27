'use strict';

var cheerio = require('cheerio'),
    async = require('async'),
    request = require('./request'),
    util = require('./util');

var patterns = {
    punc: /[,\.]/g,
    results: /([\d,]+)-([\d,]+)\s+of ([\d,]+)/,
    bill: /^([A-Za-z.]+)(\d{1,5}) — (\d{2,3})/,
    date: /\d{2}\/\d{2}\/\d{4}/
};


var billList = {

    /**
     * Parses a page of search results for bills
     *
     * @param {string} html - HTML string representation of search results page
     * @returns {Object}
     */
    parse: function(html) {
        var $ = cheerio.load(html);
        var results = {
            start: 0,
            end: 0,
            of: 0,
            bills: []
        };

        var resultsNum = $('span.results-number').text();
        var matches = resultsNum.match(patterns.results);

        if(!matches) {
            return results;
        }

        results.start = parseInt(matches[1].replace(patterns.punc, ''));
        results.end = parseInt(matches[2].replace(patterns.punc, ''));
        results.of = parseInt(matches[3].replace(patterns.punc, ''));

        $('ul.results_list > li').each(function() {
            var $el = $(this),
                $a = $el.find('> h2 a'),
                $title = $el.find('> h3'),
                $introduced_at = $el.find('> table th:contains("Sponsor:")').next(),
                $latest_action = $el.find('> table th:contains("Latest Action:")').next();

            var heading = $a.parent().text().match(patterns.bill),
                type = (heading[1]) ? heading[1].replace(patterns.punc, '').toLowerCase(): null,
                number = (heading[2]) ? heading[2] : null,
                congress = (heading[3]) ? heading[3] : null,
                title = $title.text(),
                introduced_at = $introduced_at.text().match(patterns.date),
                last_action = $latest_action.text().match(patterns.date),
                href = $a.attr('href');

            results.bills.push({
                id: congress + '-' + type + number,
                type: type,
                number: parseInt(number),
                congress: parseInt(congress),
                title: title,
                introduced_at: (introduced_at) ? (new Date(introduced_at[0])).toISOString().slice(0, 10) : null,
                last_action: (last_action) ? (new Date(last_action[0])).toISOString().slice(0,10) : null,
                href: href
            });
        });

        return results;
    },

    /**
     * Requests a page of search results for bills from congress.gov
     *
     * @param {Object} [query] - Request options
     * @param {number} [query.pageSize=250] - Number of results per page
     * @param {number} [query.page=1] - Page number to fetch
     * @param {number|number[]} [query.congress=current] - Congress number
     * @param {string} [query.chamber] - Chamber of congress ('House' or 'Senate')
     * @param {fetchCallback} done - Fetch callback
     */
    fetch: function(query, done) {
        if(typeof query === 'function') {
            done = query;
            query = {};
        } else {
            query = query || {};
        }

        if(typeof done !== 'function') {
            throw new TypeError('bill_list:fetch requires a callback function');
        }

        var options = {
            url: 'https://congress.gov/legislation',
            qs: {
                'pageSize': query.pageSize || 250,
                'page': query.page || 1
            }
        };

        // SOME query parameters are formatted as JSON string values (WHY Library of Congress?!)
        var q = {
            'type': 'bills',
            'congress': query.congress || util.currentCongress()
        };

        if(query.hasOwnProperty('chamber')) {
            q.chamber = query.chamber;
        }

        options.qs.q = JSON.stringify(q);

        request.get(options, function(err, res, body) {
            if(err) {
                done(err);
            } else {
                done(null, body);
            }
        });
    },

    /**
     * Scrapes congress.gov for a list of bills
     *
     * Asynchronously performs a search for bills, requesting
     * each page of results until all are found and parses each
     * bill found into a JSON object.
     *
     * @param {Object} [query] - Query parameters
     * @param {parseCallback} done - Parse callback
     */
    scrape: function(query, done) {
        if(typeof query === 'function') {
            done = query;
            query = {};
        } else {
            query = query || {};
        }

        if(typeof done !== 'function') {
            throw new TypeError('bill-list:scrape requires a callback function');
        }

        // Fetch first page
        return billList.fetch(query, function(err, html) {
            if(err) {
                return done(err);
            }

            // Check if more pages exist
            var results = billList.parse(html);
            var pageSize = query.pageSize || 250;
            var page = query.page || 1;
            var numPages = Math.ceil(results.of / pageSize);

            // First page already parsed
            // Callback just passes its list of bills to next in waterfall
            var pages = [function(callback) {
                callback(null, results.bills);
            }];

            // Fetch all remaining pages
            for(var i = page+1; i<=numPages; i++) {
                (function(i) {
                    // For each page, push fetch/parse to the waterfall stack
                    pages.push(function(bills, callback) {
                        query.page = i;
                        billList.fetch(query, function(err, html) {
                            if(err) {
                                return callback(err);
                            }

                            // Append bills to list
                            var results = billList.parse(html);
                            bills = bills.concat(results.bills);

                            callback(null, bills);
                        });
                    });
                })(i);
            }

            // If more pages need to be scraped, start the waterfall
            if(results.end < results.of) {
                return async.waterfall(pages, done);
            } else {
                return done(null, results.bills);
            }
        });
    }

};

module.exports = billList;

/**
 * Callback which receives fetched html string
 *
 * @callback fetchCallback
 * @param {Error|null} err
 * @param {string} html
 */

/**
 * Callback which receives an array of bills
 *
 * @callback parseCallback
 * @param {Error|null} err
 * @param {Object[]} bills
 */
